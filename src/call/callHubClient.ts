import * as signalR from '@microsoft/signalr'

const DEFAULT_CALL_HUB_URL = 'http://51.20.193.29/call/hub'

function resolveHubUrl() {
  const explicit = (import.meta.env.VITE_CALL_HUB_URL as string | undefined)?.trim()
  if (explicit) return explicit
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}/call/hub`
  }
  return DEFAULT_CALL_HUB_URL
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
  | 'EndCall'

class CallHubClient {
  private connection: signalR.HubConnection | null = null
  private connectInFlight: Promise<void> | null = null

  get state() {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected
  }

  async connect(getAccessToken: () => string | null) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return
    if (this.connectInFlight) return this.connectInFlight

    this.connectInFlight = (async () => {
      if (!this.connection) {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(resolveHubUrl(), {
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

