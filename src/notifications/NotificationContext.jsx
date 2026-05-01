import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { deleteNotification, fetchNotifications } from '../api/notificationApi'
import { fetchMyClubNotifications, markClubNotificationRead } from '../api/clubApi'
import { getAccessToken, subscribeToAuthSessionChange } from '../auth/tokenStorage'
import { getJwtUserId } from '../auth/jwtRoles'
import { notificationHubClient } from './notificationHubClient'

const NotificationContext = createContext(null)

const POLL_INTERVAL_MS = 60 * 1000
const DEBUG_NAMESPACE = '[notifications]'
const CLUB_ANNOUNCEMENT_POSTED_EVENT = 'club-announcement-posted'

function debugLog(level, message, details) {
  const logger = console[level] || console.log
  if (details === undefined) {
    logger(`${DEBUG_NAMESPACE} ${message}`)
    return
  }
  logger(`${DEBUG_NAMESPACE} ${message}`, details)
}

function writeProviderDebugSnapshot(patch) {
  if (typeof window === 'undefined') return
  const current = window.__notificationDebug || {}
  window.__notificationDebug = {
    ...current,
    provider: {
      ...(current.provider || {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  }
}

function compareByNewest(a, b) {
  const aTime = new Date(a?.createdAt || 0).getTime()
  const bTime = new Date(b?.createdAt || 0).getTime()
  return bTime - aTime
}

function mergeNotifications(nextItems, previousItems = []) {
  const merged = new Map()
  const orderedItems = [...nextItems, ...previousItems]

  orderedItems.forEach((item) => {
    if (!item?.id) return
    if (!merged.has(item.id)) {
      merged.set(item.id, item)
      return
    }

    const existing = merged.get(item.id)
    merged.set(item.id, { ...existing, ...item })
  })

  return [...merged.values()]
}

function storageKeyForUser(userId) {
  return `notification-read-state:${String(userId || 'anonymous')}`
}

function normalizeIdentityPart(value) {
  return String(value || '').trim().toLowerCase()
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return ''
}

function normalizeClubNotificationRecord(record, fallbackIndex = 0) {
  const rawId = record?.id ?? record?.notificationId ?? `club-${fallbackIndex}`
  const createdAt = record?.createdAt || record?.created || record?.time || new Date().toISOString()
  const title = firstNonEmptyString(record?.title, record?.subject, record?.message) || 'Club notification'
  const message =
    firstNonEmptyString(record?.body, record?.description, record?.message, record?.content, record?.text) || title

  return {
    id: `club:${String(rawId)}`,
    source: 'club',
    sourceId: String(rawId),
    removable: false,
    type: firstNonEmptyString(record?.type, record?.category) || 'Club Notification',
    title,
    message,
    channel: firstNonEmptyString(record?.channel) || 'Club',
    createdAt,
    recipientUserId: firstNonEmptyString(record?.recipientUserId, record?.userId),
    serverRead: Boolean(record?.read ?? record?.isRead),
  }
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

function readAuthSnapshot() {
  const accessToken = getAccessToken()
  return {
    accessToken,
    userId: getJwtUserId() || '',
  }
}

async function fetchCombinedNotifications(userId) {
  const [globalResult, clubResult] = await Promise.allSettled([
    fetchNotifications({ limit: 20, page: 1 }),
    fetchMyClubNotifications('all'),
  ])

  if (globalResult.status === 'rejected' && clubResult.status === 'rejected') {
    const globalMessage = globalResult.reason?.message || 'Could not load notifications.'
    const clubMessage = clubResult.reason?.message || 'Could not load club notifications.'
    throw new Error(`${globalMessage} ${clubMessage}`.trim())
  }

  const globalItems =
    globalResult.status === 'fulfilled'
      ? globalResult.value.items
          .filter((item) => notificationMatchesUser(item, userId))
          .map((item) => ({
            ...item,
            source: 'global',
            sourceId: item.id,
            removable: true,
            serverRead: Boolean(item.read),
          }))
      : []

  const clubRows =
    clubResult.status === 'fulfilled'
      ? Array.isArray(clubResult.value)
        ? clubResult.value
        : clubResult.value?.items ?? []
      : []

  const clubItems = (Array.isArray(clubRows) ? clubRows : []).map((item, index) =>
    normalizeClubNotificationRecord(item, index)
  )

  return {
    items: [...globalItems, ...clubItems].sort(compareByNewest),
    diagnostics: {
      globalFetchedCount: globalResult.status === 'fulfilled' ? globalResult.value.items.length : 0,
      globalVisibleCount: globalItems.length,
      clubFetchedCount: clubItems.length,
    },
  }
}

export function NotificationProvider({ children }) {
  const [authSnapshot, setAuthSnapshot] = useState(() => readAuthSnapshot())
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [connectionState, setConnectionState] = useState('disconnected')
  const [readState, setReadState] = useState({})
  const notificationAudioRef = useRef(null)
  const notificationAudioPrimedRef = useRef(false)
  const lastConnectionStateRef = useRef('disconnected')

  const accessToken = authSnapshot.accessToken
  const userId = authSnapshot.userId
  const identityKey = normalizeIdentityPart(userId) || 'anonymous'
  const loggedIn = Boolean(accessToken)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncAuthSnapshot = () => {
      const nextSnapshot = readAuthSnapshot()
      setAuthSnapshot((prev) => {
        if (prev.accessToken === nextSnapshot.accessToken && prev.userId === nextSnapshot.userId) {
          return prev
        }
        debugLog('info', 'Notification provider auth snapshot changed.', {
          hadAccessToken: Boolean(prev.accessToken),
          hasAccessToken: Boolean(nextSnapshot.accessToken),
          previousUserId: prev.userId || null,
          nextUserId: nextSnapshot.userId || null,
        })
        return nextSnapshot
      })
    }

    const unsubscribe = subscribeToAuthSessionChange(syncAuthSnapshot)
    window.addEventListener('focus', syncAuthSnapshot, true)
    document.addEventListener('visibilitychange', syncAuthSnapshot)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', syncAuthSnapshot, true)
      document.removeEventListener('visibilitychange', syncAuthSnapshot)
    }
  }, [])

  useEffect(() => {
    writeProviderDebugSnapshot({
      loggedIn,
      identityKey,
      userId: userId || null,
      accessTokenPresent: loggedIn,
    })
    debugLog('info', 'Notification provider identity resolved.', {
      loggedIn,
      identityKey,
      userId: userId || null,
      accessTokenPresent: loggedIn,
    })
  }, [identityKey, loggedIn, userId])

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
    writeProviderDebugSnapshot({
      connectionState,
      notificationCount: items.length,
    })
  }, [connectionState, items.length])

  useEffect(() => {
    if (!loggedIn) {
      debugLog('warn', 'Notification provider disabled because the user is not logged in.')
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
    notificationHubClient.retain()
    debugLog('info', 'Notification provider starting listeners.', {
      identityKey,
      userId: userId || null,
    })

    const refreshNotifications = async ({ silent = false } = {}) => {
      if (!cancelled) {
        if (silent) setRefreshing(true)
        else setLoading(true)
        setError('')
      }

      try {
        const data = await fetchCombinedNotifications(userId)
        if (!cancelled) {
          debugLog('info', 'Notification refresh completed.', {
            silent,
            globalFetchedCount: data.diagnostics.globalFetchedCount,
            globalVisibleCount: data.diagnostics.globalVisibleCount,
            clubFetchedCount: data.diagnostics.clubFetchedCount,
            visibleCount: data.items.length,
            userId: userId || null,
          })
          setItems(data.items)
        }
      } catch (err) {
        if (!cancelled) {
          debugLog('error', 'Notification refresh failed.', {
            silent,
            userId: userId || null,
            error: err?.message || String(err),
          })
          setError(err?.message || 'Could not load notifications.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    const stopNotificationListener = notificationHubClient.onNotification((item, eventName) => {
      if (cancelled) return
      if (!item) {
        debugLog('info', 'Notification hub event requested a silent refresh.', {
          eventName,
          userId: userId || null,
        })
        void refreshNotifications({ silent: true })
        return
      }
      if (!notificationMatchesUser(item, userId)) {
        debugLog('warn', 'Notification hub event ignored because it did not match the current user.', {
          eventName,
          currentUserId: userId || null,
          itemId: item?.id || null,
          recipientUserId: item?.recipientUserId || null,
          recipientUserIds: item?.recipientUserIds || [],
          audience: item?.audience || null,
        })
        return
      }
      debugLog('info', 'Notification hub event accepted for current user.', {
        eventName,
        currentUserId: userId || null,
        itemId: item?.id || null,
        type: item?.type || null,
      })
      setItems((prev) => {
        const isNewNotification = !prev.some((existing) => existing.id === item.id)
        if (isNewNotification) {
          void playNotificationSound(notificationAudioRef, notificationAudioPrimedRef)
        }
        return mergeNotifications([item], prev)
      })
      void refreshNotifications({ silent: true })
    })

    const stopStateListener = notificationHubClient.onStateChange((state, connectionError) => {
      if (cancelled) return
      const previousState = lastConnectionStateRef.current
      lastConnectionStateRef.current = state
      debugLog(connectionError ? 'warn' : 'info', 'Notification hub state changed.', {
        previousState,
        state,
        userId: userId || null,
        error: connectionError?.message || null,
      })
      setConnectionState(state)
      if (state === 'connected' && previousState && previousState !== 'connecting') {
        void refreshNotifications({ silent: true })
      }
    })

    void refreshNotifications()

    void notificationHubClient.connect(() => getAccessToken()).catch((err) => {
      debugLog('error', 'Notification hub connect call failed.', {
        userId: userId || null,
        error: err?.message || String(err),
      })
      if (!cancelled) setConnectionState('unavailable')
    })

    const handleAnnouncementPosted = () => {
      debugLog('info', 'Club announcement posted locally. Triggering silent notification refresh.', {
        userId: userId || null,
      })
      void refreshNotifications({ silent: true })
    }
    window.addEventListener(CLUB_ANNOUNCEMENT_POSTED_EVENT, handleAnnouncementPosted)

    pollTimer = window.setInterval(() => {
      void refreshNotifications({ silent: true })
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      debugLog('info', 'Notification provider cleaning up listeners.', {
        identityKey,
        userId: userId || null,
      })
      if (pollTimer) window.clearInterval(pollTimer)
      const audio = notificationAudioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      notificationAudioPrimedRef.current = false
      stopNotificationListener()
      stopStateListener()
      window.removeEventListener(CLUB_ANNOUNCEMENT_POSTED_EVENT, handleAnnouncementPosted)
      notificationHubClient.release()
    }
  }, [loggedIn, userId])

  const value = useMemo(() => {
    const decoratedItems = items.map((item) => ({
      ...item,
      read: Boolean(item.serverRead || readState[item.id]),
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
        const target = items.find((item) => item.id === id)
        if (target?.source === 'club' && target.sourceId) {
          void markClubNotificationRead(target.sourceId)
            .then(() => {
              setItems((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, serverRead: true, read: true, isRead: true } : item
                )
              )
            })
            .catch(() => {
              /* ignore club read failures in header shortcut */
            })
        }
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
          const data = await fetchCombinedNotifications(userId)
          setItems(data.items)
        } catch (err) {
          setError(err?.message || 'Could not load notifications.')
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      removeNotification: async (id) => {
        if (!id) return
        const target = items.find((item) => item.id === id)
        if (target?.source === 'club') return
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
