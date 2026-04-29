import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getAccessToken, getAccessTokenExpirationMs } from '../auth'
import { isDispatcherAccessToken } from '../auth/jwtPayload'
import IncomingCallModal from './IncomingCallModal'
import { useCallHub } from './useCallHub'
import './GlobalCallUi.css'

function isAuthRoute(pathname: string) {
  return (
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  )
}

function isCallRoute(pathname: string) {
  return (
    pathname === '/calls/caller' ||
    pathname === '/calls/dispatcher' ||
    pathname === '/calls/history' ||
    pathname === '/calls/contacts'
  )
}

function formatCallDuration(totalSeconds: number) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Keeps the call hub connected for any logged-in user on non-auth routes, and shows
 * incoming-call + in-call UI globally so dispatchers are reachable from every page.
 */
const GlobalCallUi: React.FC = () => {
  const location = useLocation()
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null)
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null)
  const [rejectReason, setRejectReason] = useState('Busy')
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [callStartedAtMs, setCallStartedAtMs] = useState<number | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isCallModalLocked, setIsCallModalLocked] = useState(false)

  const CALL_DEBUG =
    import.meta.env.DEV || String(import.meta.env.VITE_CALL_DEBUG || '').toLowerCase() === 'true'

  const {
    phase,
    error: hubError,
    incomingCall,
    callId,
    roomId,
    ringing,
    connect,
    disconnect,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    otherParticipants,
    localStream,
    remoteStream,
    sessionEndReason,
    clearSessionEndReason,
  } = useCallHub()

  const hasCallIdentity = Boolean(callId || roomId)
  const hasCallMedia = Boolean(localStream || remoteStream)

  useEffect(() => {
    const isTokenValid = (token: string | null) => {
      if (!token) return false
      const expiresAtMs = getAccessTokenExpirationMs(token)
      return expiresAtMs == null || Date.now() < expiresAtMs - 5000
    }

    const reconcile = () => {
      const token = getAccessToken()
      const tokenIsValid = isTokenValid(token)

      if (!tokenIsValid || isAuthRoute(location.pathname)) {
        void disconnect().catch(() => null)
        return
      }

      if (phase === 'connecting' || phase === 'connected') return
      void connect().catch(() => null)
    }

    reconcile()
    const interval = window.setInterval(reconcile, 1500)
    return () => window.clearInterval(interval)
  }, [location.pathname, phase, connect, disconnect])

  useEffect(() => {
    const el = audioEl
    if (!el || !remoteStream) return

    if (CALL_DEBUG) {
      console.info('[CALL-DBG] remoteStream attached', {
        tracks: remoteStream.getTracks().map((t) => ({
          id: t.id,
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        })),
      })
    }

    if (el.srcObject !== remoteStream) {
      el.srcObject = remoteStream
    }

    el.muted = false
    el.volume = 1

    const tryPlay = async () => {
      await el.play()
    }

    const p = tryPlay()
    if (p && typeof p.catch === 'function') {
      p.then(() => {
        if (CALL_DEBUG) console.info('[CALL-DBG] audio.play success')
        setAudioBlocked(false)
      }).catch((err) => {
        const msg = String(err?.message || err || '')
        if (CALL_DEBUG) console.info('[CALL-DBG] audio.play blocked', msg)
        if (/interrupted|removed from the document/i.test(msg)) {
          return
        }
        setAudioBlocked(true)
      })
    } else {
      setAudioBlocked(false)
    }

    const onCanPlay = () => {
      void el
        .play()
        .then(() => {
          if (CALL_DEBUG) console.info('[CALL-DBG] audio.play success (canplay)')
          setAudioBlocked(false)
        })
        .catch((err) => {
          if (CALL_DEBUG) console.info('[CALL-DBG] audio.play blocked (canplay)', String(err?.message || err))
          setAudioBlocked(true)
        })
    }

    el.addEventListener('canplay', onCanPlay)
    return () => {
      el.removeEventListener('canplay', onCanPlay)
    }
  }, [audioEl, remoteStream, CALL_DEBUG])

  useEffect(() => {
    if (phase !== 'in-call') setAudioBlocked(false)
  }, [phase])

  useEffect(() => {
    const ringtoneEl = ringtoneAudioRef.current
    if (!ringtoneEl) return

    const shouldRing = Boolean(incomingCall) && phase !== 'in-call' && phase !== 'accepted'
    if (shouldRing) {
      ringtoneEl.currentTime = 0
      void ringtoneEl.play().catch(() => null)
      return
    }

    ringtoneEl.pause()
    ringtoneEl.currentTime = 0
  }, [incomingCall, phase])

  useEffect(() => {
    const shouldLockModal =
      phase === 'ringing' ||
      phase === 'accepted' ||
      phase === 'in-call' ||
      ((phase === 'connected' || phase === 'connecting') && !incomingCall && (hasCallMedia || hasCallIdentity))
    if (shouldLockModal) {
      setIsCallModalLocked(true)
    }

    const isTerminalPhase =
      phase === 'ended' ||
      phase === 'rejected' ||
      phase === 'cancelled' ||
      phase === 'timeout' ||
      phase === 'idle' ||
      phase === 'auth-expired' ||
      phase === 'error'

    if (isTerminalPhase) {
      setIsCallModalLocked(false)
    }
  }, [phase, incomingCall, hasCallMedia, hasCallIdentity])

  useEffect(() => {
    if (phase === 'in-call') {
      setCallStartedAtMs((prev) => prev ?? Date.now())
    }
  }, [phase])

  useEffect(() => {
    if (!isCallModalLocked) {
      setCallStartedAtMs(null)
      setDurationSeconds(0)
    }
  }, [isCallModalLocked])

  useEffect(() => {
    if (!isCallModalLocked || !callStartedAtMs) return

    const tick = () => {
      setDurationSeconds(Math.max(0, Math.floor((Date.now() - callStartedAtMs) / 1000)))
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [isCallModalLocked, callStartedAtMs])

  useEffect(() => {
    if (!isCallModalLocked) {
      setIsMuted(false)
    }
  }, [isCallModalLocked])

  useEffect(() => {
    if (!localStream) return
    const tracks = localStream.getAudioTracks()
    if (!tracks.length) return

    tracks.forEach((track) => {
      track.enabled = !isMuted
    })
  }, [localStream, isMuted])

  const handleEnableAudio = async () => {
    const el = remoteAudioRef.current
    if (!el) return

    try {
      el.muted = false
      el.volume = 1
      await el.play()
      if (CALL_DEBUG) console.info('[CALL-DBG] audio unlocked by user gesture')
      setAudioBlocked(false)
    } catch {
      if (CALL_DEBUG) console.info('[CALL-DBG] audio unlock failed')
      setAudioBlocked(true)
    }
  }

  const showIncoming = Boolean(incomingCall) && phase !== 'in-call' && phase !== 'accepted'
  const showLiveCallModal = isCallModalLocked
  const hasLocalAudioTracks = Boolean(localStream?.getAudioTracks().length)
  const isOutgoingRinging = phase === 'ringing'
  const isLiveCall = phase === 'in-call' || (isCallModalLocked && callStartedAtMs !== null)
  const primaryPeer = (otherParticipants || [])[0]
  const peerName =
    primaryPeer?.displayName ||
    primaryPeer?.userId ||
    ringing?.targetUserId ||
    ringing?.dispatcherUserId ||
    'Participant'

  const showSessionEndBanner =
    Boolean(sessionEndReason) &&
    (phase === 'ended' || phase === 'rejected' || phase === 'cancelled' || phase === 'timeout')

  const handleToggleMute = () => {
    if (!hasLocalAudioTracks) return
    setIsMuted((prev) => !prev)
  }

  const handleCallAction = async () => {
    if (isOutgoingRinging && callId) {
      await cancelCall(callId, 'Caller cancelled the request.')
      return
    }
    await endCall()
  }

  return (
    <>
      <audio
        ref={(el) => {
          remoteAudioRef.current = el
          setAudioEl(el)
        }}
        autoPlay
        playsInline
        className="gc-active-audio"
      />
      <audio
        ref={ringtoneAudioRef}
        src="/audio/incoming-call-ringtone.mpeg"
        preload="auto"
        loop
        className="gc-active-audio"
      />

      {hubError && phase === 'error' && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 2147482500,
            maxWidth: 360,
            padding: '12px 14px',
            borderRadius: 12,
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: 13,
            border: '1px solid #fecaca',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
          role="alert"
        >
          {hubError}
        </div>
      )}

      {showSessionEndBanner && sessionEndReason && (
        <div
          style={{
            position: 'fixed',
            bottom: 100,
            right: 12,
            zIndex: 2147482490,
            maxWidth: 380,
            padding: '12px 14px',
            borderRadius: 12,
            background: '#f8fafc',
            color: '#0f172a',
            fontSize: 13,
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
          role="status"
        >
          <div style={{ marginBottom: 8 }}>{sessionEndReason}</div>
          <button
            type="button"
            onClick={() => clearSessionEndReason()}
            style={{
              fontSize: 12,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {showIncoming && incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          onAccept={() => acceptCall(incomingCall.callId)}
          onReject={() => rejectCall(incomingCall.callId, rejectReason)}
        />
      )}

      {showLiveCallModal && (
        <div className="gc-live-call-modal" role="dialog" aria-modal="false" aria-labelledby="gc-live-call-title">
          <div className="gc-live-call-header">
            <h3 id="gc-live-call-title" className="gc-live-call-title">
              {isLiveCall ? 'Call in progress' : isOutgoingRinging ? 'Calling...' : 'Connecting call...'}
            </h3>
            <span className={`gc-live-call-status ${isLiveCall ? 'is-active' : ''}`}>
              {isLiveCall ? 'Live' : isOutgoingRinging ? 'Ringing' : 'Joining'}
            </span>
          </div>

          <p className="gc-live-call-peer">{peerName}</p>
          <p className="gc-live-call-room">Room: {roomId || callId || '-'}</p>
          <p className="gc-live-call-duration">
            {isLiveCall ? formatCallDuration(durationSeconds) : '00:00'}
          </p>

          <div className="gc-live-call-actions">
            <button
              type="button"
              className="gc-live-call-btn gc-live-call-btn--mute"
              onClick={handleToggleMute}
              disabled={!hasLocalAudioTracks}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button type="button" className="gc-live-call-btn gc-live-call-btn--decline" onClick={() => void handleCallAction()}>
              {isOutgoingRinging ? 'Cancel' : 'Decline'}
            </button>
          </div>

          {audioBlocked && (
            <button type="button" className="gc-live-call-btn gc-live-call-btn--unlock" onClick={handleEnableAudio}>
              Enable speaker audio
            </button>
          )}
        </div>
      )}

      {CALL_DEBUG &&
        import.meta.env.DEV &&
        getAccessToken() &&
        !isAuthRoute(location.pathname) &&
        isCallRoute(location.pathname) && (
          <div className="gc-call-debug" title="Dev-only call diagnostics.">
            Call debug - hub: {phase} - dispatcherRole: {isDispatcherAccessToken(getAccessToken()) ? 'yes' : 'no'}
          </div>
        )}
    </>
  )
}

export default GlobalCallUi
