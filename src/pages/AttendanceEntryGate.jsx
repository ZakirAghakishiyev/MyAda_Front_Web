import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken } from '../auth'

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function readRoleClaims(payload) {
  if (!payload || typeof payload !== 'object') return []
  const raw = [
    payload.role,
    payload.roles,
    payload.userType,
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
  ].flat()
  return raw
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
}

function readUserIdClaim(payload) {
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
  const location = useLocation()
  const fromHome = Boolean(location.state?.fromHome)
  if (!fromHome) return <Navigate to="/attendance/demo" replace />

  const token = getAccessToken()
  const payload = decodeJwtPayload(token)
  const roles = readRoleClaims(payload).map((r) => r.toLowerCase())
  const isAllowed = roles.includes('instructor') || roles.includes('admin')
  if (!isAllowed) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Access denied</h2>
        <p>Only Instructor or Admin users can access QR attendance.</p>
      </div>
    )
  }

  const instructorId = readUserIdClaim(payload)
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

