import { authFetch } from '../auth'

const LOCATION_API_BASE = 'http://13.60.31.141:5000/location/api/v1'

async function parseResponse(res) {
  if (res.status === 204) return null
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`)
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

async function request(path, options = {}) {
  const res = await authFetch(`${LOCATION_API_BASE}${path}`, options)
  return parseResponse(res)
}

export async function getBuildings() {
  const result = await request('/buildings')
  return Array.isArray(result) ? result : []
}

export async function getRoomsByBuildingId(buildingId) {
  if (!buildingId) return []
  const result = await request(`/rooms/by-building/${buildingId}`)
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
