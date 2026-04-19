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
  return clubAuthJson(`clubs/${encodeURIComponent(clubId)}`, { method: 'GET' })
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
  return clubAuthJson(usersScopedPath('event-registrations'), { method: 'GET' })
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

/* --- Club proposal (student) — protected in doc; uses multipart --- */

export function submitClubProposal(formData) {
  return clubAuthJson('club-proposals', { method: 'POST', body: formData })
}

/* --- Applications (interview slots) --- */

export function fetchApplicationInterviewSlots(applicationId) {
  return clubAuthJson(`applications/${encodeURIComponent(applicationId)}/interview-slots`, {
    method: 'GET',
  })
}

export function selectInterviewSlot(applicationId, slotId) {
  return clubAuthJson(`applications/${encodeURIComponent(applicationId)}/interview-slot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId }),
  })
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
  return clubAuthFetch(clubAdminPath(clubId, `members/${encodeURIComponent(memberId)}`), {
    method: 'DELETE',
  })
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
  return clubAuthFetch(clubAdminPath(clubId, `employees/${encodeURIComponent(employeeId)}`), {
    method: 'DELETE',
  })
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

export function fetchStudentServicesClubProposals() {
  return clubAuthJson('student-services/club-proposals', { method: 'GET' })
}

export function fetchStudentServicesClubProposal(proposalId) {
  return clubAuthJson(`student-services/club-proposals/${encodeURIComponent(proposalId)}`, {
    method: 'GET',
  })
}

export function approveStudentServicesClubProposal(proposalId) {
  return clubAuthJson(`student-services/club-proposals/${encodeURIComponent(proposalId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export function rejectStudentServicesClubProposal(proposalId, reason) {
  return clubAuthJson(`student-services/club-proposals/${encodeURIComponent(proposalId)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export function requestRevisionStudentServicesClubProposal(proposalId, changes) {
  return clubAuthJson(`student-services/club-proposals/${encodeURIComponent(proposalId)}/request-revision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes }),
  })
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

export function fetchStudentServicesEventProposals() {
  return clubAuthJson('student-services/event-proposals', { method: 'GET' })
}

export function fetchStudentServicesEventProposal(proposalId) {
  return clubAuthJson(`student-services/event-proposals/${encodeURIComponent(proposalId)}`, {
    method: 'GET',
  })
}

export function approveStudentServicesEventProposal(proposalId, assignments) {
  return clubAuthJson(`student-services/event-proposals/${encodeURIComponent(proposalId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments }),
  })
}

export function rejectStudentServicesEventProposal(proposalId, reason) {
  return clubAuthJson(`student-services/event-proposals/${encodeURIComponent(proposalId)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export function requestRevisionStudentServicesEventProposal(proposalId, changes) {
  return clubAuthJson(`student-services/event-proposals/${encodeURIComponent(proposalId)}/request-revision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes }),
  })
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

export function approveStudentServicesClubProfileImage(clubId) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/profile-image/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export function fetchStudentServicesClubMembers(clubId) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/members`, { method: 'GET' })
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

export function fetchStudentServicesClubEmployees(clubId) {
  return clubAuthJson(`student-services/clubs/${encodeURIComponent(clubId)}/employees`, { method: 'GET' })
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
