import { SCHEDULING_API_BASE } from './schedulingConfig'
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

function headersJsonWithUser() {
  const h = { 'Content-Type': 'application/json' }
  const raw = getSchedulingUserId()
  if (raw !== '' && raw != null) {
    const n = Number.parseInt(String(raw), 10)
    if (Number.isFinite(n)) h['X-User-Id'] = String(n)
  }
  return h
}

function headersUserOnly() {
  const h = {}
  const raw = getSchedulingUserId()
  if (raw !== '' && raw != null) {
    const n = Number.parseInt(String(raw), 10)
    if (Number.isFinite(n)) h['X-User-Id'] = String(n)
  }
  return h
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

export async function schedulingPublish(scheduleRunId) {
  const res = await fetch(`${SCHEDULING_API_BASE}/schedules/${scheduleRunId}/publish`, {
    method: 'POST',
    headers: headersJsonWithUser(),
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
