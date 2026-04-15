export const AUTH_API_BASE =
  import.meta.env.VITE_AUTH_API_BASE?.replace(/\/$/, '') ||
  'http://51.20.193.29:5000'
