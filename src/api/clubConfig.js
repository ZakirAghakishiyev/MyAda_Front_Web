/**
 * Club service base URL (see Club API docs).
 * Local Docker service: `http://localhost:5003` → `{base}/api/v1/...`
 * Gateway route (recommended for local dev): `/club` (proxied by Vite to your gateway target).
 * Deployed gateway: `http://<host>:5000/club` (gateway strips `/club` before forwarding).
 */
export const CLUB_API_BASE = String(
  import.meta.env.VITE_CLUB_API_BASE ??
    // Default to relative path so local `vite` proxy can route it.
    '/club'
).replace(/\/+$/, '')

/** Origin without `/club` — used for legacy fallbacks (e.g. default.png on the gateway). */
export function clubGatewayOrigin() {
  return CLUB_API_BASE.replace(/\/club$/i, '') || CLUB_API_BASE
}

/**
 * Public base URL for club media files (S3). API often returns relative paths like
 * `/clubs/clubs/{id}/profile/logo/...jpg` which must be joined to this host, not the API gateway.
 * @see https://myada-app.s3.eu-north-1.amazonaws.com/clubs/clubs/1/profile/logo/...
 */
export const CLUB_MEDIA_BASE = String(
  import.meta.env.VITE_CLUB_MEDIA_BASE ||
    'https://myada-app.s3.eu-north-1.amazonaws.com'
).replace(/\/+$/, '')

/** Path segment after `/api/v1/` (no leading slash). */
export function clubUrl(path) {
  const p = String(path || '').replace(/^\//, '')
  return `${CLUB_API_BASE}/api/v1/${p}`
}
