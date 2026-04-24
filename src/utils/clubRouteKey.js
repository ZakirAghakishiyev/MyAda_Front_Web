/**
 * Club admin API path segment must be a positive integer string (e.g. "3").
 * URLs and queries sometimes use a slug like "club-3" — parse that here.
 * @param {string | null | undefined} value
 * @returns {string} Normalized id or the trimmed original for unknown shapes.
 */
export function normalizeClubRouteKey(value) {
  if (value == null) return ''
  const s = String(value).trim()
  if (!s) return ''
  if (/^\d+$/.test(s) && s !== '0') return s
  const m = s.match(/^club[-_](\d+)$/i) || s.match(/^club(\d+)$/i)
  if (m) return m[1]
  return s
}
