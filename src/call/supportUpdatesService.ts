import * as signalR from '@microsoft/signalr'

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.map((u) => u.replace(/\/$/, '')).filter(Boolean))]
}

function buildSupportUpdatesHubCandidates(): string[] {
  const explicit = import.meta.env.VITE_SUPPORT_UPDATES_HUB_URL as string | undefined
  if (explicit) return uniqueUrls([explicit])

  const devProxyOff =
    String(import.meta.env.VITE_SUPPORT_HUB_USE_VITE_PROXY ?? 'true').toLowerCase() === 'false'

  if (import.meta.env.DEV && !devProxyOff && typeof window !== 'undefined') {
    return uniqueUrls([`${window.location.origin}/support/hubs/support-updates`])
  }

  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '')
  const bases = envBase
    ? [envBase]
    : ['https://myada.duckdns.org']

  return uniqueUrls(bases.map((b) => `${b}/support/hubs/support-updates`))
}

export class SupportUpdatesService {
  private connection: signalR.HubConnection | null = null
  private readonly handlers: Array<() => void> = []
  private connectInFlight: Promise<void> | null = null
  private unauthorized = false

  private isUnauthorizedError(err: unknown) {
    const msg = String((err as any)?.message || err || '').toLowerCase()
    return msg.includes('401') || msg.includes('unauthorized') || msg.includes('request denied')
  }

  async connect(getAccessToken: () => string | null) {
    if (this.unauthorized) {
      throw new Error('SUPPORT_UPDATES_UNAUTHORIZED')
    }
    if (this.connection?.state === signalR.HubConnectionState.Connected) return
    if (this.connectInFlight) return this.connectInFlight

    this.connectInFlight = (async () => {
    const candidates = buildSupportUpdatesHubCandidates()
    let lastErr: unknown = null

    for (const url of candidates) {
      await this.hardStop()
      try {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(url, {
            accessTokenFactory: () => getAccessToken() || '',
          })
          .configureLogging(signalR.LogLevel.None)
          .withAutomaticReconnect()
          .build()

        await this.connection.start()
        return
      } catch (e) {
        lastErr = e
        if (this.isUnauthorizedError(e)) {
          this.unauthorized = true
          throw new Error('SUPPORT_UPDATES_UNAUTHORIZED')
        }
        await this.hardStop()
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr || 'Support updates hub connection failed.'))
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

  async invoke<T = unknown>(method: string, ...args: any[]) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Support hub is not connected.')
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
  }
}
