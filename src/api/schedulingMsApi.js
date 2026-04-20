import { SCHEDULING_API_BASE, SCHEDULING_DEV_USER_ID_HEADER } from './schedulingConfig'
import { getEffectiveSchedulingInstructorId } from '../utils/schedulingInstructorId'

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
      .map((x) => {
        if (typeof x !== 'object' || !x) return String(x)
        const loc = Array.isArray(x.loc) ? x.loc.filter(Boolean).join('.') : ''
        const msg = x.msg != null ? String(x.msg) : ''
        return loc ? `${loc}: ${msg}` : msg || JSON.stringify(x)
      })
      .filter(Boolean)
      .join(' ')
  }
  if (d && typeof d === 'object') {
    if (data?.message) return String(data.message)
    try {
      return JSON.stringify(d)
    } catch {
      return `Request failed (${res.status})`
    }
  }
  if (data?.message) return String(data.message)
  return `Request failed (${res.status})`
}

function headersJsonWithUser() {
  const h = { 'Content-Type': 'application/json' }
  const userId = getEffectiveSchedulingInstructorId()
  if (userId != null) h[SCHEDULING_DEV_USER_ID_HEADER] = String(userId)
  return h
}

function headersUserOnly() {
  const h = {}
  const userId = getEffectiveSchedulingInstructorId()
  if (userId != null) h[SCHEDULING_DEV_USER_ID_HEADER] = String(userId)
  return h
}

function assertSchedulingUserIdHeader() {
  if (getEffectiveSchedulingInstructorId() != null) return
  const err = new Error(
    `Sign in as an instructor (JWT with a valid ${SCHEDULING_DEV_USER_ID_HEADER}), or set Instructor user ID on the Scheduling page — UUID or numeric string per API.`
  )
  err.status = 400
  throw err
}

/**
 * Build body for POST /schedules/generate.
 * OpenAPI `ScheduleGenerateRequest` uses **strings** for both fields (minLength 1, maxLength 32).
 */
export function normalizeScheduleGenerateBody(input) {
  const rawYear = input?.academic_year ?? input?.academicYear
  const academic_year = String(
    rawYear != null && typeof rawYear === 'number' && Number.isFinite(rawYear)
      ? Math.trunc(rawYear)
      : String(rawYear ?? '').trim()
  )
  if (!academic_year) {
    const err = new Error('academic_year is required (e.g. 2026).')
    err.status = 400
    throw err
  }
  const semester = String(input?.semester ?? '').trim()
  if (!semester) {
    const err = new Error('semester is required (e.g. Fall, Spring).')
    err.status = 400
    throw err
  }
  return { academic_year, semester }
}

/** POST /schedules/generate — no X-User-Id required */
export async function schedulingGenerate(body) {
  const payload = normalizeScheduleGenerateBody(body)
  const res = await fetch(`${SCHEDULING_API_BASE}/schedules/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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

/** GET /instructors/preferences?academic_year=&semester= — requires X-User-Id */
export async function preferencesGet(academicYear, semester) {
  assertSchedulingUserIdHeader()
  const q = new URLSearchParams({
    academic_year: String(academicYear),
    semester: String(semester),
  })
  const res = await fetch(`${SCHEDULING_API_BASE}/instructors/preferences?${q}`, {
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

/** PUT /instructors/preferences — creates or replaces profile for (academic_year, semester) */
export async function preferencesPut(body) {
  assertSchedulingUserIdHeader()
  const res = await fetch(`${SCHEDULING_API_BASE}/instructors/preferences`, {
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

/** POST /instructors/preferences — same upsert as PUT (OpenAPI post_instructor_preferences) */
export async function preferencesPost(body) {
  assertSchedulingUserIdHeader()
  const res = await fetch(`${SCHEDULING_API_BASE}/instructors/preferences`, {
    method: 'POST',
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
