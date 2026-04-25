import { authFetch } from '../auth'
import { resolveCallRestApiBase } from './callHubClient'
import type { CallHistoryItem, CallHistoryStatus } from './types'

const HISTORY_STATUSES: CallHistoryStatus[] = ['pending', 'accepted', 'rejected', 'cancelled', 'timed-out']

function normalizeStatus(raw: unknown): CallHistoryStatus {
  const s = String(raw ?? '').trim()
  return HISTORY_STATUSES.includes(s as CallHistoryStatus) ? (s as CallHistoryStatus) : 'pending'
}

function unwrapBody<T>(data: unknown): T {
  if (data == null) return data as T
  if (typeof data !== 'object') return data as T
  const obj = data as Record<string, unknown>
  if (Object.prototype.hasOwnProperty.call(obj, 'result') && obj.result !== undefined) return obj.result as T
  if (Object.prototype.hasOwnProperty.call(obj, 'data') && obj.data !== undefined) return obj.data as T
  return data as T
}

function normalizeHistoryItem(raw: unknown): CallHistoryItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const callId = String(r.callId ?? '')
  if (!callId) return null
  const participant = (p: unknown) => {
    if (!p || typeof p !== 'object') return { userId: '', displayName: '' }
    const o = p as Record<string, unknown>
    return {
      userId: String(o.userId ?? ''),
      displayName: String(o.displayName ?? ''),
    }
  }
  return {
    callId,
    roomId: String(r.roomId ?? ''),
    status: normalizeStatus(r.status),
    caller: participant(r.caller),
    dispatcher: participant(r.dispatcher),
    requestedAtUtc: String(r.requestedAtUtc ?? ''),
    acceptedAtUtc: r.acceptedAtUtc != null ? String(r.acceptedAtUtc) : null,
    endedAtUtc: r.endedAtUtc != null ? String(r.endedAtUtc) : null,
    durationSeconds: r.durationSeconds != null && r.durationSeconds !== '' ? Number(r.durationSeconds) : null,
    resolvedAtUtc: r.resolvedAtUtc != null ? String(r.resolvedAtUtc) : null,
    resolveReason: r.resolveReason != null ? String(r.resolveReason) : null,
    endReason: r.endReason != null ? String(r.endReason) : null,
  }
}

function parseHistoryList(data: unknown): CallHistoryItem[] {
  const unwrapped = unwrapBody<unknown>(data)
  const list = Array.isArray(unwrapped) ? unwrapped : []
  return list.map(normalizeHistoryItem).filter((x): x is CallHistoryItem => Boolean(x))
}

export type FetchCallHistoryParams = {
  status?: CallHistoryStatus
  limit?: number
}

/**
 * `GET /call/api/call-history` — persisted history for the current user (caller or dispatcher).
 */
export async function fetchCallHistory(params: FetchCallHistoryParams = {}): Promise<CallHistoryItem[]> {
  const base = resolveCallRestApiBase()
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.limit != null) q.set('limit', String(params.limit))
  const qs = q.toString()
  const url = `${base}/call-history${qs ? `?${qs}` : ''}`
  const res = await authFetch(url, { method: 'GET' })
  if (!res.ok) {
    const err = new Error(`Could not load call history (${res.status}).`)
    ;(err as Error & { status?: number }).status = res.status
    throw err
  }
  const json = await res.json().catch(() => null)
  return parseHistoryList(json)
}

/**
 * `GET /call/api/call-history/{callId}`
 */
export async function fetchCallHistoryById(callId: string): Promise<CallHistoryItem> {
  const id = String(callId ?? '').trim()
  if (!id) {
    const err = new Error('callId is required.')
    ;(err as Error & { status?: number }).status = 400
    throw err
  }
  const base = resolveCallRestApiBase()
  const url = `${base}/call-history/${encodeURIComponent(id)}`
  const res = await authFetch(url, { method: 'GET' })
  if (res.status === 404) {
    const err = new Error('Call not found.')
    ;(err as Error & { status?: number }).status = 404
    throw err
  }
  if (!res.ok) {
    const err = new Error(`Could not load call (${res.status}).`)
    ;(err as Error & { status?: number }).status = res.status
    throw err
  }
  const json = await res.json().catch(() => null)
  const unwrapped = unwrapBody<unknown>(json)
  const item = normalizeHistoryItem(unwrapped)
  if (!item) {
    const err = new Error('Invalid call history response.')
    ;(err as Error & { status?: number }).status = 500
    throw err
  }
  return item
}
