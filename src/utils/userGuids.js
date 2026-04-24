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
 * Member list DTO (club-admin): `id` and `userId` are the same user GUID (see backend ClubAdminMemberDto).
 * @param {Record<string, unknown>} m
 * @returns {string | null}
 */
export function pickMemberUserGuidFromApiDto(m) {
  if (!m || typeof m !== 'object') return null
  return (
    parseUserGuidString(m.id) ||
    parseUserGuidString(m.Id) ||
    parseUserGuidString(m.userId) ||
    parseUserGuidString(m.userID) ||
    parseUserGuidString(m.UserId) ||
    parseUserGuidString(m.applicantUserId) ||
    parseUserGuidString(m.user?.id) ||
    null
  )
}
