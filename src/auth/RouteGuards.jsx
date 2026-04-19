import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAccessToken } from './tokenStorage'
import { userHasJwtAdminRole, userHasStudentServicesRole } from './jwtRoles'
import { fetchMyClubMemberships } from '../api/clubApi'
import { roleMayManageClub } from './clubStaffRoles'

function loginRedirectPath(fromPath) {
  const q = new URLSearchParams()
  q.set('redirect', fromPath || '/')
  return `/login?${q.toString()}`
}

/** Any authenticated user may access nested routes (all `/clubs/*`). */
export function RequireAuth() {
  const location = useLocation()
  if (!getAccessToken()) {
    return <Navigate to={loginRedirectPath(location.pathname + location.search)} replace />
  }
  return <Outlet />
}

/** Student Services: signed-in + (system Admin OR `student-services` JWT role). */
export function RequireStudentServices({ children }) {
  const location = useLocation()
  if (!getAccessToken()) {
    return <Navigate to={loginRedirectPath(location.pathname + location.search)} replace />
  }
  if (userHasJwtAdminRole() || userHasStudentServicesRole()) {
    return children
  }
  return <Navigate to="/" replace />
}

/**
 * Club admin portal: system Admin, or at least one club membership with a staff/officer role.
 * Per-club access for `?club=` is still enforced in ClubAdminLayout / API.
 */
export function RequireClubAdminPortal({ children }) {
  const location = useLocation()
  const token = getAccessToken()
  const admin = userHasJwtAdminRole()
  const [gate, setGate] = useState(() => {
    if (!token) return 'login'
    if (admin) return 'allow'
    return 'loading'
  })

  useEffect(() => {
    if (!token) {
      setGate('login')
      return
    }
    if (userHasJwtAdminRole()) {
      setGate('allow')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const raw = await fetchMyClubMemberships()
        const items = raw?.items ?? raw ?? []
        const rows = Array.isArray(items) ? items : []
        const hasStaff = rows.some((row) => {
          const role = String(row.role ?? row.membershipRole ?? '')
          return roleMayManageClub(role)
        })
        if (!cancelled) setGate(hasStaff ? 'allow' : 'deny')
      } catch {
        if (!cancelled) setGate('deny')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  if (!token || gate === 'login') {
    return <Navigate to={loginRedirectPath(location.pathname + location.search)} replace />
  }
  if (gate === 'loading') {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        Checking club admin access…
      </div>
    )
  }
  if (gate === 'deny') {
    return <Navigate to="/" replace />
  }
  return children
}
