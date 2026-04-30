import { getAccessToken } from './tokenStorage'

export function decodeJwtPayload(token) {
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

/** @param {string | null | undefined} token */
export function getAccessTokenExpirationMs(token) {
  if (!token) return null
  const p = decodeJwtPayload(token)
  if (!p || typeof p.exp !== 'number' || !Number.isFinite(p.exp)) return null
  return p.exp * 1000
}

export function readJwtRoleClaims(payload) {
  if (!payload || typeof payload !== 'object') return []
  const realmRoles = payload.realm_access && Array.isArray(payload.realm_access.roles) ? payload.realm_access.roles : []
  const raw = [
    payload.role,
    payload.roles,
    payload.Role,
    payload.userType,
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    ...realmRoles,
  ].flat()
  return raw
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
}

/** Global/system `Admin` / `Administrator` in JWT (case-insensitive) — not the same as a club membership role. */
export function userHasJwtAdminRole() {
  const payload = decodeJwtPayload(getAccessToken())
  const roles = readJwtRoleClaims(payload).map((r) => r.toLowerCase())
  return roles.includes('admin') || roles.includes('administrator')
}

/** Student Services portal: JWT role `student-services` (and common spellings). */
export function userHasStudentServicesRole() {
  const payload = decodeJwtPayload(getAccessToken())
  const roles = readJwtRoleClaims(payload).map((r) =>
    String(r ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
  )
  return roles.some(
    (r) =>
      r === 'student-services' ||
      r === 'studentservices' ||
      r === 'student_services' ||
      r === 'student-services-staff' ||
      r === 'student_services_staff'
  )
}

/**
 * User id for Club API paths under `users/{id}/...` (must match JWT `sub` / `user_id` or common claim aliases).
 * @returns {string | null}
 */
export function getJwtUserId() {
  const payload = decodeJwtPayload(getAccessToken())
  if (!payload || typeof payload !== 'object') return null
  const id =
    payload.sub ??
    payload.user_id ??
    payload.userId ??
    payload.oid ??
    payload.nameid ??
    payload.unique_name ??
    payload['http://schemas.microsoft.com/identity/claims/objectidentifier'] ??
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
  if (id == null || id === '') return null
  return String(id)
}

/** Email from access token (common claim names across IdPs). */
export function getJwtEmail() {
  const payload = decodeJwtPayload(getAccessToken())
  if (!payload || typeof payload !== 'object') return null
  const candidates = [
    payload.email,
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'],
    payload.upn,
    payload.preferred_username,
    payload.preferredUsername,
    payload.unique_name,
    payload.name,
  ]
  for (const raw of candidates) {
    if (raw == null || raw === '') continue
    const s = String(raw).trim()
    if (s.includes('@')) return s
  }
  return null
}

function pickFirstNonEmptyString(payload, keys) {
  if (!payload || typeof payload !== 'object') return null
  for (const k of keys) {
    const v = payload[k]
    if (v == null) continue
    const s = String(v).trim()
    if (s) return s
  }
  return null
}

/** Display name from access token (common claim names across IdPs). */
export function getJwtDisplayName() {
  const payload = decodeJwtPayload(getAccessToken())
  if (!payload || typeof payload !== 'object') return null
  const first = pickFirstNonEmptyString(payload, ['firstName', 'given_name', 'givenName', 'FirstName'])
  const last = pickFirstNonEmptyString(payload, ['lastName', 'family_name', 'familyName', 'LastName', 'surname'])
  const full = `${first || ''} ${last || ''}`.trim()
  if (full) return full
  return pickFirstNonEmptyString(payload, ['name', 'displayName', 'preferred_username', 'preferredUsername', 'unique_name'])
}

/**
 * Best-effort role/job label for headers (falls back to a friendly role claim).
 * Not used for authorization.
 */
export function getJwtRoleLabel() {
  const payload = decodeJwtPayload(getAccessToken())
  if (!payload || typeof payload !== 'object') return null
  const title = pickFirstNonEmptyString(payload, [
    'jobTitle',
    'JobTitle',
    'title',
    'Title',
    'position',
    'Position',
    'department',
    'Department',
    'userType',
    'UserType',
  ])
  if (title) return title
  const roles = readJwtRoleClaims(payload)
    .map((r) => String(r || '').trim())
    .filter(Boolean)
  const firstRole = roles[0]
  if (!firstRole) return null
  // Convert common separators into a human label.
  return firstRole
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** One or two letters for the header avatar. */
export function getJwtProfileInitial() {
  const payload = decodeJwtPayload(getAccessToken())
  if (!payload || typeof payload !== 'object') return 'U'
  const fn = String(payload.firstName ?? '').trim()
  const ln = String(payload.lastName ?? '').trim()
  if (fn) return (fn[0] + (ln[0] || fn[1] || '')).toUpperCase().slice(0, 2)
  const email = String(payload.email ?? payload.unique_name ?? '').trim()
  if (email) return email[0].toUpperCase()
  return 'U'
}
