import * as signalR from '@microsoft/signalr'
import { buildNotificationHubUrlCandidates, normalizeNotificationRecord } from '../api/notificationApi'

const NOTIFICATION_EVENT_NAMES = [
  'ReceiveNotification',
  'receiveNotification',
  'NotificationReceived',
  'NewNotification',
  'notificationReceived',
  'newNotification',
]

function normalizeHubPayload(payload) {
  if (!payload) return null
  if (Array.isArray(payload)) {
    return payload.length > 0 ? normalizeNotificationRecord(payload[0]) : null
  }
  if (typeof payload === 'object') {
    if (payload.notification && typeof payload.notification === 'object') {
      return normalizeNotificationRecord(payload.notification)
    }
    if (payload.data && typeof payload.data === 'object') {
      return normalizeNotificationRecord(payload.data)
    }
    return normalizeNotificationRecord(payload)
  }
  return normalizeNotificationRecord({
    type: 'Notification',
    message: String(payload),
    channel: 'Push',
  })
}

class NotificationHubClient {
  connection = null
  connectInFlight = null
  lastHubUrl = null
  notificationHandlers = new Set()
  stateHandlers = new Set()

  emitState(state, error = null) {
    this.stateHandlers.forEach((handler) => handler(state, error))
  }

  bindConnectionEvents(connection) {
    NOTIFICATION_EVENT_NAMES.forEach((eventName) => {
      connection.on(eventName, (payload) => {
        const normalized = normalizeHubPayload(payload)
        if (!normalized) return
        this.notificationHandlers.forEach((handler) => handler(normalized, eventName))
      })
    })

    connection.onreconnecting((error) => {
      this.emitState('reconnecting', error || null)
    })

    connection.onreconnected(() => {
      this.emitState('connected', null)
    })

    connection.onclose((error) => {
      this.emitState('disconnected', error || null)
    })
  }

  createConnection(hubUrl, getAccessToken) {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken?.() || '',
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()

    this.bindConnectionEvents(connection)
    return connection
  }

  async connect(getAccessToken) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      this.emitState('connected', null)
      return
    }
    if (this.connectInFlight) return this.connectInFlight

    this.connectInFlight = (async () => {
      const candidates = buildNotificationHubUrlCandidates()
      let lastError = null

      this.emitState('connecting', null)

      for (const hubUrl of candidates) {
        try {
          await this.stop()
          this.lastHubUrl = hubUrl
          this.connection = this.createConnection(hubUrl, getAccessToken)
          await this.connection.start()
          this.emitState('connected', null)
          return
        } catch (error) {
          lastError = error
          await this.stop()
        }
      }

      this.emitState('unavailable', lastError || null)
      throw lastError instanceof Error ? lastError : new Error('Notification hub connection failed.')
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
      try {
        await this.connection.stop()
      } catch {
        /* ignore stop errors */
      }
    }
    this.connection = null
    this.lastHubUrl = null
  }
}

export const notificationHubClient = new NotificationHubClient()
