const browserOrigin =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin.replace(/\/$/, '')
    : ''

export const AUTH_API_BASE =
  import.meta.env.VITE_AUTH_API_BASE?.replace(/\/$/, '') ||
  browserOrigin ||
  'https://myada.duckdns.org'
