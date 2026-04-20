export const AUTH_API_BASE =
  import.meta.env.VITE_AUTH_API_BASE?.replace(/\/$/, '') ||
  'http://13.60.31.141:5000'
