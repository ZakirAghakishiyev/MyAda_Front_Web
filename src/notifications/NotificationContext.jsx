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
  const itemUserIds = Array.isArray(item?.recipientUserIds)
    ? item.recipientUserIds.map((value) => normalizeIdentityPart(value)).filter(Boolean)
    : []
  const audience = normalizeIdentityPart(item?.audience)

  if (!targetUserId) return true
  if (itemUserId) return itemUserId === targetUserId
  if (itemUserIds.length > 0) return itemUserIds.includes(targetUserId)
  if (['all', 'all_users', 'broadcast', 'everyone', 'public'].includes(audience)) return true
  return true
}

function ensureNotificationAudio(audioRef) {
  if (typeof window === 'undefined') return null
  if (!audioRef.current) {
    const audio = new Audio('/audio/notification-sound.mp3')
    audio.preload = 'auto'
    audio.playsInline = true
    audioRef.current = audio
  }
  return audioRef.current
}

async function primeNotificationAudio(audioRef, primedRef) {
  const audio = ensureNotificationAudio(audioRef)
  if (!audio) return false
  if (primedRef.current) return true

  try {
    audio.muted = true
    audio.currentTime = 0
    await audio.play()
    audio.pause()
    audio.currentTime = 0
    audio.muted = false
    primedRef.current = true
    return true
  } catch {
    audio.muted = false
    return false
  }
}

async function playNotificationSound(audioRef, primedRef) {
  const audio = ensureNotificationAudio(audioRef)
  if (!audio) return

  const ready = await primeNotificationAudio(audioRef, primedRef)
  if (!ready) return

  try {
    audio.pause()
    audio.currentTime = 0
    audio.muted = false
    await audio.play()
  } catch {
    primedRef.current = false
  }
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
  const notificationAudioRef = useRef(null)
  const notificationAudioPrimedRef = useRef(false)
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
      void primeNotificationAudio(notificationAudioRef, notificationAudioPrimedRef)
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
          void playNotificationSound(notificationAudioRef, notificationAudioPrimedRef)
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
      const audio = notificationAudioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      notificationAudioPrimedRef.current = false
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
