import { authFetch } from '../auth'
import { API_BASE } from './apiBase'

// Gateway base (override with VITE_LOST_FOUND_HOST).
const LOST_FOUND_HOST = (import.meta.env.VITE_LOST_FOUND_HOST ?? API_BASE).replace(
  /\/+$/,
  '',
)
const LOST_FOUND_API_BASE = `${LOST_FOUND_HOST}/lostfound/api/lost-and-found`
const LOST_FOUND_CATEGORIES_URL = `${LOST_FOUND_HOST}/lostfound/api/v1/categories`

function normalizeCategoryId(value) {
  if (value === undefined || value === null) return null
  const raw = String(value).trim()
  if (!raw) return null
  const num = Number(raw)
  if (Number.isInteger(num) && num > 0) return num
  return raw
}

function normalizeCategoryOption(category) {
  if (category == null) return null
  if (typeof category === 'string') {
    const name = category.trim()
    return name ? { id: null, name } : null
  }
  if (typeof category !== 'object') return null
  const id = normalizeCategoryId(
    category.id ??
      category.Id ??
      category.categoryId ??
      category.CategoryId
  )
  const name = String(category.name ?? category.Name ?? '').trim()
  if (!name) return null
  return { id, name }
}

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

/**
 * Public `status` from modern API (list/detail projection): `active` | `pending_verification` (snake_case; see LostFound-Frontend-API.md §7).
 * @param {unknown} raw
 * @returns {string}
 */
export function formatPublicStatusForDisplay(raw) {
  if (raw == null && raw !== 0) return 'Pending verification'
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw === 0) return 'Pending verification'
    if (raw === 1) return 'Active'
  }
  const s = String(raw).trim()
  if (!s) return 'Pending verification'
  if (/^\d+$/.test(s)) {
    const n = Math.floor(Number(s))
    if (n === 0) return 'Pending verification'
    if (n === 1) return 'Active'
  }
  const c = s.toLowerCase().replace(/[\s-]+/g, '_')
  if (c === 'active' || c === 'live' || c === 'published' || c === 'listed' || c === 'open') return 'Active'
  if (
    c === 'pending_verification' ||
    c === 'pending' ||
    c === 'new' ||
    c === 'submitted' ||
    c === 'draft' ||
    c === 'unverified' ||
    (c.includes('pending') && c.includes('verif')) ||
    s.toLowerCase().includes('pending verification') ||
    s.toLowerCase().includes('under review') ||
    s.toLowerCase().includes('in review')
  ) {
    return 'Pending verification'
  }
  if (s.length <= 48) {
    return s
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ')
  }
  return s
}

/**
 * Admin `adminStatus`: `pending` | `received` | `delivered` (case-insensitive; §7).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function formatAdminStatusForDisplay(raw) {
  if (raw == null && raw !== 0) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw === 0) return 'Pending'
    if (raw === 1) return 'Received'
    if (raw === 2) return 'Delivered'
  }
  const s = String(raw).trim()
  if (!s) return null
  if (/^\d+$/.test(s)) {
    const n = Math.floor(Number(s))
    if (n === 0) return 'Pending'
    if (n === 1) return 'Received'
    if (n === 2) return 'Delivered'
  }
  const c = s.toLowerCase()
  if (c === 'pending' || c === 'new' || c === 'draft' || c === 'submitted') return 'Pending'
  if (c === 'received' || c === 'in_office' || c === 'in office' || c === 'in-office' || c === 'at office' || c === 'at_office' || c === 'atoffice' || c === 'intake' || c === 'stored' || c === 'in_lostfound') {
    return 'Received'
  }
  if (c === 'delivered' || c === 'completed' || c === 'closed' || c === 'resolved' || c === 'returned' || c === 'handed' || c === 'pickedup') {
    return 'Delivered'
  }
  if (c.length <= 32) {
    return s
      .split(/[\s_-]+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ')
  }
  return s
}

/**
 * When `adminStatus` is missing, infer a workflow for admin UIs.
 * @param {unknown} rawPublic — raw public status from the API (not a display string when avoidable)
 * @returns {'Pending'|'Received'|'Delivered'}
 */
function inferAdminWorkflowFromPublicStatus(rawPublic) {
  if (rawPublic == null) return 'Pending'
  const p = String(rawPublic).toLowerCase().replace(/[\s-]+/g, '_')
  if (
    p === 'returned' ||
    p === 'returned_to_owner' ||
    p === 'returnedtoowner' ||
    p === 'collected' ||
    p === 'handed' ||
    p === 'handedover' ||
    p === 'closed' ||
    p === 'resolved' ||
    p === 'archived' ||
    p === 'fulfilled' ||
    (p.includes('deliver') && p.includes('complet')) ||
    (p.includes('pickup') && p.includes('complet'))
  ) {
    return 'Delivered'
  }
  if (p === 'in_office' || p === 'inoffice' || p === 'in_offce' || p === 'at_office' || p === 'atoffice' || p === 'stored' || p === 'receipt' || p === 'receiv') {
    return 'Received'
  }
  if (p === 'pending' || p === 'pending_verification' || p.includes('verif') || p === 'unverified' || p === 'submitted' || p === 'draft' || p === 'new') {
    return 'Pending'
  }
  if (p === 'active' || p === 'live' || p === 'published' || p === 'listed' || p === 'open') return 'Pending'
  return 'Pending'
}

/**
 * Gather admin workflow value from the API, including nested or alternate property names.
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {unknown}
 */
function collectAdminRawValue(item) {
  if (!item || typeof item !== 'object') return null
  const cands = [
    item.adminStatus,
    item.AdminStatus,
    item.admin_status,
    item.itemAdminStatus,
    item.ItemAdminStatus,
    item.staffStatus,
    item.StaffStatus,
    item.staff_status,
    item.processingStatus,
    item.ProcessingStatus,
    item.workFlowStatus,
    item.WorkflowStatus,
    item.workflow,
    item.Workflow,
    item.ItemWorkflow,
    item.adminWorkflowStatus,
    item.AdminWorkflowStatus,
    item.adminWorkflow,
    item.AdminWorkflow,
  ]
  for (const c of cands) {
    if (c == null) continue
    if (c === '' && c !== 0) continue
    if (typeof c === 'string' && !c.trim()) continue
    return c
  }
  const ext = item.admin
  if (ext && typeof ext === 'object') {
    return ext.status ?? ext.Status ?? ext.adminStatus ?? null
  }
  return null
}

const pickStr = (o, keys) => {
  if (!o) return ''
  for (const k of keys) {
    const v = o[k]
    if (v == null || v === false) continue
    const s = String(v).trim()
    if (s) return s
  }
  return ''
}

const pickTimeLike = (o, keys) => {
  for (const k of keys) {
    const v = o[k]
    if (v == null) continue
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v
    const t = new Date(String(v))
    if (!Number.isNaN(t.getTime())) return t
  }
  return null
}

/**
 * When the API does not return `adminStatus` but the item was processed, infer from other fields
 * (storage, intake, handover) so a full page refresh still matches the server.
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {'Pending' | 'Received' | 'Delivered' | null}
 */
function inferAdminStatusFromItemSignals(item) {
  if (!item || typeof item !== 'object') return null
  if (item.deliveryComplete === true || item.DeliveryComplete === true || item.isDelivered === true) return 'Delivered'
  if (item.handoverComplete === true || item.HandoverComplete === true) return 'Delivered'
  if (item.returnedToOwner === true || item.ReturnedToOwner === true) return 'Delivered'
  if (
    pickTimeLike(item, [
      'handoverCompletedAt',
      'HandoverCompletedAt',
      'deliveredAt',
      'DeliveredAt',
      'pickedUpAt',
      'PickedUpAt',
      'returnedAt',
      'ReturnedAt',
      'collectionClosedAt',
    ])
  ) {
    return 'Delivered'
  }
  const outStatus = String(item.outboundStatus || item.fulfillmentStatus || '').toLowerCase()
  if (outStatus && (outStatus.includes('deliver') || outStatus.includes('complet') || outStatus.includes('return'))) {
    if (!outStatus.includes('receiv') && !outStatus.includes('pend')) return 'Delivered'
  }
  if (String(item.publishingStatus || '').toLowerCase().includes('delivered')) return 'Delivered'
  const carry = String(item.carryStatus || item.CarryStatus || '')
    .toLowerCase()
  if (carry.includes('deliv')) return 'Delivered'
  if (carry.includes('receiv') || carry.includes('office') || carry.includes('store')) return 'Received'

  const storageBin = pickStr(item, ['storageBinId', 'StorageBinId', 'binId', 'storageBin', 'StorageBin', 'intakeBin'])
  if (storageBin && !/^(n\/a|none|—|-|null)$/i.test(storageBin)) return 'Received'
  if (
    pickTimeLike(item, [
      'receiptConfirmedAt',
      'ReceiptConfirmedAt',
      'intakeAt',
      'IntakeAt',
      'officeReceivedAt',
      'OfficeReceivedAt',
      'ReceivedAt',
      'receivedAt',
    ])
  ) {
    return 'Received'
  }
  if (item.receiptVerified === true || item.intakeComplete === true || item.receiptComplete === true) {
    return 'Received'
  }
  const intakeRef = pickStr(item, [
    'intakePhotoUrl',
    'intakeImageUrl',
    'IntakeImageUrl',
    'intakeFileUrl',
    'IntakeFileUrl',
    'verifiedIntakeImageUrl',
  ])
  if (intakeRef) return 'Received'
  const vcond = pickStr(item, ['verifiedCondition', 'VerifiedCondition', 'itemCondition', 'receiptCondition'])
  if (vcond && (storageBin || intakeRef)) return 'Received'

  return null
}

/**
 * Resolves a single display admin label (Pending | Received | …) for both normalized
 * and raw DTOs: explicit admin fields, then item signals, then public status fallbacks.
 * @param {Record<string, unknown> | null | undefined} item
 * @param {unknown} [rawPublicHint] — prefer API `status` (before display normalization) when you have it
 * @returns {string}
 */
function resolveDisplayAdminStatus(item, rawPublicHint) {
  const fromApi = formatAdminStatusForDisplay(collectAdminRawValue(item))
  if (fromApi != null) return fromApi
  const fromSig = inferAdminStatusFromItemSignals(item)
  if (fromSig != null) return fromSig
  const fromRest = formatAdminStatusForDisplay(item?.adminStatus)
  if (fromRest != null) return fromRest
  const rawPub = rawPublicHint !== undefined
    ? rawPublicHint
    : item
      ? item.status != null
        ? item.status
        : item.Status
      : null
  return inferAdminWorkflowFromPublicStatus(rawPub)
}

/**
 * Resolves staff workflow for admin dashboard buttons (pending → received → delivered).
 * Tolerates casing, minor API label drift, and `admin_status` snake_case on DTOs.
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {'pending' | 'received' | 'delivered'}
 */
export function getLostFoundAdminWorkflowPhase(item) {
  if (!item || typeof item !== 'object') return 'pending'
  // Same public hint as normalizeLostFoundItem, plus a few common alternate names on DTOs.
  const publicHint =
    item?.status != null
      ? item.status
      : (item?.Status != null
          ? item.Status
          : item.state ?? item.State ?? item.itemStatus)
  const display = resolveDisplayAdminStatus(item, publicHint)
  const t = String(display).trim().toLowerCase()
  if (
    t === 'delivered' ||
    t === 'returned' ||
    t === 'completed' ||
    t === 'closed' ||
    t === 'resolved' ||
    t.includes('handover') ||
    (t.includes('pickup') && t.includes('complet'))
  ) {
    return 'delivered'
  }
  if (
    t === 'received' ||
    t.includes('in office') ||
    t.includes('intake') ||
    t === 'stored' ||
    (t.includes('receiv') && !t.includes('unreceiv') && t !== 'delivered')
  ) {
    return 'received'
  }
  return 'pending'
}

/**
 * Map a display status label to badge CSS: active | pending | received | declined.
 * @param {string} statusLabel
 */
export function getLostFoundStatusBadgeVariant(statusLabel) {
  const t = String(statusLabel || '').toLowerCase()
  if (t === 'active' || t === 'claimed') return 'active'
  if (t === 'delivered' || t === 'returned' || t === 'completed' || t === 'closed' || t === 'resolved') {
    return 'active'
  }
  if (t === 'received' || t.includes('in office') || t === 'in-office' || t.includes('at office') || t === 'in lostfound' || t === 'stored' || t === 'intake' || t === 'inoffice' || t.includes('ready for pickup')) {
    return 'received'
  }
  if (t.includes('declin') || t === 'canceled' || t === 'cancelled' || t.includes('reject') || t.includes('archiv')) {
    return 'declined'
  }
  if (t === 'pending verification' || t.includes('pending verif') || t.includes('verif') || t === 'pending' || t.includes('review') || t === 'unverified' || t === 'submitted' || t === 'draft' || t === 'new') {
    return 'pending'
  }
  return 'pending'
}

/**
 * `status` = public catalog label (Active | Pending verification).
 * `adminStatus` = staff workflow (Pending | Received | Delivered), inferred when the API omits it.
 * @param {Record<string, unknown> | null | undefined} item
 */
function normalizeLostFoundItem(item) {
  if (!item || typeof item !== 'object') return item
  const images = Array.isArray(item.images) ? item.images : []
  const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls : []
  const mappedImages = images.map(normalizeMediaUrl).filter(Boolean)
  const mappedImageUrls = imageUrls.map(normalizeMediaUrl).filter(Boolean)
  const image = normalizeMediaUrl(item.image || mappedImageUrls[0] || mappedImages[0])
  const rawPublic = item.status ?? item.Status
  const publicLabel = formatPublicStatusForDisplay(rawPublic)
  const adminStatus = resolveDisplayAdminStatus(item, rawPublic)
  const ownerClaimsCount = Number(item.ownerClaimsCount ?? item.OwnerClaimsCount ?? 0) || 0
  const finderClaimsCount = Number(item.finderClaimsCount ?? item.FinderClaimsCount ?? 0) || 0
  const title = String(item.title || item.itemName || '').trim() || 'Untitled item'
  return {
    ...item,
    title,
    status: publicLabel,
    adminStatus,
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
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text || null
  }
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
  'categoryId',
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
  const categoryId = normalizeCategoryId(src.categoryId ?? src.category)
  if (categoryId != null) body.categoryId = categoryId
  for (const key of LOST_REPORT_JSON_KEYS) {
    if (key === 'categoryId') continue
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
  'categoryId',
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
  const categoryId = normalizeCategoryId(src.categoryId ?? src.category)
  if (categoryId != null) {
    formData.append('categoryId', String(categoryId))
  }
  for (const key of FOUND_FORM_FIELDS) {
    if (key === 'categoryId') continue
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
  /**
   * `adminListingMode: true` — do not client-filter; admin/leader need all workflow states.
   * `false` — public board: from the raw response, show everything except **handover complete**
   * (`adminStatus` phase `delivered`), so items **in office** (`received`) stay discoverable
   * for pickup. (Gateway §1.2 may still omit `received`/`delivered` for non–role callers; that is server-side.)
   */
  const adminListingMode = params.adminListingMode === true
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'adminListingMode') return
    if (value === undefined || value === null || String(value).trim() === '') return
    qs.set(key, String(value))
  })
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const result = await request(`/items${suffix}`)
  let rawItems = Array.isArray(result?.items) ? result.items : []
  if (!adminListingMode) {
    rawItems = rawItems.filter((i) => {
      const ph = getLostFoundAdminWorkflowPhase(i)
      return ph !== 'delivered'
    })
  }
  const items = rawItems.map(normalizeLostFoundItem)
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
 * Category options from `GET /api/v1/categories`, with fallback to distinct categories on listed items.
 */
export async function getLostFoundCategories() {
  try {
    const res = await authFetch(LOST_FOUND_CATEGORIES_URL, { method: 'GET' })
    const data = await parseResponse(res)
    const list = Array.isArray(data) ? data : data?.items || data?.categories || data?.data || []
    const categories = list
      .map(normalizeCategoryOption)
      .filter(Boolean)
    if (categories.length) return categories
  } catch {
    /* use fallback */
  }
  const result = await getLostFoundItems({ page: 1, limit: 200, type: 'all' })
  return Array.from(
    new Map(
      (result.items || [])
        .map((item) =>
          normalizeCategoryOption({
            id: item?.categoryId ?? item?.CategoryId,
            name: item?.category,
          })
        )
        .filter(Boolean)
        .map((category) => [String(category.id ?? `name:${category.name.toLowerCase()}`), category])
    ).values()
  )
}
