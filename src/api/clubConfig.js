/**
 * Club service base URL (see Club API docs).
 * Local gateway: `http://localhost:5000/club` → `{base}/api/v1/...`
 * Direct service (no gateway): set `VITE_CLUB_API_BASE=http://localhost:5003`
 */
export const CLUB_API_BASE = (
  import.meta.env.VITE_CLUB_API_BASE ?? 'http://localhost:5000/club'
).replace(/\/+$/, '')

/** Origin without `/club` — used to resolve relative image paths from the API. */
export function clubGatewayOrigin() {
  return CLUB_API_BASE.replace(/\/club$/i, '') || CLUB_API_BASE
}

/** Path segment after `/api/v1/` (no leading slash). */
export function clubUrl(path) {
  const p = String(path || '').replace(/^\//, '')
  return `${CLUB_API_BASE}/api/v1/${p}`
}
