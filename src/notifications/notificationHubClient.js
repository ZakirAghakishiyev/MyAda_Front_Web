import * as signalR from '@microsoft/signalr'
import { normalizeNotificationRecord, resolveNotificationHubUrl } from '../api/notificationApi'

const NOTIFICATION_EVENT_NAMES = [
  'notificationCreated',
  'NotificationCreated',
  'notificationReceived',
  'NotificationReceived',
  'ReceiveNotification',
  'ReceiveNotifications',
  'receiveNotification',
  'receiveNotifications',
  'clubNotificationCreated',
  'ClubNotificationCreated',
  'announcementCreated',
  'AnnouncementCreated',
]
const DEBUG_NAMESPACE = '[notifications]'

function isIntentionalStopError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return (
    message.includes('stopped during negotiation') ||
    message.includes('abort') ||
    message.includes('connection was stopped')
  )
}

function toDebugError(error) {
  if (!error) return null
  return {
    name: error.name || 'Error',
    message: error.message || String(error),
  }
}

function debugLog(level, message, details) {
  const logger = console[level] || console.log
  if (details === undefined) {
    logger(`${DEBUG_NAMESPACE} ${message}`)
    return
  }
  logger(`${DEBUG_NAMESPACE} ${message}`, details)
}

function writeDebugSnapshot(patch) {
  if (typeof window === 'undefined') return
  const current = window.__notificationDebug || {}
  window.__notificationDebug = {
    ...current,
    hub: {
      ...(current.hub || {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  }
}

function normalizeHubPayloads(payload) {
  if (!payload) return null
  if (Array.isArray(payload)) {
    return payload.map((item, index) => normalizeNotificationRecord(item, index)).filter(Boolean)
  }
  if (typeof payload === 'object') {
    if (Array.isArray(payload.notifications)) {
      return payload.notifications.map((item, index) => normalizeNotificationRecord(item, index)).filter(Boolean)
    }
    if (Array.isArray(payload.data)) {
      return payload.data.map((item, index) => normalizeNotificationRecord(item, index)).filter(Boolean)
    }
    if (payload.notification && typeof payload.notification === 'object') {
      return [normalizeNotificationRecord(payload.notification)]
    }
    if (payload.data && typeof payload.data === 'object') {
      return [normalizeNotificationRecord(payload.data)]
    }
    return [normalizeNotificationRecord(payload)]
  }
  return [normalizeNotificationRecord({
    type: 'Notification',
    message: String(payload),
    channel: 'Push',
  })]
}

class NotificationHubClient {
  activeConsumers = 0
  connection = null
  connectInFlight = null
  connectInFlightGeneration = 0
  lastHubUrl = null
  lastError = null
  lifecycleGeneration = 0
  notificationHandlers = new Set()
  stateHandlers = new Set()
  stopTimer = null

  emitState(state, error = null) {
    this.lastError = error || null
    writeDebugSnapshot({
      state,
      connectionId: this.connection?.connectionId || null,
      hubUrl: this.lastHubUrl || null,
      error: toDebugError(error),
    })
    this.stateHandlers.forEach((handler) => handler(state, error))
  }

  bindConnectionEvents(connection) {
    NOTIFICATION_EVENT_NAMES.forEach((eventName) => {
      connection.on(eventName, (payload) => {
        const normalizedItems = normalizeHubPayloads(payload)
        debugLog('info', `Hub event received: ${eventName}`, {
          itemCount: normalizedItems?.length || 0,
          connectionId: connection.connectionId || null,
          hubUrl: this.lastHubUrl,
        })
        if (!normalizedItems?.length) {
          this.notificationHandlers.forEach((handler) => handler(null, eventName))
          return
        }
        normalizedItems.forEach((normalized) => {
          this.notificationHandlers.forEach((handler) => handler(normalized, eventName))
        })
      })
    })

    connection.onreconnecting((error) => {
      debugLog('warn', 'Notification hub reconnecting.', {
        hubUrl: this.lastHubUrl,
        error: toDebugError(error),
      })
      this.emitState('reconnecting', error || null)
    })

    connection.onreconnected(() => {
      debugLog('info', 'Notification hub reconnected.', {
        connectionId: connection.connectionId || null,
        hubUrl: this.lastHubUrl,
      })
      this.emitState('connected', null)
    })

    connection.onclose((error) => {
      debugLog(error ? 'error' : 'warn', 'Notification hub closed.', {
        connectionId: connection.connectionId || null,
        hubUrl: this.lastHubUrl,
        error: toDebugError(error),
      })
      this.emitState('disconnected', error || null)
    })
  }

  createConnection(hubUrl, getAccessToken) {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken?.() || '',
        withCredentials: false,
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()

    debugLog('info', 'Notification hub connection object created.', { hubUrl })
    this.bindConnectionEvents(connection)
    return connection
  }

  async connect(getAccessToken) {
    const accessToken = getAccessToken?.()?.trim() || ''
    if (!accessToken) {
      debugLog('warn', 'Notification hub connection skipped: missing access token.')
      this.emitState('disconnected', null)
      throw new Error('Notification hub connection skipped: missing access token.')
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      debugLog('info', 'Notification hub already connected.', {
        connectionId: this.connection.connectionId || null,
        hubUrl: this.lastHubUrl,
      })
      this.emitState('connected', null)
      return
    }
    if (
      this.connection?.state === signalR.HubConnectionState.Connecting ||
      this.connection?.state === signalR.HubConnectionState.Reconnecting
    ) {
      if (this.connectInFlight && this.connectInFlightGeneration !== this.lifecycleGeneration) {
        debugLog('info', 'Ignoring stale notification hub connect promise after lifecycle change.', {
          lifecycleGeneration: this.lifecycleGeneration,
          connectInFlightGeneration: this.connectInFlightGeneration,
        })
      } else {
        debugLog('info', 'Notification hub connection already in progress.', {
          state: this.connection?.state,
          hubUrl: this.lastHubUrl,
        })
        return this.connectInFlight
      }
    }
    if (this.connectInFlight) {
      if (this.connectInFlightGeneration === this.lifecycleGeneration) {
        debugLog('info', 'Notification hub connection already in progress.', {
          state: this.connection?.state || 'pending',
          hubUrl: this.lastHubUrl,
        })
        return this.connectInFlight
      }
      debugLog('info', 'Notification hub connection already in progress.', {
        state: 'stale-promise',
        hubUrl: this.lastHubUrl,
      })
    }

    const connectGeneration = this.lifecycleGeneration

    this.connectInFlight = (async () => {
      const hubUrl = resolveNotificationHubUrl()
      const previousHubUrl = this.lastHubUrl

      debugLog('info', 'Starting notification hub connection.', {
        hubUrl,
        accessTokenPresent: true,
        accessTokenLength: accessToken.length,
      })
      writeDebugSnapshot({
        state: 'connecting',
        hubUrl,
        accessTokenPresent: true,
        accessTokenLength: accessToken.length,
      })
      this.emitState('connecting', null)

      try {
        if (this.connection && previousHubUrl && previousHubUrl !== hubUrl) {
          await this.stop()
        }
        if (!this.connection) {
          this.lastHubUrl = hubUrl
          this.connection = this.createConnection(hubUrl, getAccessToken)
        } else {
          this.lastHubUrl = hubUrl
        }
        await this.connection.start()
        if (connectGeneration !== this.lifecycleGeneration) {
          debugLog('warn', 'Notification hub connect completed after a newer lifecycle started. Ignoring stale result.', {
            hubUrl,
            connectGeneration,
            lifecycleGeneration: this.lifecycleGeneration,
          })
          return
        }
        debugLog('info', 'Notification hub connected.', {
          connectionId: this.connection.connectionId || null,
          hubUrl,
        })
        this.emitState('connected', null)
        return
      } catch (error) {
        const stoppedIntentionally =
          connectGeneration !== this.lifecycleGeneration || isIntentionalStopError(error)
        if (stoppedIntentionally) {
          debugLog('warn', 'Notification hub connect was interrupted by an intentional stop.', {
            hubUrl,
            connectGeneration,
            lifecycleGeneration: this.lifecycleGeneration,
            error: toDebugError(error),
          })
          this.emitState('disconnected', null)
          return
        }
        debugLog('error', 'Notification hub connection failed.', {
          hubUrl,
          error: toDebugError(error),
        })
        await this.stop()
        this.emitState('unavailable', error || null)
        throw error instanceof Error ? error : new Error('Notification hub connection failed.')
      }
    })()

    this.connectInFlightGeneration = connectGeneration

    return this.connectInFlight.finally(() => {
      if (this.connectInFlightGeneration === connectGeneration) {
        this.connectInFlight = null
      }
    })
  }

  retain() {
    this.activeConsumers += 1
    if (this.stopTimer) {
      window.clearTimeout(this.stopTimer)
      this.stopTimer = null
      debugLog('info', 'Cancelled scheduled notification hub stop because a consumer re-subscribed.', {
        activeConsumers: this.activeConsumers,
      })
    }
  }

  release() {
    this.activeConsumers = Math.max(0, this.activeConsumers - 1)
    debugLog('info', 'Notification hub consumer released.', {
      activeConsumers: this.activeConsumers,
    })
    if (this.activeConsumers > 0) return
    if (typeof window === 'undefined') {
      void this.stop()
      return
    }
    if (this.stopTimer) return

    // Defer the actual stop slightly so React.StrictMode remounts can reattach
    // without tearing down the shared SignalR connection mid-negotiation.
    this.stopTimer = window.setTimeout(() => {
      this.stopTimer = null
      if (this.activeConsumers > 0) return
      void this.stop()
    }, 0)
  }

  onNotification(handler) {
    this.notificationHandlers.add(handler)
    return () => {
      this.notificationHandlers.delete(handler)
    }
  }

  onStateChange(handler) {
    this.stateHandlers.add(handler)
    return () => {
      this.stateHandlers.delete(handler)
    }
  }

  async stop() {
    if (this.stopTimer) {
      window.clearTimeout(this.stopTimer)
      this.stopTimer = null
    }
    this.lifecycleGeneration += 1
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      debugLog('info', 'Stopping notification hub connection.', {
        connectionId: this.connection.connectionId || null,
        hubUrl: this.lastHubUrl,
      })
      try {
        await this.connection.stop()
      } catch {
        /* ignore stop errors */
      }
    }
    this.connection = null
    this.lastHubUrl = null
    this.lastError = null
    writeDebugSnapshot({
      state: 'disconnected',
      connectionId: null,
      hubUrl: null,
      error: null,
    })
  }
}

export const notificationHubClient = new NotificationHubClient()
