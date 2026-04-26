/**
 * Normalize a user id string for club-admin DELETE (members/employees) paths.
 * Accepts canonical UUID, optional braces, validates segment lengths.
 * @param {unknown} value
 * @returns {string | null} Lowercase canonical UUID, or null if not a real GUID
 */
export function parseUserGuidString(value) {
  if (value == null) return null
  let s = String(value).trim()
  if (!s) return null
  s = s.replace(/^\{+/, '').replace(/\}+$/, '')
  const parts = s.split('-')
  if (parts.length !== 5) return null
  const [a, b, c, d, e] = parts
  if (a.length !== 8 || b.length !== 4 || c.length !== 4 || d.length !== 4 || e.length !== 12) return null
  if (!/^[0-9a-fA-F]+$/.test(a + b + c + d + e)) return null
  return `${a.toLowerCase()}-${b.toLowerCase()}-${c.toLowerCase()}-${d.toLowerCase()}-${e.toLowerCase()}`
}

/**
 * User GUID for auth profile lookup (`GET /api/auth/users/{guid}`).
 * Prefer explicit `userId` / `employeeUserId` over row `id` (employee row ids may not be user GUIDs).
 * @param {Record<string, unknown>} row
 * @returns {string | null}
 */
export function pickUserGuidForAuthLookup(row) {
  if (!row || typeof row !== 'object') return null
  // Prefer explicit user ids over `row.id` / `row.Id`: club-admin employee rows use `id` for the employment row, not the account (AUTH users/{id} is account id).
  const fromExplicit =
    parseUserGuidString(row.userId) ||
    parseUserGuidString(row.userID) ||
    parseUserGuidString(row.UserId) ||
    parseUserGuidString(row.employeeUserId) ||
    parseUserGuidString(row.EmployeeUserId) ||
    parseUserGuidString(row.applicationUserId) ||
    parseUserGuidString(row.ApplicationUserId) ||
    parseUserGuidString(row.applicantUserId) ||
    parseUserGuidString(row.ApplicantUserId) ||
    parseUserGuidString(row.studentUserId) ||
    parseUserGuidString(row.StudentUserId) ||
    parseUserGuidString(row.user?.id) ||
    parseUserGuidString(row.user?.userId) ||
    parseUserGuidString(row.User?.id) ||
    parseUserGuidString(row.User?.userId) ||
    parseUserGuidString(row.User?.UserId) ||
    parseUserGuidString(row.student?.id) ||
    parseUserGuidString(row.Student?.id) ||
    parseUserGuidString(row.member?.id) ||
    parseUserGuidString(row.Member?.id) ||
    parseUserGuidString(row.Member?.Id) ||
    parseUserGuidString(row.membership?.userId) ||
    parseUserGuidString(row.Membership?.UserId) ||
    parseUserGuidString(row.membership?.memberId) ||
    parseUserGuidString(row.Membership?.MemberId) ||
    parseUserGuidString(row.clubMember?.userId) ||
    parseUserGuidString(row.ClubMember?.UserId) ||
    parseUserGuidString(row.clubMembership?.userId) ||
    parseUserGuidString(row.ClubMembership?.UserId) ||
    parseUserGuidString(row.employee?.userId) ||
    parseUserGuidString(row.Employee?.UserId) ||
    parseUserGuidString(row.clubEmployee?.userId) ||
    parseUserGuidString(row.ClubEmployee?.UserId) ||
    parseUserGuidString(row.applicationUser?.id) ||
    parseUserGuidString(row.ApplicationUser?.id) ||
    null
  if (fromExplicit) return fromExplicit
  const isEmployeeRow = row.employeeId != null || row.EmployeeId != null
  if (!isEmployeeRow) {
    const fromRowId = parseUserGuidString(row.id) || parseUserGuidString(row.Id)
    if (fromRowId) return fromRowId
  }
  return null
}

const NINE_DIGIT_ORG = /^\d{9}$/

/**
 * Key for {@link fetchAuthUserForClubRoster}: JWT-style user id **or** 9-digit organizational / student id.
 * Club employee/member APIs often expose `studentId` / `organizationalId` instead of a GUID.
 * @param {Record<string, unknown>} row
 * @returns {string | null}
 */
function pickNineDigitOrgId(obj) {
  if (!obj || typeof obj !== 'object') return null
  for (const key of [
    'studentId',
    'StudentId',
    'organizationalId',
    'OrganizationalId',
    'organizationalID',
    'memberOrganizationalId',
    'MemberOrganizationalId',
    'directoryId',
    'DirectoryId',
    'studentNumber',
    'StudentNumber',
  ]) {
    const v = String(obj[key] ?? '').trim()
    if (NINE_DIGIT_ORG.test(v)) return v
  }
  return null
}

export function pickClubRosterLookupKey(row) {
  if (!row || typeof row !== 'object') return null
  const guid =
    pickUserGuidForAuthLookup(row) ||
    parseUserGuidString(row.memberId) ||
    parseUserGuidString(row.MemberId) ||
    parseUserGuidString(row.memberUserId) ||
    parseUserGuidString(row.MemberUserId) ||
    parseUserGuidString(row.member?.userId) ||
    parseUserGuidString(row.Member?.UserId) ||
    parseUserGuidString(row.member?.id) ||
    parseUserGuidString(row.Member?.Id) ||
    null
  if (guid) return guid
  const org = pickNineDigitOrgId(row)
  if (org) return org
  const nestedKeys = [
    'member',
    'Member',
    'membership',
    'Membership',
    'clubMember',
    'ClubMember',
    'clubMembership',
    'ClubMembership',
    'employee',
    'Employee',
    'clubEmployee',
    'ClubEmployee',
    'user',
    'User',
    'student',
    'Student',
  ]
  for (const key of nestedKeys) {
    const nestedUser = row[key]
    if (!nestedUser || typeof nestedUser !== 'object') continue
    const mg = pickUserGuidForAuthLookup(nestedUser)
    if (mg) return mg
    const mo = pickNineDigitOrgId(nestedUser)
    if (mo) return mo
  }
  return null
}

/**
 * Employee roster rows can expose the person id as `employeeId` even when `id` is the
 * assignment row id. Prefer student / organizational ids first so auth lookups resolve
 * the person record, then fall back to user GUIDs for legacy payloads.
 * @param {Record<string, unknown>} row
 * @returns {string | null}
 */
export function pickClubEmployeePersonLookupKey(row) {
  if (!row || typeof row !== 'object') return null
  const studentId = pickNineDigitOrgId(row)
  if (studentId) return studentId
  return (
    pickClubRosterLookupKey(row) ||
    parseUserGuidString(row.employeeId) ||
    parseUserGuidString(row.EmployeeId) ||
    parseUserGuidString(row.employeeID) ||
    parseUserGuidString(row.EmployeeID) ||
    parseUserGuidString(row.id) ||
    parseUserGuidString(row.Id) ||
    null
  )
}

/**
 * Member list DTO (club-admin): user GUID or 9-digit directory id (see {@link pickClubRosterLookupKey}).
 * @param {Record<string, unknown>} m
 * @returns {string | null}
 */
export function pickMemberUserGuidFromApiDto(m) {
  return pickClubRosterLookupKey(m)
}
