import { authFetch } from '../auth/authClient'
import { ADMIN_API_BASE } from './adminConfig'

const USERS_BASE = `${ADMIN_API_BASE}/users`

function unwrapEnvelope(data) {
  if (data && typeof data === 'object' && data.result !== undefined) return data.result
  return data
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

function normalizeInstructorName(row, fallbackId) {
  if (!row || typeof row !== 'object') return String(fallbackId || '').trim() || 'Instructor'
  const direct =
    row.fullName ??
    row.full_name ??
    row.displayName ??
    row.display_name ??
    row.name ??
    row.userName ??
    row.username ??
    row.email
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const first = String(row.firstName ?? row.first_name ?? '').trim()
  const last = String(row.lastName ?? row.last_name ?? '').trim()
  if (first && last) return `${last}, ${first}`
  if (first) return first
  if (last) return last

  return String(fallbackId || '').trim() || 'Instructor'
}

function normalizeInstructorId(row) {
  if (!row || typeof row !== 'object') return null
  const id =
    row.id ??
    row.userId ??
    row.user_id ??
    row.userGuid ??
    row.user_guid ??
    row.guid ??
    row.instructorId ??
    row.instructor_id
  const s = String(id ?? '').trim()
  return s || null
}

/**
 * Fetch synced users by role from Attendance service (Admin API).
 * Doc: GET /attendance/api/admin/users/roles/{role}
 *
 * @param {string} role e.g. "Instructor"
 * @returns {Promise<Array<{id: string, fullName: string, raw: any}>>}
 */
export async function fetchUsersByRole(role) {
  const encodedRole = encodeURIComponent(String(role || '').trim() || 'Instructor')
  const res = await authFetch(`${USERS_BASE}/roles/${encodedRole}`, { method: 'GET' })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Failed to load users (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  const raw = unwrapEnvelope(data)
  const list = Array.isArray(raw) ? raw : []

  return list
    .map((row) => {
      const id = normalizeInstructorId(row)
      if (!id) return null
      return { id, fullName: normalizeInstructorName(row, id), raw: row }
    })
    .filter(Boolean)
}

export function indexById(instructors = []) {
  const map = new Map()
  for (const row of instructors) {
    if (!row?.id) continue
    map.set(String(row.id), row)
  }
  return map
}

