import { AUTH_API_BASE } from './config'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage'

let refreshInFlight = null

export function forceLogoutAndRedirectLogin() {
  clearTokens()
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
 * Refresh access token using cookie-stored refresh token.
 * Single-flight: concurrent callers share one refresh.
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
        clearTokens()
        return null
      }

      const data = await parseJsonSafe(res)
      if (!data.accessToken || !data.refreshToken) {
        clearTokens()
        return null
      }

      setTokens(data.accessToken, data.refreshToken)
      return data.accessToken
    } catch {
      clearTokens()
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
  clearTokens()
}

export async function forgotPassword(email) {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed.')
    err.status = res.status
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
    const err = new Error(
      typeof data === 'string' ? data : data?.message || 'Change password failed.'
    )
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Fetch with Authorization header from sessionStorage.
 * If the request used a Bearer token and the response is 401 or 400 (expired access per backend),
 * refreshes tokens once, updates sessionStorage + cookies, retries the request once.
 * On refresh failure: clears storage and redirects to /login.
 */
export async function authFetch(input, init = {}) {
  const hadRetry = Boolean(init._authRetry)
  const headers = new Headers(init.headers ?? undefined)
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(input, { ...init, headers })
  const hadBearer = Boolean(accessToken)

  if (
    hadBearer &&
    !hadRetry &&
    (response.status === 401 || response.status === 400)
  ) {
    const newAccess = await refreshSession()
    if (newAccess) {
      const retryHeaders = new Headers(init.headers ?? undefined)
      retryHeaders.set('Authorization', `Bearer ${newAccess}`)
      return fetch(input, { ...init, headers: retryHeaders, _authRetry: true })
    }
    forceLogoutAndRedirectLogin()
    const err = new Error('Session expired. Please sign in again.')
    err.code = 'AUTH_SESSION_EXPIRED'
    throw err
  }

  return response
}
