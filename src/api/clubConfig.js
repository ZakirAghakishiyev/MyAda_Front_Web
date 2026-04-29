import { API_BASE } from './apiBase'

/**
 * Club service base URL (see Club API docs).
 * Default source of truth is the API gateway base plus `/club`.
 */
export const CLUB_API_BASE = String(
  import.meta.env.VITE_CLUB_API_BASE ?? `${API_BASE}/club`
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

const DEFAULT_CLUB_IMAGE_PATH = '/clubs/default.svg'

export function resolveClubMediaUrl(path) {
  if (path == null || path === '') return null
  const s = String(path).trim()
  if (/^https?:\/\//i.test(s)) return s
  if (/^\/?clubs\/default\.(png|svg)(\?.*)?$/i.test(s)) return DEFAULT_CLUB_IMAGE_PATH
  const base = CLUB_MEDIA_BASE.replace(/\/+$/, '')
  return `${base}${s.startsWith('/') ? s : `/${s}`}`
}

/**
 * Join a relative club media path to the Club API gateway (Vite `/club` proxy or full gateway URL).
 * Pending / locally stored profile images are often served here, not yet on S3.
 */
export function resolveClubMediaViaGateway(path) {
  if (path == null || path === '') return null
  const s = String(path).trim()
  if (/^https?:\/\//i.test(s)) return s
  if (/^data:/i.test(s)) return s
  const normalized = s.startsWith('/') ? s : `/${s}`
  const base = CLUB_API_BASE.replace(/\/+$/, '')
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return `${base}${normalized}`
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${String(window.location.origin).replace(/\/+$/, '')}${base}${normalized}`
  }
  return `${base}${normalized}`
}

/**
 * Display URLs for a proposed/pending profile image: try gateway first, then S3.
 * @returns {{ primary: string | null, alt: string | null }}
 */
export function resolveProposedClubImageDisplayUrls(raw) {
  if (raw == null || String(raw).trim() === '') return { primary: null, alt: null }
  const s = String(raw).trim()
  if (/^https?:\/\//i.test(s)) return { primary: s, alt: null }
  const gw = resolveClubMediaViaGateway(s)
  const s3 = resolveClubMediaUrl(s)
  const ordered = [gw, s3, s].filter(Boolean)
  const uniq = [...new Set(ordered)]
  return { primary: uniq[0] ?? null, alt: uniq[1] ?? null }
}

/**
 * Published profile image: prefer S3 (CDN), fall back to gateway for relative paths.
 * @returns {{ primary: string | null, alt: string | null }}
 */
export function resolvePublishedClubImageDisplayUrls(raw) {
  if (raw == null || String(raw).trim() === '') return { primary: null, alt: null }
  const s = String(raw).trim()
  if (/^https?:\/\//i.test(s)) return { primary: s, alt: null }
  const gw = resolveClubMediaViaGateway(s)
  const s3 = resolveClubMediaUrl(s)
  const ordered = [s3, gw, s].filter(Boolean)
  const uniq = [...new Set(ordered)]
  return { primary: uniq[0] ?? null, alt: uniq[1] ?? null }
}

/** Path segment after `/api/v1/` (no leading slash). */
export function clubUrl(path) {
  const p = String(path || '').replace(/^\//, '')
  return `${CLUB_API_BASE}/api/v1/${p}`
}
