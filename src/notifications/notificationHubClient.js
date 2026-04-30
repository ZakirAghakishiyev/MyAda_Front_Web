import * as signalR from '@microsoft/signalr'
import { normalizeNotificationRecord, resolveNotificationHubUrl } from '../api/notificationApi'

const NOTIFICATION_EVENT_NAME = 'notificationCreated'
const DEBUG_NAMESPACE = '[notifications]'

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
  connection = null
  connectInFlight = null
  lastHubUrl = null
  lastError = null
  notificationHandlers = new Set()
  stateHandlers = new Set()

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
    connection.on(NOTIFICATION_EVENT_NAME, (payload) => {
      const normalizedItems = normalizeHubPayloads(payload)
      debugLog('info', `Hub event received: ${NOTIFICATION_EVENT_NAME}`, {
        itemCount: normalizedItems?.length || 0,
        connectionId: connection.connectionId || null,
        hubUrl: this.lastHubUrl,
      })
      if (!normalizedItems?.length) return
      normalizedItems.forEach((normalized) => {
        this.notificationHandlers.forEach((handler) => handler(normalized, NOTIFICATION_EVENT_NAME))
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
      debugLog('info', 'Notification hub connection already in progress.', {
        state: this.connection?.state,
        hubUrl: this.lastHubUrl,
      })
      return this.connectInFlight
    }
    if (this.connectInFlight) return this.connectInFlight

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
        debugLog('info', 'Notification hub connected.', {
          connectionId: this.connection.connectionId || null,
          hubUrl,
        })
        this.emitState('connected', null)
        return
      } catch (error) {
        debugLog('error', 'Notification hub connection failed.', {
          hubUrl,
          error: toDebugError(error),
        })
        await this.stop()
        this.emitState('unavailable', error || null)
        throw error instanceof Error ? error : new Error('Notification hub connection failed.')
      }
    })().finally(() => {
      this.connectInFlight = null
    })

    return this.connectInFlight
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
