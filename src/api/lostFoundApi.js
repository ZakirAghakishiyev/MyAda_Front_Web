import { authFetch } from '../auth'

const LOST_FOUND_API_BASE = 'http://13.60.31.141:5000/lostfound/api/lost-and-found'
const LOST_FOUND_HOST = 'http://13.60.31.141:5000'

function normalizeMediaUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.startsWith('data:')) return raw
  if (raw.startsWith('/')) return `${LOST_FOUND_HOST}${raw}`
  if (/^https?:\/\//i.test(raw)) return raw
  // Backend may return Docker/private hostnames such as lostfoundservice:8080.
  if (/^[a-z0-9-]+:\d+\//i.test(raw)) {
    const slashAt = raw.indexOf('/')
    const pathOnly = slashAt >= 0 ? raw.slice(slashAt) : ''
    return `${LOST_FOUND_HOST}${pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`}`
  }
  if (raw.startsWith('uploads/')) return `${LOST_FOUND_HOST}/${raw}`
  return raw
}

/**
 * Public listing `status` (e.g. Active) + workflow `adminStatus` (Pending, Received, Delivered).
 * Cards and lists use `status` for display — prefer a non-empty public status, else admin.
 */
function normalizeLostFoundItem(item) {
  if (!item || typeof item !== 'object') return item
  const images = Array.isArray(item.images) ? item.images : []
  const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls : []
  const mappedImages = images.map(normalizeMediaUrl).filter(Boolean)
  const mappedImageUrls = imageUrls.map(normalizeMediaUrl).filter(Boolean)
  const image = normalizeMediaUrl(item.image || mappedImageUrls[0] || mappedImages[0])
  const adminStatus = String(item.adminStatus != null && String(item.adminStatus).trim() !== '' ? item.adminStatus : 'Pending')
  const publicStatus = item.status != null && String(item.status).trim() !== '' ? String(item.status).trim() : ''
  const status = publicStatus || adminStatus
  return {
    ...item,
    adminStatus,
    status,
    image,
    imageUrls: mappedImageUrls.length ? mappedImageUrls : mappedImages,
    images: mappedImages,
  }
}

async function parseResponse(res) {
  if (res.status === 204) return null
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

async function request(path, options = {}) {
  const res = await authFetch(`${LOST_FOUND_API_BASE}${path}`, options)
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

export async function createLostReport(payload) {
  return request('/reports/lost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function createFoundReport(payload) {
  return request('/reports/found', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getLostFoundItems(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === '') return
    qs.set(key, String(value))
  })
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const result = await request(`/items${suffix}`)
  return {
    items: Array.isArray(result?.items) ? result.items.map(normalizeLostFoundItem) : [],
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

export async function confirmLostFoundReceipt(id, payload) {
  return request(`/items/${id}/confirm-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function completeLostFoundDelivery(id, payload) {
  return request(`/items/${id}/complete-delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getLostFoundCategories() {
  const result = await getLostFoundItems({ page: 1, limit: 200, type: 'all' })
  const categories = Array.from(
    new Set((result.items || []).map((item) => String(item?.category || '').trim()).filter(Boolean))
  )
  return categories
}
