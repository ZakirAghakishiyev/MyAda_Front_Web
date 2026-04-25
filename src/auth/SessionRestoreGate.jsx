import React, { useEffect, useState } from 'react'
import { getAccessToken, getRefreshToken } from './tokenStorage'
import { refreshSession } from './authClient'

/**
 * sessionStorage is per-tab; refresh token is in a cookie (shared).
 * Before rendering protected UI, restore access from refresh when needed.
 */
export function SessionRestoreGate({ children }) {
  const [ready, setReady] = useState(() =>
    typeof window === 'undefined' ? true : Boolean(getAccessToken() || !getRefreshToken())
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!getAccessToken() && getRefreshToken()) {
        await refreshSession()
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '40vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: 14,
        }}
      >
        Restoring session…
      </div>
    )
  }

  return children
}
