import { AUTH_API_BASE, authFetch } from '../auth'

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

