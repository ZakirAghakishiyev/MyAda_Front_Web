import { getAccessToken } from '../auth'

const ATTENDANCE_API_BASE =
  import.meta.env.VITE_ATTENDANCE_API_BASE?.replace(/\/$/, '') || 'http://13.60.31.141:5008'

const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{6,512}$/

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

function toNumberOrNull(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

  return {
    sessionId,
    lessonId: toNumberOrNull(firstDefined(item.lessonId, item.lesson_id)),
    attendanceSessionId: toNumberOrNull(firstDefined(item.attendanceSessionId, item.attendance_session_id, item.id)),
    startTime: firstDefined(item.startTime, item.start_time, item.startsAt, item.date),
    endTime: firstDefined(item.endTime, item.end_time, item.endsAt),
    topic: firstDefined(item.topic, item.name),
    status: String(firstDefined(item.status, item.sessionStatus, '') || '').toLowerCase(),
    isActive: Boolean(firstDefined(item.isActive, item.active)),
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

export function validateAttendanceQrToken(rawValue) {
  const parsed = parseAttendanceQrPayload(rawValue)
  const token = String(parsed?.token || '').trim()
  if (!token) {
    throw makeAttendanceError('QR code is empty. Please scan a valid attendance QR code.', {
      code: 'INVALID_QR_EMPTY',
      status: 400,
    })
  }
  if (
    token.includes('\n') ||
    token.includes('\r') ||
    token.includes(' ') ||
    /^https?:\/\//i.test(token)
  ) {
    throw makeAttendanceError('QR code format is invalid. Expected a plain attendance token only.', {
      code: 'INVALID_QR_FORMAT',
      status: 400,
    })
  }
  if (!TOKEN_PATTERN.test(token)) {
    throw makeAttendanceError('QR code token is malformed. Please scan the current attendance QR code.', {
      code: 'INVALID_QR_MALFORMED',
      status: 400,
    })
  }
  return token
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
  const sessionId = toNumberOrNull(firstDefined(parsed?.sessionId, parsed?.session_id))
  const roundCount = toNumberOrNull(firstDefined(parsed?.roundCount, parsed?.activationId, parsed?.round_count))
  const instructorId = String(firstDefined(parsed?.instructorId, parsed?.instructor_id, '') || '').trim()

  return {
    token,
    qrContext: {
      sessionId,
      roundCount,
      instructorId: instructorId || null,
    },
    rawValue: value,
  }
}

function buildAttendanceQrPayload({ token, sessionId, roundCount, instructorId }) {
  return JSON.stringify({
    token,
    sessionId: sessionId == null ? null : String(sessionId),
    roundCount: Number.isFinite(Number(roundCount)) ? Number(roundCount) : null,
    instructorId: String(instructorId ?? '').trim() || null,
  })
}

/**
 * Builds the exact request body expected by the attendance QR scan endpoint.
 *
 * @param {string} token
 * @returns {AttendanceQrScanRequest}
 */
export function buildAttendanceQrScanRequest(token) {
  return { token: validateAttendanceQrToken(token) }
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

  return {
    valid: true,
    closed: Boolean(firstDefined(summary?.closed, summary?.isClosed, false)),
    canActivate: !Boolean(firstDefined(summary?.closed, summary?.isClosed, false)),
    currentRound: Number(firstDefined(summary?.activeRound, summary?.currentRound, 0)) || 0,
    round1Completed: Boolean(firstDefined(summary?.round1Completed, summary?.firstRoundCompleted, false)),
    round2Completed: Boolean(firstDefined(summary?.round2Completed, summary?.secondRoundCompleted, false)),
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
 * Tries instructor-scoped endpoint first; falls back to admin lesson list filtered by instructor id.
 */
export async function getInstructorLessons({ instructorId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  if (!normalizedInstructorId) {
    throw makeAttendanceError('Instructor id (GUID) is required to load lessons.')
  }

  const headers = getAuthHeaders()
  const candidates = [
    `/api/instructors/${encodeURIComponent(normalizedInstructorId)}/lessons`,
    '/api/admin/lessons',
  ]

  let lastError = null
  for (const path of candidates) {
    try {
      const data = await attendanceRequest(path, { headers })
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.result)
            ? data.result
            : []
      const normalized = rows.map(normalizeLessonSummary).filter(Boolean)
      return normalized.filter((x) => String(x.instructorId) === normalizedInstructorId)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || makeAttendanceError('Could not load instructor lessons.')
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
  return {
    sessionId,
    startTime: firstDefined(item.startTime, item.start_time, item.startsAt, item.date, ''),
    endTime: firstDefined(item.endTime, item.end_time, item.endsAt, ''),
    topic: firstDefined(item.topic, item.name, ''),
    isActive: Boolean(firstDefined(item.isAttendanceActive, item.isActive, item.active, false)),
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

  return {
    valid: true,
    closed: Boolean(firstDefined(summary?.closed, summary?.isClosed, false)),
    canActivate: !Boolean(firstDefined(summary?.closed, summary?.isClosed, false)),
    currentRound: Number(firstDefined(summary?.activeRound, summary?.currentRound, 0)) || 0,
    round1Completed: Boolean(firstDefined(summary?.round1Completed, summary?.firstRoundCompleted, false)),
    round2Completed: Boolean(firstDefined(summary?.round2Completed, summary?.secondRoundCompleted, false)),
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

/**
 * Activate attendance for the current session.
 */
export async function startRound({ instructorId, sessionId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedSessionId = toNumberOrNull(sessionId)
  if (normalizedInstructorId == null || normalizedSessionId == null) {
    throw makeAttendanceError('Instructor id (GUID) and session id are required to start attendance.')
  }
  return attendanceRequest(
    `/api/instructors/${normalizedInstructorId}/sessions/${normalizedSessionId}/attendance/activate`,
    { method: 'POST', headers: getAuthHeaders() }
  )
}

export async function endRound({ instructorId, sessionId }) {
  const normalizedInstructorId = normalizeRouteUserId(instructorId)
  const normalizedSessionId = toNumberOrNull(sessionId)
  if (normalizedInstructorId == null || normalizedSessionId == null) {
    throw makeAttendanceError('Instructor id (GUID) and session id are required to stop attendance.')
  }
  return attendanceRequest(
    `/api/instructors/${normalizedInstructorId}/sessions/${normalizedSessionId}/attendance/deactivate`,
    { method: 'POST', headers: getAuthHeaders() }
  )
}

/**
 * Fetch the current server-issued QR token for the active attendance session.
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
    payload: buildAttendanceQrPayload({
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

export async function scanAttendanceQrCode({ studentId, scannedToken }) {
  const resolvedStudentId = resolveAuthenticatedStudentId(studentId)
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw makeAttendanceError('You are not signed in. Please log in and try again.', {
      code: 'ACCESS_TOKEN_MISSING',
      status: 401,
    })
  }

  const parsedScan = parseAttendanceQrPayload(scannedToken)
  const requestBody = buildAttendanceQrScanRequest(parsedScan.token)
  const qrContext =
    parsedScan.qrContext &&
    Object.values(parsedScan.qrContext).some((value) => value !== null && value !== undefined && value !== '')
      ? parsedScan.qrContext
      : null
  const endpoint = `${ATTENDANCE_API_BASE}/api/students/${encodeURIComponent(resolvedStudentId)}/attendance/qr/scan`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      studentId: resolvedStudentId,
      ...requestBody,
      ...(qrContext ? { qrContext } : {}),
      deviceInfo:
        typeof navigator !== 'undefined'
          ? navigator.userAgent
          : 'FrontWeb attendance client',
    }),
  })

  const payload = await parseJsonSafe(response)
  const data = readEnvelope(payload)
  if (!response.ok) {
    let message = normalizeApiMessage(payload, `Attendance scan failed (${response.status}).`)
    let code = 'ATTENDANCE_SCAN_FAILED'
    if (response.status === 400) {
      message = normalizeApiMessage(payload, 'Invalid or expired QR code.')
      code = 'ATTENDANCE_QR_INVALID'
    } else if (response.status === 401 || response.status === 403) {
      message = normalizeApiMessage(payload, 'Unauthorized request or wrong student for this QR code.')
      code = 'ATTENDANCE_QR_UNAUTHORIZED'
    }
    throw makeAttendanceError(message, {
      code,
      status: response.status,
      body: payload,
      details: Array.isArray(payload?.errors) ? payload.errors : undefined,
    })
  }

  return {
    success: true,
    message: normalizeApiMessage(data, 'Attendance marked successfully.'),
    attendanceId: data?.attendanceId ?? data?.id ?? null,
    recordedAt: data?.recordedAt ?? data?.createdAt ?? null,
    data,
  }
}
