import * as signalR from '@microsoft/signalr'

const DEFAULT_GATEWAY_BASE = 'https://myada.duckdns.org'
const DEFAULT_CALL_HUB_URL = `${DEFAULT_GATEWAY_BASE}/call/hub`

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function resolveGatewayBase() {
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim()
  if (envBase) return trimTrailingSlash(envBase)
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return trimTrailingSlash(window.location.origin)
  }
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

  get state() {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected
  }

  get resolvedHubUrl() {
    return this.lastHubUrl
  }

  get iceServersEndpoint() {
    return buildIceServersEndpoint(this.lastHubUrl || resolveHubUrl())
  }

  private createConnection(hubUrl: string, getAccessToken: () => string | null) {
    return new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken() || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()
  }

  async connect(getAccessToken: () => string | null) {
    const hubUrl = resolveHubUrl()
    const accessToken = getAccessToken()?.trim() || null
    const hasToken = Boolean(accessToken)

    console.info('[CALL-DBG] CallHubClient.connect', { hubUrl, hasToken })
    if (!hasToken) {
      console.warn('[CALL-DBG] CallHubClient.connect skipped: missing access token')
      throw new Error('Call hub connection skipped: missing access token.')
    }

    const urlChanged = this.lastHubUrl !== hubUrl
    if (urlChanged && this.connection) {
      console.info('[CALL-DBG] CallHubClient.connect detected hub url change, recreating connection', {
        previousHubUrl: this.lastHubUrl,
        nextHubUrl: hubUrl,
      })
      await this.stop()
    }

    this.lastHubUrl = hubUrl
    if (!this.connection) {
      this.connection = this.createConnection(hubUrl, getAccessToken)
    }

    if (this.connection.state === signalR.HubConnectionState.Connected) {
      console.info('[CALL-DBG] CallHubClient.connect already connected', { hubUrl })
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
          hubUrl,
          state: this.connection.state,
        })
        return
      }

      if (this.connection?.state === signalR.HubConnectionState.Disconnected) {
        console.info('[CALL-DBG] CallHubClient.starting connection', { hubUrl })
        try {
          await this.connection.start()
          console.info('[CALL-DBG] CallHubClient.start success', {
            hubUrl,
            connectionId: this.connection.connectionId,
          })
        } catch (err) {
          const statusCode = (err as any).statusCode ?? (err as any).status ?? null
          console.error('[CALL-DBG] CallHubClient.start failed', {
            hubUrl,
            statusCode,
            message: String((err as Error)?.message || err),
          })
          throw err
        }
      }
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
    this.connection?.on(eventName, cb)
    return () => this.connection?.off(eventName, cb)
  }

  onClose(cb: (error?: Error) => void) {
    this.connection?.onclose(cb)
  }

  onReconnected(cb: (connectionId?: string) => void) {
    this.connection?.onreconnected(cb)
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

