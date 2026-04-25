import { authFetch } from '../auth/authClient'
import { getAccessToken } from '../auth/tokenStorage'
import { getJwtUserId } from '../auth/jwtRoles'
import { clubUrl } from './clubConfig'

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

/**
 * Submit a club proposal JSON payload.
 * Uses non-user-scoped endpoint: club-proposals
 */
export function submitClubProposal(body) {
  const userId = getJwtUserId()
  const base = body && typeof body === 'object' ? { ...body } : {}
  // Many backends model this property as a JSON string (name ends with "Json").
  if (Array.isArray(base.otherMembersJson)) {
    base.otherMembersJson = JSON.stringify(base.otherMembersJson)
  }
  const normalizedBody = {
    ...base,
    // Legacy alias reads submitter from payload id.
    id: String((base.id != null && base.id !== '' ? base.id : userId) || '').trim() || undefined,
  }
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedBody),
  }
  // Club proposals are intentionally unauthenticated in the current backend contract.
  return clubPublicJson('club-proposals', init)
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

export function proposeClubAdminEvent(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'events/proposals'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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

export function createClubAdminPosition(clubId, body) {
  return clubAuthJson(clubAdminPath(clubId, 'positions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function patchClubAdminPosition(clubId, positionId, body) {
  return clubAuthJson(clubAdminPath(clubId, `positions/${encodeURIComponent(positionId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

/** Submit a new event proposal for institutional review (Student Services; mirrors `club-admin/.../events/proposals`). */
export function submitStudentServicesEventProposal(body) {
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
  return clubAuthJsonPrimaryOrFallback('student-services/events/proposals', 'student-services/event-proposals', init)
}

export function fetchStudentServicesEventProposal(proposalId) {
  const enc = encodeURIComponent(proposalId)
  return clubAuthJsonPrimaryOrFallback(
    `student-services/events/proposals/${enc}`,
    `student-services/event-proposals/${enc}`,
    { method: 'GET' }
  )
}

export function approveStudentServicesEventProposal(proposalId, assignments) {
  const enc = encodeURIComponent(proposalId)
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments }),
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
    if (e.status === 404) {
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
  // Preferred: student-services directory endpoint. Fallback: club-admin members (commonly implemented first).
  return clubAuthJsonPrimaryOrFallback(
    `student-services/clubs/${enc}/members${qs}`,
    `club-admin/${enc}/members${qs}`,
    { method: 'GET' }
  )
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
  // Preferred: student-services directory endpoint. Fallback: club-admin employees (commonly implemented first).
  return clubAuthJsonPrimaryOrFallback(
    `student-services/clubs/${enc}/employees${qs}`,
    `club-admin/${enc}/employees${qs}`,
    { method: 'GET' }
  )
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
