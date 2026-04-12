import { authFetch } from '../auth/authClient'
import { ADMIN_API_BASE } from './adminConfig'

const LESSONS_BASE = `${ADMIN_API_BASE}/lessons`

export async function fetchLessons() {
  const res = await authFetch(LESSONS_BASE, { method: 'GET' })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Failed to load lessons (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  const raw = data?.result !== undefined ? data.result : data
  return Array.isArray(raw) ? raw : []
}

/**
 * Creates a lesson for an existing course. Do not send `crn` — the server generates it.
 *
 * @param {object} payload
 * @param {number} payload.courseId
 * @param {number} payload.instructorId
 * @param {number} payload.roomId use 0 when unassigned until scheduling
 * @param {number} payload.academicYear e.g. 2026
 * @param {'Fall'|'Spring'|'Summer'} payload.semester AcademicSemester JSON string
 * @param {number} payload.maxCapacity
 */
export async function createLesson(payload) {
  const res = await authFetch(LESSONS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Create lesson failed (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  return unwrapEnvelope(data)
}

async function parseJson(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

function unwrapEnvelope(data) {
  if (data && data.result !== undefined) return data.result
  return data
}
