/**
 * Shared gateway/service origin for local + deployed environments.
 * Override via `VITE_API_BASE_URL` / `VITE_API_BASE` (e.g. http://localhost:5000 or https://myada.site).
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') ||
  'https://myada.site'

