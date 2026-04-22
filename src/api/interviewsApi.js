import { authFetch } from '../auth'
import { INTERVIEWS_API_BASE } from './interviewsConfig'

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function messageFromBody(body, fallback) {
  if (!body) return fallback
  if (typeof body === 'string' && body.trim()) return body.trim()
  if (typeof body === 'object') {
    const candidates = [body.message, body.title, body.detail, body.error]
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim()
    }
  }
  return fallback
}

function makeApiError(res, body, fallback) {
  const err = new Error(messageFromBody(body, fallback))
  err.status = res.status
  err.body = body
  return err
}

function qsFromParams(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    const str = String(v).trim()
    if (!str) return
    q.set(k, str)
  })
  const out = q.toString()
  return out ? `?${out}` : ''
}

export async function listInterviewSlots(interviewId, params = {}) {
  const encId = encodeURIComponent(String(interviewId))
  const url = `${INTERVIEWS_API_BASE}/api/v1/interviews/${encId}/slots${qsFromParams(params)}`
  const res = await authFetch(url, { method: 'GET' })
  const body = await parseJsonSafe(res)
  if (!res.ok) throw makeApiError(res, body, `Could not load interview slots (${res.status}).`)
  return body
}

export async function getInterviewSlot(slotId) {
  const encId = encodeURIComponent(String(slotId))
  const url = `${INTERVIEWS_API_BASE}/api/v1/slots/${encId}`
  const res = await authFetch(url, { method: 'GET' })
  const body = await parseJsonSafe(res)
  if (!res.ok) throw makeApiError(res, body, `Could not load slot (${res.status}).`)
  return body
}

function makeIdempotencyKey() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function bookInterviewSlot(interviewId, slotId, options = {}) {
  const encId = encodeURIComponent(String(interviewId))
  const url = `${INTERVIEWS_API_BASE}/api/v1/interviews/${encId}/bookings`
  const headers = new Headers(options.headers ?? undefined)
  headers.set('Content-Type', 'application/json')
  if (!headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', makeIdempotencyKey())
  }
  const res = await authFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ slotId }),
  })
  const body = await parseJsonSafe(res)
  if (!res.ok) throw makeApiError(res, body, `Could not book slot (${res.status}).`)
  return { status: res.status, body }
}

export async function getMyInterviewBooking(interviewId) {
  const encId = encodeURIComponent(String(interviewId))
  const url = `${INTERVIEWS_API_BASE}/api/v1/interviews/${encId}/my-booking`
  const res = await authFetch(url, { method: 'GET' })
  const body = await parseJsonSafe(res)
  if (res.status === 404) return null
  if (!res.ok) throw makeApiError(res, body, `Could not load booking (${res.status}).`)
  return body
}

