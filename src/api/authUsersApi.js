import { AUTH_API_BASE, authFetch } from '../auth'
import { getJwtUserId } from '../auth/jwtRoles'

async function readJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function unwrapAutoWrapper(data) {
  if (data == null || typeof data !== 'object') return data
  if (Object.prototype.hasOwnProperty.call(data, 'result') && data.result !== undefined) return data.result
  if (Object.prototype.hasOwnProperty.call(data, 'data') && data.data !== undefined) return data.data
  return data
}

const ORG_ID_KEYS = [
  'organizationalId',
  'organizationalID',
  'organizationId',
  'organizationID',
  'orgId',
  'org_id',
]

/**
 * Read organizational / directory id from an auth user DTO (property names differ by API version).
 * @param {Record<string, unknown> | null | undefined} user
 * @returns {string | null}
 */
export function getOrganizationalIdFromAuthUser(user) {
  if (!user || typeof user !== 'object') return null
  for (const k of ORG_ID_KEYS) {
    const v = user[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  for (const key of Object.keys(user)) {
    const lower = key.toLowerCase()
    if (lower === 'organizationalid' || lower === 'organizationid') {
      const v = user[key]
      if (v != null && String(v).trim() !== '') return String(v).trim()
    }
  }
  return null
}

const NINE_DIGIT_ORG_KEY = /^\d{9}$/
const GUID_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function formatAuthUserDisplayName(user) {
  if (!user || typeof user !== 'object') return ''
  const first = String(user.firstName ?? '').trim()
  const last = String(user.lastName ?? '').trim()
  return [first, last].filter(Boolean).join(' ')
}

/**
 * Resolve a roster lookup key (9-digit organizational id or GUID) to `organizationalId`.
 * Uses GET `/api/auth/users/by-organizational-id/{id}` for 9-digit keys, then GET `/api/auth/users/{id}`.
 * @param {string} lookupId
 * @returns {Promise<string>}
 */
export async function resolveEnteredIdToOrganizationalId(lookupId) {
  const key = String(lookupId ?? '').trim()
  if (!key) {
    const err = new Error('Missing user id.')
    err.code = 'MISSING_USER_ID'
    throw err
  }
  let user = null
  if (NINE_DIGIT_ORG_KEY.test(key)) {
    user = await fetchAuthUserByOrganizationalId(key)
  }
  if (!user) {
    user = await fetchAuthUserById(key)
  }
  if (!user || typeof user !== 'object') {
    const err = new Error(
      `No account was found for "${key}". Check the student ID or GUID, or try again after signing in.`
    )
    err.code = 'AUTH_USER_NOT_FOUND'
    throw err
  }
  const org = getOrganizationalIdFromAuthUser(user)
  if (org) return org
  const err = new Error(
    `An account exists for "${key}", but no organizational id was returned. Contact support if this keeps happening.`
  )
  err.code = 'ORGANIZATIONAL_ID_MISSING'
  throw err
}

/**
 * Organizational / directory id for the signed-in user (JWT subject → profile).
 * @returns {Promise<string | null>}
 */
export async function fetchCurrentUserOrganizationalId() {
  const jwtId = getJwtUserId()
  if (!jwtId) return null
  const user = await fetchAuthUserById(jwtId)
  if (!user || typeof user !== 'object') return null
  return getOrganizationalIdFromAuthUser(user)
}

/**
 * Load auth user for proposal UI (name preview). Same lookup rules as {@link resolveEnteredIdToOrganizationalId}.
 * @param {string} lookupId
 * @returns {Promise<{ displayName: string, organizationalId: string | null } | null>}
 */
export async function fetchProposalMemberProfile(lookupId) {
  const key = String(lookupId ?? '').trim()
  if (!key || (!NINE_DIGIT_ORG_KEY.test(key) && !GUID_KEY.test(key))) return null
  let user = null
  if (NINE_DIGIT_ORG_KEY.test(key)) {
    user = await fetchAuthUserByOrganizationalId(key)
  }
  if (!user) {
    user = await fetchAuthUserById(key)
  }
  if (!user || typeof user !== 'object') return null
  const displayName = formatAuthUserDisplayName(user)
  const organizationalId = getOrganizationalIdFromAuthUser(user)
  return {
    displayName: displayName || '',
    organizationalId,
  }
}

/**
 * Fetch auth user profile by id.
 * Primary endpoint (per backend contract): `/api/auth/users/{id}`.
 *
 * Note: Some deployments allow this endpoint without a Bearer token, while others require it.
 * We first try authenticated; on 403 we retry once without auth as a compatibility fallback.
 */
export async function fetchAuthUserById(userId) {
  const id = String(userId ?? '').trim()
  if (!id) return null

  const url = `${AUTH_API_BASE}/api/auth/users/${encodeURIComponent(id)}`
  try {
    const res = await authFetch(url, { method: 'GET' })
    if (res.ok) {
      const data = unwrapAutoWrapper(await readJsonSafe(res))
      return data && typeof data === 'object' ? data : null
    }
    if (res.status !== 403) return null
  } catch {
    // ignore and fallback
  }

  // Fallback: retry once without Bearer token (some gateways treat Bearer as "must be authorized")
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const data = unwrapAutoWrapper(await readJsonSafe(res))
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

/**
 * GET `/api/auth/users/by-organizational-id/{organizationalId}` (see AUTH_API_DOC).
 */
export async function fetchAuthUserByOrganizationalId(organizationalId) {
  const id = String(organizationalId ?? '').trim()
  if (!id) return null

  const url = `${AUTH_API_BASE}/api/auth/users/by-organizational-id/${encodeURIComponent(id)}`
  try {
    const res = await authFetch(url, { method: 'GET' })
    if (res.ok) {
      const data = unwrapAutoWrapper(await readJsonSafe(res))
      return data && typeof data === 'object' ? data : null
    }
    if (res.status !== 403) return null
  } catch {
    // ignore and fallback
  }

  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const data = unwrapAutoWrapper(await readJsonSafe(res))
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

