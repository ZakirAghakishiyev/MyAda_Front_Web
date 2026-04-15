import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getAccessToken } from '../auth'
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

/**
 * Keeps the call hub connected for any logged-in user on non-auth routes, and shows
 * incoming-call + in-call UI globally so dispatchers are reachable from every page.
 */
const GlobalCallUi: React.FC = () => {
  const location = useLocation()
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null)
  const [rejectReason, setRejectReason] = useState('Busy')
  const [audioBlocked, setAudioBlocked] = useState(false)
  const CALL_DEBUG =
    import.meta.env.DEV || String(import.meta.env.VITE_CALL_DEBUG || '').toLowerCase() === 'true'
  const {
    phase,
    error: hubError,
    incomingCall,
    callId,
    roomId,
    connect,
    disconnect,
    acceptCall,
    rejectCall,
    leaveCall,
    endCall,
    remoteStream,
  } = useCallHub()

  useEffect(() => {
    const reconcile = () => {
      const token = getAccessToken()
      if (!token) {
        void disconnect().catch(() => null)
        return
      }
      if (isAuthRoute(location.pathname)) return
      void connect().catch(() => null)
    }

    reconcile()
    const interval = window.setInterval(reconcile, 1500)
    return () => window.clearInterval(interval)
  }, [location.pathname, connect, disconnect])

  useEffect(() => {
    const el = audioEl
    if (!el || !remoteStream) return
    if (CALL_DEBUG) {
      console.info('[CALL-DBG] remoteStream attached', {
        tracks: remoteStream.getTracks().map((t) => ({ id: t.id, kind: t.kind, enabled: t.enabled, muted: t.muted, readyState: t.readyState })),
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
        // This can happen transiently during rapid route/state transitions.
        if (/interrupted|removed from the document/i.test(msg)) {
          return
        }
        setAudioBlocked(true)
      })
    } else {
      setAudioBlocked(false)
    }
    const onCanPlay = () => {
      void el.play().then(() => {
        if (CALL_DEBUG) console.info('[CALL-DBG] audio.play success (canplay)')
        setAudioBlocked(false)
      }).catch((err) => {
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
  const showActiveBar = phase === 'in-call'

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

      {showIncoming && incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          onAccept={() => acceptCall(incomingCall.callId)}
          onReject={() => rejectCall(incomingCall.callId, rejectReason)}
        />
      )}

      {showActiveBar && (
        <div className="gc-active-bar">
          <span className="gc-active-label">Voice call active</span>
          <span className="gc-active-meta">Room: {roomId || callId || '—'}</span>
          {audioBlocked && (
            <button type="button" className="gc-active-btn gc-active-btn--unlock" onClick={handleEnableAudio}>
              Enable audio
            </button>
          )}
          <span className="gc-active-spacer" />
          <button type="button" className="gc-active-btn gc-active-btn--ghost" onClick={() => leaveCall()}>
            Leave
          </button>
          <button type="button" className="gc-active-btn gc-active-btn--end" onClick={() => endCall()}>
            End call
          </button>
        </div>
      )}

      {import.meta.env.DEV &&
        getAccessToken() &&
        !isAuthRoute(location.pathname) && (
          <div
            className="gc-call-debug"
            title="Dev-only call diagnostics."
          >
            Call debug · hub: {phase} · dispatcherRole: {isDispatcherAccessToken(getAccessToken()) ? 'yes' : 'no'}
          </div>
        )}
    </>
  )
}

export default GlobalCallUi
