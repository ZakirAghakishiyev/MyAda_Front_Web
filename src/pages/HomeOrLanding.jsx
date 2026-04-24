import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getAccessToken } from '../auth/tokenStorage'
import Home from './Home'
import HomeLanding from './HomeLanding'

/**
 * `/` when signed out: marketing-style login landing.
 * Re-evaluates when the route updates (e.g. return from `/login` or after logout to `/`).
 */
const HomeOrLanding = () => {
  const location = useLocation()
  const isAuthed = useMemo(
    () => Boolean(getAccessToken()),
    // key changes on navigation; pathname covers direct visits
    [location.key, location.pathname, location.search]
  )

  if (!isAuthed) {
    return <HomeLanding />
  }
  return <Home />
}

export default HomeOrLanding
