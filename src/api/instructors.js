import { AUTH_API_BASE, authFetch } from '../auth'

const AUTH_USERS_BY_ROLE_BASE = `${AUTH_API_BASE}/auth/api/auth/users-by-role`

function unwrapEnvelope(data) {
  if (data && typeof data === 'object' && data.result !== undefined) return data.result
  return data
}

function unwrapUsersByRoleResponse(data) {
  const unwrapped = unwrapEnvelope(data)
  if (unwrapped && typeof unwrapped === 'object') {
    if (Array.isArray(unwrapped.users)) return unwrapped.users
    if (Array.isArray(unwrapped.result?.users)) return unwrapped.result.users
    if (Array.isArray(unwrapped.data?.users)) return unwrapped.data.users
  }
  return Array.isArray(unwrapped) ? unwrapped : []
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
  const first = String(row.firstName ?? row.first_name ?? '').trim()
  const last = String(row.lastName ?? row.last_name ?? '').trim()
  if (first && last) return `${first} ${last}`
  if (first) return first
  if (last) return last

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
 * Auth endpoint: GET /auth/api/auth/users-by-role/{role}
 *
 * @param {string} role e.g. "Instructor"
 * @returns {Promise<Array<{id: string, fullName: string, raw: any}>>}
 */
export async function fetchUsersByRole(role) {
  const encodedRole = encodeURIComponent(String(role || '').trim().toLowerCase() || 'instructor')
  const res = await authFetch(`${AUTH_USERS_BY_ROLE_BASE}/${encodedRole}`, { method: 'GET' })
  const data = await parseJson(res)
  if (!res.ok) {
    const err = new Error(data?.message || `Failed to load instructors (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  const list = unwrapUsersByRoleResponse(data)

  const byId = new Map()
  const seenNames = new Set()
  for (const row of list) {
    const id = normalizeInstructorId(row)
    if (!id) continue
    if (byId.has(id)) continue
    const fullName = normalizeInstructorName(row, id)
    const nameKey = String(fullName || '').trim().toLowerCase()
    if (nameKey && seenNames.has(nameKey)) continue
    if (nameKey) seenNames.add(nameKey)
    byId.set(id, { id, fullName, raw: row })
  }

  return Array.from(byId.values())
}

export function indexById(instructors = []) {
  const map = new Map()
  for (const row of instructors) {
    if (!row?.id) continue
    map.set(String(row.id), row)
  }
  return map
}

