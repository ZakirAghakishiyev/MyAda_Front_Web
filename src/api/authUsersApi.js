import { AUTH_API_BASE, authFetch } from '../auth'
import { getJwtUserId, getJwtEmail, decodeJwtPayload } from '../auth/jwtRoles'
import { getAccessToken } from '../auth/tokenStorage'

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

/**
 * Human-readable name from an auth user DTO or any club roster-shaped object.
 * Handles PascalCase (.NET) and nested `user` / `student` payloads.
 * @param {Record<string, unknown> | null | undefined} user
 * @returns {string}
 */
export function displayNameFromAuthUserDto(user) {
  if (!user || typeof user !== 'object') return ''
  const t = (v) => {
    if (v == null) return ''
    const s = String(v).trim()
    return s
  }
  const first =
    t(user.firstName) ||
    t(user.FirstName) ||
    t(user.givenName) ||
    t(user.GivenName)
  const last =
    t(user.lastName) ||
    t(user.LastName) ||
    t(user.surname) ||
    t(user.Surname) ||
    t(user.familyName) ||
    t(user.FamilyName)
  const combined = [first, last].filter(Boolean).join(' ').trim()
  if (combined) return combined
  const single =
    t(user.displayName) ||
    t(user.DisplayName) ||
    t(user.name) ||
    t(user.Name) ||
    t(user.fullName) ||
    t(user.FullName) ||
    t(user.studentName) ||
    t(user.StudentName)
  if (single) return single
  const un = t(user.userName) || t(user.UserName)
  if (un && !un.includes('@')) return un
  if (un) return un
  const nested = user.user ?? user.User ?? user.student ?? user.Student ?? user.member ?? user.Member
  if (nested && typeof nested === 'object' && nested !== user) {
    const inner = displayNameFromAuthUserDto(nested)
    if (inner) return inner
  }
  return ''
}

/**
 * First-line name parts from a club roster / employee list DTO (before auth enrichment).
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {{ name: string, surname: string, email: string }}
 */
export function personNamePartsFromClubRosterDto(row) {
  if (!row || typeof row !== 'object') return { name: '—', surname: '', email: '' }
  const first = String(row.firstName ?? row.FirstName ?? '').trim()
  const last = String(row.lastName ?? row.LastName ?? row.surname ?? row.Surname ?? '').trim()
  const email = String(row.email ?? row.Email ?? '').trim()
  if (first || last) return { name: first || '—', surname: last, email }
  const member = row.member ?? row.Member
  if (member && typeof member === 'object') {
    const mf = String(member.firstName ?? member.FirstName ?? '').trim()
    const ml = String(member.lastName ?? member.LastName ?? member.surname ?? member.Surname ?? '').trim()
    const me = String(member.email ?? member.Email ?? '').trim()
    if (mf || ml) return { name: mf || '—', surname: ml, email: me }
  }
  const full = displayNameFromAuthUserDto(row)
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean)
    return { name: parts[0] || '—', surname: parts.slice(1).join(' '), email }
  }
  return { name: '—', surname: '', email }
}

function formatAuthUserDisplayName(user) {
  return displayNameFromAuthUserDto(user)
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
 * Best email for the signed-in user: JWT claims first, then GET `/api/auth/users/{id}` profile.
 * @returns {Promise<string | null>}
 */
function emailFromAuthUserDto(user) {
  if (!user || typeof user !== 'object') return null
  const email = String(user.email ?? '').trim()
  if (email.includes('@')) return email
  for (const key of ['userName', 'username', 'UserName']) {
    const u = String(user[key] ?? '').trim()
    if (u.includes('@')) return u
  }
  return null
}

/**
 * Best email for the signed-in user: JWT claims first, then profile by `sub`, then by `organizationalId`.
 * @returns {Promise<string | null>}
 */
export async function fetchCurrentUserEmail() {
  const fromJwt = getJwtEmail()
  if (fromJwt) return fromJwt
  const jwtId = getJwtUserId()
  if (jwtId) {
    const user = await fetchAuthUserById(jwtId)
    const e = emailFromAuthUserDto(user)
    if (e) return e
  }
  const payload = decodeJwtPayload(getAccessToken())
  if (!payload || typeof payload !== 'object') return null
  const org = String(
    payload.organizationalId ?? payload.organizationalID ?? payload.organizationId ?? ''
  ).trim()
  if (org) {
    const user = await fetchAuthUserByOrganizationalId(org)
    return emailFromAuthUserDto(user)
  }
  return null
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
 * Per-session cache for auth profile reads, including misses.
 * Auth profile reads are protected: non-admin callers get 403 for other users (AUTH_API_DOC §4-§5).
 * Caching the null result prevents N×(403+401) request spam on every render of a club detail / roster page.
 */
const authUserByIdCache = new Map()
const authUserByOrgIdCache = new Map()

export function clearAuthUserCache() {
  authUserByIdCache.clear()
  authUserByOrgIdCache.clear()
}

/**
 * Fetch auth user profile by id.
 * Primary endpoint (per AUTH_API_DOC): `GET /api/auth/users/{id}` — Bearer required; admin can fetch any user,
 * everyone else can only fetch self.
 *
 * Behaviour:
 * - 200: returns the user DTO (cached).
 * - 401/403/404: returns `null` (cached). No unauth retry — the contract requires Bearer, so a bare `fetch`
 *   would just generate a second 401 console error for the same logical request.
 */
export async function fetchAuthUserById(userId) {
  const id = String(userId ?? '').trim()
  if (!id) return null
  if (authUserByIdCache.has(id)) return authUserByIdCache.get(id)

  const url = `${AUTH_API_BASE}/api/auth/users/${encodeURIComponent(id)}`
  let result = null
  try {
    const res = await authFetch(url, { method: 'GET' })
    if (res.ok) {
      const data = unwrapAutoWrapper(await readJsonSafe(res))
      result = data && typeof data === 'object' ? data : null
    }
  } catch {
    result = null
  }
  authUserByIdCache.set(id, result)
  return result
}

/**
 * GET `/api/auth/users/by-organizational-id/{organizationalId}` (see AUTH_API_DOC §5).
 * Same access rules as `fetchAuthUserById`. Cached per-session, no unauth retry.
 */
export async function fetchAuthUserByOrganizationalId(organizationalId) {
  const id = String(organizationalId ?? '').trim()
  if (!id) return null
  if (authUserByOrgIdCache.has(id)) return authUserByOrgIdCache.get(id)

  const url = `${AUTH_API_BASE}/api/auth/users/by-organizational-id/${encodeURIComponent(id)}`
  let result = null
  try {
    const res = await authFetch(url, { method: 'GET' })
    if (res.ok) {
      const data = unwrapAutoWrapper(await readJsonSafe(res))
      result = data && typeof data === 'object' ? data : null
    }
  } catch {
    result = null
  }
  authUserByOrgIdCache.set(id, result)
  return result
}

/**
 * Load auth profile for club roster enrichment.
 * - 9-digit key → `users/by-organizational-id/{id}` (with `users/{id}` only as a last resort).
 * - GUID key → `users/{id}` ONLY. We do not fall back to `by-organizational-id/{guid}`: that endpoint
 *   expects a 9-digit organizational id, so calling it with a GUID is guaranteed to fail (and was the
 *   source of the visible 403/401 spam in the network panel).
 * @param {string} lookupKey
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function fetchAuthUserForClubRoster(lookupKey) {
  const key = String(lookupKey ?? '').trim()
  if (!key) return null
  if (NINE_DIGIT_ORG_KEY.test(key)) {
    const byOrg = await fetchAuthUserByOrganizationalId(key)
    if (byOrg) return byOrg
    const byId = await fetchAuthUserById(key)
    return byId && typeof byId === 'object' ? byId : null
  }
  if (GUID_KEY.test(key)) {
    const byId = await fetchAuthUserById(key)
    return byId && typeof byId === 'object' ? byId : null
  }
  let u = await fetchAuthUserById(key)
  if (u) return u
  u = await fetchAuthUserByOrganizationalId(key)
  return u && typeof u === 'object' ? u : null
}
