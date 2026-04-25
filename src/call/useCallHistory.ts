import { useCallback, useEffect, useState } from 'react'
import { fetchCallHistory } from './callHistoryApi'
import { subscribeCallHistoryInvalidate } from './callHistoryInvalidate'
import type { CallHistoryFilter, CallHistoryItem } from './types'

const DEFAULT_LIMIT = 50

export function useCallHistory(initialFilter: CallHistoryFilter = 'all') {
  const [filter, setFilter] = useState<CallHistoryFilter>(initialFilter)
  const [items, setItems] = useState<CallHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchCallHistory({
        status: filter === 'all' ? undefined : filter,
        limit: DEFAULT_LIMIT,
      })
      setItems(list)
    } catch (e) {
      setItems([])
      setError(e instanceof Error ? e.message : 'Could not load call history.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    return subscribeCallHistoryInvalidate(() => {
      void reload()
    })
  }, [reload])

  return {
    filter,
    setFilter,
    items,
    loading,
    error,
    reload,
  }
}
