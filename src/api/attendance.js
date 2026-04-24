import { getAccessToken, authFetch } from '../auth'
import { API_BASE } from './apiBase'

const ATTENDANCE_API_BASE =
  import.meta.env.VITE_ATTENDANCE_API_BASE?.replace(/\/$/, '') || `${API_BASE}/attendance`

/** Legacy / short opaque tokens (non-JWT) */
const LEGACY_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{6,1024}$/

function looksLikeJwt(value) {
  const s = String(value || '').trim()
  if (!s || s.includes('|')) return false
  const parts = s.split('.')
  return parts.length >= 3 && parts.every((p) => p.length > 0)
}

function readEnvelope(data) {
  if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'result')) {
    return data.result
  }
  return data
}

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function normalizeApiMessage(data, fallback) {
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim()
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim()
    if (typeof data.title === 'string' && data.title.trim()) return data.title.trim()
  }
  return fallback
}

function makeAttendanceError(message, extras = {}) {
  const err = new Error(message)
  Object.assign(err, extras)
  return err
}

function getAuthHeaders(includeJson = false) {
  const headers = new Headers()
  const accessToken = getAccessToken()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (includeJson) headers.set('Content-Type', 'application/json')
  return headers
}

async function attendanceRequest(path, options = {}) {
  const response = await fetch(`${ATTENDANCE_API_BASE}${path}`, options)
  const payload = await parseJsonSafe(response)
  const data = readEnvelope(payload)

  if (!response.ok) {
    throw makeAttendanceError(
      normalizeApiMessage(payload, `Attendance request failed (${response.status}).`),
      { status: response.status, body: payload }
    )
  }

  return data
}

function baseWithoutAttendanceSuffix() {
  return ATTENDANCE_API_BASE.replace(/\/attendance$/i, '') || ATTENDANCE_API_BASE
}

/**
 * Some deployments expose attendance routes at:
 * - {gateway}/attendance/api/...
 * Others expose them at:
 * - {gateway}/api/...
 *
 * This helper tries both by building candidate URLs.
 */
async function attendanceRequestCandidates(paths, options = {}) {
  const list = Array.isArray(paths) ? paths : [paths]
  const baseRoot = baseWithoutAttendanceSuffix()
  const candidates = []
  for (const p of list) {
    const path = String(p || '')
    if (!path) continue
    candidates.push(`${ATTENDANCE_API_BASE}${path}`)
    candidates.push(`${baseRoot}${path}`)
  }

  let lastErr
  for (const url of candidates) {
    try {
      const response = await fetch(url, options)
      const payload = await parseJsonSafe(response)
      const data = readEnvelope(payload)
      if (!response.ok) {
        throw makeAttendanceError(
          normalizeApiMessage(payload, `Attendance request failed (${response.status}).`),
          { status: response.status, body: payload }
        )
      }
      return data
    } catch (e) {
      lastErr = e
      if (e?.status !== 404) throw e
    }
  }
  throw lastErr || makeAttendanceError('Attendance request failed.')
}

function toNumberOrNull(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toBooleanOrUndefined(value) {
  if (value === undefined || value === null) return undefined
  return Boolean(value)
}

function normalizeRouteUserId(value) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function normalizeSession(item) {
  if (!item || typeof item !== 'object') return null
  const sessionId = toNumberOrNull(firstDefined(item.sessionId, item.id))
  if (sessionId == null) return null
  const roundNo = toNumberOrNull(firstDefined(item.roundNo, item.round, item.roundNumber))

  return {
    sessionId,
    lessonId: toNumberOrNull(firstDefined(item.lessonId, item.lesson_id)),
    attendanceSessionId: toNumberOrNull(firstDefined(item.attendanceSessionId, item.attendance_session_id, item.id)),
    startTime: firstDefined(item.startTime, item.start_time, item.startsAt, item.date),
    endTime: firstDefined(item.endTime, item.end_time, item.endsAt),
    topic: firstDefined(item.topic, item.name),
    status: String(firstDefined(item.status, item.sessionStatus, '') || '').toLowerCase(),
    isActive: Boolean(firstDefined(item.isAttendanceActive, item.isActive, item.active)),
    roundNo: roundNo == null ? 0 : roundNo,
  }
}

function pickBestSession(sessions = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) return null
  const normalized = sessions.map(normalizeSession).filter(Boolean)
  if (normalized.length === 0) return null

  const active = normalized.find((session) => session.isActive || session.status.includes('active'))
  if (active) return active

  const upcoming = normalized.find((session) => {
    if (!session.startTime) return false
    const startsAt = new Date(session.startTime).getTime()
    return Number.isFinite(startsAt) && startsAt >= Date.now()
  })
  if (upcoming) return upcoming

  return normalized
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(left.startTime || 0).getTime()
      const rightTime = new Date(right.startTime || 0).getTime()
      return rightTime - leftTime
    })[0]
}

/**
 * Basic sanity check for scan payload. Supports JWT, `jwt|studentGuid`, or legacy short token.
 */
export function validateAttendanceQrToken(rawValue) {
  const parsed = parseAttendanceQrPayload(rawValue)
  const token = String(parsed?.token || '').trim()
  if (!token) {
    throw makeAttendanceError('QR code is empty. Please scan a valid attendance QR code.', {
      code: 'INVALID_QR_EMPTY',
      status: 400,
    })
  }
  if (token.includes('\n') || token.includes('\r') || /^https?:\/\//i.test(token)) {
    throw makeAttendanceError('QR code format is invalid. Expected a JWT or `jwt|studentGuid` string.', {
      code: 'INVALID_QR_FORMAT',
      status: 400,
    })
  }
  if (token.includes('|')) {
    const [left] = token.split('|')
    if (looksLikeJwt(left) || LEGACY_TOKEN_PATTERN.test(String(left || '').trim())) return token
    throw makeAttendanceError('QR code token is malformed.', { code: 'INVALID_QR_MALFORMED', status: 400 })
  }
  if (looksLikeJwt(token) || LEGACY_TOKEN_PATTERN.test(token)) return token
  throw makeAttendanceError('QR code token is malformed. Please scan the current attendance QR code.', {
    code: 'INVALID_QR_MALFORMED',
    status: 400,
  })
}

export function parseAttendanceQrPayload(rawValue) {
  const value = String(rawValue ?? '').trim()
  if (!value) {
    throw makeAttendanceError('QR code is empty. Please scan a valid attendance QR code.', {
      code: 'INVALID_QR_EMPTY',
      status: 400,
    })
  }

  if (!value.startsWith('{')) {
    // Plain JWT, legacy token, or `jwt|studentGuid` — context is in the JWT; no separate qrContext.
    return { token: value, qrContext: null, rawValue: value }
  }

  let parsed
  try {
    parsed = JSON.parse(value)
  } catch {
    throw makeAttendanceError('QR code format is invalid. JSON payload could not be parsed.', {
      code: 'INVALID_QR_FORMAT',
      status: 400,
    })
  }

  const token = String(firstDefined(parsed?.token, parsed?.payload, '')).trim()
  if (!token) {
    throw makeAttendanceError('QR JSON did not include a token field.', { code: 'INVALID_QR_FORMAT', status: 400 })
  }
  return {
    token,
    qrContext: null,
    rawValue: value,
  }
}

/**
 * @deprecated Use raw JWT in QR. Kept for older demos only.
 */
function buildLegacyQrJsonPayload({ token, sessionId, roundCount, instructorId }) {
  return JSON.stringify({
    token,
    sessionId: sessionId == null ? null : String(sessionId),
    roundCount: Number.isFinite(Number(roundCount)) ? Number(roundCount) : null,
    instructorId: String(instructorId ?? '').trim() || null,
  })
}

/**
 * Prefer `JWT|studentGuid` so the server can verify the correct account. If the scanned
 * value already includes `|`, it is used as-is.
 */
export function buildScanTokenForRequest(scannedValue, studentGuid) {
  const raw = String(scannedValue ?? '').trim()
  if (!raw) {
    throw makeAttendanceError('Scanned value is empty.', { code: 'INVALID_QR_EMPTY', status: 400 })
  }
  if (raw.includes('|')) {
    return validateAttendanceQrToken(raw)
  }
  const validated = validateAttendanceQrToken(raw)
  const guid = String(studentGuid ?? '').trim()
  if (!guid) {
    throw makeAttendanceError('Student id is required to bind the token.', { code: 'STUDENT_ID_MISSING' })
  }
  return `${validated}|${guid}`
}

export function resolveAuthenticatedStudentId(explicitStudentId) {
  const direct = String(explicitStudentId ?? '').trim()
  if (direct) return direct

  const storageCandidates = [
    sessionStorage.getItem('studentId'),
    sessionStorage.getItem('userId'),
    localStorage.getItem('studentId'),
    localStorage.getItem('userId'),
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
  if (storageCandidates.length > 0) return storageCandidates[0]

  const accessToken = getAccessToken()
  if (accessToken) {
    try {
      const [, payloadPart] = accessToken.split('.')
      const normalizedBase64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalizedBase64.padEnd(normalizedBase64.length + ((4 - (normalizedBase64.length % 4)) % 4), '=')
      const json = JSON.parse(atob(padded))
      const claimCandidates = [
        json.studentId,
        json.student_id,
        json.sid,
        json.sub,
        json['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
      if (claimCandidates.length > 0) return claimCandidates[0]
    } catch {
      // Ignore malformed or opaque token payloads.
    }
  }

  throw makeAttendanceError('Authenticated student id is missing. Please sign in again.', {
    code: 'STUDENT_ID_MISSING',
  })
}

export async function getSessionState({ instructorId, lessonId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedLessonId = toNumberOrNull(lessonId)
  if (normalizedInstructorId == null || normalizedLessonId == null) {
    throw makeAttendanceError('Instructor id (GUID) and lesson id are required to load attendance sessions.')
  }

  const sessions = await attendanceRequest(
    `/api/instructors/${normalizedInstructorId}/lessons/${normalizedLessonId}/sessions`,
    { headers: getAuthHeaders() }
  )

  const items = Array.isArray(sessions)
    ? sessions
    : Array.isArray(sessions?.items)
      ? sessions.items
      : Array.isArray(sessions?.result)
        ? sessions.result
        : []

  const selectedSession = pickBestSession(items)
  if (!selectedSession) throw makeAttendanceError('No attendance session exists for this lesson yet.')

  let summary = null
  try {
    summary = await attendanceRequest(
      `/api/instructors/${normalizedInstructorId}/sessions/${selectedSession.sessionId}/attendance/summary`,
      { headers: getAuthHeaders() }
    )
  } catch {
    summary = null
  }

  const closed = Boolean(firstDefined(summary?.closed, summary?.isClosed, false))
  const summaryCurrentRound = toNumberOrNull(firstDefined(summary?.activeRound, summary?.currentRound))
  const sessionRoundNo = toNumberOrNull(selectedSession?.roundNo) || 0
  const sessionRoundActive = Boolean(selectedSession?.isActive)
  const currentRound = summaryCurrentRound != null
    ? summaryCurrentRound
    : sessionRoundActive
      ? sessionRoundNo || 1
      : 0

  const summaryRound1Completed = toBooleanOrUndefined(firstDefined(summary?.round1Completed, summary?.firstRoundCompleted))
  const summaryRound2Completed = toBooleanOrUndefined(firstDefined(summary?.round2Completed, summary?.secondRoundCompleted))
  const round1Completed = summaryRound1Completed ?? (!sessionRoundActive && sessionRoundNo >= 1)
  const round2Completed = summaryRound2Completed ?? (!sessionRoundActive && sessionRoundNo >= 2)
  const canActivate = !closed && !sessionRoundActive && sessionRoundNo < 2

  return {
    valid: true,
    closed,
    canActivate,
    currentRound,
    round1Completed,
    round2Completed,
    registeredCount: Number(firstDefined(summary?.presentCount, summary?.registeredCount, summary?.markedCount, 0)) || 0,
    totalCount: Number(firstDefined(summary?.totalStudents, summary?.totalCount, summary?.enrolledCount, 0)) || 0,
    sessionId: selectedSession.sessionId,
    attendanceSessionId: selectedSession.attendanceSessionId,
    topic: selectedSession.topic || null,
    startTime: selectedSession.startTime || null,
    endTime: selectedSession.endTime || null,
  }
}

function normalizeLessonSummary(item) {
  if (!item || typeof item !== 'object') return null
  const lessonId = toNumberOrNull(firstDefined(item.lessonId, item.id))
  if (lessonId == null) return null

  return {
    lessonId,
    crn: firstDefined(item.crn, item.CRN, item.lessonCrn, ''),
    code: firstDefined(item.code, item.courseCode, item.lessonCode, ''),
    title: firstDefined(item.name, item.title, item.courseName, item.lessonName, ''),
    section: firstDefined(item.section, item.group, ''),
    instructorId: String(firstDefined(item.instructorId, item.instructor_id, item.instructorUserId, '') || ''),
    semester: firstDefined(item.semester, ''),
    academicYear: firstDefined(item.academicYear, item.academic_year, ''),
  }
}

/**
 * Load lessons for an instructor for QR attendance entry page.
 * Primary contract: GET /api/instructors/{instructorId}/lessons
 */
export async function getInstructorLessons({ instructorId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  if (!normalizedInstructorId) {
    throw makeAttendanceError('Instructor id (GUID) is required to load lessons.')
  }

  const headers = getAuthHeaders()
  const instructorPath = `/api/instructors/${encodeURIComponent(normalizedInstructorId)}/lessons`

  // Instructor-scoped endpoint should already return only this instructor's lessons.
  // Do not filter by instructorId field because some deployments omit it in each row.
  try {
    const data = await attendanceRequest(instructorPath, { headers })
    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.result)
          ? data.result
          : []
    return rows.map(normalizeLessonSummary).filter(Boolean)
  } catch (primaryError) {
    // Backward compatibility fallback for older gateways lacking instructor lessons endpoint.
    try {
      const adminData = await attendanceRequest('/api/admin/lessons', { headers })
      const adminRows = Array.isArray(adminData)
        ? adminData
        : Array.isArray(adminData?.items)
          ? adminData.items
          : Array.isArray(adminData?.result)
            ? adminData.result
            : []
      const normalized = adminRows.map(normalizeLessonSummary).filter(Boolean)
      return normalized.filter((x) => String(x.instructorId) === normalizedInstructorId)
    } catch {
      throw primaryError
    }
  }

  throw makeAttendanceError('Could not load instructor lessons.')
}

function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.result)) return data.result
  return []
}

function normalizeSessionSummary(item) {
  if (!item || typeof item !== 'object') return null
  const sessionId = toNumberOrNull(firstDefined(item.sessionId, item.id))
  if (sessionId == null) return null
  const roundNo = toNumberOrNull(firstDefined(item.roundNo, item.round, item.roundNumber))
  return {
    sessionId,
    startTime: firstDefined(item.startTime, item.start_time, item.startsAt, item.date, ''),
    endTime: firstDefined(item.endTime, item.end_time, item.endsAt, ''),
    topic: firstDefined(item.topic, item.name, ''),
    isActive: Boolean(firstDefined(item.isAttendanceActive, item.isActive, item.active, false)),
    roundNo: roundNo == null ? 0 : roundNo,
  }
}

export async function getLessonSessions({ instructorId, lessonId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedLessonId = toNumberOrNull(lessonId)
  if (!normalizedInstructorId || normalizedLessonId == null) {
    throw makeAttendanceError('Instructor id and lesson id are required to load sessions.')
  }
  const data = await attendanceRequest(
    `/api/instructors/${encodeURIComponent(normalizedInstructorId)}/lessons/${normalizedLessonId}/sessions`,
    { headers: getAuthHeaders() }
  )
  return unwrapList(data).map(normalizeSessionSummary).filter(Boolean)
}

export async function getSessionStateForSession({ instructorId, lessonId, sessionId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedLessonId = toNumberOrNull(lessonId)
  const normalizedSessionId = toNumberOrNull(sessionId)
  if (!normalizedInstructorId || normalizedLessonId == null || normalizedSessionId == null) {
    throw makeAttendanceError('Instructor id, lesson id, and session id are required.')
  }

  const sessions = await getLessonSessions({
    instructorId: normalizedInstructorId,
    lessonId: normalizedLessonId,
  })
  const selectedSession = sessions.find((s) => s.sessionId === normalizedSessionId)
  if (!selectedSession) throw makeAttendanceError('Selected session was not found for this lesson.')

  let summary = null
  try {
    summary = await attendanceRequest(
      `/api/instructors/${encodeURIComponent(normalizedInstructorId)}/sessions/${normalizedSessionId}/attendance/summary`,
      { headers: getAuthHeaders() }
    )
  } catch {
    summary = null
  }

  const closed = Boolean(firstDefined(summary?.closed, summary?.isClosed, false))
  const summaryCurrentRound = toNumberOrNull(firstDefined(summary?.activeRound, summary?.currentRound))
  const sessionRoundNo = toNumberOrNull(selectedSession?.roundNo) || 0
  const sessionRoundActive = Boolean(selectedSession?.isActive)
  const currentRound = summaryCurrentRound != null
    ? summaryCurrentRound
    : sessionRoundActive
      ? sessionRoundNo || 1
      : 0

  const summaryRound1Completed = toBooleanOrUndefined(firstDefined(summary?.round1Completed, summary?.firstRoundCompleted))
  const summaryRound2Completed = toBooleanOrUndefined(firstDefined(summary?.round2Completed, summary?.secondRoundCompleted))
  const round1Completed = summaryRound1Completed ?? (!sessionRoundActive && sessionRoundNo >= 1)
  const round2Completed = summaryRound2Completed ?? (!sessionRoundActive && sessionRoundNo >= 2)
  const canActivate = !closed && !sessionRoundActive && sessionRoundNo < 2

  return {
    valid: true,
    closed,
    canActivate,
    currentRound,
    round1Completed,
    round2Completed,
    registeredCount: Number(firstDefined(summary?.presentCount, summary?.registeredCount, summary?.markedCount, 0)) || 0,
    totalCount: Number(firstDefined(summary?.totalStudents, summary?.totalCount, summary?.enrolledCount, 0)) || 0,
    sessionId: selectedSession.sessionId,
    attendanceSessionId: selectedSession.sessionId,
    topic: selectedSession.topic || null,
    startTime: selectedSession.startTime || null,
    endTime: selectedSession.endTime || null,
  }
}

export async function createLessonSession({ instructorId, lessonId, startAt, endAt, topic }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedLessonId = toNumberOrNull(lessonId)
  if (!normalizedInstructorId || normalizedLessonId == null) {
    throw makeAttendanceError('Instructor id and lesson id are required to create a session.')
  }
  if (!startAt || !endAt) {
    throw makeAttendanceError('startAt and endAt are required to create a session.')
  }

  const payload = {
    startTime: startAt,
    endTime: endAt,
    ...(topic ? { topic } : {}),
  }

  const candidates = [
    `/api/instructors/${encodeURIComponent(normalizedInstructorId)}/lessons/${normalizedLessonId}/sessions`,
    `/api/admin/lessons/${normalizedLessonId}/sessions`,
  ]

  let lastError = null
  for (const path of candidates) {
    try {
      const data = await attendanceRequest(path, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      })
      const summary = normalizeSessionSummary(data?.result ?? data)
      return summary || { sessionId: toNumberOrNull(data?.id) ?? null, startTime: startAt, endTime: endAt, topic: topic || '' }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || makeAttendanceError('Could not create session.')
}

async function postAttendanceSessionFirstMatch(instructorId, sessionId, suffixPaths, body) {
  const iid = normalizeRouteUserId(instructorId)
  const sid = toNumberOrNull(sessionId)
  if (!iid || sid == null) {
    throw makeAttendanceError('Instructor id (GUID) and session id are required.')
  }
  const base = `/api/instructors/${encodeURIComponent(iid)}/sessions/${sid}`
  const paths = suffixPaths.map((s) => `${base}${s}`)
  const headers = getAuthHeaders(false)
  const init = { method: 'POST', headers }
  if (body != null) {
    headers.set('Content-Type', 'application/json')
    init.body = JSON.stringify(body)
  }
  return attendanceRequestCandidates(paths, init)
}

/**
 * Activate a numbered round (1 or 2). Tries /attendance/activate/{n} then legacy /attendance/activate.
 */
export async function activateAttendanceRound({ instructorId, sessionId, round }) {
  const n = round === 2 ? 2 : 1
  return postAttendanceSessionFirstMatch(instructorId, sessionId, [`/attendance/activate/${n}`, `/attendance/activate`])
}

/** @deprecated use activateAttendanceRound with explicit round */
export async function startRound({ instructorId, sessionId, round = 1 }) {
  return activateAttendanceRound({ instructorId, sessionId, round: round === 2 ? 2 : 1 })
}

/**
 * Deactivate a numbered round. Tries /attendance/deactivate/{n} then legacy /deactivate.
 */
export async function deactivateAttendanceRound({ instructorId, sessionId, round }) {
  const n = round === 2 ? 2 : 1
  return postAttendanceSessionFirstMatch(instructorId, sessionId, [`/attendance/deactivate/${n}`, `/attendance/deactivate`])
}

/** @deprecated use deactivateAttendanceRound with explicit round */
export async function endRound({ instructorId, sessionId, round = 1 }) {
  return deactivateAttendanceRound({ instructorId, sessionId, round: round === 2 ? 2 : 1 })
}

/**
 * Finalize session attendance (after both rounds are fully deactivated per product flow).
 * POST /api/instructors/.../sessions/.../attendance/finalize
 */
export async function finalizeSessionAttendance({ instructorId, sessionId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedSessionId = toNumberOrNull(sessionId)
  if (normalizedInstructorId == null || normalizedSessionId == null) {
    throw makeAttendanceError('Instructor id (GUID) and session id are required to finalize attendance.')
  }
  return postAttendanceSessionFirstMatch(instructorId, sessionId, ['/attendance/finalize'])
}

/**
 * Fetch the current server-issued QR token for the active attendance session.
 * QR value should be the **raw JWT** (session/round context is inside the token).
 */
export async function getQRPayload({ instructorId, sessionId, roundCount }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedSessionId = toNumberOrNull(sessionId)
  if (normalizedInstructorId == null || normalizedSessionId == null) {
    throw makeAttendanceError('Instructor id (GUID) and session id are required to generate the QR token.')
  }

  const data = await attendanceRequest(
    `/api/instructors/${normalizedInstructorId}/sessions/${normalizedSessionId}/qr-token`,
    { method: 'POST', headers: getAuthHeaders() }
  )

  const token = String(firstDefined(data?.token, data?.payload, data?.qrToken, data?.value, data) || '').trim()
  if (!token) throw makeAttendanceError('Attendance backend returned an empty QR token.')

  const resolvedRoundCount = Number.isFinite(Number(roundCount))
    ? Number(roundCount)
    : toNumberOrNull(firstDefined(data?.activationId, data?.roundCount))

  return {
    /** Raw JWT string to encode in the QR (preferred). */
    payload: token,
    /** @deprecated use `payload` (now raw JWT) */
    legacyJsonPayload: buildLegacyQrJsonPayload({
      token,
      sessionId: normalizedSessionId,
      roundCount: resolvedRoundCount,
      instructorId: normalizedInstructorId,
    }),
    token,
    expiresAt: firstDefined(data?.expiresAt, data?.expires_at, null),
    activationId: toNumberOrNull(firstDefined(data?.activationId, data?.roundCount)),
    data,
  }
}

function extractServerErrorCode(data) {
  if (!data || typeof data !== 'object') return null
  return (
    data.errorCode || data.ErrorCode || data.error_code || data.code || data.Code || data.detail?.errorCode || null
  )
}

/**
 * Student check-in: POST /api/students/{studentId}/attendance/scan
 * Tries /attendance/scan first, then legacy /attendance/qr/scan on 404.
 * Body: { token, studentId? , deviceInfo? } — token should be `jwt|studentGuid` when possible.
 */
export async function scanAttendanceQrCode({ studentId, scannedToken }) {
  const resolvedStudentId = resolveAuthenticatedStudentId(studentId)
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw makeAttendanceError('You are not signed in. Please log in and try again.', {
      code: 'ACCESS_TOKEN_MISSING',
      status: 401,
    })
  }

  const token = buildScanTokenForRequest(scannedToken, resolvedStudentId)
  const bodyObj = {
    token,
    studentId: resolvedStudentId,
    deviceInfo:
      typeof navigator !== 'undefined' ? `Web ${navigator.userAgent || 'browser'}` : 'Web FrontWeb',
  }
  const body = JSON.stringify(bodyObj)

  const enc = encodeURIComponent(resolvedStudentId)
  const relPaths = [
    `/api/students/${enc}/attendance/scan`,
    `/api/students/${enc}/attendance/qr/scan`,
  ]

  const baseRoot = baseWithoutAttendanceSuffix()
  const basePairs = [ATTENDANCE_API_BASE, baseRoot].filter((b, i, a) => a.indexOf(b) === i)

  let lastErr
  for (const base of basePairs) {
    for (const path of relPaths) {
      const url = `${String(base).replace(/\/$/, '')}${path}`
      const response = await authFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      const payload = await parseJsonSafe(response)
      const data = readEnvelope(payload)

      if (!response.ok) {
        const errCode = extractServerErrorCode(payload) || extractServerErrorCode(data)
        let message = normalizeApiMessage(data ?? payload, `Attendance scan failed (${response.status}).`)
        if (errCode) message = `${message}${String(message).includes(String(errCode)) ? '' : ` (${errCode})`}`
        if (response.status === 404) {
          lastErr = makeAttendanceError(message, { code: errCode, status: 404, body: payload })
          continue
        }
        throw makeAttendanceError(message, {
          code:
            errCode ||
            (response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : 'ATTENDANCE_SCAN_FAILED'),
          status: response.status,
          body: payload,
        })
      }

      return {
        success: true,
        message: normalizeApiMessage(data, 'Attendance marked successfully.'),
        status: data?.status ?? data?.attendanceStatus ?? null,
        round: data?.round ?? data?.roundNumber ?? data?.activationId ?? null,
        validScanCount: data?.validScanCount ?? data?.scansCompleted ?? null,
        errorCode: data?.errorCode ?? null,
        attendanceId: data?.attendanceId ?? data?.id ?? null,
        recordedAt: data?.scannedAt ?? data?.recordedAt ?? data?.createdAt ?? null,
        data,
      }
    }
  }
  throw lastErr || makeAttendanceError('Could not reach attendance scan endpoint.', { code: 'SCAN_ENDPOINT_UNREACHABLE' })
}

export function getStaticSessionState() {
  return {
    valid: true,
    closed: false,
    canActivate: true,
    currentRound: 0,
    round1Completed: false,
    round2Completed: false,
    registeredCount: 0,
    totalCount: 45,
    sessionId: 1,
    attendanceSessionId: 1,
    topic: 'Demo attendance session',
    startTime: null,
    endTime: null,
  }
}

function normalizeAttendanceStatusToUi(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'present') return 'present'
  if (raw === 'late') return 'late'
  if (raw === 'absent') return 'absent'
  if (raw === 'excused') return 'excused'
  return raw || 'absent'
}

function normalizeUiStatusToApi(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'present') return 'Present'
  if (raw === 'late') return 'Late'
  if (raw === 'absent') return 'Absent'
  if (raw === 'excused') return 'Excused'
  return 'Absent'
}

/**
 * Instructor roster for a session.
 * GET /api/instructors/{instructorId}/sessions/{sessionId}/attendance
 */
export async function getSessionAttendance({ instructorId, sessionId }) {
  const normalizedInstructorId = String(instructorId ?? '').trim()
  const normalizedSessionId = toNumberOrNull(sessionId)
  if (!normalizedInstructorId || normalizedSessionId == null) {
    throw makeAttendanceError('Instructor id (GUID) and session id are required.')
  }
  const data = await attendanceRequest(
    `/api/instructors/${encodeURIComponent(normalizedInstructorId)}/sessions/${normalizedSessionId}/attendance`,
    { headers: getAuthHeaders() }
  )
  const rows = unwrapList(data)
  return rows
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const studentId = String(firstDefined(item.studentId, item.student_id, '') || '').trim()
      if (!studentId) return null
      return {
        id: item.id ?? item.attendanceId ?? `${normalizedSessionId}:${studentId}`,
        attendanceId: toNumberOrNull(firstDefined(item.id, item.attendanceId, item.attendance_id)),
        sessionId: normalizedSessionId,
        lessonId: toNumberOrNull(firstDefined(item.lessonId, item.lesson_id)),
        studentId,
        name: firstDefined(item.studentFullName, item.studentName, item.fullName, item.name, ''),
        studentCode: firstDefined(item.studentCode, item.code, item.studentNumber, ''),
        status: normalizeAttendanceStatusToUi(firstDefined(item.status, item.attendanceStatus, 'absent')),
        firstScanAt: firstDefined(item.firstScanAt, item.first_scan_at, null),
        lastScanAt: firstDefined(item.lastScanAt, item.last_scan_at, null),
        isManuallyAdjusted: Boolean(firstDefined(item.isManuallyAdjusted, item.manuallyAdjusted, false)),
        instructorNote: firstDefined(item.instructorNote, item.note, null),
        raw: item,
      }
    })
    .filter(Boolean)
}

/**
 * Instructor updates a single student's attendance status for a session.
 * PATCH /api/instructors/{instructorId}/sessions/{sessionId}/attendance/{studentId}
 */
export async function patchSessionAttendance({ instructorId, sessionId, studentId, status, instructorNote }) {
  const normalizedInstructorId = String(instructorId ?? '').trim()
  const normalizedSessionId = toNumberOrNull(sessionId)
  const normalizedStudentId = String(studentId ?? '').trim()
  if (!normalizedInstructorId || normalizedSessionId == null || !normalizedStudentId) {
    throw makeAttendanceError('Instructor id, session id, and student id are required.')
  }
  const payload = {
    status: normalizeUiStatusToApi(status),
    ...(instructorNote != null ? { instructorNote: String(instructorNote) } : {}),
  }
  const data = await attendanceRequest(
    `/api/instructors/${encodeURIComponent(normalizedInstructorId)}/sessions/${normalizedSessionId}/attendance/${encodeURIComponent(normalizedStudentId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    }
  )
  return data
}

/**
 * Student per-session attendance rows for a lesson.
 * GET /api/students/{studentId}/lessons/{lessonId}/attendance
 */
export async function getStudentLessonAttendance({ studentId, lessonId }) {
  const resolvedStudentId = String(studentId ?? '').trim()
  const normalizedLessonId = toNumberOrNull(lessonId)
  if (!resolvedStudentId || normalizedLessonId == null) {
    throw makeAttendanceError('Student id (GUID) and lesson id are required.')
  }
  const data = await attendanceRequest(
    `/api/students/${encodeURIComponent(resolvedStudentId)}/lessons/${normalizedLessonId}/attendance`,
    { headers: getAuthHeaders() }
  )
  const rows = unwrapList(data)
  return rows
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const sessionId = toNumberOrNull(firstDefined(item.sessionId, item.session_id))
      if (sessionId == null) return null
      return {
        attendanceId: toNumberOrNull(firstDefined(item.attendanceId, item.id)),
        sessionId,
        sessionStartTime: firstDefined(item.sessionStartTime, item.session_start_time, item.startTime, null),
        sessionEndTime: firstDefined(item.sessionEndTime, item.session_end_time, item.endTime, null),
        lessonName: firstDefined(item.lessonName, item.lesson, null),
        lessonCode: firstDefined(item.lessonCode, item.code, null),
        status: normalizeAttendanceStatusToUi(firstDefined(item.status, item.attendanceStatus, 'absent')),
        firstScanAt: firstDefined(item.firstScanAt, item.first_scan_at, null),
        lastScanAt: firstDefined(item.lastScanAt, item.last_scan_at, null),
        isManuallyAdjusted: Boolean(firstDefined(item.isManuallyAdjusted, item.manuallyAdjusted, false)),
        instructorNote: firstDefined(item.instructorNote, item.note, null),
        raw: item,
      }
    })
    .filter(Boolean)
}

/**
 * Admin: list enrolled students for a lesson.
 * GET /api/admin/lessons/{lessonId}/enrollments
 */
export async function getLessonEnrollmentsAdmin({ lessonId }) {
  const normalizedLessonId = toNumberOrNull(lessonId)
  if (normalizedLessonId == null) {
    throw makeAttendanceError('lessonId is required.')
  }
  const data = await attendanceRequestCandidates(
    [`/api/admin/lessons/${normalizedLessonId}/enrollments`],
    { method: 'GET', headers: getAuthHeaders() }
  )
  const rows = unwrapList(data)
  return rows
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const studentId = String(firstDefined(item.studentId, item.userId, item.id, '') || '').trim()
      if (!studentId) return null
      return {
        studentId,
        name: firstDefined(item.studentFullName, item.fullName, item.name, ''),
        email: firstDefined(item.email, item.studentEmail, ''),
        studentCode: firstDefined(item.studentCode, item.code, item.studentNumber, ''),
        raw: item,
      }
    })
    .filter(Boolean)
}
