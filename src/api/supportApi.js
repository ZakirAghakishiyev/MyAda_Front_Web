import { authFetch } from '../auth'
import { getJwtUserId } from '../auth/jwtRoles'
import { DISPATCHER_ROLE_USER_URLS, getSupportApiBases } from './supportConfig'

/** Path segment: Support API uses GUIDs in paths (SUPPORT_API_DOC.md). */
function sp(id) {
  if (id == null) return ''
  return encodeURIComponent(String(id).trim())
}

export const SUPPORT_PATH_MEMBER_PLACEHOLDER =
  '00000000-0000-0000-0000-000000000000' /** path segment when `sub` should be applied server-side */

const MOCK_MEMBERS = {
  3001: { fullName: 'John Member', email: 'john@example.com' },
  3002: { fullName: 'Aisha Student', email: 'aisha@example.com' },
}

const MOCK_STAFF = {
  9001: { fullName: 'Jane Staff', area: 'IT' },
  9002: { fullName: 'Mark Technician', area: 'IT' },
  9003: { fullName: 'Aydin IT Support', area: 'IT' },
  9101: { fullName: 'Leyla Facilities', area: 'FM' },
  9102: { fullName: 'Kamran Maintenance', area: 'FM' },
  9103: { fullName: 'Nigar Maintenance', area: 'FM' },
}

const MOCK_DISPATCHERS = {
  8001: { fullName: 'Dispatcher One' },
}

const LOCATION_DATA = {
  buildings: [
    { id: 1, code: 'A' },
    { id: 2, code: 'B' },
    { id: 3, code: 'C' },
  ],
  roomsByBuildingId: {
    1: [
      { id: 101, code: '101' },
      { id: 102, code: '102' },
      { id: 103, code: '103' },
      { id: 203, code: '203' },
    ],
    2: [
      { id: 201, code: '101' },
      { id: 202, code: '102' },
      { id: 205, code: '105' },
    ],
    3: [
      { id: 301, code: '101' },
      { id: 401, code: '201' },
      { id: 402, code: '202' },
    ],
  },
}

function readEnvelope(data) {
  if (data && Object.prototype.hasOwnProperty.call(data, 'result')) return data.result
  return data
}

async function parseResponse(res) {
  if (res.status === 204) return null
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.title || data.detail)) ||
      (typeof data === 'string' && data.trim()) ||
      `Request failed (${res.status})`
    const err = new Error(String(message))
    err.status = res.status
    err.body = data
    throw err
  }
  if (!text) return null
  if (data && typeof data === 'object' && data.isError) {
    const err = new Error(data?.message || data?.responseException || 'Support API error')
    err.status = res.status
    err.body = data
    throw err
  }
  return data && typeof data === 'object' ? readEnvelope(data) : data
}

async function request(path, options = {}) {
  let lastErr = null
  for (const base of getSupportApiBases().map((b) => String(b).replace(/\/+$/, ''))) {
    try {
      const res = await authFetch(`${base}${path}`, options)
      if (res.status === 404) {
        lastErr = new Error(`Not found: ${base}${path}`)
        continue
      }
      return await parseResponse(res)
    } catch (err) {
      lastErr = err
      const msg = String(err?.message || '')
      const status = Number(err?.status)
      const isNetwork = err instanceof TypeError || /failed to fetch|network|connection refused/i.test(msg)
      const isRetryableGateway = status === 502 || status === 503 || status === 504
      if (isNetwork || isRetryableGateway) continue
    }
  }
  throw lastErr || new Error('Support API request failed.')
}

const SUPPORT_STAFF_STATUS_UNAVAILABLE_STATUSES = new Set([404, 501, 502, 503, 504])

function isSupportStaffStatusEndpointUnavailable(err) {
  const status = Number(err?.status)
  if (SUPPORT_STAFF_STATUS_UNAVAILABLE_STATUSES.has(status)) return true
  const msg = String(err?.message || '')
  return /\((404|501|502|503|504)\)/.test(msg) || /not found|bad gateway|service unavailable/i.test(msg)
}

function toShortAge(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function toReadableDateTime(iso) {
  if (!iso) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return String(iso)
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dt)
}

function resolveBuildingLabel(buildingId) {
  if (buildingId == null) return ''
  const id = Number(buildingId)
  const building = LOCATION_DATA.buildings.find((b) => Number(b.id) === id)
  if (!building) return `Building ${id}`
  return `Building ${building.code}`
}

function resolveRoomLabel(buildingId, roomId) {
  if (roomId == null) return ''
  const bid = Number(buildingId)
  const rid = Number(roomId)
  const room = (LOCATION_DATA.roomsByBuildingId[bid] || []).find((r) => Number(r.id) === rid)
  if (!room) return `Room ${rid}`
  return `Room ${room.code}`
}

function buildRequestLocation(item) {
  const fromApi = String(
    item?.location ?? item?.locationText ?? item?.address ?? item?.siteLocation ?? ''
  ).trim()
  if (fromApi) return fromApi
  const parts = []
  if (item?.isBuilding || item?.buildingId != null) {
    const building = resolveBuildingLabel(item.buildingId)
    if (building) parts.push(building)
  }
  if (item?.isRoom || item?.roomId != null) {
    const room = resolveRoomLabel(item.buildingId, item.roomId)
    if (room) parts.push(room)
  }
  const details = String(item?.areaDetails || '').trim()
  if (details) parts.push(details)
  if (parts.length > 0) return parts.join(', ')
  return item?.location || 'N/A'
}

function resolveAssignedStaffName(item) {
  const label =
    item?.assignedToName ||
    item?.assignedStaffName ||
    item?.assigneeName ||
    (typeof item?.assignedTo === 'string' ? item.assignedTo : null) ||
    item?.staffName
  if (label) return label
  const assignedId = item?.assignedStaffId
  if (assignedId == null || assignedId === '') return null
  const n = Number(assignedId)
  if (!Number.isNaN(n) && MOCK_STAFF[n]?.fullName) return MOCK_STAFF[n].fullName
  if (String(assignedId).length > 12) return `Staff ${String(assignedId).slice(0, 8)}…`
  return `Staff ${assignedId}`
}

function pickCreatedByUserId(item) {
  if (!item || typeof item !== 'object') return null
  const v =
    item.createdById ??
    item.createdByUserId ??
    item.creatorUserId ??
    item.requesterUserId ??
    item.requestedByUserId ??
    item.requestedById ??
    item.memberUserId ??
    item.memberId ??
    item.reporter?.memberId ??
    item.reporter?.MemberId
  if (v == null || String(v).trim() === '') return null
  return String(v).trim()
}

function resolveCreatorName(item) {
  const label =
    item?.createdByName ||
    item?.createdByFullName ||
    item?.creatorName ||
    item?.requesterName ||
    item?.requestedByName ||
    item?.memberName ||
    item?.teacherName ||
    item?.instructorName ||
    item?.reporter?.fullName ||
    item?.reporter?.FullName ||
    (typeof item?.createdBy === 'string' ? item.createdBy : null)
  if (label && String(label).trim()) return String(label).trim()
  const creatorId = pickCreatedByUserId(item)
  if (!creatorId) return null
  if (creatorId.length > 12) return `User ${creatorId.slice(0, 8)}...`
  return `User ${creatorId}`
}

function resolveCreatorEmail(item) {
  const label =
    item?.createdByEmail ||
    item?.creatorEmail ||
    item?.requesterEmail ||
    item?.requestedByEmail ||
    item?.memberEmail ||
    item?.teacherEmail ||
    item?.instructorEmail ||
    item?.reporter?.email ||
    item?.reporter?.Email
  const value = String(label || '').trim()
  return value || null
}

function resolveCreatorRoleLabel(item) {
  const raw =
    item?.createdByRole ||
    item?.creatorRole ||
    item?.requesterRole ||
    item?.requestedByRole ||
    item?.memberRole ||
    item?.createdByType ||
    item?.creatorType ||
    item?.requesterType
  const value = String(raw || '').trim().toLowerCase()
  if (!value) return 'creator'
  if (/(teacher|instructor|faculty|professor|lecturer)/i.test(value)) return 'teacher'
  if (/student/.test(value)) return 'requester'
  return 'creator'
}

/** Auth user id (JWT `sub`) of the staff member assigned to the request, when the API exposes it. */
function pickAssignedStaffUserId(item) {
  if (!item || typeof item !== 'object') return null
  const v =
    item.assignedStaffUserId ??
    item.assignedStaffId ??
    item.assignedStaffID ??
    item.assignedToStaffId ??
    item.assignedToStaffUserId ??
    item.assignedUserId ??
    item.assigneeUserId ??
    item.staffUserId ??
    item.StaffUserId
  if (v == null || String(v).trim() === '') return null
  return String(v).trim()
}

function normStaffIdKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

/**
 * Staff portal lists: only tickets assigned to `staffUserId`. If no item includes an assignee id,
 * returns `items` unchanged (backend `GET …/staff/{id}` already scoped).
 */
function filterStaffRequestsForSignedInUser(items, staffUserId) {
  const target = normStaffIdKey(staffUserId)
  if (!target) return []
  const arr = Array.isArray(items) ? items : []
  const anyAssignee = arr.some((row) => pickAssignedStaffUserId(row))
  if (!anyAssignee) return arr
  return arr.filter((row) => {
    const a = pickAssignedStaffUserId(row)
    return Boolean(a) && normStaffIdKey(a) === target
  })
}

/**
 * Whether the signed-in staff user may open this ticket (assignee matches JWT `sub`, or API omits assignee id).
 */
export function staffMayViewSupportRequest(request, staffUserId) {
  const target = normStaffIdKey(staffUserId)
  if (!request || !target) return false
  const a = pickAssignedStaffUserId(request)
  if (!a) return true
  return normStaffIdKey(a) === target
}

function collectAttachmentUrls(item) {
  const raw =
    item?.attachmentUrls ??
    item?.attachmentPaths ??
    item?.imageUrls ??
    item?.images ??
    item?.attachments ??
    item?.files ??
    []
  if (!Array.isArray(raw)) return []
  return raw
    .map((v) => {
      if (!v) return ''
      if (typeof v === 'string') return v
      if (typeof v === 'object') {
        return (
          v.url ||
          v.path ||
          v.filePath ||
          v.publicPath ||
          v.location ||
          v.href ||
          ''
        )
      }
      return ''
    })
    .filter(Boolean)
}

function isImageUrl(url) {
  const value = String(url || '').toLowerCase()
  return value.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/.test(value)
}

function getMockUploadEntries() {
  try {
    const raw = localStorage.getItem(MOCK_UPLOAD_STORAGE_KEY) || '[]'
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeUploadPath(value) {
  const str = String(value || '').trim()
  if (!str) return ''
  if (str.startsWith('data:')) return str
  try {
    const url = new URL(str)
    return url.pathname
  } catch {
    return str.startsWith('/') ? str : `/${str}`
  }
}

function resolveAttachmentDisplayUrl(url) {
  const normalized = normalizeUploadPath(url)
  if (!normalized || normalized.startsWith('data:')) return String(url || '')
  const uploads = getMockUploadEntries()
  const match = uploads.find((entry) => {
    const candidates = [
      normalizeUploadPath(entry?.url),
      normalizeUploadPath(entry?.path),
      `/${MOCK_UPLOAD_FOLDER}/${entry?.filename || ''}`,
    ]
    return candidates.includes(normalized)
  })
  if (match?.content) return match.content
  return String(url || '')
}

function normLookupKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function normPersonNameKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeSupportRequest(item) {
  if (!item || typeof item !== 'object') return item
  const createdAt = item.createdAt || item.created || null
  const completedAt = item.completedAt || item.completed || null
  const attachmentUrls = collectAttachmentUrls(item).map(resolveAttachmentDisplayUrl)
  const imageUrls = attachmentUrls.filter(isImageUrl)
  const areaRaw = String(item.area || item.serviceArea || '').toLowerCase()
  let service = item.service
  if (service == null && areaRaw) {
    if (areaRaw === 'fm' || areaRaw === 'facilities') service = 'FM'
    else if (areaRaw === 'it') service = 'IT'
  }
  return {
    ...item,
    assignedStaffUserId: pickAssignedStaffUserId(item),
    createdById: pickCreatedByUserId(item),
    creatorName: resolveCreatorName(item),
    creatorEmail: resolveCreatorEmail(item),
    creatorRoleLabel: resolveCreatorRoleLabel(item),
    teacherCallTargetId: String(item?.teacherCallTargetId || '').trim() || null,
    service,
    location: buildRequestLocation(item),
    assignedTo: resolveAssignedStaffName(item),
    attachmentUrls,
    imageUrls: imageUrls.length > 0 ? imageUrls : attachmentUrls,
    createdAt,
    completedAt,
    created: createdAt ? toReadableDateTime(createdAt) : null,
    completed: completedAt ? toReadableDateTime(completedAt) : null,
  }
}

function normalizeTimelineStep(step) {
  const map = {
    Created: 'Created',
    Assigned: 'Assigned',
    DispatcherInstructions: 'Dispatcher Instructions',
    InProgress: 'In Progress',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
  }
  return map[String(step || '')] || String(step || 'Update')
}

function normalizeTimelineItem(item) {
  if (!item || typeof item !== 'object') return item
  const createdAt = item.createdAt || null
  return {
    ...item,
    step: normalizeTimelineStep(item.step),
    createdAt,
    created: createdAt ? toReadableDateTime(createdAt) : '',
  }
}

/**
 * Path params for Support API must be user GUIDs (JWT `sub`). Optional localStorage
 * keys override for testing: support_member_id, support_staff_id, support_dispatcher_id.
 * @returns {{ memberId: string | null, staffId: string | null, dispatcherId: string | null }}
 */
export function getCurrentUserIds() {
  const fromJwt = getJwtUserId()
  const o = (key) => {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    return v && String(v).trim() ? String(v).trim() : null
  }
  return {
    memberId: o('support_member_id') || fromJwt || null,
    staffId: o('support_staff_id') || fromJwt || null,
    dispatcherId: o('support_dispatcher_id') || fromJwt || null,
  }
}

export function getMockPeople() {
  return { members: MOCK_MEMBERS, staff: MOCK_STAFF, dispatchers: MOCK_DISPATCHERS }
}

export async function getActiveDispatchers() {
  const adminToken = String(import.meta.env.VITE_DISPATCHER_ROLE_TOKEN || '').trim()
  for (const baseUrl of DISPATCHER_ROLE_USER_URLS) {
    try {
      // Backend contract: role path is normalized lowercase and endpoint requires admin bearer token.
      const url = `${baseUrl}/dispatcher`
      const res = adminToken
        ? await fetch(url, {
            headers: {
              accept: '*/*',
              Authorization: `Bearer ${adminToken}`,
            },
          })
        : await authFetch(url, {
            headers: { accept: '*/*' },
          })

      const data = await parseResponse(res)
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data?.items)
            ? data.items
            : []

      const mapped = list
        .map((item, index) => {
          const rawSub = item?.sub ?? item?.id ?? item?.userId ?? item?.memberId
          const sub = rawSub != null && String(rawSub).trim() !== '' ? String(rawSub).trim() : ''
          if (!sub) return null
          const status = String(item?.status || '').trim().toLowerCase()
          return {
            id: sub || index,
            sub,
            userId: sub,
            memberId: sub,
            name: displayNameFromAuthUser(item) || `Dispatcher ${index + 1}`,
            email: String(item?.email || '').trim() || null,
            role: String(item.role || 'dispatcher').toLowerCase(),
            status: status || null,
            isActive:
              item.isActive !== false &&
              item.active !== false &&
              (!status || status === 'active'),
          }
        })
        .filter(Boolean)

      const activeOnly = mapped.filter((item) => item.isActive !== false)
      return activeOnly.length > 0 ? activeOnly : mapped
    } catch {
      // Try next base URL.
    }
  }
  return []
}
export function getMockLocations() {
  return LOCATION_DATA
}

/**
 * Map API `service` / `serviceArea` / category labels to IT vs FM for staff assignment.
 * Backend sometimes sends a category name (e.g. "Electricity") in `service`; treat known FM domains as FM.
 * @returns {'IT' | 'FM'}
 */
export function resolveStaffPickerModule(area, category = '') {
  const s = String(area || '').trim().toLowerCase()
  const c = String(category || '').trim().toLowerCase()
  const combined = `${s} ${c}`
  if (s === 'fm' || s === 'facilities' || /\bfacilit(y|ies)?\b/.test(combined)) return 'FM'
  if (s === 'it') return 'IT'
  if (
    /electric|plumb|hvac|mainten|clean|building|grounds|carpent|paint|lock|furniture|elevator|sanitation|water|heat|pest|landscap|janitor|custodial|facility|restroom|toilet|leak|lighting|generator/i.test(
      combined
    )
  )
    return 'FM'
  if (/software|network|email|account|printer|computer|wifi|vpn|hardware|login|portal|password|laptop|server|database|ldap|active\s*directory|outlook|teams|zoom/i.test(combined))
    return 'IT'
  return 'IT'
}

function mockStaffOptionsByArea(area) {
  const raw = String(area || '').toUpperCase()
  const normalized = raw === 'FACILITIES' ? 'FM' : raw
  return Object.entries(MOCK_STAFF)
    .filter(([, item]) => item.area === normalized)
    .map(([id, item]) => ({ id: String(id), name: item.fullName, area: item.area }))
}

function displayNameFromAuthUser(item) {
  const fn = String(item?.firstName || '').trim()
  const ln = String(item?.lastName || '').trim()
  const combined = [fn, ln].filter(Boolean).join(' ')
  if (combined) return combined
  return (
    item?.userName ||
    item?.username ||
    item?.email ||
    (item?.id ? `User ${String(item.id).slice(0, 8)}` : 'User')
  )
}

function emailFromAuthDirectoryUser(item) {
  return String(item?.email || item?.Email || item?.userName || item?.UserName || '').trim() || null
}

function mapAuthDirectoryUser(item, fallbackRole = '') {
  const id = item?.id != null ? String(item.id).trim() : ''
  if (!id) return null
  const status = String(item?.status || '').trim().toLowerCase()
  if (status && status !== 'active') return null
  return {
    id,
    name: displayNameFromAuthUser(item),
    email: emailFromAuthDirectoryUser(item),
    role: String(item?.role || fallbackRole || '').trim().toLowerCase(),
  }
}

const authUsersByRoleCache = new Map()

async function fetchAuthUsersByRole(role) {
  const roleKey = String(role || '').trim().toLowerCase()
  if (!roleKey) return []
  if (authUsersByRoleCache.has(roleKey)) return authUsersByRoleCache.get(roleKey)

  const pending = (async () => {
    const roleSeg = encodeURIComponent(roleKey)
    const adminToken = String(import.meta.env.VITE_DISPATCHER_ROLE_TOKEN || '').trim()
    for (const baseUrl of DISPATCHER_ROLE_USER_URLS) {
      const root = String(baseUrl || '').replace(/\/+$/, '')
      if (!root) continue
      try {
        const url = `${root}/${roleSeg}`
        const res = adminToken
          ? await fetch(url, {
              headers: {
                accept: 'application/json',
                Authorization: `Bearer ${adminToken}`,
              },
            })
          : await authFetch(url, { headers: { accept: 'application/json' } })
        const text = await res.text()
        if (!res.ok) continue
        const data = text ? JSON.parse(text) : null
        const users = Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data)
            ? data
            : []
        const mapped = users
          .map((u) => mapAuthDirectoryUser(u, roleKey))
          .filter(Boolean)
        if (mapped.length > 0) return mapped
      } catch {
        /* try next base */
      }
    }
    return []
  })()

  authUsersByRoleCache.set(roleKey, pending)
  return pending
}

async function fetchTeacherDirectoryUsers() {
  const rolesToTry = ['instructor', 'teacher']
  const byId = new Map()
  for (const role of rolesToTry) {
    const users = await fetchAuthUsersByRole(role)
    for (const user of users) {
      if (!user?.id || byId.has(user.id)) continue
      byId.set(user.id, user)
    }
  }
  return [...byId.values()]
}

/**
 * Auth gateway: `GET /api/auth/users-by-role/{role}` (see AUTH_API_DOC.md).
 * Uses `VITE_DISPATCHER_ROLE_TOKEN` when set (admin bearer), otherwise the logged-in session via `authFetch`.
 * @param {string} role e.g. `it_staff`, `tech_staff` (gateway: `/api/auth/users-by-role/{role}`)
 * @param {'IT' | 'FM'} areaLabel
 * @returns {Promise<{ id: string, name: string, area: string }[]>}
 */
async function fetchAuthUsersByRoleForStaffPicker(role, areaLabel) {
  const users = await fetchAuthUsersByRole(role)
  return users.map((user) => ({ id: user.id, name: user.name, area: areaLabel }))
}

/**
 * Resolve a support request creator to a teacher/instructor call target accepted by CallService `RequestCall(targetUserId)`.
 * This uses Support detail data first, then verifies against Auth `users-by-role/instructor` so support staff do not
 * attempt calls to non-teacher creators.
 * @param {string | number | Record<string, unknown>} requestOrDetail
 * @returns {Promise<{ userId: string, creatorName: string | null, creatorEmail: string | null, creatorRoleLabel: 'teacher' }>}
 */
export async function resolveSupportRequestTeacherCallTarget(requestOrDetail) {
  let detail =
    requestOrDetail && typeof requestOrDetail === 'object'
      ? normalizeSupportRequest(requestOrDetail)
      : await getRequestDetail(requestOrDetail)

  if (
    requestOrDetail &&
    typeof requestOrDetail === 'object' &&
    detail?.id != null &&
    !String(detail?.teacherCallTargetId || '').trim() &&
    detail?.creatorRoleLabel !== 'teacher' &&
    !String(detail?.creatorEmail || '').trim()
  ) {
    detail = await getRequestDetail(detail.id)
  }

  const directTeacherTargetId = String(detail?.teacherCallTargetId || '').trim()
  if (directTeacherTargetId) {
    return {
      userId: directTeacherTargetId,
      creatorName: detail?.creatorName || null,
      creatorEmail: detail?.creatorEmail || null,
      creatorRoleLabel: 'teacher',
    }
  }

  const creatorId = String(detail?.createdById || '').trim()
  const creatorName = String(detail?.creatorName || '').trim() || null
  const creatorEmail = resolveCreatorEmail(detail)

  if (detail?.creatorRoleLabel === 'teacher' && creatorId) {
    return {
      userId: creatorId,
      creatorName,
      creatorEmail,
      creatorRoleLabel: 'teacher',
    }
  }

  if (!creatorId && !creatorEmail && !creatorName) {
    const err = new Error('Ticket creator information is missing for this request.')
    err.code = 'SUPPORT_TEACHER_TARGET_MISSING'
    throw err
  }

  const teachers = await fetchTeacherDirectoryUsers()
  if (!teachers.length) {
    const err = new Error('Could not verify the ticket creator as a teacher right now. Please try again after the instructor directory is available.')
    err.code = 'SUPPORT_TEACHER_DIRECTORY_UNAVAILABLE'
    throw err
  }

  const targetById = creatorId
    ? teachers.find((teacher) => normLookupKey(teacher.id) === normLookupKey(creatorId))
    : null
  if (targetById) {
    return {
      userId: targetById.id,
      creatorName: targetById.name || creatorName,
      creatorEmail: targetById.email || creatorEmail,
      creatorRoleLabel: 'teacher',
    }
  }

  const creatorEmailKey = normLookupKey(creatorEmail)
  const emailMatches = creatorEmailKey
    ? teachers.filter((teacher) => normLookupKey(teacher.email) === creatorEmailKey)
    : []
  if (emailMatches.length === 1) {
    return {
      userId: emailMatches[0].id,
      creatorName: emailMatches[0].name || creatorName,
      creatorEmail: emailMatches[0].email || creatorEmail,
      creatorRoleLabel: 'teacher',
    }
  }

  const creatorNameKey = normPersonNameKey(creatorName)
  const nameMatches = creatorNameKey
    ? teachers.filter((teacher) => normPersonNameKey(teacher.name) === creatorNameKey)
    : []
  if (nameMatches.length === 1) {
    return {
      userId: nameMatches[0].id,
      creatorName: nameMatches[0].name || creatorName,
      creatorEmail: nameMatches[0].email || creatorEmail,
      creatorRoleLabel: 'teacher',
    }
  }

  const err = new Error('Only teacher-created tickets can be called from support. This ticket creator could not be verified as an instructor.')
  err.code = 'SUPPORT_TEACHER_NOT_FOUND'
  throw err
}

/**
 * Staff pickers: prefers Auth users-by-role (`it_staff` for IT / `tech_staff` for FM per request module),
 * then `SupportStaffStatuses` (Online + OnBreak), then mock data.
 * @param {string} [area] Request `service` / area from API (may be a category name).
 * @param {string} [category] Request category when `service` is not IT/FM.
 * @returns {Promise<{ id: string, name: string, area: string }[]>}
 */
export async function fetchStaffOptionsByArea(area, category = '') {
  const want = resolveStaffPickerModule(area, category)
  const authRole = want === 'FM' ? 'tech_staff' : 'it_staff'
  const fromAuth = await fetchAuthUsersByRoleForStaffPicker(authRole, want)
  if (fromAuth.length > 0) return fromAuth

  const rows = []
  for (const st of ['Online', 'OnBreak']) {
    try {
      const batch = await getStaffStatusesByStatus(st)
      if (Array.isArray(batch)) rows.push(...batch)
    } catch {
      /* fall through to mock */
    }
  }
  const byId = new Map()
  for (const row of rows) {
    const id = row?.memberId ?? row?.staffId ?? row?.userId ?? row?.id
    if (id == null || id === '') continue
    const sid = String(id).trim()
    if (byId.has(sid)) continue
    const name =
      row?.fullName ||
      row?.displayName ||
      row?.userName ||
      row?.email ||
      `Staff ${sid.slice(0, 8)}…`
    const a = String(row?.area || row?.department || row?.team || '').toUpperCase()
    let mapped = 'IT'
    if (a.includes('FACILIT') || a === 'FM' || a.includes('MAINT') || a.includes('BUILD')) mapped = 'FM'
    byId.set(sid, { id: sid, name, area: mapped })
  }
  const all = [...byId.values()]
  const filtered = all.filter((o) => o.area === want)
  const use = filtered.length > 0 ? filtered : all
  if (use.length > 0) return use
  return mockStaffOptionsByArea(want)
}

const MOCK_UPLOAD_FOLDER = 'support-ticket-uploads'
const MOCK_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const MOCK_UPLOAD_STORAGE_KEY = 'support_mock_upload_files'

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function sanitizeFileBaseName(name) {
  const trimmed = String(name || '').trim()
  const withoutExt = trimmed.replace(/\.[^/.]+$/, '')
  const safe = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  return safe || 'upload'
}

function detectUploadExt(file) {
  const nameExt = String(file?.name || '').split('.').pop()?.toLowerCase()
  if (nameExt && MOCK_UPLOAD_EXTENSIONS.includes(nameExt)) return nameExt
  const typeExt = String(file?.type || '').split('/').pop()?.toLowerCase()
  if (typeExt && MOCK_UPLOAD_EXTENSIONS.includes(typeExt)) return typeExt
  return randomFrom(MOCK_UPLOAD_EXTENSIONS)
}

function makeUploadFilename(file) {
  const base = sanitizeFileBaseName(file?.name)
  const ext = detectUploadExt(file)
  const randomKey = Math.random().toString(36).slice(2, 10)
  // keep random key at filename end for uniqueness
  return `${base}-${randomKey}.${ext}`
}

function toPortableUploadUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${normalizedPath}`
  }
  return normalizedPath
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function saveAttachmentsToMockFolder(files = []) {
  if (!Array.isArray(files) || files.length === 0) return []
  try {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const uploaded = await request('/SupportRequests/uploads', {
      method: 'POST',
      body: formData,
    })
    if (Array.isArray(uploaded)) return uploaded
  } catch {
    // Fallback to local mock persistence when backend upload is unavailable.
  }

  const saved = []
  const persisted = JSON.parse(localStorage.getItem(MOCK_UPLOAD_STORAGE_KEY) || '[]')
  for (const file of files) {
    const filename = makeUploadFilename(file)
    const path = `/${MOCK_UPLOAD_FOLDER}/${filename}`
    const url = toPortableUploadUrl(path)
    const content = await readAsDataUrl(file)
    persisted.push({
      folder: MOCK_UPLOAD_FOLDER,
      filename,
      path,
      url,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      content,
      createdAt: new Date().toISOString(),
    })
    saved.push(url)
  }
  localStorage.setItem(MOCK_UPLOAD_STORAGE_KEY, JSON.stringify(persisted))
  return saved
}

export async function getCategories(module) {
  const path = module ? `/Categories/module/${sp(module)}` : '/Categories'
  const result = await request(path)
  return Array.isArray(result) ? result : []
}

export async function createSupportRequest(memberId, dto) {
  const pathId =
    memberId != null && String(memberId).trim() !== ''
      ? sp(memberId)
      : sp(SUPPORT_PATH_MEMBER_PLACEHOLDER)
  return request(`/SupportRequests/member/${pathId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
}

export async function getMemberRequests(memberId) {
  const pathId =
    memberId != null && String(memberId).trim() !== ''
      ? sp(memberId)
      : sp(SUPPORT_PATH_MEMBER_PLACEHOLDER)
  const result = await request(`/SupportRequests/member/${pathId}`)
  return Array.isArray(result) ? result.map(normalizeSupportRequest) : []
}

export async function getStaffRequests(staffId) {
  if (staffId == null || String(staffId).trim() === '') return []
  const result = await request(`/SupportRequests/staff/${sp(staffId)}`)
  const list = Array.isArray(result) ? result.map(normalizeSupportRequest) : []
  return filterStaffRequestsForSignedInUser(list, staffId)
}

export async function getAllRequests(filters = {}) {
  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') qs.set(k, String(v))
  })
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const result = await request(`/SupportRequests${suffix}`)
  return Array.isArray(result) ? result.map(normalizeSupportRequest) : []
}

export async function getRequestDetail(requestId) {
  const result = await request(`/SupportRequests/${sp(requestId)}`)
  return normalizeSupportRequest(result)
}

export async function getRequestTimeline(requestId) {
  const result = await request(`/SupportRequests/${sp(requestId)}/timeline`)
  if (!Array.isArray(result)) return []
  return result.map(normalizeTimelineItem)
}

export async function cancelMemberRequest(requestId, memberId, reason) {
  return request(
    `/SupportRequests/${sp(requestId)}/cancel/member/${sp(memberId)}`,
    {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
    }
  )
}

export async function assignRequest(requestId, dispatcherId, staffId, dispatcherInstructions = '') {
  return request(
    `/SupportRequests/${sp(requestId)}/assign/dispatcher/${sp(dispatcherId)}`,
    {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId: String(staffId), dispatcherInstructions }),
    }
  )
}

export async function reassignRequest(requestId, dispatcherId, staffId, dispatcherInstructions = '') {
  return request(
    `/SupportRequests/${sp(requestId)}/reassign/dispatcher/${sp(dispatcherId)}`,
    {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId: String(staffId), dispatcherInstructions }),
    }
  )
}

export async function setDispatcherRequestInstructions(
  requestId,
  dispatcherId,
  dispatcherInstructions
) {
  return request(
    `/SupportRequests/${sp(requestId)}/dispatcher-instructions/dispatcher/${sp(dispatcherId)}`,
    {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dispatcherInstructions }),
    }
  )
}

export async function markRequestStarted(requestId, staffId) {
  return request(`/SupportRequests/${sp(requestId)}/start/staff/${sp(staffId)}`, { method: 'PUT' })
}

export async function markRequestInProgress(requestId, staffId) {
  return request(`/SupportRequests/${sp(requestId)}/in-progress/staff/${sp(staffId)}`, { method: 'PUT' })
}

export async function markRequestCompleted(requestId, staffId) {
  return request(`/SupportRequests/${sp(requestId)}/complete/staff/${sp(staffId)}`, { method: 'PUT' })
}

export async function getStaffStatusesByStatus(status) {
  if (getStaffStatusesByStatus.supportStatusEndpointUnavailable === true) {
    return []
  }
  try {
    const result = await request(`/SupportStaffStatuses/status/${sp(status)}`)
    return Array.isArray(result) ? result : []
  } catch (err) {
    if (isSupportStaffStatusEndpointUnavailable(err)) {
      getStaffStatusesByStatus.supportStatusEndpointUnavailable = true
      isDispatcherActiveByMemberId.supportStatusEndpointUnavailable = true
      return []
    }
    throw err
  }
}

export async function isDispatcherActiveByMemberId(memberId) {
  if (memberId == null || String(memberId).trim() === '') return false
  const target = String(memberId).trim().toLowerCase()
  if (isDispatcherActiveByMemberId.supportStatusEndpointUnavailable === true) {
    // Backend does not expose SupportStaffStatuses routes; skip noisy checks.
    return true
  }
  const isActiveRow = (row) => {
    if (!row || typeof row !== 'object') return false
    if (row.isActive === true || row.active === true) return true
    const status = String(row.status || row.state || '').toLowerCase()
    return status === 'active' || status === 'available' || status === 'online'
  }
  const rowMatchesTarget = (row) => {
    if (!row || typeof row !== 'object') return false
    const candidates = [row.memberId, row.userId, row.staffId, row.id]
      .map((v) => String(v ?? '').trim().toLowerCase())
      .filter(Boolean)
    return candidates.includes(target)
  }

  try {
    const result = await request(`/SupportStaffStatuses/member/${sp(memberId)}`)
    const rows = Array.isArray(result) ? result : [result]
    if (rows.some((row) => rowMatchesTarget(row) && isActiveRow(row))) return true
    return rows.some((row) => isActiveRow(row))
  } catch (err) {
    if (isSupportStaffStatusEndpointUnavailable(err)) {
      // Backend does not expose SupportStaffStatuses routes consistently, or the gateway
      // cannot reach them right now. Do not block call setup on this optional preflight.
      getStaffStatusesByStatus.supportStatusEndpointUnavailable = true
      isDispatcherActiveByMemberId.supportStatusEndpointUnavailable = true
      return true
    }
    throw err
  }
}

getStaffStatusesByStatus.supportStatusEndpointUnavailable = false
isDispatcherActiveByMemberId.supportStatusEndpointUnavailable = false
export function mapListItemToCard(item) {
  const a = String(item?.area || '').toLowerCase()
  const serviceFromArea =
    a === 'fm' || a === 'facilities' ? 'FM' : a === 'it' ? 'IT' : ''
  return {
    id: String(item.id),
    description: item.title || item.description || 'Support Request',
    descriptionFull: item.description || '',
    category: item.category || 'General',
    location: item.location || 'N/A',
    assignedTo: item.assignedTo || null,
    assignedStaffUserId: item.assignedStaffUserId ?? null,
    timeAgo: toShortAge(item.createdAt),
    status: item.status || 'New',
    urgency: item.urgency || 'Standard',
    priority: item.urgency || 'Standard',
    created: item.created || (item.createdAt ? toReadableDateTime(item.createdAt) : null),
    completed: item.completed || (item.completedAt ? toReadableDateTime(item.completedAt) : null),
    cancelReason: item.cancelReason || null,
    rating: item.rating ?? null,
    ticketNo: item.ticketNo || null,
    service: item.service || serviceFromArea || '',
    unseen: Boolean(item.unseen),
    createdById: item.createdById || null,
    creatorName: item.creatorName || null,
    creatorEmail: item.creatorEmail || null,
    creatorRoleLabel: item.creatorRoleLabel || 'creator',
    teacherCallTargetId: item.teacherCallTargetId || null,
  }
}
