import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { deleteNotification, fetchNotifications } from '../api/notificationApi'
import { getAccessToken } from '../auth/tokenStorage'
import { getJwtUserId } from '../auth/jwtRoles'
import { notificationHubClient } from './notificationHubClient'

const NotificationContext = createContext(null)

const POLL_INTERVAL_MS = 60 * 1000

function compareByNewest(a, b) {
  const aTime = new Date(a?.createdAt || 0).getTime()
  const bTime = new Date(b?.createdAt || 0).getTime()
  return bTime - aTime
}

function mergeNotifications(nextItems, previousItems = []) {
  const merged = new Map()
  ;[...nextItems, ...previousItems].forEach((item) => {
    if (!item?.id) return
    const existing = merged.get(item.id)
    merged.set(item.id, existing ? { ...existing, ...item } : item)
  })
  return [...merged.values()].sort(compareByNewest)
}

function storageKeyForUser(userId) {
  return `notification-read-state:${String(userId || 'anonymous')}`
}

function normalizeIdentityPart(value) {
  return String(value || '').trim().toLowerCase()
}

function notificationMatchesUser(item, userId) {
  const targetUserId = normalizeIdentityPart(userId)
  const itemUserId = normalizeIdentityPart(item?.recipientUserId)

  if (!targetUserId) return true
  if (!itemUserId) return false
  return itemUserId === targetUserId
}

function ensureAudioContext(audioContextRef) {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContextRef.current) {
    audioContextRef.current = new AudioContextCtor()
  }
  return audioContextRef.current
}

async function primeNotificationAudio(audioContextRef) {
  const context = ensureAudioContext(audioContextRef)
  if (!context) return false
  if (context.state === 'suspended') {
    try {
      await context.resume()
    } catch {
      return false
    }
  }
  return context.state === 'running'
}

async function playNotificationChime(audioContextRef) {
  const ready = await primeNotificationAudio(audioContextRef)
  if (!ready) return

  const context = audioContextRef.current
  if (!context) return

  const now = context.currentTime
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
  gain.connect(context.destination)

  const first = context.createOscillator()
  first.type = 'sine'
  first.frequency.setValueAtTime(784, now)
  first.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18)
  first.connect(gain)
  first.start(now)
  first.stop(now + 0.2)

  const second = context.createOscillator()
  second.type = 'triangle'
  second.frequency.setValueAtTime(1174.66, now + 0.08)
  second.frequency.exponentialRampToValueAtTime(1318.51, now + 0.24)
  second.connect(gain)
  second.start(now + 0.08)
  second.stop(now + 0.32)
}

function loadReadState(userId) {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId))
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistReadState(userId, readState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(readState))
  } catch {
    /* ignore storage failures */
  }
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [connectionState, setConnectionState] = useState('disconnected')
  const [readState, setReadState] = useState({})
  const audioContextRef = useRef(null)
  const lastConnectionStateRef = useRef('disconnected')

  const accessToken = getAccessToken()
  const userId = getJwtUserId() || ''
  const identityKey = normalizeIdentityPart(userId) || 'anonymous'
  const loggedIn = Boolean(accessToken)

  useEffect(() => {
    setItems([])
    setError('')
    setLoading(false)
    setRefreshing(false)
    setReadState(loadReadState(identityKey))
  }, [identityKey])

  useEffect(() => {
    persistReadState(identityKey, readState)
  }, [identityKey, readState])

  useEffect(() => {
    if (!loggedIn || typeof window === 'undefined') return undefined

    const unlockAudio = () => {
      void primeNotificationAudio(audioContextRef)
    }

    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [loggedIn])

  useEffect(() => {
    if (!loggedIn) {
      setItems([])
      setLoading(false)
      setRefreshing(false)
      setError('')
      setConnectionState('disconnected')
      return undefined
    }

    let cancelled = false
    let pollTimer = null
    lastConnectionStateRef.current = 'disconnected'

    const refreshNotifications = async ({ silent = false } = {}) => {
      if (!cancelled) {
        if (silent) setRefreshing(true)
        else setLoading(true)
        setError('')
      }

      try {
        const data = await fetchNotifications({ limit: 20, page: 1 })
        if (!cancelled) {
          const filtered = data.items.filter((item) => notificationMatchesUser(item, userId))
          setItems(filtered.sort(compareByNewest))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Could not load notifications.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    const stopNotificationListener = notificationHubClient.onNotification((item) => {
      if (cancelled) return
      if (!notificationMatchesUser(item, userId)) return
      setItems((prev) => {
        const isNewNotification = !prev.some((existing) => existing.id === item.id)
        if (isNewNotification) {
          void playNotificationChime(audioContextRef)
        }
        return mergeNotifications([item], prev)
      })
    })

    const stopStateListener = notificationHubClient.onStateChange((state) => {
      if (cancelled) return
      const previousState = lastConnectionStateRef.current
      lastConnectionStateRef.current = state
      setConnectionState(state)
      if (state === 'connected' && previousState && previousState !== 'connecting') {
        void refreshNotifications({ silent: true })
      }
    })

    void refreshNotifications()

    void notificationHubClient.connect(() => getAccessToken()).catch(() => {
      if (!cancelled) setConnectionState('unavailable')
    })

    pollTimer = window.setInterval(() => {
      void refreshNotifications({ silent: true })
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (pollTimer) window.clearInterval(pollTimer)
      stopNotificationListener()
      stopStateListener()
      void notificationHubClient.stop()
    }
  }, [loggedIn, userId])

  const value = useMemo(() => {
    const decoratedItems = items.map((item) => ({
      ...item,
      read: Boolean(readState[item.id]),
    }))
    const unreadCount = decoratedItems.reduce((count, item) => count + (item.read ? 0 : 1), 0)

    return {
      items: decoratedItems,
      loading,
      refreshing,
      error,
      unreadCount,
      connectionState,
      markAsRead: (id) => {
        if (!id) return
        setReadState((prev) => ({ ...prev, [id]: true }))
      },
      markAllAsRead: () => {
        setReadState((prev) => {
          const next = { ...prev }
          decoratedItems.forEach((item) => {
            next[item.id] = true
          })
          return next
        })
      },
      refresh: async () => {
        setRefreshing(true)
        setError('')
        try {
          const data = await fetchNotifications({ limit: 20, page: 1 })
          const filtered = data.items.filter((item) => notificationMatchesUser(item, userId))
          setItems(filtered.sort(compareByNewest))
        } catch (err) {
          setError(err?.message || 'Could not load notifications.')
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      removeNotification: async (id) => {
        if (!id) return
        await deleteNotification(id)
        setItems((prev) => prev.filter((item) => item.id !== id))
        setReadState((prev) => {
          if (!Object.prototype.hasOwnProperty.call(prev, id)) return prev
          const next = { ...prev }
          delete next[id]
          return next
        })
      },
    }
  }, [connectionState, error, items, loading, readState, refreshing, userId])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider.')
  }
  return context
}
