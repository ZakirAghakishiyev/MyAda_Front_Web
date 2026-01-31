import React, { createContext, useContext, useState } from 'react'

const CancelledRequestsContext = createContext(null)

export function CancelledRequestsProvider({ children }) {
  const [cancelled, setCancelled] = useState({})

  const cancelRequest = (id, reason) => {
    setCancelled((prev) => ({ ...prev, [id]: reason }))
  }

  const getCancelReason = (id) => cancelled[id] ?? null

  const isCancelled = (id) => id in cancelled

  return (
    <CancelledRequestsContext.Provider value={{ cancelled, cancelRequest, getCancelReason, isCancelled }}>
      {children}
    </CancelledRequestsContext.Provider>
  )
}

export function useCancelledRequests() {
  const ctx = useContext(CancelledRequestsContext)
  if (!ctx) {
    return {
      cancelled: {},
      cancelRequest: () => {},
      getCancelReason: () => null,
      isCancelled: () => false
    }
  }
  return ctx
}
