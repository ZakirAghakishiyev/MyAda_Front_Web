export const AUTH_API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  import.meta.env.VITE_AUTH_API_BASE?.replace(/\/$/, '') ||
  'https://myada.site'
