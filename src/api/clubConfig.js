/**
 * Club service base URL (see Club API docs).
 * Local Docker service: `http://localhost:5003` → `{base}/api/v1/...`
 * Deployed gateway: `http://<host>:5000/club` (gateway strips `/club` before forwarding).
 */
export const CLUB_API_BASE = (
  import.meta.env.VITE_CLUB_API_BASE ?? 'http://localhost:5003'
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
