import React, { createContext, useCallback, useContext } from 'react'
import {
  completeLostFoundDelivery,
  confirmLostFoundReceipt,
  getLostFoundClaims,
  getLostFoundItemById,
  getLostFoundItems,
  getLostFoundTimeline,
  notifyLostFoundOwner,
  patchLostFoundItem,
} from '../api/lostFoundApi'

const LostAndFoundAdminContext = createContext(null)

function normalizeItemsResult(result) {
  return {
    items: Array.isArray(result?.items) ? result.items : [],
    total: Number(result?.total || 0),
  }
}

export function LostAndFoundAdminProvider({ children }) {
  const fetchItems = useCallback(async (params = {}) => {
    const result = await getLostFoundItems({
      ...params,
      adminListingMode: true,
    })
    return normalizeItemsResult(result)
  }, [])

  const fetchStatusTotals = useCallback(async () => {
    const baseParams = { page: 1, limit: 1 }
    const [pending, received, delivered] = await Promise.all([
      fetchItems({ ...baseParams, adminStatus: 'pending' }),
      fetchItems({ ...baseParams, adminStatus: 'received' }),
      fetchItems({ ...baseParams, adminStatus: 'delivered' }),
    ])
    return {
      pending: pending.total,
      received: received.total,
      delivered: delivered.total,
    }
  }, [fetchItems])

  const fetchItemDetail = useCallback(async (itemId) => {
    const [item, timeline, claims] = await Promise.all([
      getLostFoundItemById(itemId),
      getLostFoundTimeline(itemId),
      getLostFoundClaims(itemId),
    ])
    return {
      item,
      timeline: Array.isArray(timeline) ? timeline : [],
      claims: Array.isArray(claims) ? claims : [],
    }
  }, [])

  const setItemStatus = useCallback((itemId, adminStatus) => {
    return patchLostFoundItem(itemId, { adminStatus })
  }, [])

  const updateItem = useCallback((itemId, updates) => {
    return patchLostFoundItem(itemId, updates)
  }, [])

  const notifyOwner = useCallback((itemId, message = '') => {
    return notifyLostFoundOwner(itemId, { channel: 'email', message })
  }, [])

  const confirmReceipt = useCallback((itemId, payload = {}) => {
    return confirmLostFoundReceipt(itemId, payload)
  }, [])

  const confirmHandover = useCallback((itemId, payload = {}) => {
    return completeLostFoundDelivery(itemId, payload)
  }, [])

  const value = {
    fetchItems,
    fetchStatusTotals,
    fetchItemDetail,
    setItemStatus,
    updateItem,
    notifyOwner,
    confirmReceipt,
    confirmHandover,
  }

  return (
    <LostAndFoundAdminContext.Provider value={value}>
      {children}
    </LostAndFoundAdminContext.Provider>
  )
}

export function useLostAndFoundAdmin() {
  const ctx = useContext(LostAndFoundAdminContext)
  if (!ctx) {
    throw new Error('useLostAndFoundAdmin must be used within LostAndFoundAdminProvider')
  }
  return ctx
}
