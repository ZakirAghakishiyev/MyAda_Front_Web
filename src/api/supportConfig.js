/**
 * Support service base (see SUPPORT_API_DOC.md).
 * Gateway: {api-base}/support/api/... — source of truth is the API base, not the frontend origin.
 */
import { AUTH_API_BASE } from '../auth/config'

const trim = (s) => String(s || '').replace(/\/+$/, '')

export const SUPPORT_API_BASE_FALLBACKS = [
  'http://localhost:5000/support/api',
  'http://127.0.0.1:5000/support/api',
  'http://localhost:5008/api',
]

/** Bases to try in order; first is the configured API gateway base. */
export function getSupportApiBases() {
  const fromEnv = trim(import.meta.env.VITE_SUPPORT_API_BASE)
  if (fromEnv) return [fromEnv]
  return [`${AUTH_API_BASE}/support/api`, ...SUPPORT_API_BASE_FALLBACKS]
}

/**
 * Same gateway root as login / `authFetch` ({@link AUTH_API_BASE}), so dispatcher
 * `users-by-role` calls hit e.g. `https://myada.site/api/auth/users-by-role/...`.
 * Override list only with `VITE_AUTH_API_BASES` (comma/semicolon-separated full `.../users-by-role` bases).
 */
export const DISPATCHER_ROLE_USER_URLS = import.meta.env.VITE_AUTH_API_BASES
  ? String(import.meta.env.VITE_AUTH_API_BASES)
      .split(/[,;]/)
      .map((s) => trim(s))
      .filter(Boolean)
  : [`${AUTH_API_BASE}/api/auth/users-by-role`, 'http://127.0.0.1:5001/api/auth/users-by-role']
