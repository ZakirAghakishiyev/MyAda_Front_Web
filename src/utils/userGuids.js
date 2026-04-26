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
  return (
    parseUserGuidString(row.userId) ||
    parseUserGuidString(row.userID) ||
    parseUserGuidString(row.UserId) ||
    parseUserGuidString(row.employeeUserId) ||
    parseUserGuidString(row.EmployeeUserId) ||
    parseUserGuidString(row.applicantUserId) ||
    parseUserGuidString(row.user?.id) ||
    parseUserGuidString(row.user?.userId) ||
    parseUserGuidString(row.id) ||
    parseUserGuidString(row.Id) ||
    null
  )
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
    'memberOrganizationalId',
    'directoryId',
    'DirectoryId',
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
  const member = row.member ?? row.Member
  if (member && typeof member === 'object') {
    const mg = pickUserGuidForAuthLookup(member)
    if (mg) return mg
    const mo = pickNineDigitOrgId(member)
    if (mo) return mo
  }
  return null
}

/**
 * Member list DTO (club-admin): user GUID or 9-digit directory id (see {@link pickClubRosterLookupKey}).
 * @param {Record<string, unknown>} m
 * @returns {string | null}
 */
export function pickMemberUserGuidFromApiDto(m) {
  return pickClubRosterLookupKey(m)
}
