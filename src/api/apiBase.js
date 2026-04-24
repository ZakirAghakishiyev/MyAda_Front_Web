/**
 * Shared gateway/service origin for local + deployed environments.
 * Override via `VITE_API_BASE` (e.g. http://localhost:5000 or https://prod.example.com).
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') || 'http://13.60.31.141:5000'

