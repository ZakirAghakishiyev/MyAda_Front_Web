import { API_BASE } from './apiBase'

export const INTERVIEWS_API_BASE =
  import.meta.env.VITE_INTERVIEWS_API_BASE?.replace(/\/$/, '') || API_BASE

