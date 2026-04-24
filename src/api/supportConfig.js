/**
 * Support service base (see SUPPORT_API_DOC.md).
 * Gateway: {origin}/support/api/... — in dev, Vite proxies /support to the API gateway.
 */
const trim = (s) => String(s || '').replace(/\/+$/, '')

export const SUPPORT_API_BASE_FALLBACKS = [
  'http://localhost:5000/support/api',
  'http://127.0.0.1:5000/support/api',
  'http://localhost:5008/api',
]

/** Bases to try in order; first is same-origin when in browser (Vite proxy / deployed behind gateway). */
export function getSupportApiBases() {
  const fromEnv = trim(import.meta.env.VITE_SUPPORT_API_BASE)
  if (fromEnv) return [fromEnv]
  const sameOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? [`${window.location.origin}/support/api`]
      : []
  return [...sameOrigin, ...SUPPORT_API_BASE_FALLBACKS]
}

const authRoot = () => trim(import.meta.env.VITE_AUTH_API_BASE || 'http://localhost:5000')

export const DISPATCHER_ROLE_USER_URLS = import.meta.env.VITE_AUTH_API_BASES
  ? String(import.meta.env.VITE_AUTH_API_BASES)
      .split(/[,;]/)
      .map((s) => trim(s))
      .filter(Boolean)
  : [`${authRoot()}/api/auth/users-by-role`, 'http://127.0.0.1:5001/api/auth/users-by-role']
