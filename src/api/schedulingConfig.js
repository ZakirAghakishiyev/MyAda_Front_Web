/**
 * Scheduling microservice — API root including `/api/v1` (see Scheduling backend FRONTEND_API.md).
 * `VITE_SCHEDULING_API_BASE` may be the service origin (e.g. `http://localhost:5010`) or already
 * the full API root (e.g. `https://myada.site/scheduling/api/v1`).
 */
function normalizeSchedulingApiBase(raw) {
  const trimmed = String(raw ?? '')
    .trim()
    .replace(/\/+$/, '')
  const origin = trimmed || 'https://myada.site/scheduling'
  if (origin.endsWith('/api/v1')) return origin
  return `${origin}/api/v1`
}

export const SCHEDULING_API_BASE = normalizeSchedulingApiBase(import.meta.env.VITE_SCHEDULING_API_BASE)

/** Dev auth header expected by scheduling microservice for instructor-scoped endpoints. */
export const SCHEDULING_DEV_USER_ID_HEADER =
  import.meta.env.VITE_SCHEDULING_DEV_USER_ID_HEADER?.trim() || 'X-User-Id'
