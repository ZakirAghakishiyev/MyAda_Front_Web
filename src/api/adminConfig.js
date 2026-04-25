import { API_BASE } from './apiBase'

/**
 * Base URL for attendance admin APIs (courses, lessons).
 * Gateway: `{host}/attendance` + `/api/admin/courses` etc. (see MyAdaAttendanceService ATTENDANCE_API.md).
 * Override with `VITE_ADMIN_API_BASE` or align gateway root via `VITE_ATTENDANCE_API_BASE`.
 */
const attendanceServiceRoot =
  import.meta.env.VITE_ATTENDANCE_API_BASE?.replace(/\/$/, '') || `${API_BASE}/attendance`

export const ADMIN_API_BASE =
  import.meta.env.VITE_ADMIN_API_BASE?.replace(/\/$/, '') || `${attendanceServiceRoot}/api/admin`
