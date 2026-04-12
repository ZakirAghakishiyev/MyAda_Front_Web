export const AUTH_API_BASE =
  import.meta.env.VITE_AUTH_API_BASE?.replace(/\/$/, '') ||
  'http://13.60.196.144:5000'
