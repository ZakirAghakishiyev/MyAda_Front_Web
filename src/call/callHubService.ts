import * as signalR from '@microsoft/signalr'

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.map((u) => u.replace(/\/$/, '')).filter(Boolean))]
}

/**
 * Call hub should resolve from the API gateway origin, not the frontend origin.
 * Override with `VITE_CALL_HUB_URL`, `VITE_API_BASE_URL`, or `VITE_API_BASE`.
 */
export function buildCallHubUrlCandidates(): string[] {
  const explicit = import.meta.env.VITE_CALL_HUB_URL as string | undefined
  if (explicit) return uniqueUrls([explicit])

  const envBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
    (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '')
  const bases = envBase ? [envBase] : ['https://myada.site']

  return uniqueUrls(bases.map((b) => `${b}/call/hub`))
}

export class CallHubService {
  private connection: signalR.HubConnection | null = null
  private readonly handlers: Array<() => void> = []
  private lastHubUrl: string | null = null
  private connectInFlight: Promise<signalR.HubConnection> | null = null

  get state() {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected
  }

  get connectionId() {
    return this.connection?.connectionId ?? null
  }

  get resolvedHubUrl() {
    return this.lastHubUrl
  }

  async connect(getAccessToken: () => string | null) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection
    }
    if (this.connectInFlight) return this.connectInFlight

    this.connectInFlight = (async () => {
      const candidates = buildCallHubUrlCandidates()
      let lastErr: unknown = null

      for (const url of candidates) {
        await this.hardStop()
        try {
          this.lastHubUrl = url
          this.connection = new signalR.HubConnectionBuilder()
            .withUrl(url, {
              accessTokenFactory: () => getAccessToken() || '',
            })
            .withAutomaticReconnect()
            .build()

          await this.connection.start()
          return this.connection
        } catch (e) {
          lastErr = e
          await this.hardStop()
        }
      }

      this.lastHubUrl = null
      throw lastErr instanceof Error ? lastErr : new Error(String(lastErr || 'Call hub connection failed.'))
    })().finally(() => {
      this.connectInFlight = null
    })

    return this.connectInFlight
  }

  on(name: string, cb: (...args: any[]) => void) {
    if (!this.connection) return
    this.connection.on(name, cb)
    this.handlers.push(() => this.connection?.off(name, cb))
  }

  onReconnected(cb: (connectionId?: string) => void) {
    if (!this.connection) return
    this.connection.onreconnected(cb)
  }

  onClose(cb: (error?: Error) => void) {
    if (!this.connection) return
    this.connection.onclose(cb)
  }

  async invoke<T = unknown>(method: string, ...args: any[]) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Call hub is not connected. Wait until status is connected, then try again.')
    }
    return this.connection.invoke<T>(method, ...args)
  }

  private async hardStop() {
    for (const detach of this.handlers.splice(0)) detach()
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      try {
        await this.connection.stop()
      } catch {
        /* ignore */
      }
    }
    this.connection = null
  }

  async stop() {
    await this.hardStop()
    this.lastHubUrl = null
  }
}
