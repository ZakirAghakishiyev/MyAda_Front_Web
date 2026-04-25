import React, { useEffect, useState } from 'react'
import { getAccessToken, getRefreshToken } from './tokenStorage'
import { refreshSession } from './authClient'

/**
 * Access token in sessionStorage; refresh token in a **session** cookie (no Max-Age), both cleared when the browser session ends.
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
