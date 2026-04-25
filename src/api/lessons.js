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
 * @param {string} payload.instructorId instructor GUID
 * @param {number} payload.roomId positive room id (CreateLessonDto.roomId)
 * @param {number} payload.academicYear e.g. 2026
 * @param {'Fall'|'Spring'|'Summer'} payload.semester AcademicSemester JSON string
 * @param {number} payload.maxCapacity
 */
export async function createLesson(payload) {
  const maxCapacity = payload.maxCapacity ?? payload.capacity
  const normalizedPayload = {
    courseId: payload.courseId,
    instructorId: payload.instructorId,
    academicYear: payload.academicYear,
    semester: payload.semester,
    maxCapacity,
    ...(payload.roomId != null && Number(payload.roomId) > 0 ? { roomId: Number(payload.roomId) } : {}),
  }

  const res = await authFetch(LESSONS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPayload),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const detail =
      data?.title ||
      data?.message ||
      flattenValidationErrors(data?.errors) ||
      flattenValidationDetail(data?.detail) ||
      `Create lesson failed (${res.status})`
    const err = new Error(detail)
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

function flattenValidationErrors(errors) {
  if (!errors || typeof errors !== 'object') return ''
  const all = Object.values(errors)
    .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  return all.join(' ')
}

function flattenValidationDetail(detail) {
  if (typeof detail === 'string') return detail
  if (!Array.isArray(detail)) return ''
  return detail
    .map((d) => {
      if (typeof d === 'string') return d
      if (d && typeof d === 'object' && d.msg) return String(d.msg)
      return ''
    })
    .filter(Boolean)
    .join(' ')
}
