import {
  decodeJwtPayload,
  readJwtRoleClaims,
  userHasJwtAdminRole,
  userHasStudentServicesRole,
} from './jwtRoles'
import { getAccessToken } from './tokenStorage'

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
}

/**
 * All role-like strings in the token: claims + realm, plus userType as a virtual tag.
 * @returns {string[]}
 */
function normalizedRoleList() {
  const token = getAccessToken()
  if (!token) return []
  const p = decodeJwtPayload(token)
  if (!p || typeof p !== 'object') return []
  const raw = readJwtRoleClaims(p)
  const asNorm = raw.map((x) => norm(x)).filter(Boolean)
  const userType = norm(p.userType)
  if (userType) asNorm.push(`usertype-${userType}`)
  return asNorm
}

function hasAnyRole(pred) {
  const r = normalizedRoleList()
  return r.some(pred)
}

export function userIsInstructor() {
  return hasAnyRole((r) => r === 'instructor' || r === 'faculty' || r.endsWith('-instructor'))
}

export function userIsCourseManager() {
  return hasAnyRole(
    (r) =>
      r === 'course-manager' ||
      r === 'coursemanager' ||
      r === 'scheduling-manager' ||
      r === 'scheduling_coordinator' ||
      r === 'course-coordinator' ||
      (r.includes('course') && r.includes('manager')) ||
      (r.includes('scheduling') && (r.includes('manager') || r.includes('coordinator')))
  )
}

export function userIsLostFoundAdmin() {
  return hasAnyRole(
    (r) =>
      r === 'lost-found-admin' ||
      r === 'lostandfoundadmin' ||
      r === 'lost_found_admin' ||
      r === 'laf-admin' ||
      (r.includes('lost') && r.includes('found') && r.includes('admin')) ||
      (r.includes('lost-and-found') && r.includes('admin'))
  )
}

const list = () => normalizedRoleList()

/**
 * Support ticket dispatcher (not the same as call/dispatcher; use explicit support + dispatcher when possible).
 */
export function userIsSupportDispatcherRole() {
  const l = list()
  if (l.some((r) => r === 'support-dispatcher' || r === 'supportdispatcher')) return true
  if (l.some((r) => r.includes('support') && r.includes('dispatch'))) return true
  if (l.includes('dispatcher') && l.includes('usertype-staff')) return true
  return false
}

export function userIsItSupportStaff() {
  return hasAnyRole(
    (r) =>
      r === 'it-support' ||
      r === 'it_support' ||
      r === 'it-support-staff' ||
      (r.startsWith('it-') && r.includes('support'))
  )
}

export function userIsFmSupportStaff() {
  return hasAnyRole(
    (r) =>
      r === 'fm-support' ||
      r === 'fm_support' ||
      r === 'fm-support-staff' ||
      (r.startsWith('fm-') && r.includes('support'))
  )
}

/**
 * @returns {boolean} whether the signed-in user should see the full “all modules” home (admin only).
 */
export function userSeesFullHomeAsAdmin() {
  return userHasJwtAdminRole()
}

/**
 * Resolve which home template to use. `student` is the default when no other role matches.
 * Club-admin-only users are upgraded in the UI when memberships load (see Home.jsx).
 * @returns {'admin' | 'lf_admin' | 'student_services' | 'dispatcher' | 'support_staff' | 'course_manager' | 'instructor' | 'student' | 'club_admin'}
 */
export function getJwtHomeMenuKey() {
  if (userHasJwtAdminRole()) return 'admin'
  if (userIsLostFoundAdmin()) return 'lf_admin'
  if (userHasStudentServicesRole()) return 'student_services'
  if (userIsSupportDispatcherRole()) return 'dispatcher'
  if (userIsItSupportStaff() || userIsFmSupportStaff()) return 'support_staff'
  if (userIsCourseManager()) return 'course_manager'
  if (userIsInstructor()) return 'instructor'
  return 'student'
}

/**
 * @param {boolean} canAccessClubAdminPortal
 */
export function getResolvedHomeMenuKey(canAccessClubAdminPortal) {
  const k = getJwtHomeMenuKey()
  if (k === 'admin') return 'admin'
  if (k === 'student' && canAccessClubAdminPortal) return 'club_admin'
  return k
}
