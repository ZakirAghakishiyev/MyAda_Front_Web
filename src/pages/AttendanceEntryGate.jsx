import React from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken } from '../auth'
import { decodeJwtPayload, readJwtRoleClaims, getJwtUserId, userHasJwtAdminRole } from '../auth/jwtRoles'

function readUserIdFromPayload(payload) {
  const fromHelper = getJwtUserId()
  if (fromHelper) return fromHelper
  if (!payload || typeof payload !== 'object') return ''
  const candidates = [
    payload.userId,
    payload.user_id,
    payload.sub,
    payload.uid,
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
  ]
  return String(candidates.find((v) => String(v ?? '').trim()) ?? '').trim()
}

export default function AttendanceEntryGate() {
  const token = getAccessToken()
  if (!token) {
    const q = new URLSearchParams()
    q.set('redirect', '/attendance')
    return <Navigate to={`/login?${q.toString()}`} replace />
  }

  const payload = decodeJwtPayload(token)
  const roles = readJwtRoleClaims(payload).map((r) => r.toLowerCase())
  const isInstructor = roles.includes('instructor')
  const isAdmin = userHasJwtAdminRole() || roles.includes('admin') || roles.includes('administrator')
  if (!isInstructor && !isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Access denied</h2>
        <p>Only Instructor or Admin users can access QR attendance.</p>
      </div>
    )
  }

  const instructorId = readUserIdFromPayload(payload)
  if (!instructorId) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Access denied</h2>
        <p>Instructor id is missing in auth token.</p>
      </div>
    )
  }
  return <Navigate to={`/attendance/${encodeURIComponent(instructorId)}`} replace />
}

