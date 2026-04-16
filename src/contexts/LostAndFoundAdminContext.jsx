import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  completeLostFoundDelivery,
  confirmLostFoundReceipt,
  getLostFoundItemById,
  getLostFoundItems,
  notifyLostFoundOwner,
  patchLostFoundItem,
} from '../api/lostFoundApi'

const LostAndFoundAdminContext = createContext(null)

export function LostAndFoundAdminProvider({ children }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshItems = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getLostFoundItems({ page: 1, limit: 200 })
      setItems(Array.isArray(result.items) ? result.items : [])
    } catch (err) {
      setError(err?.message || 'Failed to load admin items.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshItems()
  }, [refreshItems])

  const setItemStatus = useCallback((itemId, adminStatus) => {
    return patchLostFoundItem(itemId, { adminStatus }).then(() => refreshItems())
  }, [refreshItems])

  const notifyOwner = useCallback((itemId, message = '') => {
    return notifyLostFoundOwner(itemId, { channel: 'email', message })
  }, [])

  const confirmReceipt = useCallback(async (itemId, payload = {}) => {
    try {
      await confirmLostFoundReceipt(itemId, payload)
    } catch (err) {
      // Some backend builds validate strict DTOs for confirm endpoints.
      // Fallback to status patch so admin flow remains operational.
      if (err?.status === 400 || err?.status === 404 || err?.status === 405) {
        await patchLostFoundItem(itemId, { adminStatus: 'Received' })
      } else {
        throw err
      }
    }
    await refreshItems()
  }, [refreshItems])

  const confirmHandover = useCallback(async (itemId, payload = {}) => {
    try {
      await completeLostFoundDelivery(itemId, payload)
    } catch (err) {
      if (err?.status === 400 || err?.status === 404 || err?.status === 405) {
        await patchLostFoundItem(itemId, { adminStatus: 'Delivered' })
      } else {
        throw err
      }
    }
    await refreshItems()
  }, [refreshItems])

  const updateItem = useCallback((itemId, updates) => {
    return patchLostFoundItem(itemId, updates).then(() => refreshItems())
  }, [refreshItems])

  const getItem = useCallback(async (itemId) => {
    const local = items.find((it) => String(it.id) === String(itemId))
    if (local) return local
    return getLostFoundItemById(itemId)
  }, [items])

  const value = {
    items,
    isLoading,
    error,
    setItemStatus,
    updateItem,
    notifyOwner,
    confirmReceipt,
    confirmHandover,
    getItem,
    refreshItems
  }
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
