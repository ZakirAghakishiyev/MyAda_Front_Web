import { SCHEDULING_API_BASE, SCHEDULING_DEV_USER_ID_HEADER } from './schedulingConfig'
import { getSchedulingUserId } from '../utils/schedulingUserId'

async function parseJson(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

function detailMessage(data, res) {
  const d = data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    return d
      .map((x) => (typeof x === 'object' && x?.msg ? x.msg : String(x)))
      .join(' ')
  }
  return `Request failed (${res.status})`
}

function parseSchedulingUserId() {
  const raw = getSchedulingUserId()
  if (raw === '' || raw == null) return null
  const n = Number.parseInt(String(raw), 10)
  return Number.isFinite(n) ? n : null
}

function headersJsonWithUser() {
  const h = { 'Content-Type': 'application/json' }
  const userId = parseSchedulingUserId()
  if (userId != null) h[SCHEDULING_DEV_USER_ID_HEADER] = String(userId)
  return h
}

function headersUserOnly() {
  const h = {}
  const userId = parseSchedulingUserId()
  if (userId != null) h[SCHEDULING_DEV_USER_ID_HEADER] = String(userId)
  return h
}

function assertSchedulingUserIdHeader() {
  if (parseSchedulingUserId() != null) return
  const err = new Error(`Set a valid integer user id for ${SCHEDULING_DEV_USER_ID_HEADER}.`)
  err.status = 400
  throw err
}

/** POST /schedules/generate — no X-User-Id required */
export async function schedulingGenerate(body) {
  const res = await fetch(`${SCHEDULING_API_BASE}/schedules/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export async function schedulingGetRun(scheduleRunId) {
  const res = await fetch(`${SCHEDULING_API_BASE}/schedules/${scheduleRunId}`)
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return data
}

export async function schedulingGetSessions(scheduleRunId, query = {}) {
  const q = new URLSearchParams()
  if (query.day) q.set('day', query.day)
  if (query.instructor_user_id != null) q.set('instructor_user_id', String(query.instructor_user_id))
  const qs = q.toString()
  const url = `${SCHEDULING_API_BASE}/schedules/${scheduleRunId}/sessions${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return Array.isArray(data) ? data : []
}

export async function schedulingGetUnscheduled(scheduleRunId) {
  const res = await fetch(`${SCHEDULING_API_BASE}/schedules/${scheduleRunId}/unscheduled`)
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return Array.isArray(data) ? data : []
}

export async function schedulingPatchSession(scheduleRunId, sessionId, body) {
  assertSchedulingUserIdHeader()
  const res = await fetch(`${SCHEDULING_API_BASE}/schedules/${scheduleRunId}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: headersJsonWithUser(),
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return data
}

export async function schedulingGetSessionOptions(scheduleRunId, sessionId) {
  const res = await fetch(
    `${SCHEDULING_API_BASE}/schedules/${scheduleRunId}/sessions/${sessionId}/options`,
    { headers: headersUserOnly() }
  )
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return data?.options ?? []
}

/**
 * POST /schedules/{schedule_run_id}/publish — requires X-User-Id.
 * Body (snake_case): from_date, to_date (ISO dates); optional topic for Attendance session generation.
 *
 * @param {number|string} scheduleRunId
 * @param {{ from_date: string, to_date: string, topic?: string | null }} body
 */
export async function schedulingPublish(scheduleRunId, body) {
  assertSchedulingUserIdHeader()
  const payload = {
    from_date: body.from_date,
    to_date: body.to_date,
  }
  if (body.topic != null && String(body.topic).trim() !== '') {
    payload.topic = String(body.topic).trim()
  }
  const res = await fetch(`${SCHEDULING_API_BASE}/schedules/${scheduleRunId}/publish`, {
    method: 'POST',
    headers: headersJsonWithUser(),
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return data
}

export async function preferencesGet(academicYear, semester) {
  assertSchedulingUserIdHeader()
  const q = new URLSearchParams({
    academic_year: String(academicYear),
    semester: String(semester),
  })
  const res = await fetch(`${SCHEDULING_API_BASE}/instructors/me/preferences?${q}`, {
    headers: headersUserOnly(),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return data
}

export async function preferencesPut(body) {
  assertSchedulingUserIdHeader()
  const res = await fetch(`${SCHEDULING_API_BASE}/instructors/me/preferences`, {
    method: 'PUT',
    headers: headersJsonWithUser(),
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(detailMessage(data, res))
    err.status = res.status
    throw err
  }
  return data
}
