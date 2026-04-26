import { authFetch } from '../auth/authClient'
import { getAccessToken } from '../auth/tokenStorage'
import { getJwtUserId } from '../auth/jwtRoles'
import { fetchCurrentUserOrganizationalId } from './authUsersApi'
import { clubUrl } from './clubConfig'
import { CLUB_POSITION_CATEGORIES, positionCategoryOptionsFromApi } from '../data/clubAdminData'

/**
 * Club-admin position POST/PATCH: API expects `category` (string enum), not `categoryId`.
 * Maps legacy 1-based `categoryId` to the same order as `CLUB_POSITION_CATEGORIES`.
 */
function buildClubAdminPositionJsonPayload(body) {
  const b = body && typeof body === 'object' ? body : {}
  const title = String(b.title ?? b.name ?? '').trim()
  const name = String(b.name ?? b.title ?? '').trim() || title
  let category = String(b.category ?? '').trim()
  if (!category && b.categoryId != null && b.categoryId !== '') {
    const idx = Number(b.categoryId)
    if (!Number.isNaN(idx) && idx >= 1 && idx <= CLUB_POSITION_CATEGORIES.length) {
      category = CLUB_POSITION_CATEGORIES[idx - 1]
    }
  }
  if (category) {
    const exact = CLUB_POSITION_CATEGORIES.find((c) => c === category)
    if (exact) category = exact
    else {
      const lower = category.toLowerCase()
      const ci = CLUB_POSITION_CATEGORIES.find((c) => c.toLowerCase() === lower)
      if (ci) category = ci
    }
  }
  const requirements = Array.isArray(b.requirements)
    ? b.requirements.map((r) => String(r).trim()).filter(Boolean)
    : []
  return { title, name, category, requirements }
}

async function readJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Club Management service uses AutoWrapper: successful bodies often nest the payload under `result`. */
function unwrapApiResponse(data) {
  if (data == null || typeof data !== 'object') return data
  if (Object.prototype.hasOwnProperty.call(data, 'result') && data.result !== undefined) return data.result
  if (Object.prototype.hasOwnProperty.call(data, 'data') && data.data !== undefined) return data.data
  return data
}

/** Items from club-admin list payloads (bare array, `{ items|Items }`, or nested `result|Result` / `data|Data`). */
export function clubAdminListItems(data) {
  if (data == null) return []
  let cur = data
  for (let i = 0; i < 4; i += 1) {
    if (Array.isArray(cur)) return cur
    if (cur == null || typeof cur !== 'object') return []
    const items = cur.items ?? cur.Items
    if (Array.isArray(items)) return items
    const inner = cur.result ?? cur.Result ?? cur.data ?? cur.Data
    if (inner === undefined) return []
    cur = inner
  }
  return []
}

function usersScopedPath(suffix) {
  const userId = getJwtUserId()
  if (!userId) {
    const err = new Error('Could not resolve your user id from the session. Please sign in again.')
    err.status = 401
    throw err
  }
  const rest = String(suffix || '').replace(/^\//, '')
  return `users/${encodeURIComponent(userId)}/${rest}`
}

export async function clubPublicFetch(path, init = {}) {
  const res = await fetch(clubUrl(path), init)
  return res
}

export async function clubAuthFetch(path, init = {}) {
  // Do not redirect to /login here: missing token is a normal state on public routes.
  // Callers handle errors; session expiry is still handled inside authFetch (refresh → logout only on refresh failure).
  if (!getAccessToken()) {
    const err = new Error('Authentication required.')
    err.status = 401
    err.code = 'CLUB_AUTH_REQUIRED'
    throw err
  }
  return authFetch(clubUrl(path), init)
}

export async function clubPublicJson(path, init = {}) {
  const res = await clubPublicFetch(path, init)
  const data = await readJsonSafe(res)
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data != null
        ? data.message || data.title || data.detail || `Request failed (${res.status})`
        : typeof data === 'string' && data
          ? data
          : `Request failed (${res.status})`
    const err = new Error(String(msg))
    err.status = res.status
    err.body = data
    throw err
  }
  return unwrapApiResponse(data)
}

export async function clubAuthJson(path, init = {}) {
  const res = await clubAuthFetch(path, init)
  const data = await readJsonSafe(res)
  if (!res.ok) {
    // Do not force global logout on 401: authFetch already refreshes once; a 401 here may be
    // club-service policy (audience/scope), not a dead app session. Redirecting nukes navigation between club pages.
    const msg =
      typeof data === 'object' && data != null
        ? data.message || data.title || data.detail || `Request failed (${res.status})`
        : typeof data === 'string' && data
          ? data
          : `Request failed (${res.status})`
    const err = new Error(String(msg))
    err.status = res.status
    err.body = data
    throw err
  }
  return unwrapApiResponse(data)
}

/** DELETE with empty or JSON error body; success is usually 204 No Content. */
async function clubAuthDeleteExpectOk(path) {
  const res = await clubAuthFetch(path, { method: 'DELETE' })
  if (res.ok) return
  const data = await readJsonSafe(res)
  const msg =
    typeof data === 'object' && data != null
      ? data.message || data.title || data.detail || `Request failed (${res.status})`
      : typeof data === 'string' && data
        ? data
        : `Request failed (${res.status})`
  const err = new Error(String(msg))
  err.status = res.status
  err.body = data
  throw err
}

/** Try canonical path; on 404 only, retry legacy path (no body stream reuse for multipart — use for GET/JSON only). */
async function clubAuthJsonPrimaryOrFallback(primaryPath, fallbackPath, init = {}) {
  try {
    return await clubAuthJson(primaryPath, init)
  } catch (e) {
    if (e.status === 404 && fallbackPath) {
      return await clubAuthJson(fallbackPath, init)
    }
    throw e
  }
}

/**
 * Normalizes form state to `EventProposalSubmitDto` (JSON) / multipart field values.
 * @see CLUB_API_DOC / FRONTEND_CLUB_API_GUIDE — `dateTime` local `YYYY-MM-DDTHH:mm:ss` (no Z);
 * JSON uses nested `subEvents` + `logistics`; multipart uses `subEventsJson` + `logisticsJson` strings.
 */
export function buildEventProposalSubmitDto(form) {
  const f = form && typeof form === 'object' ? form : {}
  const subEvents = Array.isArray(f.subEvents) ? f.subEvents : []
  const log = f.logistics && typeof f.logistics === 'object' ? f.logistics : {}
  const otherNeeds = log.otherNeeds != null ? String(log.otherNeeds).trim() : ''
  const objectives =
    typeof f.objectives === 'string'
      ? f.objectives
      : f.objectives != null
        ? String(f.objectives)
        : ''
  const base = {
    name: String(f.name || '').trim() || 'Event proposal',
    dateTime: String(f.dateTime ?? '').trim(),
    duration: String(f.duration ?? '').trim(),
    attendance: String(f.attendance ?? '').trim(),
    venue: String(f.venue || 'TBD'),
    description: String(f.description ?? ''),
    objectives,
    subEvents: subEvents.map((se) => ({
      title: String(se?.title ?? '').trim(),
      capacity: String(se?.capacity ?? '').trim(),
      start: String(se?.start ?? '').trim(),
      end: String(se?.end ?? '').trim(),
      date: String(se?.date ?? '').trim(),
    })),
    logistics: {
      avSetup: Boolean(log.avSetup),
      security: Boolean(log.security),
      catering: Boolean(log.catering),
      cleaning: Boolean(log.cleaning),
      ...(otherNeeds ? { otherNeeds } : {}),
    },
  }
  const out = { ...base }
  const so = f.submittedByOrganization != null ? String(f.submittedByOrganization).trim() : ''
  if (so) out.submittedByOrganization = so
  const iu = f.imageUrl != null ? String(f.imageUrl).trim() : ''
  if (iu) out.imageUrl = iu
  return out
}

/**
 * Multipart fields for `EventProposalSubmitDto` (student-services + shared builder).
 * @param {{ includeImageUrl?: boolean }} [options] — set `includeImageUrl: false` for club-admin proposals (that route rejects `imageUrl`).
 */
function buildEventProposalFormData(dto, options = {}) {
  const includeImageUrl = options.includeImageUrl !== false
  const fd = new FormData()
  fd.append('name', dto.name)
  fd.append('dateTime', dto.dateTime)
  fd.append('duration', dto.duration)
  fd.append('attendance', dto.attendance)
  fd.append('venue', dto.venue)
  fd.append('description', dto.description)
  fd.append('objectives', dto.objectives)
  fd.append('subEventsJson', JSON.stringify(dto.subEvents))
  fd.append('logisticsJson', JSON.stringify(dto.logistics))
  if (dto.submittedByOrganization) fd.append('submittedByOrganization', dto.submittedByOrganization)
  if (includeImageUrl && dto.imageUrl) fd.append('imageUrl', dto.imageUrl)
  return fd
}

/** Student Services POST /student-services/events/proposals: `application/json` or `multipart/form-data` with `imageFile` / optional `imageUrl` (file wins if both). */
function postEventProposalResolvingPath(pathPrimary, pathFallback, dto, imageFile) {
  if (imageFile instanceof File) {
    const fd = buildEventProposalFormData(dto, { includeImageUrl: true })
    fd.append('imageFile', imageFile, imageFile.name)
    const doPost = (p) => clubAuthJson(p, { method: 'POST', body: fd })
    return (async () => {
      try {
        return await doPost(pathPrimary)
      } catch (e) {
        if (e.status === 404 && pathFallback) return doPost(pathFallback)
        throw e
      }
    })()
  }
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  }
  return clubAuthJsonPrimaryOrFallback(pathPrimary, pathFallback, init)
}

/* --- Categories (public) --- */

export function fetchCategories() {
  return clubPublicJson('categories', { method: 'GET' })
}

/* --- Clubs --- */

export function fetchClubs(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.category) q.set('category', params.category)
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 12))
  const qs = q.toString()
  return clubAuthJson(`clubs${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export function fetchClub(clubId) {
  // Public club detail is readable without auth (student directory). When the user is signed in,
  // prefer the authenticated fetch (same DTO, but may include additional fields depending on gateway rules).
  const path = `clubs/${encodeURIComponent(clubId)}`
  if (getAccessToken()) return clubAuthJson(path, { method: 'GET' })
  return clubPublicJson(path, { method: 'GET' })
}

export function fetchClubMembers(clubId) {
  return clubAuthJson(`clubs/${encodeURIComponent(clubId)}/members`, { method: 'GET' })
}

export function submitClubJoinApplication(clubId, formData) {
  return clubAuthJson(`clubs/${encodeURIComponent(clubId)}/join-applications`, {
    method: 'POST',
    body: formData,
  })
}

/* --- Events --- */

export function fetchEvents(params = {}) {
  const q = new URLSearchParams()
  if (params.clubId != null) q.set('clubId', String(params.clubId))
  if (params.myClubsOnly != null) q.set('myClubsOnly', String(params.myClubsOnly))
  if (params.search) q.set('search', params.search)
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 24))
  const qs = q.toString()
  return clubAuthJson(`events${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export function fetchEvent(eventId) {
  return clubAuthJson(`events/${encodeURIComponent(eventId)}`, { method: 'GET' })
}

export function registerForEvent(eventId) {
  return clubAuthJson(`events/${encodeURIComponent(eventId)}/registrations`, {
    method: 'POST',
  })
}

/**
 * GET all registrations for an event (paged DTO, array, or club-style `{ items, total }`). Used to show real
 * headcount on the public event page when the event DTO does not include `registeredCount` / similar.
 */
export function fetchEventRegistrationsList(eventId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 500))
  return clubAuthJson(
    `events/${encodeURIComponent(eventId)}/registrations?${q.toString()}`,
    { method: 'GET' }
  )
}

/** Derive total count from a registrations list response (totals from pagination preferred over page length). */
export function countEventRegistrationsInResponse(data) {
  if (data == null) return null
  if (Array.isArray(data)) return data.length
  if (typeof data === 'object') {
    const directTotal = toFiniteIntNonNegative(
      data.totalCount ?? data.TotalCount ?? data.total ?? data.Total ?? data.count ?? data.Count
    )
    if (directTotal != null) return directTotal
    if (data.meta && typeof data.meta === 'object') {
      const m = toFiniteIntNonNegative(data.meta.total ?? data.meta.Total ?? data.meta.count)
      if (m != null) return m
    }
    const items = clubAdminListItems(data)
    if (Array.isArray(items)) return items.length
  }
  return null
}

function toFiniteIntNonNegative(v) {
  if (v == null) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const i = Math.floor(n)
  return i >= 0 ? i : null
}

export function unregisterFromEvent(eventId) {
  return clubAuthFetch(`events/${encodeURIComponent(eventId)}/registrations`, {
    method: 'DELETE',
  })
}

export function fetchEventTicket(eventId) {
  return clubAuthJson(`events/${encodeURIComponent(eventId)}/ticket`, { method: 'GET' })
}

/* --- Vacancies --- */

export function fetchVacancies(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.category) q.set('category', params.category)
  if (params.savedOnly != null) q.set('savedOnly', String(params.savedOnly))
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 12))
  const qs = q.toString()
  return clubAuthJson(`vacancies${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export function fetchVacancy(vacancyId) {
  return clubAuthJson(`vacancies/${encodeURIComponent(vacancyId)}`, { method: 'GET' })
}

export function fetchVacanciesByClub(clubId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 12))
  return clubAuthJson(`vacancies/by-club/${encodeURIComponent(clubId)}?${q}`, { method: 'GET' })
}

export function submitVacancyApplication(vacancyId, formData) {
  return clubAuthJson(`vacancies/${encodeURIComponent(vacancyId)}/applications`, {
    method: 'POST',
    body: formData,
  })
}

/* --- Me --- */

export function fetchMyClubMemberships() {
  return clubAuthJson(usersScopedPath('club-memberships'), { method: 'GET' })
}

/**
 * End the current user's membership in a club. Tries several common gateway routes (DELETE and POST fallbacks).
 */
export async function leaveClubMembership(clubId) {
  const raw = String(clubId ?? '').trim()
  if (!raw) {
    const err = new Error('Club id required')
    err.status = 400
    throw err
  }
  const enc = encodeURIComponent(raw)
  const deletePaths = [
    `users/me/club-memberships/${enc}`,
    `${usersScopedPath(`club-memberships/${enc}`)}`,
    `clubs/${enc}/members/me`,
    `clubs/${enc}/membership`,
  ]
  let lastErr
  for (const p of deletePaths) {
    try {
      await clubAuthDeleteExpectOk(p)
      return
    } catch (e) {
      lastErr = e
      if (e?.status === 404) continue
      throw e
    }
  }
  try {
    await clubAuthJson(`clubs/${enc}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    return
  } catch (e) {
    if (e?.status === 404) {
      try {
        await clubAuthJson(`clubs/${enc}/cancel-membership`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        return
      } catch (e2) {
        throw lastErr || e2
      }
    }
    throw e
  }
}

export function fetchMyVacancyApplications(params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  return clubAuthJson(`${usersScopedPath('vacancy-applications')}?${q}`, { method: 'GET' })
}

export function fetchMyMembershipApplications() {
  return clubAuthJson(usersScopedPath('membership-applications'), { method: 'GET' })
}

export function fetchMyEventRegistrations() {
  // Preferred contract: GET /users/me/event-registrations
  // Fallback: older gateways use user-scoped path /users/{id}/event-registrations
  return clubAuthJsonPrimaryOrFallback(
    'users/me/event-registrations',
    usersScopedPath('event-registrations'),
    { method: 'GET' }
  )
}

export function fetchMyClubNotifications(type = 'all') {
  const q = new URLSearchParams({ type })
  return clubAuthJson(`${usersScopedPath('club-notifications')}?${q}`, { method: 'GET' })
}

export function markClubNotificationRead(notificationId) {
  return clubAuthJson(
    `${usersScopedPath('club-notifications')}/${encodeURIComponent(notificationId)}/read`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  )
}

/* --- Club proposal (student) --- */

/** Max sizes aligned with ProposeClub UI copy and typical gateway limits. */
export const CLUB_PROPOSAL_MAX_LOGO_BYTES = 2 * 1024 * 1024
export const CLUB_PROPOSAL_MAX_CONSTITUTION_BYTES = 5 * 1024 * 1024

function normalizeClubProposalCommitment(val) {
  const s = String(val ?? 'no').trim().toLowerCase()
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'yes'
  return 'no'
}

/**
 * POST /api/v1/club-proposals (anonymous).
 * Per CLUB_API_DOC: multipart/form-data with real `logoFile` / `constitutionFile` uploads (S3 on server);
 * `otherMembersJson` is repeated form fields, one string id per member (not a JSON blob). This gateway expects **organizational / student-style ids**, not Auth GUIDs — send trimmed strings as provided.
 *
 * @param {object} proposal
 * @param {string} [proposal.id] submitter id; when omitted, resolved as signed-in user’s **organizational** id (Auth profile)
 * @param {string} proposal.name
 * @param {string} [proposal.description]
 * @param {File} proposal.logoFile
 * @param {File} proposal.constitutionFile
 * @param {string} [proposal.presidentStudentId]
 * @param {string} [proposal.vicePresidentStudentId]
 * @param {Array<{ studentId?: string, userId?: string, position?: string } | string>} [proposal.otherMembers] roster rows or plain id strings
 * @param {string} [proposal.commitment]
 * @param {string} [proposal.shortDesc]
 * @param {string} [proposal.uniqueDesc]
 * @param {string} [proposal.goals]
 * @param {string} [proposal.activities]
 * @param {string} [proposal.alignment]
 * @param {string} [proposal.vision]
 */
export async function submitClubProposal(proposal) {
  const p = proposal && typeof proposal === 'object' ? proposal : {}
  const fd = new FormData()

  if (!(p.logoFile instanceof File) || p.logoFile.size <= 0) {
    const err = new Error(
      'Club logo is missing or empty. Choose a real PNG/JPG file in Postman (no warning on the file row) or in the app before submitting.'
    )
    err.code = 'PROPOSAL_LOGO_FILE_MISSING'
    throw err
  }
  if (!(p.constitutionFile instanceof File) || p.constitutionFile.size <= 0) {
    const err = new Error(
      'Constitution PDF is missing or empty. Choose a real PDF file in Postman (no warning on the file row) or in the app before submitting.'
    )
    err.code = 'PROPOSAL_CONSTITUTION_FILE_MISSING'
    throw err
  }
  if (p.logoFile.size > CLUB_PROPOSAL_MAX_LOGO_BYTES) {
    const mb = CLUB_PROPOSAL_MAX_LOGO_BYTES / (1024 * 1024)
    const err = new Error(`Club logo must be ${mb} MB or smaller.`)
    err.code = 'PROPOSAL_LOGO_TOO_LARGE'
    throw err
  }
  if (p.constitutionFile.size > CLUB_PROPOSAL_MAX_CONSTITUTION_BYTES) {
    const mb = CLUB_PROPOSAL_MAX_CONSTITUTION_BYTES / (1024 * 1024)
    const err = new Error(`Constitution PDF must be ${mb} MB or smaller.`)
    err.code = 'PROPOSAL_CONSTITUTION_TOO_LARGE'
    throw err
  }

  let submitterId = p.id != null && p.id !== '' ? String(p.id).trim() : ''
  if (!submitterId) {
    submitterId = (await fetchCurrentUserOrganizationalId()) || ''
  }
  if (getAccessToken() && !submitterId) {
    const err = new Error(
      'Your student (organizational) id could not be loaded. Please sign in again, or contact support if this continues.'
    )
    err.code = 'PROPOSAL_SUBMITTER_ID_MISSING'
    throw err
  }
  if (submitterId) {
    fd.append('id', submitterId)
  }

  const name = String(p.name || '').trim()
  fd.append('name', name)

  /** `description` is required in legacy multipart mode on some gateways; always send a non-empty string. */
  let description = String(p.description ?? '').trim()
  if (!description) {
    const parts = [p.shortDesc, p.uniqueDesc, p.goals, p.activities, p.alignment, p.vision]
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
    description = parts.join('\n\n')
  }
  if (!description) {
    description = name ? `Club proposal: ${name}` : 'Club proposal'
  }
  fd.append('description', description)

  fd.append('logoFile', p.logoFile, p.logoFile.name)
  fd.append('constitutionFile', p.constitutionFile, p.constitutionFile.name)

  const president = String(p.presidentStudentId ?? '').trim()
  if (president) fd.append('presidentStudentId', president)
  const vice = String(p.vicePresidentStudentId ?? '').trim()
  if (vice) fd.append('vicePresidentStudentId', vice)

  const others = Array.isArray(p.otherMembers)
    ? p.otherMembers
    : Array.isArray(p.otherMembersJson)
      ? p.otherMembersJson
      : []
  for (const entry of others) {
    const sid =
      typeof entry === 'string' || typeof entry === 'number'
        ? String(entry).trim()
        : String(entry?.studentId ?? entry?.userId ?? '').trim()
    if (sid) fd.append('otherMembersJson', sid)
  }

  fd.append('commitment', normalizeClubProposalCommitment(p.commitment))

  const appendIf = (key, val) => {
    const t = String(val ?? '').trim()
    if (t) fd.append(key, t)
  }
  appendIf('shortDesc', p.shortDesc)
  appendIf('uniqueDesc', p.uniqueDesc)
  appendIf('goals', p.goals)
  appendIf('activities', p.activities)
  appendIf('alignment', p.alignment)
  appendIf('vision', p.vision)

  // Do not set Content-Type — browser sets multipart boundary.
  return clubPublicJson('club-proposals', { method: 'POST', body: fd })
}

/* --- Applications (interview slots) --- */

export function fetchApplicationInterviewSlots(applicationId) {
  const raw = String(applicationId ?? '').trim()
  const candidates = []
  if (raw) candidates.push(raw)
  if (raw.includes(':')) {
    const tail = raw.split(':').pop()?.trim()
    if (tail && !candidates.includes(tail)) candidates.push(tail)
  }
  return (async () => {
    let lastErr = null
    for (const id of candidates) {
      for (const path of [
        `applications/${encodeURIComponent(id)}/interview-slots`,
        `interviews/${encodeURIComponent(id)}/slots`,
      ]) {
        try {
          return await clubAuthJson(path, { method: 'GET' })
        } catch (e) {
          lastErr = e
          if (e?.status !== 404) throw e
        }
      }
    }
    if (lastErr) throw lastErr
    const err = new Error('Invalid interview application id.')
    err.status = 400
    throw err
  })()
}

export function selectInterviewSlot(applicationId, slotId) {
  const raw = String(applicationId ?? '').trim()
  const candidates = []
  if (raw) candidates.push(raw)
  if (raw.includes(':')) {
    const tail = raw.split(':').pop()?.trim()
    if (tail && !candidates.includes(tail)) candidates.push(tail)
  }
  return (async () => {
    let lastErr = null
    for (const id of candidates) {
      for (const path of [
        `applications/${encodeURIComponent(id)}/interview-slot`,
        `interviews/${encodeURIComponent(id)}/bookings`,
      ]) {
        try {
          return await clubAuthJson(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slotId }),
          })
        } catch (e) {
          lastErr = e
          if (e?.status !== 404) throw e
        }
      }
    }
    if (lastErr) throw lastErr
    const err = new Error('Invalid interview application id.')
    err.status = 400
    throw err
  })()
}

export function fetchMyInterviewBooking(applicationId) {
  const raw = String(applicationId ?? '').trim()
  const candidates = []
  if (raw) candidates.push(raw)
  if (raw.includes(':')) {
    const tail = raw.split(':').pop()?.trim()
    if (tail && !candidates.includes(tail)) candidates.push(tail)
  }
  return (async () => {
    let lastErr = null
    for (const id of candidates) {
      const res = await clubAuthFetch(`interviews/${encodeURIComponent(id)}/my-booking`, {
        method: 'GET',
      })
      const data = await readJsonSafe(res)
      if (res.status === 404) continue
      if (!res.ok) {
        const msg =
          typeof data === 'object' && data != null
            ? data.message || data.title || data.detail || `Request failed (${res.status})`
            : typeof data === 'string' && data
              ? data
              : `Request failed (${res.status})`
        const err = new Error(String(msg))
        err.status = res.status
        err.body = data
        throw err
      }
      return unwrapApiResponse(data)
    }
    if (lastErr) throw lastErr
    return null
  })()
}

/** By slot id (admin or shared slot DTO) — for displaying booked times. */
export function fetchClubInterviewSlotById(slotId) {
  const id = String(slotId ?? '').trim()
  if (!id) {
    const err = new Error('Slot id required')
    err.status = 400
    throw err
  }
  return (async () => {
    for (const path of [`slots/${encodeURIComponent(id)}`, `interview-slots/${encodeURIComponent(id)}`]) {
      try {
        return await clubAuthJson(path, { method: 'GET' })
      } catch (e) {
        if (e?.status === 404) continue
        throw e
      }
    }
    return null
  })()
}

/* --- Club admin --- */

function clubAdminPath(clubId, subPath) {
  const base = `club-admin/${encodeURIComponent(clubId)}`
  const rest = subPath.replace(/^\//, '')
  return `${base}/${rest}`
}

export function fetchClubAdminDashboard(clubId) {
  return clubAuthJson(clubAdminPath(clubId, 'dashboard'), { method: 'GET' })
}

export function fetchClubAdminApplications(clubId, params = {}) {
  const q = new URLSearchParams()
  if (params.type) q.set('type', String(params.type))
  if (params.status) q.set('status', String(params.status))
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 100))
  const qs = q.toString()
  return clubAuthJson(clubAdminPath(clubId, `applications?${qs}`), { method: 'GET' })
}

export function fetchClubAdminApplication(clubId, applicationId) {
  return clubAuthJson(clubAdminPath(clubId, `applications/${encodeURIComponent(applicationId)}`), {
    method: 'GET',
  })
}

export function approveClubAdminApplication(clubId, applicationId) {
  return clubAuthJson(clubAdminPath(clubId, `applications/${encodeURIComponent(applicationId)}/approve`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export function rejectClubAdminApplication(clubId, applicationId, reason) {
  return clubAuthJson(clubAdminPath(clubId, `applications/${encodeURIComponent(applicationId)}/reject`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export function requestChangesClubAdminApplication(clubId, applicationId, changes) {
  return clubAuthJson(
    clubAdminPath(clubId, `applications/${encodeURIComponent(applicationId)}/request-changes`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    }
  )
}

export function inviteClubAdminApplicationToInterview(clubId, applicationId) {
  return clubAuthJson(
    clubAdminPath(clubId, `applications/${encodeURIComponent(applicationId)}/invite-to-interview`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  )
}

export function addClubAdminApplicationNote(clubId, applicationId, note) {
  return clubAuthJson(clubAdminPath(clubId, `applications/${encodeURIComponent(applicationId)}/notes`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  })
}

export function clubAdminBulkDecision(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'applications/bulk-decision'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function fetchClubAdminInterviewSlots(clubId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  return clubAuthJson(clubAdminPath(clubId, `interview-slots?${q}`), { method: 'GET' })
}

export function generateClubAdminInterviewSlots(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'interview-slots/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function patchClubAdminInterviewSlot(clubId, slotId, body) {
  return clubAuthJson(clubAdminPath(clubId, `interview-slots/${encodeURIComponent(slotId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

export function deleteClubAdminInterviewSlot(clubId, slotId) {
  return clubAuthFetch(clubAdminPath(clubId, `interview-slots/${encodeURIComponent(slotId)}`), {
    method: 'DELETE',
  })
}

export function fetchClubAdminVacancies(clubId, params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  return clubAuthJson(clubAdminPath(clubId, `vacancies?${q}`), { method: 'GET' })
}

export function createClubAdminVacancy(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'vacancies'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function patchClubAdminVacancy(clubId, vacancyId, body) {
  return clubAuthJson(clubAdminPath(clubId, `vacancies/${encodeURIComponent(vacancyId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function patchClubAdminVacancyStatus(clubId, vacancyId, status) {
  return clubAuthJson(clubAdminPath(clubId, `vacancies/${encodeURIComponent(vacancyId)}/status`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export function fetchClubAdminMembers(clubId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  return clubAuthJson(clubAdminPath(clubId, `members?${q}`), { method: 'GET' })
}

export function deleteClubAdminMember(clubId, memberId) {
  return clubAuthDeleteExpectOk(clubAdminPath(clubId, `members/${encodeURIComponent(memberId)}`))
}

export function fetchClubAdminEmployees(clubId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  return clubAuthJson(clubAdminPath(clubId, `employees?${q}`), { method: 'GET' })
}

export function createClubAdminEmployee(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'employees'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function patchClubAdminEmployeesPositions(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'employees/positions'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteClubAdminEmployee(clubId, employeeId) {
  return clubAuthDeleteExpectOk(clubAdminPath(clubId, `employees/${encodeURIComponent(employeeId)}`))
}

export function fetchClubAdminEvents(clubId, params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  if (params.search) q.set('search', String(params.search))
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 24))
  const qs = q.toString()
  return clubAuthJson(clubAdminPath(clubId, `events${qs ? `?${qs}` : ''}`), { method: 'GET' })
}

export function patchClubAdminEvent(clubId, eventId, body) {
  return clubAuthJson(clubAdminPath(clubId, `events/${encodeURIComponent(eventId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * `POST /api/v1/club-admin/{clubId}/events/proposals` — **multipart/form-data only**; attach image with `imageFile`.
 * `imageUrl` is rejected on this route (CLUB_API_DOC).
 * @param {string|number} clubId
 * @param {Record<string, unknown>} formState — fields for {@link buildEventProposalSubmitDto} (do not set `imageUrl` for this route)
 * @param {File|null|undefined} [imageFile] — optional event poster / image
 */
export function proposeClubAdminEvent(clubId, formState, imageFile) {
  const built = buildEventProposalSubmitDto(formState)
  const { imageUrl: _discarded, ...dto } = built
  void _discarded
  const fd = buildEventProposalFormData(dto, { includeImageUrl: false })
  if (imageFile instanceof File) {
    fd.append('imageFile', imageFile, imageFile.name)
  }
  return clubAuthJson(clubAdminPath(clubId, 'events/proposals'), { method: 'POST', body: fd })
}

export function fetchClubAdminEventAttendees(clubId, eventId) {
  return clubAuthJson(clubAdminPath(clubId, `events/${encodeURIComponent(eventId)}/attendees`), {
    method: 'GET',
  })
}

export function patchClubAdminEventAttendee(clubId, eventId, attendeeId, body) {
  return clubAuthJson(
    clubAdminPath(clubId, `events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(attendeeId)}`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
}

export function deleteClubAdminEventAttendee(clubId, eventId, attendeeId) {
  return clubAuthFetch(
    clubAdminPath(clubId, `events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(attendeeId)}`),
    { method: 'DELETE' }
  )
}

export function patchClubAdminProfile(clubId, formData) {
  return clubAuthJson(clubAdminPath(clubId, 'profile'), { method: 'PATCH', body: formData })
}

/**
 * @see CLUB_API_DOC: GET /api/v1/club-admin/{clubId}/files — list club resource files (`items` in body).
 */
export function fetchClubAdminFiles(clubId) {
  return clubAuthJson(clubAdminPath(clubId, 'files'), { method: 'GET' })
}

/**
 * @see CLUB_API_DOC: POST multipart with `file` (required) and `title` (optional).
 * @param {string|number} clubId
 * @param {File} file
 * @param {string} [title]
 */
export function postClubAdminFile(clubId, file, title) {
  const fd = new FormData()
  fd.append('file', file, file.name)
  const t = title != null ? String(title).trim() : ''
  if (t) fd.append('title', t)
  return clubAuthJson(clubAdminPath(clubId, 'files'), { method: 'POST', body: fd })
}

/**
 * @see CLUB_API_DOC: PATCH — `title` and/or `file` optional; at least one should be set.
 * @param {FormData} formData
 */
export function patchClubAdminFile(clubId, fileId, formData) {
  return clubAuthJson(
    clubAdminPath(clubId, `files/${encodeURIComponent(String(fileId))}`),
    { method: 'PATCH', body: formData }
  )
}

export function deleteClubAdminFile(clubId, fileId) {
  return clubAuthDeleteExpectOk(
    clubAdminPath(clubId, `files/${encodeURIComponent(String(fileId))}`)
  )
}

/** Logo only — always PATCH alone so the gateway never applies the same file to hero + profile. */
export function patchClubAdminProfileLogoOnly(clubId, file) {
  const fd = new FormData()
  fd.append('logoFile', file)
  return patchClubAdminProfile(clubId, fd)
}

/** Background / hero only — separate multipart from {@link patchClubAdminProfileLogoOnly}. */
export function patchClubAdminProfileBackgroundOnly(clubId, file) {
  const fd = new FormData()
  fd.append('backgroundFile', file)
  return patchClubAdminProfile(clubId, fd)
}

export function postClubAdminAnnouncement(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'announcements'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function fetchClubAdminPositions(clubId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  return clubAuthJson(clubAdminPath(clubId, `positions?${q}`), { method: 'GET' })
}

/** Category strings for position create/edit: API enum plus any values already used on this club's positions. */
export async function fetchClubAdminPositionCategoryOptions(clubId) {
  const res = await fetchClubAdminPositions(clubId, { page: 1, limit: 200 })
  const items = res?.items ?? res ?? []
  const list = Array.isArray(items) ? items : []
  const seen = list.map((p) => p?.categoryName ?? p?.category).filter(Boolean)
  return positionCategoryOptionsFromApi(seen)
}

export function createClubAdminPosition(clubId, body) {
  const payload = buildClubAdminPositionJsonPayload(body)
  return clubAuthJson(clubAdminPath(clubId, 'positions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function patchClubAdminPosition(clubId, positionId, body) {
  const payload = buildClubAdminPositionJsonPayload(body)
  return clubAuthJson(clubAdminPath(clubId, `positions/${encodeURIComponent(positionId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteClubAdminPosition(clubId, positionId) {
  return clubAuthFetch(clubAdminPath(clubId, `positions/${encodeURIComponent(positionId)}`), {
    method: 'DELETE',
  })
}

/* --- Student services --- */

export function fetchStudentServicesDashboard() {
  return clubAuthJson('student-services/dashboard', { method: 'GET' })
}

export function fetchStudentServicesClubs(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 12))
  return clubAuthJson(`student-services/clubs?${q}`, { method: 'GET' })
}

export function fetchStudentServicesClub(clubId) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}`, { method: 'GET' })
}

export function fetchStudentServicesClubProposals(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  if (params.search) q.set('search', String(params.search))
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  const qs = `?${q}`
  return clubAuthJsonPrimaryOrFallback(
    `student-services/clubs/proposals${qs}`,
    `student-services/club-proposals${qs}`,
    { method: 'GET' }
  )
}

export function fetchStudentServicesClubProposal(proposalId) {
  const enc = encodeURIComponent(proposalId)
  return clubAuthJsonPrimaryOrFallback(
    `student-services/clubs/proposals/${enc}`,
    `student-services/club-proposals/${enc}`,
    { method: 'GET' }
  )
}

export function approveStudentServicesClubProposal(proposalId) {
  const enc = encodeURIComponent(proposalId)
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }
  return clubAuthJsonPrimaryOrFallback(
    `student-services/clubs/proposals/${enc}/approve`,
    `student-services/club-proposals/${enc}/approve`,
    init
  )
}

export function rejectStudentServicesClubProposal(proposalId, reason) {
  const enc = encodeURIComponent(proposalId)
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }
  return clubAuthJsonPrimaryOrFallback(
    `student-services/clubs/proposals/${enc}/reject`,
    `student-services/club-proposals/${enc}/reject`,
    init
  )
}

export function requestRevisionStudentServicesClubProposal(proposalId, changes) {
  const enc = encodeURIComponent(proposalId)
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes }),
  }
  return clubAuthJsonPrimaryOrFallback(
    `student-services/clubs/proposals/${enc}/request-revision`,
    `student-services/club-proposals/${enc}/request-revision`,
    init
  )
}

export function fetchStudentServicesProposalRequirements() {
  return clubAuthJson('student-services/club-proposal-requirements', { method: 'GET' })
}

export function putStudentServicesProposalRequirements(body) {
  return clubAuthJson('student-services/club-proposal-requirements', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function fetchStudentServicesEventProposals(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  if (params.search) q.set('search', String(params.search))
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  const qs = `?${q}`
  return clubAuthJsonPrimaryOrFallback(
    `student-services/events/proposals${qs}`,
    `student-services/event-proposals${qs}`,
    { method: 'GET' }
  )
}

/**
 * `POST /api/v1/student-services/events/proposals` — `application/json` or `multipart/form-data`;
 * optional `imageUrl` + `imageFile` (upload wins if both; CLUB_API_DOC).
 * @param {Record<string, unknown>} formState — include `imageUrl` when using a pre-hosted URL
 * @param {File|null|undefined} [imageFile]
 */
export function submitStudentServicesEventProposal(formState, imageFile) {
  const dto = buildEventProposalSubmitDto(formState)
  return postEventProposalResolvingPath(
    'student-services/events/proposals',
    'student-services/event-proposals',
    dto,
    imageFile
  )
}

export function fetchStudentServicesEventProposal(proposalId) {
  const enc = encodeURIComponent(proposalId)
  return clubAuthJsonPrimaryOrFallback(
    `student-services/events/proposals/${enc}`,
    `student-services/event-proposals/${enc}`,
    { method: 'GET' }
  )
}

/**
 * `POST /api/v1/student-services/events/proposals/{id}/approve` — optional body `EventProposalApproveDto` (e.g. `{ assignments: [...] }`).
 * @param {string|number} proposalId
 * @param {Record<string, unknown>|Array<unknown>|null|undefined} [approveDtoOrAssignments] — full DTO object, or an **assignments array** (wrapped as `{ assignments }`)
 */
export function approveStudentServicesEventProposal(proposalId, approveDtoOrAssignments) {
  const enc = encodeURIComponent(proposalId)
  let body = {}
  if (approveDtoOrAssignments != null) {
    if (Array.isArray(approveDtoOrAssignments)) {
      body = { assignments: approveDtoOrAssignments }
    } else if (typeof approveDtoOrAssignments === 'object') {
      body = { ...approveDtoOrAssignments }
    }
  }
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
  return clubAuthJsonPrimaryOrFallback(
    `student-services/events/proposals/${enc}/approve`,
    `student-services/event-proposals/${enc}/approve`,
    init
  )
}

export function rejectStudentServicesEventProposal(proposalId, reason) {
  const enc = encodeURIComponent(proposalId)
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }
  return clubAuthJsonPrimaryOrFallback(
    `student-services/events/proposals/${enc}/reject`,
    `student-services/event-proposals/${enc}/reject`,
    init
  )
}

export function requestRevisionStudentServicesEventProposal(proposalId, changes) {
  const enc = encodeURIComponent(proposalId)
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes }),
  }
  return clubAuthJsonPrimaryOrFallback(
    `student-services/events/proposals/${enc}/request-revision`,
    `student-services/event-proposals/${enc}/request-revision`,
    init
  )
}

export function fetchStudentServicesEvents() {
  return clubAuthJson('student-services/events', { method: 'GET' })
}

export function createStudentServicesEvent(body) {
  return clubAuthJson('student-services/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getStudentServicesEvent(eventId) {
  return clubAuthJson(`student-services/events/${encodeURIComponent(eventId)}`, { method: 'GET' })
}

export function patchStudentServicesEvent(eventId, body) {
  return clubAuthJson(`student-services/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteStudentServicesEvent(eventId) {
  return clubAuthFetch(`student-services/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' })
}

export function patchStudentServicesClub(clubId, body) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * Club logo upload for Student Services / directory.
 * Preferred: `POST /api/v1/student-services/clubs/{id}/profile-image` (pending → approve for public URL).
 * Fallback: `PATCH /api/v1/club-admin/{id}/profile` with multipart `logoFile` (persists to profile immediately).
 */
export async function uploadStudentServicesClubProfileImage(clubId, file) {
  const fd = new FormData()
  fd.append('logoFile', file)
  try {
    return await clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/profile-image`, {
      method: 'POST',
      body: fd,
    })
  } catch (e) {
    if (e?.status === 403 || e?.status === 404) {
      const fd2 = new FormData()
      fd2.append('logoFile', file)
      return patchClubAdminProfile(clubId, fd2)
    }
    throw e
  }
}

/**
 * Pending club background for Student Services (when implemented).
 * Falls back to club-admin profile PATCH with `backgroundFile` if the SS route is not deployed (404).
 */
export async function uploadStudentServicesClubBackgroundImage(clubId, file) {
  const fd = new FormData()
  fd.append('backgroundFile', file)
  try {
    return await clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/background-image`, {
      method: 'POST',
      body: fd,
    })
  } catch (e) {
    if (e?.status === 403 || e?.status === 404) {
      const fd2 = new FormData()
      fd2.append('backgroundFile', file)
      return patchClubAdminProfile(clubId, fd2)
    }
    throw e
  }
}

export function approveStudentServicesClubProfileImage(clubId) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/profile-image/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export function fetchStudentServicesClubMembers(clubId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  const enc = encodeURIComponent(clubId)
  const qs = `?${q}`
  // Student-services roster endpoints may be deployed as empty stubs; use club-admin data in that case.
  return (async () => {
    try {
      const primary = await clubAuthJson(`student-services/clubs/${enc}/members${qs}`, { method: 'GET' })
      if (clubAdminListItems(primary).length > 0) return primary
    } catch (e) {
      if (e?.status !== 404) throw e
    }
    return clubAuthJson(`club-admin/${enc}/members${qs}`, { method: 'GET' })
  })()
}

export function patchStudentServicesClubMember(clubId, memberId, body) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/members/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteStudentServicesClubMember(clubId, memberId) {
  return clubAuthFetch(`student-services/clubs/${encodeURIComponent(clubId)}/members/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  })
}

export function fetchStudentServicesClubEmployees(clubId, params = {}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 50))
  const enc = encodeURIComponent(clubId)
  const qs = `?${q}`
  // Student-services roster endpoints may be deployed as empty stubs; use club-admin data in that case.
  return (async () => {
    try {
      const primary = await clubAuthJson(`student-services/clubs/${enc}/employees${qs}`, { method: 'GET' })
      if (clubAdminListItems(primary).length > 0) return primary
    } catch (e) {
      if (e?.status !== 404) throw e
    }
    return clubAuthJson(`club-admin/${enc}/employees${qs}`, { method: 'GET' })
  })()
}

export function createStudentServicesClubEmployee(clubId, body) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function patchStudentServicesClubEmployee(clubId, employeeId, body) {
  return clubAuthJson(
    `student-services/clubs/${encodeURIComponent(clubId)}/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
}

export function deleteStudentServicesClubEmployee(clubId, employeeId) {
  return clubAuthFetch(
    `student-services/clubs/${encodeURIComponent(clubId)}/employees/${encodeURIComponent(employeeId)}`,
    { method: 'DELETE' }
  )
}
