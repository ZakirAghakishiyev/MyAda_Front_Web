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
  const raw = [
    payload.role,
    payload.roles,
    payload.userType,
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
  ].flat()
  return raw
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
}

/** Global/system `Admin` in JWT (case-insensitive) — not the same as a club membership role. */
export function userHasJwtAdminRole() {
  const payload = decodeJwtPayload(getAccessToken())
  const roles = readJwtRoleClaims(payload).map((r) => r.toLowerCase())
  return roles.includes('admin')
}
