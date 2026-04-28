/**
 * Shared gateway/service origin for local + deployed environments.
 * Override via `VITE_API_BASE` (e.g. http://localhost:5000 or https://myada.duckdns.org).
 */
const browserOrigin =
  import.meta.env.DEV && typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin.replace(/\/+$/, '')
    : ''

export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') || browserOrigin || 'https://myada.duckdns.org'

