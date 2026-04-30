import { API_BASE } from './apiBase'
import { authFetch } from '../auth'

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function parseNotificationResponseBody(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function parseResponse(res) {
  const text = await res.text()
  const data = parseNotificationResponseBody(text)

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.error || data.message || data.title || data.detail)) ||
      (typeof data === 'string' && data.trim()) ||
      `Notification request failed (${res.status})`
    const err = new Error(String(message))
    err.status = res.status
    err.body = data
    throw err
  }

  return data
}

export function resolveNotificationApiBase() {
  return `${trimTrailingSlash(API_BASE)}/notification`
}

function buildNotificationApiUrl(path) {
  const normalizedPath = String(path || '').replace(/^\/+/, '')
  return `${resolveNotificationApiBase()}/${normalizedPath}`
}

export function buildNotificationHubUrlCandidates() {
  const explicit = trimTrailingSlash(import.meta.env.VITE_NOTIFICATION_HUB_URL)
  if (explicit) return [explicit]

  const base = trimTrailingSlash(API_BASE)
  return unique([
    `${base}/notification/hub`,
  ])
}

function clampNotificationLimit(limit) {
  const parsed = Number(limit)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.min(Math.floor(parsed), 100)
}

function buildQuery(params = {}) {
  const query = new URLSearchParams()
  if (params.type && params.type !== 'all') query.set('type', params.type)
  if (params.channel && params.channel !== 'all') query.set('channel', params.channel)
  if (params.recipientUserId) query.set('recipientUserId', String(params.recipientUserId).trim())
  if (params.page) query.set('page', String(params.page))
  const limit = clampNotificationLimit(params.limit)
  if (limit) query.set('limit', String(limit))
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export function normalizeNotificationRecord(record, fallbackIndex = 0) {
  const createdAt = record?.createdAt || record?.created || new Date().toISOString()
  const rawId =
    record?.id ??
    record?.notificationId ??
    record?.Id ??
    record?.NotificationId ??
    null
  const fallbackId = [
    String(record?.type || record?.notificationType || 'notification').trim().toLowerCase(),
    String(record?.channel || record?.notificationType || 'push').trim().toLowerCase(),
    String(createdAt || '').trim(),
    String(record?.message || '').trim(),
    String(fallbackIndex),
  ].join(':')

  return {
    id: rawId ? String(rawId) : fallbackId,
    type: String(record?.type || 'Notification').trim() || 'Notification',
    message: String(record?.message || '').trim(),
    channel: String(record?.channel || record?.notificationType || 'Push').trim() || 'Push',
    createdAt,
    recipientUserId: record?.recipientUserId ? String(record.recipientUserId).trim() : '',
    recipientEmail: record?.recipientEmail ? String(record.recipientEmail).trim().toLowerCase() : '',
  }
}

export async function fetchNotifications(params = {}) {
  const endpoint = params.endpoint === 'all' ? 'api/v1/notifications' : 'api/v1/notifications/me'
  const limit = clampNotificationLimit(params.limit ?? 20) ?? 20
  const query = buildQuery({
    page: params.page ?? 1,
    limit,
    type: params.type ?? 'all',
    channel: params.channel ?? 'all',
    recipientUserId: params.recipientUserId,
  })
  const url = buildNotificationApiUrl(`${endpoint}${query}`)
  const res = await authFetch(url, {
    headers: {
      accept: 'application/json',
    },
  })
  const data = await parseResponse(res)
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []

  return {
    items: items.map((item, index) => normalizeNotificationRecord(item, index)),
    total: Number(data?.total ?? items.length ?? 0),
    page: Number(data?.page ?? 1),
    limit: Number(data?.limit ?? limit),
  }
}

export async function fetchNotificationById(notificationId) {
  const id = String(notificationId || '').trim()
  if (!id) throw new Error('Notification id is required.')

  const res = await authFetch(buildNotificationApiUrl(`api/v1/notifications/${encodeURIComponent(id)}`), {
    headers: {
      accept: 'application/json',
    },
  })
  const data = await parseResponse(res)
  return normalizeNotificationRecord(data)
}

export async function deleteNotification(notificationId) {
  const id = String(notificationId || '').trim()
  if (!id) throw new Error('Notification id is required.')

  const res = await authFetch(buildNotificationApiUrl(`api/v1/notifications/${encodeURIComponent(id)}`), {
    method: 'DELETE',
  })

  if (res.status === 204) return true
  await parseResponse(res)
  return true
}

export async function sendEmailNotification(payload = {}) {
  const body = {
    type: payload.type,
    recipientUserId: payload.recipientUserId,
    toEmail: payload.toEmail,
    subject: payload.subject,
    message: payload.message,
  }

  const res = await fetch(buildNotificationApiUrl('api/v1/notifications/email'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  return parseResponse(res)
}
