/**
 * Club membership roles that may open /club-admin for that club (officers, employees, etc.).
 * Aligns with ClubAdminLayout access checks.
 */
export function roleMayManageClub(role) {
  const r = String(role || '').toLowerCase()
  if (!r) return false
  return (
    /\b(admin|president|officer|employee|staff|lead|coordinator|treasurer|secretary|manager|director)\b/.test(r) ||
    r.includes('admin') ||
    r.includes('employee')
  )
}
