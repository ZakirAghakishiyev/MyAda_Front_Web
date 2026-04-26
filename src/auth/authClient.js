import { AUTH_API_BASE } from './config'
import { getAccessTokenExpirationMs } from './jwtRoles'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage'

let refreshInFlight = null
/** @type {ReturnType<typeof setTimeout> | null} */
let proactiveRefreshTimer = null

const REFRESH_BEFORE_ACCESS_EXPIRY_MS = 90 * 1000
const RESUME_REFRESH_IF_REMAINING_MS = 2 * 60 * 1000

function clearProactiveRefresh() {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer)
    proactiveRefreshTimer = null
  }
}

/**
 * Re-issue access token shortly before the JWT `exp` (per AUTH_API_DOC, access ~15m).
 * Called after every successful token set (login or refresh).
 */
function scheduleProactiveAccessRefresh() {
  clearProactiveRefresh()
  const t = getAccessToken()
  if (!t) return
  if (!getRefreshToken()) return
  const expMs = getAccessTokenExpirationMs(t)
  if (expMs == null) return
  const delay = Math.max(0, expMs - Date.now() - REFRESH_BEFORE_ACCESS_EXPIRY_MS)
  if (delay === 0) {
    void refreshSession()
    return
  }
  proactiveRefreshTimer = setTimeout(() => {
    proactiveRefreshTimer = null
    if (!getRefreshToken()) return
    if (!getAccessToken()) {
      void refreshSession()
      return
    }
    const exp = getAccessTokenExpirationMs(getAccessToken())
    if (exp == null) return
    if (exp - Date.now() <= REFRESH_BEFORE_ACCESS_EXPIRY_MS + 5000) {
      void refreshSession()
    }
  }, Math.min(delay, 2147483647))
}

function clearClientSession() {
  clearProactiveRefresh()
  clearTokens()
}

if (typeof window !== 'undefined') {
  const onResume = () => {
    if (document.hidden) return
    void (async () => {
      if (!getRefreshToken()) return
      const t = getAccessToken()
      if (!t) {
        await refreshSession()
        return
      }
      const exp = getAccessTokenExpirationMs(t)
      if (exp == null) return
      if (exp - Date.now() < RESUME_REFRESH_IF_REMAINING_MS) {
        await refreshSession()
      }
    })()
  }
  document.addEventListener('visibilitychange', onResume)
  window.addEventListener('focus', onResume, true)
}

export function forceLogoutAndRedirectLogin() {
  clearClientSession()
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
}

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

/**
 * Refresh access token: POST /api/auth/refresh with { refreshToken }.
 * Single-flight: concurrent callers share one refresh. Rotates both tokens (AUTH_API_DOC).
 */
export async function refreshSession() {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return null

      const res = await fetch(`${AUTH_API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) {
        clearClientSession()
        return null
      }

      const data = await parseJsonSafe(res)
      if (!data.accessToken || !data.refreshToken) {
        clearClientSession()
        return null
      }

      setTokens(data.accessToken, data.refreshToken)
      scheduleProactiveAccessRefresh()
      return data.accessToken
    } catch {
      clearClientSession()
      return null
    }
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

export async function login(username, password) {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const data = await parseJsonSafe(res)

  if (!res.ok) {
    const err = new Error(
      data.message || (res.status === 401 ? 'Invalid username or password.' : 'Login failed.')
    )
    err.status = res.status
    throw err
  }

  if (!data.accessToken || !data.refreshToken) {
    const err = new Error('Unexpected response from server.')
    err.status = res.status
    throw err
  }

  setTokens(data.accessToken, data.refreshToken)
  scheduleProactiveAccessRefresh()
  return data
}

export async function logout() {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  try {
    if (accessToken && refreshToken) {
      await fetch(`${AUTH_API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      })
    }
  } catch {
    // still clear client session
  }
  clearClientSession()
}

export async function forgotPassword(email) {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data != null
        ? data.message || data.title || data.detail
        : typeof data === 'string' && data
          ? data
          : 'Request failed.'
    const err = new Error(String(msg || 'Request failed.'))
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export async function resetPassword(email, token, newPassword) {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPassword }),
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const err = new Error(
      typeof data === 'string' ? data : data.message || 'Reset failed.'
    )
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export async function changePassword(email, oldPassword, newPassword) {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/change-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, oldPassword, newPassword }),
  })
  const text = await res.text()
  let data = text
  try {
    data = text ? JSON.parse(text) : text
  } catch {
    /* plain string body */
  }
  if (!res.ok) {
    let msg =
      typeof data === 'string' && data.trim()
        ? data.trim()
        : typeof data === 'object' && data != null
          ? data.message || data.title || data.detail
          : ''
    if (!msg && res.status === 404) msg = 'No account found for this email.'
    if (!msg && Array.isArray(data)) msg = data.map(String).join(' ')
    if (!msg && typeof data === 'object' && data != null && Array.isArray(data.errors)) {
      msg = data.errors.map(String).join(' ')
    }
    const err = new Error(msg || 'Change password failed.')
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

/**
 * Fetch with Authorization. On 401, call POST /api/auth/refresh once, then retry the request once
 * (AUTH_API_DOC: Frontend Integration Notes). If refresh fails, clear session and redirect to login.
 */
export async function authFetch(input, init = {}) {
  const safeInit = init && typeof init === 'object' ? init : {}
  const { _authRetry, ...fetchInit } = safeInit
  const hadRetry = Boolean(_authRetry)
  const headers = new Headers(fetchInit.headers ?? undefined)
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(input, { ...fetchInit, headers })
  const hadBearer = Boolean(accessToken)

  if (hadBearer && !hadRetry && response.status === 401) {
    const newAccess = await refreshSession()
    if (newAccess) {
      return authFetch(input, { ...fetchInit, _authRetry: true })
    }
    forceLogoutAndRedirectLogin()
    const err = new Error('Session expired. Please sign in again.')
    err.code = 'AUTH_SESSION_EXPIRED'
    throw err
  }

  return response
}
