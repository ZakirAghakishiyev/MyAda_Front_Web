import React, { createContext, useContext, useState, useCallback } from 'react'
import { mockItems } from '../data/lostAndFoundItems'

const LostAndFoundAdminContext = createContext(null)

export function LostAndFoundAdminProvider({ children }) {
  const [items, setItems] = useState(() =>
    mockItems.map((item) => ({ ...item, adminStatus: item.adminStatus || 'Pending' }))
  )

  const setItemStatus = useCallback((itemId, adminStatus) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, adminStatus } : it))
    )
  }, [])

  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it))
    )
  }, [])

  const value = { items, setItemStatus, updateItem }
  return (
    <LostAndFoundAdminContext.Provider value={value}>
      {children}
    </LostAndFoundAdminContext.Provider>
  )
}

export function useLostAndFoundAdmin() {
  const ctx = useContext(LostAndFoundAdminContext)
  if (!ctx) throw new Error('useLostAndFoundAdmin must be used within LostAndFoundAdminProvider')
  return ctx
}
