import { authFetch } from '../auth/authClient'
import { ADMIN_API_BASE } from './adminConfig'

const COURSES_URL = `${ADMIN_API_BASE}/courses`

export async function fetchCourses() {
  const res = await authFetch(COURSES_URL, { method: 'GET' })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Failed to load courses (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  const raw = data?.result !== undefined ? data.result : data
  return Array.isArray(raw) ? raw : []
}

/**
 * @param {object} body
 * @param {string} body.name
 * @param {string} body.department
 * @param {string} body.code
 * @param {number} body.credits
 * @param {number} body.timesPerWeek
 */
export async function createCourse(body) {
  const res = await authFetch(COURSES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Create course failed (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  return unwrapEnvelope(data)
}

/**
 * @param {number|string} courseId
 * @returns {Promise<object>} CourseDto
 */
export async function fetchCourse(courseId) {
  const res = await authFetch(`${COURSES_URL}/${courseId}`, { method: 'GET' })
  const data = await parseJson(res)
  if (res.status === 404) {
    const err = new Error(data?.message || 'Course not found.')
    err.status = 404
    throw err
  }
  if (!res.ok) {
    const err = new Error(data?.message || `Failed to load course (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  return unwrapEnvelope(data)
}

/**
 * @param {number|string} courseId
 * @param {object} body UpdateCourseDto — same fields as CreateCourseDto
 */
export async function updateCourse(courseId, body) {
  const res = await authFetch(`${COURSES_URL}/${courseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Update course failed (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  return unwrapEnvelope(data)
}

/**
 * Lessons for one course (summary list; typically without nested sessions).
 * @param {number|string} courseId
 * @returns {Promise<object[]>}
 */
export async function fetchLessonsByCourseId(courseId) {
  const res = await authFetch(`${COURSES_URL}/${courseId}/lessons`, { method: 'GET' })
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
