const ACCESS_STORAGE_KEY = 'accessToken'
const REFRESH_COOKIE_NAME = 'refreshToken'
/** ~180 days; refresh invalidation is enforced server-side */
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name, value, maxAgeSeconds) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  let cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
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
  setCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_MAX_AGE)
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_STORAGE_KEY)
  deleteCookie(REFRESH_COOKIE_NAME)
}
