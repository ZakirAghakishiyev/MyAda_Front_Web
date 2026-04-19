import { getAccessToken } from '../auth/tokenStorage'
import { getSchedulingUserId } from './schedulingUserId'

/** Matches scheduling service: UUID or legacy numeric string for X-User-Id. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

/**
 * @param {unknown} value
 * @returns {string | null} Trimmed id string, or null if not a valid scheduling user id.
 */
export function normalizeSchedulingUserId(value) {
  if (value == null) return null
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return String(value)
  const s = String(value).trim()
  if (!s) return null
  if (/^\d+$/.test(s)) return s
  if (UUID_RE.test(s)) return s
  return null
}

function readInstructorUserIdFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null
  const keys = [
    'instructor_user_id',
    'instructorUserId',
    'InstructorUserId',
    'userId',
    'user_id',
  ]
  for (const k of keys) {
    const id = normalizeSchedulingUserId(payload[k])
    if (id != null) return id
  }
  for (const k of ['sub', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) {
    const id = normalizeSchedulingUserId(payload[k])
    if (id != null) return id
  }
  return null
}

/**
 * String for `X-User-Id` (UUID or numeric), or null if unavailable.
 * Session override (Scheduling page field) wins, then JWT claims.
 */
export function getEffectiveSchedulingInstructorId() {
  const fromSession = normalizeSchedulingUserId(getSchedulingUserId())
  if (fromSession != null) return fromSession
  const fromJwt = readInstructorUserIdFromPayload(decodeJwtPayload(getAccessToken()))
  if (fromJwt != null) return fromJwt
  return null
}
