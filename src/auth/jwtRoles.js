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
