const ACCESS_STORAGE_KEY = 'accessToken'
const REFRESH_COOKIE_NAME = 'refreshToken'
/** Aligned with AUTH API (refresh token lifetime, e.g. 30 days) — keeps session after browser restarts. */
const REFRESH_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * @param {string} name
 * @param {string} value
 * @param {number} [maxAgeSeconds] — if omitted, cookie is a **session** cookie (cleared when the browser is closed).
 */
function setCookie(name, value, maxAgeSeconds) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  let cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`
  if (maxAgeSeconds != null && Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0) {
    cookie += `; Max-Age=${maxAgeSeconds}`
  }
  if (secure) cookie += '; Secure'
  document.cookie = cookie
}

function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0`
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_STORAGE_KEY)
}

export function getRefreshToken() {
  return getCookie(REFRESH_COOKIE_NAME)
}

export function setTokens(accessToken, refreshToken) {
  sessionStorage.setItem(ACCESS_STORAGE_KEY, accessToken)
  setCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_MAX_AGE_SEC)
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_STORAGE_KEY)
  deleteCookie(REFRESH_COOKIE_NAME)
}
