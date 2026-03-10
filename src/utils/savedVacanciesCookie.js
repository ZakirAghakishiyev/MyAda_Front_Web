const COOKIE_NAME = 'savedVacancies'
const MAX_AGE_DAYS = 365

function getCookie (name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie (name, value, days = MAX_AGE_DAYS) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`
}

/**
 * @returns {number[]} saved vacancy IDs
 */
export function getSavedVacancyIds () {
  try {
    const raw = getCookie(COOKIE_NAME)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(Number(n))).map(Number) : []
  } catch {
    return []
  }
}

/**
 * @param {number[]} ids
 */
export function setSavedVacancyIds (ids) {
  const list = Array.isArray(ids) ? ids.filter((n) => Number.isInteger(Number(n))).map(Number) : []
  setCookie(COOKIE_NAME, JSON.stringify(list))
}
