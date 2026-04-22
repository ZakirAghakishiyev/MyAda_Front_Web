/** Base URL for admin scheduling/course APIs. */
export const ADMIN_API_BASE =
  import.meta.env.VITE_ADMIN_API_BASE?.replace(/\/$/, '') || 'http://localhost:5008/api/admin'
