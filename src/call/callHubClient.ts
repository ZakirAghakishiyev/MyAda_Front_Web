import * as signalR from '@microsoft/signalr'

const DEFAULT_GATEWAY_BASE = 'https://myada.site'
const DEFAULT_CALL_HUB_URL = `${DEFAULT_GATEWAY_BASE}/call/hub`

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.map((u) => trimTrailingSlash(u)).filter(Boolean))]
}

type HubConnectionCandidate = {
  hubUrl: string
}

function resolveGatewayBase() {
  const envBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  if (envBaseUrl) return trimTrailingSlash(envBaseUrl)
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim()
  if (envBase) return trimTrailingSlash(envBase)
  return DEFAULT_GATEWAY_BASE
}

/** API gateway origin used for `/call/hub`, `/call/webrtc/ice-servers`, `/call/api/*`. */
export function resolveCallGatewayBase() {
  return resolveGatewayBase()
}

function resolveHubUrl() {
  const explicit = (import.meta.env.VITE_CALL_HUB_URL as string | undefined)?.trim()
  if (explicit) return trimTrailingSlash(explicit)
  const base = resolveGatewayBase()
  if (!base) return DEFAULT_CALL_HUB_URL
  return `${base}/call/hub`
}

function buildHubConnectionCandidates(): HubConnectionCandidate[] {
  const explicit = (import.meta.env.VITE_CALL_HUB_URL as string | undefined)?.trim()

  if (explicit) {
    const normalized = trimTrailingSlash(explicit)
    return [{ hubUrl: normalized }]
  }

  const envBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_API_BASE as string | undefined)?.trim()
  const envHub = envBase ? [`${trimTrailingSlash(envBase)}/call/hub`] : []
  return uniqueUrls([...envHub, DEFAULT_CALL_HUB_URL]).map((hubUrl) => ({ hubUrl }))
}

/**
 * REST base for call routes on the gateway, e.g. `${resolveCallRestBase()}/call-history`.
 * Always includes the `/call/api` prefix segment.
 */
export function resolveCallRestApiBase() {
  return `${resolveGatewayBase()}/call/api`
}

/**
 * `GET …/call/webrtc/ice-servers` — same gateway host as the hub unless overridden.
 */
export function buildIceServersEndpoint(hubUrl?: string | null) {
  const explicit = (import.meta.env.VITE_CALL_ICE_SERVERS_URL as string | undefined)?.trim()
  if (explicit) return trimTrailingSlash(explicit)
  const hub = (hubUrl || resolveHubUrl()).trim()
  const fromHub = hub.replace(/\/call\/hub\/?$/i, '')
  if (fromHub && fromHub !== hub) {
    return `${trimTrailingSlash(fromHub)}/call/webrtc/ice-servers`
  }
  return `${resolveGatewayBase()}/call/webrtc/ice-servers`
}

export type CallHubMethod =
  | 'RequestCall'
  | 'AcceptCall'
  | 'RejectCall'
  | 'CancelCall'
  | 'LeaveCall'
  | 'SendOffer'
  | 'SendAnswer'
  | 'SendIceCandidate'
  | 'GetIceConfiguration'
  | 'EndCall'

class CallHubClient {
  private connection: signalR.HubConnection | null = null
  private connectInFlight: Promise<void> | null = null
  private lastHubUrl: string | null = null
  private eventHandlers = new Map<string, Set<(...args: any[]) => void>>()
  private closeHandlers = new Set<(error?: Error) => void>()
  private reconnectedHandlers = new Set<(connectionId?: string) => void>()

  get state() {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected
  }

  get resolvedHubUrl() {
    return this.lastHubUrl
  }

  get iceServersEndpoint() {
    return buildIceServersEndpoint(this.lastHubUrl || resolveHubUrl())
  }

  private createConnection(candidate: HubConnectionCandidate, getAccessToken: () => string | null) {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(candidate.hubUrl, {
        accessTokenFactory: () => getAccessToken() || '',
        // We authenticate hubs with bearer tokens, so cross-origin cookies/credentials
        // are unnecessary and can trigger stricter CORS requirements during negotiate.
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()
    this.bindStoredHandlers(connection)
    return connection
  }

  private bindStoredHandlers(connection: signalR.HubConnection) {
    for (const [eventName, handlers] of this.eventHandlers.entries()) {
      for (const handler of handlers) {
        connection.on(eventName, handler)
      }
    }
    for (const handler of this.closeHandlers) {
      connection.onclose(handler)
    }
    for (const handler of this.reconnectedHandlers) {
      connection.onreconnected(handler)
    }
  }

  async connect(getAccessToken: () => string | null) {
    const candidates = buildHubConnectionCandidates()
    const hubUrls = candidates.map((candidate) => candidate.hubUrl)
    const hubUrl = hubUrls[0] || resolveHubUrl()
    const accessToken = getAccessToken()?.trim() || null
    const hasToken = Boolean(accessToken)

    console.info('[CALL-DBG] CallHubClient.connect', {
      hubUrl,
      hubUrls,
      candidateModes: candidates.map((candidate) => ({
        hubUrl: candidate.hubUrl,
      })),
      hasToken,
    })
    if (!hasToken) {
      console.warn('[CALL-DBG] CallHubClient.connect skipped: missing access token')
      throw new Error('Call hub connection skipped: missing access token.')
    }

    const urlChanged = this.lastHubUrl !== null && !hubUrls.includes(this.lastHubUrl)
    if (urlChanged && this.connection) {
      console.info('[CALL-DBG] CallHubClient.connect detected hub url change, recreating connection', {
        previousHubUrl: this.lastHubUrl,
        nextHubUrl: hubUrl,
      })
      await this.stop()
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.info('[CALL-DBG] CallHubClient.connect already connected', { hubUrl: this.lastHubUrl })
      return
    }

    if (this.connectInFlight) {
      console.info('[CALL-DBG] CallHubClient.connect already in flight', { hubUrl })
      return this.connectInFlight
    }

    this.connectInFlight = (async () => {
      if (
        this.connection?.state === signalR.HubConnectionState.Connecting ||
        this.connection?.state === signalR.HubConnectionState.Reconnecting
      ) {
        console.info('[CALL-DBG] CallHubClient.connect waiting for existing connection state', {
          hubUrl: this.lastHubUrl,
          state: this.connection.state,
        })
        return
      }

      let lastError: unknown = null

      for (const candidate of candidates) {
        if (this.lastHubUrl !== candidate.hubUrl || !this.connection) {
          await this.stop()
          this.connection = this.createConnection(candidate, getAccessToken)
          this.lastHubUrl = candidate.hubUrl
        }

        if (this.connection?.state !== signalR.HubConnectionState.Disconnected) {
          continue
        }

        console.info('[CALL-DBG] CallHubClient.starting connection', {
          hubUrl: candidate.hubUrl,
        })
        try {
          await this.connection.start()
          console.info('[CALL-DBG] CallHubClient.start success', {
            hubUrl: candidate.hubUrl,
            connectionId: this.connection.connectionId,
          })
          return
        } catch (err) {
          lastError = err
          const statusCode = (err as any).statusCode ?? (err as any).status ?? null
          console.error('[CALL-DBG] CallHubClient.start failed', {
            hubUrl: candidate.hubUrl,
            statusCode,
            message: String((err as Error)?.message || err),
          })
          await this.stop()
        }
      }

      throw lastError instanceof Error ? lastError : new Error('Call hub connection failed.')
    })().finally(() => {
      this.connectInFlight = null
    })

    return this.connectInFlight
  }

  async disconnect() {
    if (!this.connection) return
    if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop()
    }
  }

  async stop() {
    await this.disconnect()
    this.connection = null
    this.lastHubUrl = null
  }

  on(eventName: string, cb: (...args: any[]) => void) {
    let handlers = this.eventHandlers.get(eventName)
    if (!handlers) {
      handlers = new Set()
      this.eventHandlers.set(eventName, handlers)
    }
    handlers.add(cb)
    this.connection?.on(eventName, cb)
    return () => {
      handlers?.delete(cb)
      if (handlers?.size === 0) {
        this.eventHandlers.delete(eventName)
      }
      this.connection?.off(eventName, cb)
    }
  }

  onClose(cb: (error?: Error) => void) {
    this.closeHandlers.add(cb)
    this.connection?.onclose(cb)
    return () => {
      this.closeHandlers.delete(cb)
    }
  }

  onReconnected(cb: (connectionId?: string) => void) {
    this.reconnectedHandlers.add(cb)
    this.connection?.onreconnected(cb)
    return () => {
      this.reconnectedHandlers.delete(cb)
    }
  }

  get connectionId() {
    return this.connection?.connectionId ?? null
  }

  async invoke<T = unknown>(method: CallHubMethod, ...args: any[]) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Call hub is not connected.')
    }
    return this.connection.invoke<T>(method, ...args)
  }
}

export const callHubClient = new CallHubClient()

