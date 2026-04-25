import React, { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken } from '../auth/tokenStorage'
import Home from './Home'

/**
 * `/` when signed out: go straight to login (no intermediate marketing page).
 * When signed in: main home content.
 */
const HomeOrLanding = () => {
  const location = useLocation()
  const isAuthed = useMemo(
    () => Boolean(getAccessToken()),
    [location.key, location.pathname, location.search]
  )

  if (!isAuthed) {
    const redirectPath = `${location.pathname}${location.search}` || '/'
    const qs = new URLSearchParams({ redirect: redirectPath })
    return <Navigate to={`/login?${qs.toString()}`} replace />
  }
  return <Home />
}

export default HomeOrLanding
