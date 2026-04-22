import { authFetch } from '../auth'

// Base should point to the Location service or gateway prefix (no trailing slash).
// Examples:
// - Local:    http://localhost:5010
// - Gateway:  http://<host>:5000/location
const LOCATION_API_BASE = (
  import.meta.env.VITE_LOCATION_API_BASE ?? 'http://13.60.31.141:5000/location'
).replace(/\/+$/, '')

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '')
  const p = String(path || '')
  return `${b}${p.startsWith('/') ? '' : '/'}${p}`
}

function baseWithoutLocationSuffix() {
  return LOCATION_API_BASE.replace(/\/location$/i, '')
}

function unwrapAutoWrapper(data) {
  if (data == null || typeof data !== 'object') return data
  if (Object.prototype.hasOwnProperty.call(data, 'result') && data.result !== undefined) return data.result
  if (Object.prototype.hasOwnProperty.call(data, 'data') && data.data !== undefined) return data.data
  return data
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
    const msg =
      data && typeof data === 'object'
        ? data.message || data.title || data.detail || `Request failed (${res.status})`
        : data
          ? String(data)
          : `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.body = data
    throw err
  }
  return unwrapAutoWrapper(data)
}

async function request(path, options = {}) {
  const p = String(path || '')
  const baseRoot = baseWithoutLocationSuffix()
  const candidates = [
    // If base is the service root (no /location)
    joinUrl(baseRoot, `/api/v1${p}`),
    joinUrl(baseRoot, `/api/v1/locations${p}`),
    joinUrl(baseRoot, `/location/api/v1${p}`),
    joinUrl(baseRoot, `/location/api/v1/locations${p}`),

    // If base already includes /location
    joinUrl(LOCATION_API_BASE, `/api/v1${p}`),
    joinUrl(LOCATION_API_BASE, `/api/v1/locations${p}`),
    joinUrl(LOCATION_API_BASE, p),
  ].filter(Boolean)

  let lastErr
  for (const url of candidates) {
    try {
      const res = await authFetch(url, options)
      return await parseResponse(res)
    } catch (e) {
      lastErr = e
      // only retry on 404; other errors should surface
      if (e?.status !== 404) throw e
    }
  }
  throw lastErr
}

async function requestMany(paths, options = {}) {
  const list = Array.isArray(paths) ? paths : [paths]
  let lastErr
  for (const p of list) {
    try {
      return await request(p, options)
    } catch (e) {
      lastErr = e
      if (e?.status !== 404) throw e
    }
  }
  throw lastErr
}

export async function getBuildings() {
  const result = await requestMany(['/buildings', '/locations/buildings'])
  return Array.isArray(result) ? result : []
}

export async function getRoomsByBuildingId(buildingId) {
  if (!buildingId) return []
  const result = await requestMany(
    [`/rooms/by-building/${buildingId}`, `/locations/rooms/by-building/${buildingId}`]
  )
  return Array.isArray(result) ? result : []
}

export async function validateRoomLocation(roomId, buildingId) {
  const result = await request('/locations/validate-room-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId: Number(roomId), buildingId: Number(buildingId) }),
  })
  return Boolean(result)
}
