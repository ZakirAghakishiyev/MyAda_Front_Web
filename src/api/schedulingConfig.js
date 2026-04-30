/** Scheduling microservice (local Docker default). */
export const SCHEDULING_API_BASE =
  import.meta.env.VITE_SCHEDULING_API_BASE?.replace(/\/+$/, '') ||
  'https://myada.site/scheduling'

/** Dev auth header expected by scheduling microservice for instructor-scoped endpoints. */
export const SCHEDULING_DEV_USER_ID_HEADER =
  import.meta.env.VITE_SCHEDULING_DEV_USER_ID_HEADER?.trim() || 'X-User-Id'
