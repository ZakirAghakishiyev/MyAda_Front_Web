import { authFetch } from '../auth'

const LOST_FOUND_HOST = (
  import.meta.env.VITE_LOST_FOUND_HOST ?? 'http://13.60.31.141:5000'
).replace(/\/+$/, '')
const LOST_FOUND_API_BASE = `${LOST_FOUND_HOST}/lostfound/api/lost-and-found`
const LOST_FOUND_CATEGORIES_URL = `${LOST_FOUND_HOST}/lostfound/api/v1/categories`

function normalizeMediaUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.startsWith('data:')) return raw
  if (raw.startsWith('/')) return `${LOST_FOUND_HOST}${raw}`
  if (/^https?:\/\//i.test(raw)) return raw
  if (/^[a-z0-9-]+:\d+\//i.test(raw)) {
    const slashAt = raw.indexOf('/')
    const pathOnly = slashAt >= 0 ? raw.slice(slashAt) : ''
    return `${LOST_FOUND_HOST}${pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`}`
  }
  if (raw.startsWith('uploads/')) return `${LOST_FOUND_HOST}/${raw}`
  return raw
}

function formatAdminStatusLabel(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'received') return 'Received'
  if (s === 'delivered') return 'Delivered'
  return 'Pending'
}

/**
 * Workflow labels for UI; `status` mirrors `adminStatus` for display (not public listing status).
 */
function normalizeLostFoundItem(item) {
  if (!item || typeof item !== 'object') return item
  const images = Array.isArray(item.images) ? item.images : []
  const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls : []
  const mappedImages = images.map(normalizeMediaUrl).filter(Boolean)
  const mappedImageUrls = imageUrls.map(normalizeMediaUrl).filter(Boolean)
  const image = normalizeMediaUrl(item.image || mappedImageUrls[0] || mappedImages[0])
  const adminStatus = formatAdminStatusLabel(item.adminStatus)
  const ownerClaimsCount = Number(item.ownerClaimsCount ?? item.OwnerClaimsCount ?? 0) || 0
  const finderClaimsCount = Number(item.finderClaimsCount ?? item.FinderClaimsCount ?? 0) || 0
  const title = String(item.title || item.itemName || '').trim() || 'Untitled item'
  return {
    ...item,
    title,
    adminStatus,
    status: adminStatus,
    image,
    imageUrls: mappedImageUrls.length ? mappedImageUrls : mappedImages,
    images: mappedImages,
    ownerClaimsCount,
    finderClaimsCount,
  }
}

/**
 * True when a user submitted the public claim that pairs with "Notify owner" in admin:
 * found listings → owner claim ("This is mine"); lost listings → finder claim ("Item found").
 * @param {Record<string, unknown> | null | undefined} item
 */
export function itemHasEligibleClaimForOwnerNotify(item) {
  if (!item || typeof item !== 'object') return false
  const owner = Number(item.ownerClaimsCount ?? 0) > 0
  const finder = Number(item.finderClaimsCount ?? 0) > 0
  const t = String(item.type ?? '').toLowerCase()
  if (t === 'found') return owner
  if (t === 'lost') return finder
  return owner || finder
}

function formatErrorMessage(data, status) {
  let message =
    (data && typeof data === 'object' && (data.message || data.error)) ||
    (typeof data === 'string' ? data : null) ||
    `Request failed (${status})`
  if (data?.details && typeof data.details === 'object') {
    const parts = Object.entries(data.details).flatMap(([field, msgs]) =>
      Array.isArray(msgs) ? msgs.map((m) => `${field}: ${m}`) : [`${field}: ${msgs}`]
    )
    if (parts.length) message = `${message} — ${parts.join('; ')}`
  }
  return String(message)
}

async function parseResponse(res) {
  if (res.status === 204) return null
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message = formatErrorMessage(data, res.status)
    const err = new Error(message)
    err.status = res.status
    err.body = data
    if (data && typeof data === 'object' && data.error) err.code = data.error
    throw err
  }
  return data
}

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData
  const headers = new Headers(options.headers ?? undefined)
  if (isForm) {
    headers.delete('Content-Type')
  }
  const res = await authFetch(`${LOST_FOUND_API_BASE}${path}`, { ...options, headers })
  return parseResponse(res)
}

export async function uploadLostFoundImage(file) {
  if (!file) return null
  const formData = new FormData()
  formData.append('file', file)
  const result = await request('/upload', {
    method: 'POST',
    body: formData,
  })
  return result?.url || null
}

export async function uploadLostFoundImages(files = []) {
  if (!Array.isArray(files) || files.length === 0) return []
  const uploaded = await Promise.all(files.map((file) => uploadLostFoundImage(file)))
  return uploaded.filter(Boolean)
}

const LOST_REPORT_JSON_KEYS = new Set([
  'type',
  'itemName',
  'category',
  'description',
  'location',
  'dateLost',
  'timeLost',
  'contactName',
  'contactPhone',
  'status',
])

/**
 * User lost report — only strict fields (JSON or multipart with `files` / `files[]`).
 * @param {Record<string, unknown> | FormData} payload
 */
export async function createLostReport(payload) {
  if (payload instanceof FormData) {
    return request('/reports/lost', { method: 'POST', body: payload })
  }
  const src = payload && typeof payload === 'object' ? payload : {}
  const body = {}
  for (const key of LOST_REPORT_JSON_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) continue
    const val = src[key]
    if (val === undefined || val === null) continue
    const str = typeof val === 'string' ? val.trim() : val
    if (str === '') continue
    body[key] = typeof val === 'string' ? str : val
  }
  body.type = 'lost'
  if (!body.status) body.status = 'pending'
  if (!body.timeLost) body.timeLost = '12:00'
  return request('/reports/lost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const FOUND_FORM_FIELDS = new Set([
  'itemName',
  'category',
  'description',
  'locationType',
  'collectionPlace',
  'building',
  'buildingCode',
  'floor',
  'isRoom',
  'roomOrArea',
  'roomArea',
  'campusLocation',
  'location',
  'lastKnownLocation',
])

function normalizeFoundFieldValue(key, value) {
  if (value === undefined || value === null) return null
  if (key === 'isRoom') {
    if (value === true || value === 'true' || value === 'yes') return 'true'
    if (value === false || value === 'false' || value === 'no') return 'false'
    const s = String(value).trim()
    return s === 'yes' ? 'true' : s === 'no' ? 'false' : s || null
  }
  const s = typeof value === 'string' ? value.trim() : String(value)
  return s === '' ? null : s
}

/**
 * User found report — multipart only; at least one `files` entry required by API.
 * @param {Record<string, string | number | boolean | undefined>} fields
 * @param {File[]} files
 */
export async function createFoundReport(fields, files = []) {
  const formData = new FormData()
  const src = fields && typeof fields === 'object' ? fields : {}
  for (const key of FOUND_FORM_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) continue
    const normalized = normalizeFoundFieldValue(key, src[key])
    if (normalized == null) continue
    formData.append(key, normalized)
  }
  const fileList = Array.isArray(files) ? files : []
  for (const f of fileList) {
    if (f instanceof File) formData.append('files', f)
  }
  return request('/reports/found', { method: 'POST', body: formData })
}

export async function getLostFoundItems(params = {}) {
  /** When false (default), hide admin workflow items not meant for the public board. */
  const adminListingMode = params.adminListingMode === true
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'adminListingMode') return
    if (value === undefined || value === null || String(value).trim() === '') return
    qs.set(key, String(value))
  })
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const result = await request(`/items${suffix}`)
  let items = Array.isArray(result?.items) ? result.items.map(normalizeLostFoundItem) : []
  if (!adminListingMode) {
    items = items.filter((i) => {
      const a = String(i.adminStatus).toLowerCase()
      return a !== 'delivered' && a !== 'received'
    })
  }
  return {
    items,
    total: Number(result?.total || 0),
  }
}

export async function getLostFoundItemById(id) {
  const result = await request(`/items/${id}`)
  return normalizeLostFoundItem(result)
}

export async function getLostFoundStats() {
  const result = await request('/stats')
  return {
    total: Number(result?.total || 0),
    active: Number(result?.active || 0),
    pendingVerification: Number(result?.pendingVerification || 0),
  }
}

export async function getLostFoundTimeline(id) {
  const result = await request(`/items/${id}/timeline`)
  return Array.isArray(result?.events) ? result.events : []
}

export async function createLostFoundClaim(id, payload) {
  return request(`/items/${id}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function patchLostFoundItem(id, payload) {
  return request(`/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function notifyLostFoundOwner(id, payload) {
  return request(`/items/${id}/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * @param {object} payload
 * @param {string} [payload.storageBinId]
 * @param {string} [payload.condition] — good | fair | damaged (alias: verifiedCondition)
 * @param {boolean} [payload.confirmAccuracy]
 * @param {string} [payload.adminNotes]
 * @param {File} [payload.intakePhotoFile]
 */
export async function confirmLostFoundReceipt(id, payload = {}) {
  const form = new FormData()
  const storageBinId = payload.storageBinId
  const condition = payload.condition || payload.verifiedCondition
  if (storageBinId) form.append('storageBinId', String(storageBinId).trim())
  if (condition) form.append('condition', String(condition).trim())
  const confirmAccuracy = payload.confirmAccuracy ?? payload.receiptVerified
  if (confirmAccuracy !== undefined && confirmAccuracy !== null) {
    form.append('confirmAccuracy', confirmAccuracy ? 'true' : 'false')
  }
  if (payload.adminNotes) form.append('adminNotes', String(payload.adminNotes).trim())
  if (payload.intakePhotoFile instanceof File) form.append('intakePhotoFile', payload.intakePhotoFile)
  return request(`/items/${id}/confirm-receipt`, { method: 'POST', body: form })
}

/**
 * @param {object} payload
 * @param {string} [payload.claimantName]
 * @param {string} [payload.claimantStudentId]
 * @param {boolean} [payload.studentIdVerified] (alias: handoverVerified)
 * @param {File} [payload.handoverProofFile]
 */
export async function completeLostFoundDelivery(id, payload = {}) {
  const form = new FormData()
  if (payload.claimantName) form.append('claimantName', String(payload.claimantName).trim())
  if (payload.claimantStudentId) form.append('claimantStudentId', String(payload.claimantStudentId).trim())
  const studentIdVerified = payload.studentIdVerified ?? payload.handoverVerified
  if (studentIdVerified !== undefined && studentIdVerified !== null) {
    form.append('studentIdVerified', studentIdVerified ? 'true' : 'false')
  }
  if (payload.handoverProofFile instanceof File) form.append('handoverProofFile', payload.handoverProofFile)
  return request(`/items/${id}/complete-delivery`, { method: 'POST', body: form })
}

export async function getLostFoundClaims(id) {
  const result = await request(`/items/${id}/claims`)
  return Array.isArray(result?.claims) ? result.claims : []
}

/**
 * Category names from `GET /api/v1/categories`, with fallback to distinct categories on listed items.
 */
export async function getLostFoundCategories() {
  try {
    const res = await authFetch(LOST_FOUND_CATEGORIES_URL, { method: 'GET' })
    const data = await parseResponse(res)
    const list = Array.isArray(data) ? data : data?.items || data?.categories || data?.data || []
    const names = list
      .map((c) => (typeof c === 'string' ? c : c?.name))
      .map((n) => String(n || '').trim())
      .filter(Boolean)
    if (names.length) return names
  } catch {
    /* use fallback */
  }
  const result = await getLostFoundItems({ page: 1, limit: 200, type: 'all' })
  return Array.from(
    new Set((result.items || []).map((item) => String(item?.category || '').trim()).filter(Boolean))
  )
}
