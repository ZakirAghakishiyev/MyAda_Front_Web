import * as signalR from '@microsoft/signalr'

const DEFAULT_GATEWAY_BASE = 'http://13.60.31.141:5000'
const DEFAULT_CALL_HUB_URL = `${DEFAULT_GATEWAY_BASE}/call/hub`
const DEFAULT_ICE_SERVERS_ENDPOINT = `${DEFAULT_GATEWAY_BASE}/call/webrtc/ice-servers`

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

function resolveHubUrl() {
  const explicit = (import.meta.env.VITE_CALL_HUB_URL as string | undefined)?.trim()
  if (explicit) return trimTrailingSlash(explicit)
  const base = resolveGatewayBase()
  if (!base) return DEFAULT_CALL_HUB_URL
  return `${base}/call/hub`
}

export function buildIceServersEndpoint(_hubUrl: string) {
  const explicit = (import.meta.env.VITE_CALL_ICE_SERVERS_URL as string | undefined)?.trim()
  if (explicit) return trimTrailingSlash(explicit)
  return DEFAULT_ICE_SERVERS_ENDPOINT
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

  async connect(getAccessToken: () => string | null) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return
    if (this.connectInFlight) return this.connectInFlight

    this.connectInFlight = (async () => {
      const hubUrl = resolveHubUrl()
      this.lastHubUrl = hubUrl
      if (!this.connection) {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => getAccessToken() || '',
          })
          .withAutomaticReconnect()
          .build()
      }
      if (this.connection.state === signalR.HubConnectionState.Disconnected) {
        await this.connection.start()
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

