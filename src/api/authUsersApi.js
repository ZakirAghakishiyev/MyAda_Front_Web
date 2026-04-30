import { AUTH_API_BASE, authFetch } from '../auth'
import { getJwtUserId, getJwtEmail, decodeJwtPayload } from '../auth/jwtRoles'
import { getAccessToken } from '../auth/tokenStorage'

async function readJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function unwrapAutoWrapper(data) {
  if (data == null || typeof data !== 'object') return data
  if (Object.prototype.hasOwnProperty.call(data, 'result') && data.result !== undefined) return data.result
  if (Object.prototype.hasOwnProperty.call(data, 'data') && data.data !== undefined) return data.data
  return data
}

const ORG_ID_KEYS = [
  'organizationalId',
  'organizationalID',
  'organizationId',
  'organizationID',
  'orgId',
  'org_id',
]

/**
 * Read organizational / directory id from an auth user DTO (property names differ by API version).
 * @param {Record<string, unknown> | null | undefined} user
 * @returns {string | null}
 */
export function getOrganizationalIdFromAuthUser(user) {
  if (!user || typeof user !== 'object') return null
  for (const k of ORG_ID_KEYS) {
    const v = user[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  for (const key of Object.keys(user)) {
    const lower = key.toLowerCase()
    if (lower === 'organizationalid' || lower === 'organizationid') {
      const v = user[key]
      if (v != null && String(v).trim() !== '') return String(v).trim()
    }
  }
  return null
}

const NINE_DIGIT_ORG_KEY = /^\d{9}$/
const GUID_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Human-readable name from an auth user DTO or any club roster-shaped object.
 * Handles PascalCase (.NET) and nested `user` / `student` payloads.
 * @param {Record<string, unknown> | null | undefined} user
 * @returns {string}
 */
export function displayNameFromAuthUserDto(user) {
  if (!user || typeof user !== 'object') return ''
  const t = (v) => {
    if (v == null) return ''
    const s = String(v).trim()
    return s
  }
  const first =
    t(user.firstName) ||
    t(user.FirstName) ||
    t(user.givenName) ||
    t(user.GivenName)
  const last =
    t(user.lastName) ||
    t(user.LastName) ||
    t(user.surname) ||
    t(user.Surname) ||
    t(user.familyName) ||
    t(user.FamilyName)
  const combined = [first, last].filter(Boolean).join(' ').trim()
  if (combined) return combined
  const single =
    t(user.displayName) ||
    t(user.DisplayName) ||
    t(user.name) ||
    t(user.Name) ||
    t(user.fullName) ||
    t(user.FullName) ||
    t(user.studentName) ||
    t(user.StudentName)
  if (single) return single
  const un = t(user.userName) || t(user.UserName)
  if (un && !un.includes('@')) return un
  if (un) return un
  const nested =
    user.user ??
    user.User ??
    user.student ??
    user.Student ??
    user.member ??
    user.Member ??
    user.applicationUser ??
    user.ApplicationUser ??
    user.appUser ??
    user.AppUser ??
    user.person ??
    user.Person
  if (nested && typeof nested === 'object' && nested !== user) {
    const inner = displayNameFromAuthUserDto(nested)
    if (inner) return inner
  }
  return ''
}

/**
 * First-line name parts from a club roster / employee list DTO (before auth enrichment).
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {{ name: string, surname: string, email: string }}
 */
/** Single-string name fields often present on club roster DTOs (club service + EF projections). */
const ROSTER_SINGLE_NAME_KEYS = [
  'fullName',
  'FullName',
  'displayName',
  'DisplayName',
  'studentName',
  'StudentName',
  'memberName',
  'MemberName',
  'applicantName',
  'ApplicantName',
  'legalName',
  'LegalName',
  'preferredName',
  'PreferredName',
  'personName',
  'PersonName',
  'studentFullName',
  'StudentFullName',
  'employeeName',
  'EmployeeName',
  'userFullName',
  'UserFullName',
]

const ROSTER_NESTED_PERSON_KEYS = [
  'user',
  'User',
  'student',
  'Student',
  'applicant',
  'Applicant',
  'account',
  'Account',
  'applicationUser',
  'ApplicationUser',
  'appUser',
  'AppUser',
  'person',
  'Person',
  'profile',
  'Profile',
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
]

function emailFromRosterObject(obj) {
  if (!obj || typeof obj !== 'object') return ''
  const direct = String(obj.email ?? obj.Email ?? '').trim()
  if (direct) return direct
  const userName = String(obj.userName ?? obj.UserName ?? obj.username ?? obj.Username ?? '').trim()
  return userName.includes('@') ? userName : ''
}

function personNamePartsFromNestedRosterObject(obj, fallbackEmail = '', depth = 0, seen = new Set()) {
  if (!obj || typeof obj !== 'object' || seen.has(obj) || depth > 4) return null
  seen.add(obj)
  const email = emailFromRosterObject(obj) || fallbackEmail
  const first = String(obj.firstName ?? obj.FirstName ?? obj.givenName ?? obj.GivenName ?? '').trim()
  const last = String(
    obj.lastName ?? obj.LastName ?? obj.surname ?? obj.Surname ?? obj.familyName ?? obj.FamilyName ?? ''
  ).trim()
  if (first || last) return { name: first || '—', surname: last, email }
  for (const k of ROSTER_SINGLE_NAME_KEYS) {
    const split = splitDisplayIntoParts(obj[k])
    if (split) return { ...split, email }
  }
  for (const [key, value] of Object.entries(obj)) {
    if (!value || typeof value !== 'object') continue
    const lower = key.toLowerCase()
    if (lower.includes('position') || lower.includes('role') || lower.includes('department') || lower.includes('category')) continue
    const hit = personNamePartsFromNestedRosterObject(value, email, depth + 1, seen)
    if (hit) return hit
  }
  return null
}

function splitDisplayIntoParts(display) {
  const s = String(display ?? '').trim()
  if (!s || s === '—') return null
  const parts = s.split(/\s+/).filter(Boolean)
  if (!parts.length) return null
  return { name: parts[0] || '—', surname: parts.slice(1).join(' ') }
}

/**
 * First-line name parts from a club roster / employee list DTO.
 * Per AUTH_API_DOC, non-admin callers cannot load other users via `/api/auth/users/{id}` — do not rely on auth for names.
 * Parse club-service / student-services payloads (flat + nested + common .NET shapes).
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {{ name: string, surname: string, email: string }}
 */
export function personNamePartsFromClubRosterDto(row) {
  if (!row || typeof row !== 'object') return { name: '—', surname: '', email: '' }
  const email = emailFromRosterObject(row)
  // Match .NET and gateway DTOs: FirstName/LastName and GivenName/FamilyName often used together
  const first = String(
    row.firstName ?? row.FirstName ?? row.givenName ?? row.GivenName ?? row.forename ?? row.Forename ?? ''
  ).trim()
  const last = String(
    row.lastName ??
      row.LastName ??
      row.surname ??
      row.Surname ??
      row.familyName ??
      row.FamilyName ??
      row.secondName ??
      row.SecondName ??
      ''
  ).trim()
  if (first || last) return { name: first || '—', surname: last, email }
  for (const k of ROSTER_SINGLE_NAME_KEYS) {
    const split = splitDisplayIntoParts(row[k])
    if (split) return { ...split, email }
  }
  const unRow = String(row.userName ?? row.UserName ?? '').trim()
  if (unRow && !unRow.includes('@')) return { name: unRow, surname: '', email }
  // Employee/member APIs often nest the person under `user`, `membership`, or `employee`.
  for (const nestedKey of ROSTER_NESTED_PERSON_KEYS) {
    const nestedPerson = row[nestedKey]
    if (!nestedPerson || typeof nestedPerson !== 'object' || nestedPerson === row) continue
    const nestedHit = personNamePartsFromNestedRosterObject(nestedPerson, email)
    if (nestedHit) return nestedHit
    const pf = String(nestedPerson.firstName ?? nestedPerson.FirstName ?? '').trim()
    const pl = String(nestedPerson.lastName ?? nestedPerson.LastName ?? nestedPerson.surname ?? nestedPerson.Surname ?? '').trim()
    const pe = emailFromRosterObject(nestedPerson)
    if (pf || pl) return { name: pf || '—', surname: pl, email: pe || email }
    for (const k of ROSTER_SINGLE_NAME_KEYS) {
      const split = splitDisplayIntoParts(nestedPerson[k])
      if (split) return { ...split, email: pe || email }
    }
    const innerFull = displayNameFromAuthUserDto(nestedPerson)
    if (innerFull) {
      const parts = innerFull.split(/\s+/).filter(Boolean)
      return { name: parts[0] || '—', surname: parts.slice(1).join(' '), email: pe || email }
    }
  }
  const deepHit = personNamePartsFromNestedRosterObject(row, email)
  if (deepHit) return deepHit
  const full = displayNameFromAuthUserDto(row)
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean)
    return { name: parts[0] || '—', surname: parts.slice(1).join(' '), email }
  }
  const org = String(
    row.studentId ?? row.StudentId ?? row.organizationalId ?? row.OrganizationalId ?? row.directoryId ?? row.DirectoryId ?? ''
  ).trim()
  if (org && /^\d+$/.test(org)) return { name: org, surname: '', email }
  const uid = String(row.userId ?? row.userID ?? row.UserId ?? '').trim()
  if (uid && GUID_KEY.test(uid)) return { name: `User ${uid.slice(0, 8)}…`, surname: '', email }
  return { name: '—', surname: '', email }
}

function formatAuthUserDisplayName(user) {
  return displayNameFromAuthUserDto(user)
}

/**
 * Resolve a roster lookup key (9-digit organizational id or GUID) to `organizationalId`.
 * Uses GET `/api/auth/users/by-organizational-id/{id}` for 9-digit keys, then GET `/api/auth/users/{id}`.
 * @param {string} lookupId
 * @returns {Promise<string>}
 */
export async function resolveEnteredIdToOrganizationalId(lookupId) {
  const key = String(lookupId ?? '').trim()
  if (!key) {
    const err = new Error('Missing user id.')
    err.code = 'MISSING_USER_ID'
    throw err
  }
  let user = null
  if (NINE_DIGIT_ORG_KEY.test(key)) {
    user = await fetchAuthUserByOrganizationalId(key)
  }
  if (!user) {
    user = await fetchAuthUserById(key)
  }
  if (!user || typeof user !== 'object') {
    const err = new Error(
      `No account was found for "${key}". Check the student ID or GUID, or try again after signing in.`
    )
    err.code = 'AUTH_USER_NOT_FOUND'
    throw err
  }
  const org = getOrganizationalIdFromAuthUser(user)
  if (org) return org
  const err = new Error(
    `An account exists for "${key}", but no organizational id was returned. Contact support if this keeps happening.`
  )
  err.code = 'ORGANIZATIONAL_ID_MISSING'
  throw err
}

/**
 * Organizational / directory id for the signed-in user (JWT subject → profile).
 * @returns {Promise<string | null>}
 */
export async function fetchCurrentUserOrganizationalId() {
  const jwtId = getJwtUserId()
  if (!jwtId) return null
  const user = await fetchAuthUserById(jwtId)
  if (!user || typeof user !== 'object') return null
  return getOrganizationalIdFromAuthUser(user)
}

/**
 * Best email for the signed-in user: JWT claims first, then GET `/api/auth/users/{id}` profile.
 * @returns {Promise<string | null>}
 */
function emailFromAuthUserDto(user) {
  if (!user || typeof user !== 'object') return null
  const email = String(user.email ?? '').trim()
  if (email.includes('@')) return email
  for (const key of ['userName', 'username', 'UserName']) {
    const u = String(user[key] ?? '').trim()
    if (u.includes('@')) return u
  }
  return null
}

/**
 * Best email for the signed-in user: JWT claims first, then profile by `sub`, then by `organizationalId`.
 * @returns {Promise<string | null>}
 */
export async function fetchCurrentUserEmail() {
  const fromJwt = getJwtEmail()
  if (fromJwt) return fromJwt
  const jwtId = getJwtUserId()
  if (jwtId) {
    const user = await fetchAuthUserById(jwtId)
    const e = emailFromAuthUserDto(user)
    if (e) return e
  }
  const payload = decodeJwtPayload(getAccessToken())
  if (!payload || typeof payload !== 'object') return null
  const org = String(
    payload.organizationalId ?? payload.organizationalID ?? payload.organizationId ?? ''
  ).trim()
  if (org) {
    const user = await fetchAuthUserByOrganizationalId(org)
    return emailFromAuthUserDto(user)
  }
  return null
}

/**
 * Load auth user for proposal UI (name preview). Same lookup rules as {@link resolveEnteredIdToOrganizationalId}.
 * @param {string} lookupId
 * @returns {Promise<{ displayName: string, organizationalId: string | null } | null>}
 */
export async function fetchProposalMemberProfile(lookupId) {
  const key = String(lookupId ?? '').trim()
  if (!key || (!NINE_DIGIT_ORG_KEY.test(key) && !GUID_KEY.test(key))) return null
  let user = null
  if (NINE_DIGIT_ORG_KEY.test(key)) {
    user = await fetchAuthUserByOrganizationalId(key)
  }
  if (!user) {
    user = await fetchAuthUserById(key)
  }
  if (!user || typeof user !== 'object') return null
  const displayName = formatAuthUserDisplayName(user)
  const organizationalId = getOrganizationalIdFromAuthUser(user)
  return {
    displayName: displayName || '',
    organizationalId,
  }
}

/**
 * Per-session cache for auth profile reads, including misses.
 * Auth profile reads are protected: non-admin callers get 403 for other users (AUTH_API_DOC §4-§5).
 * Caching the null result prevents N×(403+401) request spam on every render of a club detail / roster page.
 */
const authUserByIdCache = new Map()
const authUserByOrgIdCache = new Map()
const authAdminUserByIdCache = new Map()

export function clearAuthUserCache() {
  authUserByIdCache.clear()
  authUserByOrgIdCache.clear()
  authAdminUserByIdCache.clear()
}

/**
 * Fetch auth user profile by id.
 * Tries the scheduling gateway path first (`GET /scheduling/api/auth/users/{id}`),
 * then falls back to `GET /api/auth/users/{id}`. Bearer required; admin can fetch any user,
 * everyone else can only fetch self.
 *
 * Behaviour:
 * - 200: returns the user DTO (cached).
 * - 401/403/404: returns `null` (cached). No unauth retry — the contract requires Bearer, so a bare `fetch`
 *   would just generate a second 401 console error for the same logical request.
 */
export async function fetchAuthUserById(userId) {
  const id = String(userId ?? '').trim()
  if (!id) return null
  if (authUserByIdCache.has(id)) return authUserByIdCache.get(id)

  const encodedId = encodeURIComponent(id)
  const candidateUrls = Array.from(
    new Set([
      `${AUTH_API_BASE}/scheduling/api/auth/users/${encodedId}`,
      `${AUTH_API_BASE}/api/auth/users/${encodedId}`,
    ])
  )
  let result = null
  for (const url of candidateUrls) {
    try {
      const res = await authFetch(url, { method: 'GET' })
      if (!res.ok) continue
      const data = unwrapAutoWrapper(await readJsonSafe(res))
      if (data && typeof data === 'object') {
        result = data
        break
      }
    } catch {
      /* try next candidate URL */
    }
  }
  authUserByIdCache.set(id, result)
  return result
}

/**
 * GET `/api/auth/users/by-organizational-id/{organizationalId}` (see AUTH_API_DOC §5).
 * Same access rules as `fetchAuthUserById`. Cached per-session, no unauth retry.
 */
export async function fetchAuthUserByOrganizationalId(organizationalId) {
  const id = String(organizationalId ?? '').trim()
  if (!id) return null
  if (authUserByOrgIdCache.has(id)) return authUserByOrgIdCache.get(id)

  const url = `${AUTH_API_BASE}/api/auth/users/by-organizational-id/${encodeURIComponent(id)}`
  let result = null
  try {
    const res = await authFetch(url, { method: 'GET' })
    if (res.ok) {
      const data = unwrapAutoWrapper(await readJsonSafe(res))
      result = data && typeof data === 'object' ? data : null
    }
  } catch {
    result = null
  }
  authUserByOrgIdCache.set(id, result)
  return result
}

/**
 * Fetch auth user profile through the admin-only endpoint.
 * The club-admin employees page uses this after resolving a student / organizational id.
 */
export async function fetchAuthAdminUserById(userId) {
  const id = String(userId ?? '').trim()
  if (!id) return null
  if (authAdminUserByIdCache.has(id)) return authAdminUserByIdCache.get(id)

  const url = `${AUTH_API_BASE}/api/auth/admin/users/${encodeURIComponent(id)}`
  let result = null
  try {
    const res = await authFetch(url, { method: 'GET' })
    if (res.ok) {
      const data = unwrapAutoWrapper(await readJsonSafe(res))
      result = data && typeof data === 'object' ? data : null
    }
  } catch {
    result = null
  }
  authAdminUserByIdCache.set(id, result)
  return result
}

/**
 * Resolve a student / organizational id to the admin auth profile.
 * This first resolves the auth user by organizational id, then loads the admin profile by account id.
 */
export async function fetchAuthAdminUserForClubRoster(lookupKey) {
  const key = String(lookupKey ?? '').trim()
  if (!key) return null
  if (NINE_DIGIT_ORG_KEY.test(key)) {
    const byOrg = await fetchAuthUserByOrganizationalId(key)
    if (!byOrg || typeof byOrg !== 'object') return null
    const adminId = String(byOrg.id ?? byOrg.Id ?? '').trim()
    if (adminId) {
      const adminUser = await fetchAuthAdminUserById(adminId)
      if (adminUser) return adminUser
    }
    return byOrg
  }
  if (GUID_KEY.test(key)) {
    const byAdminId = await fetchAuthAdminUserById(key)
    if (byAdminId) return byAdminId
    const fallback = await fetchAuthUserById(key)
    return fallback && typeof fallback === 'object' ? fallback : null
  }
  let user = await fetchAuthAdminUserById(key)
  if (user) return user
  user = await fetchAuthUserByOrganizationalId(key)
  if (user && typeof user === 'object') return user
  user = await fetchAuthUserById(key)
  return user && typeof user === 'object' ? user : null
}

/**
 * Load auth profile for club roster enrichment (MyAda admins / self lookups only).
 * AUTH_API_DOC: non-admin `GET /api/auth/users/{id}` and `.../by-organizational-id/{id}` only succeed for the signed-in user.
 * Club officers therefore cannot rely on this to resolve other members’ names — use {@link personNamePartsFromClubRosterDto} on club DTOs first.
 * - 9-digit key → `users/by-organizational-id/{id}` (with `users/{id}` only as a last resort).
 * - GUID key → `users/{id}` ONLY (no by-org fallback for GUID-shaped strings).
 * @param {string} lookupKey
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function fetchAuthUserForClubRoster(lookupKey) {
  const key = String(lookupKey ?? '').trim()
  if (!key) return null
  if (NINE_DIGIT_ORG_KEY.test(key)) {
    const byOrg = await fetchAuthUserByOrganizationalId(key)
    if (byOrg) return byOrg
    const byId = await fetchAuthUserById(key)
    return byId && typeof byId === 'object' ? byId : null
  }
  if (GUID_KEY.test(key)) {
    const byId = await fetchAuthUserById(key)
    return byId && typeof byId === 'object' ? byId : null
  }
  let u = await fetchAuthUserById(key)
  if (u) return u
  u = await fetchAuthUserByOrganizationalId(key)
  return u && typeof u === 'object' ? u : null
}
