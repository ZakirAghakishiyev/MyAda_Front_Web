import { authFetch } from '../auth'

const SUPPORT_API_BASES = (
  import.meta.env.VITE_SUPPORT_API_BASE
    ? [String(import.meta.env.VITE_SUPPORT_API_BASE).trim()]
    : [
        // Gateway-correct support route
        'http://51.20.193.29:5000/support/api',
        // Direct support service (diagnostics / fallback)
        'http://51.20.193.29:5008/api',
      ]
)
  .map((x) => x.replace(/\/$/, ''))
  .filter(Boolean)

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

const DISPATCHER_ROLE_USERS_BASE_URLS = [
  'http://51.20.193.29:5000/api/auth/users-by-role',
  'http://51.20.193.29:5001/api/auth/users-by-role',
]

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
  if (!text) return null
  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  return readEnvelope(data)
}

async function request(path, options = {}) {
  let lastErr = null
  for (const base of SUPPORT_API_BASES) {
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
      const isNetwork = err instanceof TypeError || /failed to fetch|network|connection refused/i.test(msg)
      if (isNetwork) continue
    }
  }
  throw lastErr || new Error('Support API request failed.')
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
  if (item?.assignedTo) return item.assignedTo
  const assignedId = Number(item?.assignedStaffId)
  if (!assignedId) return null
  const staff = MOCK_STAFF[assignedId]
  if (staff?.fullName) return staff.fullName
  return `Staff #${assignedId}`
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

function normalizeSupportRequest(item) {
  if (!item || typeof item !== 'object') return item
  const createdAt = item.createdAt || item.created || null
  const completedAt = item.completedAt || item.completed || null
  const attachmentUrls = collectAttachmentUrls(item).map(resolveAttachmentDisplayUrl)
  const imageUrls = attachmentUrls.filter(isImageUrl)
  return {
    ...item,
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

export function getCurrentUserIds() {
  return {
    memberId: Number(localStorage.getItem('support_member_id') || 3001),
    staffId: Number(localStorage.getItem('support_staff_id') || 9001),
    dispatcherId: Number(localStorage.getItem('support_dispatcher_id') || 8001),
  }
}

export function getMockPeople() {
  return { members: MOCK_MEMBERS, staff: MOCK_STAFF, dispatchers: MOCK_DISPATCHERS }
}

export async function getActiveDispatchers() {
  const adminToken = String(import.meta.env.VITE_DISPATCHER_ROLE_TOKEN || '').trim()
  for (const baseUrl of DISPATCHER_ROLE_USERS_BASE_URLS) {
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

      return list
        .map((item, index) => {
          const rawSub = item?.sub ?? item?.id ?? item?.userId ?? item?.memberId
          const sub = rawSub != null && String(rawSub).trim() !== '' ? String(rawSub).trim() : ''
          if (!sub) return null
          return {
            id: sub || index,
            sub,
            userId: sub,
            memberId: sub,
            name:
              item.fullName ||
              item.displayName ||
              item.userName ||
              item.username ||
              item.email ||
              `Dispatcher ${index + 1}`,
            role: String(item.role || 'dispatcher').toLowerCase(),
            isActive: item.isActive !== false,
          }
        })
        .filter(Boolean)
    } catch {
      // Try next base URL.
    }
  }
  return []
}

export function getMockLocations() {
  return LOCATION_DATA
}

export function getStaffOptionsByArea(area) {
  const raw = String(area || '').toUpperCase()
  const normalized = raw === 'FACILITIES' ? 'FM' : raw
  return Object.entries(MOCK_STAFF)
    .filter(([, item]) => item.area === normalized)
    .map(([id, item]) => ({ id: Number(id), name: item.fullName, area: item.area }))
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
  const path = module ? `/Categories/module/${module}` : '/Categories'
  const result = await request(path)
  return Array.isArray(result) ? result : []
}

export async function createSupportRequest(memberId, dto) {
  return request(`/SupportRequests/member/${memberId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
}

export async function getMemberRequests(memberId) {
  const result = await request(`/SupportRequests/member/${memberId}`)
  return Array.isArray(result) ? result.map(normalizeSupportRequest) : []
}

export async function getStaffRequests(staffId) {
  const result = await request(`/SupportRequests/staff/${staffId}`)
  return Array.isArray(result) ? result.map(normalizeSupportRequest) : []
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
  const result = await request(`/SupportRequests/${requestId}`)
  return normalizeSupportRequest(result)
}

export async function getRequestTimeline(requestId) {
  const result = await request(`/SupportRequests/${requestId}/timeline`)
  if (!Array.isArray(result)) return []
  return result.map(normalizeTimelineItem)
}

export async function cancelMemberRequest(requestId, memberId, reason) {
  return request(`/SupportRequests/${requestId}/cancel/member/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export async function assignRequest(requestId, dispatcherId, staffId, dispatcherInstructions = '') {
  return request(`/SupportRequests/${requestId}/assign/dispatcher/${dispatcherId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, dispatcherInstructions }),
  })
}

export async function markRequestStarted(requestId, staffId) {
  return request(`/SupportRequests/${requestId}/start/staff/${staffId}`, { method: 'PUT' })
}

export async function markRequestInProgress(requestId, staffId) {
  return request(`/SupportRequests/${requestId}/in-progress/staff/${staffId}`, { method: 'PUT' })
}

export async function markRequestCompleted(requestId, staffId) {
  return request(`/SupportRequests/${requestId}/complete/staff/${staffId}`, { method: 'PUT' })
}

export async function getStaffStatusesByStatus(status) {
  const result = await request(`/SupportStaffStatuses/status/${status}`)
  return Array.isArray(result) ? result : []
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
    const result = await request(`/SupportStaffStatuses/member/${memberId}`)
    const rows = Array.isArray(result) ? result : [result]
    if (rows.some((row) => rowMatchesTarget(row) && isActiveRow(row))) return true
    return rows.some((row) => isActiveRow(row))
  } catch (err) {
    const msg = String(err?.message || '')
    if (msg.includes('(404)') || /not found/i.test(msg)) {
      // Disable this check after first 404 to avoid repeated console noise.
      isDispatcherActiveByMemberId.supportStatusEndpointUnavailable = true
      return true
    }
    throw err
  }
}

isDispatcherActiveByMemberId.supportStatusEndpointUnavailable = false

export function mapListItemToCard(item) {
  return {
    id: String(item.id),
    description: item.title || item.description || 'Support Request',
    descriptionFull: item.description || '',
    category: item.category || 'General',
    location: item.location || 'N/A',
    assignedTo: item.assignedTo || null,
    timeAgo: toShortAge(item.createdAt),
    status: item.status || 'New',
    urgency: item.urgency || 'Standard',
    priority: item.urgency || 'Standard',
    created: item.created || (item.createdAt ? toReadableDateTime(item.createdAt) : null),
    completed: item.completed || (item.completedAt ? toReadableDateTime(item.completedAt) : null),
    cancelReason: item.cancelReason || null,
    rating: item.rating ?? null,
    ticketNo: item.ticketNo || null,
    service: item.service || '',
    unseen: Boolean(item.unseen),
  }
}
