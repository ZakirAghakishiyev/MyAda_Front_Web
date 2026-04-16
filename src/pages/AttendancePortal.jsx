import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import * as attendanceApi from '../api/attendance'
import adaLogo from '../assets/ada-logo.png'
import './AttendancePortal.css'

const QR_REFRESH_INTERVAL_MS = 5_000
const QR_RETRY_DELAY_MS = 3000
const QR_REFRESH_SECONDS = QR_REFRESH_INTERVAL_MS / 1000

const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
)
const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)
const IconStop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
)
const IconDoublePlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 5v14l7-7zm9 0v14l7-7z" />
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconGear = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconLog = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h10M7 12h10M7 16h6" />
  </svg>
)

function formatTime() {
  const d = new Date()
  return d.toTimeString().slice(0, 8)
}

const defaultCourse = {
  university: 'ADA UNIVERSITY',
  semester: 'SPRING 2024',
  title: 'CSCI 101: Computer Science I',
  section: 'Section A',
  room: 'Room 302',
  instructor: 'Dr. Aliyev',
}

export default function AttendancePortal() {
  const { instructorId, lessonId } = useParams()
  const navigate = useNavigate()
  const lessonBase = `/attendance/${encodeURIComponent(instructorId || 'demo')}/lesson/${encodeURIComponent(lessonId || 'demo')}`
  const [course, setCourse] = useState(defaultCourse)
  const [sessionState, setSessionState] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionInitialized, setSessionInitialized] = useState(false)

  const [attendanceActive, setAttendanceActive] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [round1Completed, setRound1Completed] = useState(false)
  const [round2Completed, setRound2Completed] = useState(false)
  const [sessionClosed, setSessionClosed] = useState(false)
  const [canActivate, setCanActivate] = useState(false)

  const [qrPayload, setQrPayload] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState(null)
  const [qrRefreshCountdown, setQrRefreshCountdown] = useState(0)

  const [roundActionLoading, setRoundActionLoading] = useState(false)
  const [roundActionError, setRoundActionError] = useState(null)

  const [logEntries, setLogEntries] = useState([])
  const [connectionStatus, setConnectionStatus] = useState({ ok: true, latencyMs: null })
  const logEndRef = useRef(null)
  const refreshTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const hasLoggedQrGenRef = useRef(false)

  const ids = {
    instructorId: instructorId || 'demo',
    lessonId: lessonId || 'demo',
    sessionId: sessionState?.sessionId,
    attendanceSessionId: sessionState?.attendanceSessionId,
  }

  const addLog = useCallback((message, highlight = false) => {
    setLogEntries((prev) => [...prev, { time: formatTime(), message, highlight }])
  }, [])

  const handleInitializeSession = useCallback(async () => {
    setSessionLoading(true)
    setSessionError(null)
    try {
      const data = await attendanceApi.getSessionState({
        instructorId,
        lessonId,
      })
      setSessionState(data)
      setSessionClosed(Boolean(data.closed))
      setRound1Completed(Boolean(data.round1Completed))
      setRound2Completed(Boolean(data.round2Completed))
      setCanActivate(Boolean(data.canActivate))
      setCurrentRound(Number(data.currentRound) || 0)
      setAttendanceActive(Boolean(data.currentRound))
      setSessionInitialized(true)
      addLog(`Session initialized from backend: ${lessonId || 'demo'}`, true)
    } catch (e) {
      setSessionError(e.message || 'Failed to load attendance session')
    } finally {
      setSessionLoading(false)
    }
  }, [instructorId, lessonId, addLog])

  const fetchQR = useCallback(async () => {
    if (!attendanceActive || sessionClosed) return
    setQrLoading(true)
    setQrError(null)
    try {
      const data = await attendanceApi.getQRPayload(ids)
      const payload = data.payload || data.token || ''
      setQrPayload(payload)
      if (!hasLoggedQrGenRef.current) {
        hasLoggedQrGenRef.current = true
        addLog('QR Generation successful...')
      }
      addLog(`QR Refreshed (Token: ${(data.token || payload).slice(0, 12)}...)`)
    } catch (e) {
      setQrError(e.message || 'QR retrieval failed')
      addLog(`QR refresh failed: ${e.message}`, true)
      retryTimeoutRef.current = setTimeout(() => {
        if (attendanceActive && !sessionClosed) fetchQR()
      }, QR_RETRY_DELAY_MS)
    } finally {
      setQrLoading(false)
    }
  }, [attendanceActive, sessionClosed, ids.instructorId, ids.lessonId, ids.sessionId, ids.attendanceSessionId, addLog])

  useEffect(() => {
    if (!attendanceActive || sessionClosed) {
      hasLoggedQrGenRef.current = false
      setQrPayload(null)
      setQrRefreshCountdown(0)
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      return
    }

    let countdown = QR_REFRESH_SECONDS
    setQrRefreshCountdown(countdown)

    const tick = () => {
      countdown -= 1
      setQrRefreshCountdown((c) => Math.max(0, c - 1))
      if (countdown <= 0) countdown = QR_REFRESH_SECONDS
    }

    fetchQR()
    const countdownInterval = setInterval(tick, 1000)
    countdownTimerRef.current = countdownInterval

    const refreshInterval = setInterval(() => {
      setQrRefreshCountdown(QR_REFRESH_SECONDS)
      fetchQR()
    }, QR_REFRESH_INTERVAL_MS)
    refreshTimerRef.current = refreshInterval

    return () => {
      clearInterval(countdownInterval)
      clearInterval(refreshInterval)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [attendanceActive, sessionClosed, fetchQR])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logEntries])

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  const handleStartRound = async () => {
    if (!canActivate || roundActionLoading) return
    setRoundActionLoading(true)
    setRoundActionError(null)
    try {
      await attendanceApi.startRound(ids)
      const nextRound = round1Completed ? 2 : 1
      addLog(`Attendance Round ${nextRound} Started`, true)
      setCurrentRound(nextRound)
      setAttendanceActive(true)
      setCanActivate(true)
      setSessionState((s) => ({ ...(s || {}), currentRound: nextRound, closed: false, canActivate: true }))
    } catch (e) {
      setRoundActionError(e.message || 'Failed to start round')
    } finally {
      setRoundActionLoading(false)
    }
  }

  const handleEndRound = async () => {
    if (!attendanceActive || roundActionLoading) return
    setRoundActionLoading(true)
    setRoundActionError(null)
    try {
      await attendanceApi.endRound(ids)
      addLog(`Attendance Round ${currentRound} Ended`)
      if (currentRound === 1) {
        setRound1Completed(true)
        setCurrentRound(0)
        setAttendanceActive(false)
        setSessionState((s) => ({ ...(s || {}), round1Completed: true, currentRound: 0 }))
      } else if (currentRound === 2) {
        setRound2Completed(true)
        setCurrentRound(0)
        setAttendanceActive(false)
        setSessionClosed(true)
        setCanActivate(false)
        setSessionState((s) => ({ ...(s || {}), round2Completed: true, currentRound: 0, closed: true, canActivate: false }))
      }
    } catch (e) {
      setRoundActionError(e.message || 'Failed to end round')
    } finally {
      setRoundActionLoading(false)
    }
  }

  const registeredCount = sessionState?.registeredCount ?? 0
  const totalCount = sessionState?.totalCount ?? 45
  const attendanceRate = totalCount ? Math.round((registeredCount / totalCount) * 100) : 0

  const canStartRound1 = sessionInitialized && canActivate && !attendanceActive && !round1Completed && !round2Completed
  const canStopRound1 = attendanceActive && currentRound === 1
  const canStartRound2 = sessionInitialized && canActivate && !attendanceActive && round1Completed && !round2Completed
  const canStopRound2 = attendanceActive && currentRound === 2

  const handleEndSession = useCallback(() => {
    if (!sessionInitialized) return
    if (!window.confirm('End this attendance session? No further rounds can be started.')) return
    setAttendanceActive(false)
    setCurrentRound(0)
    setSessionClosed(true)
    setCanActivate(false)
    setQrPayload(null)
    setSessionState((s) => (s ? { ...s, closed: true, canActivate: false, currentRound: 0 } : null))
    addLog('Session ended by instructor', true)
  }, [sessionInitialized, addLog])

  return (
    <div className="attendance-portal">
      <header className="ap-navbar">
        <div className="ap-nav-left">
          <button type="button" className="ap-logo-btn" onClick={() => navigate('/')} aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="ap-logo-img" />
          </button>
          <nav className="ap-nav-links">
            <span className="ap-nav-link ap-nav-link--active">Dashboard</span>
            <button type="button" className="ap-nav-link" onClick={() => navigate(`${lessonBase}/history`)}>History</button>
            <button type="button" className="ap-nav-link" onClick={() => navigate(`${lessonBase}/students`)}>Students</button>
            <button type="button" className="ap-nav-link">Settings</button>
          </nav>
        </div>
        <div className="ap-nav-right">
          <button type="button" className="ap-icon-btn" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </button>
          <div className="ap-user">
            <div className="ap-user-avatar" />
            <span className="ap-user-arrow">▼</span>
          </div>
        </div>
      </header>

      <div className="ap-content">
        <section className="ap-header">
          <div className="ap-course-meta">
            <span>{course.university} • {course.semester}</span>
          </div>
          <h1 className="ap-course-title">{course.title}</h1>
          <p className="ap-course-details">{course.section} • {course.room} • {course.instructor}</p>
          <div className="ap-session-actions">
            <button type="button" className="ap-btn ap-btn--secondary">
              <IconGear /> Session Settings
            </button>
            <button type="button" className="ap-btn ap-btn--danger" onClick={handleEndSession} disabled={!sessionInitialized}>
              <IconClose /> End Session
            </button>
          </div>
        </section>

        {!sessionInitialized && (
          <section className="ap-init-card">
            <h2 className="ap-init-title">Session not started</h2>
            <p className="ap-init-text">Click below to initialize the attendance session for this lesson. After that you can start Round 1 and Round 2.</p>
            <button type="button" className="ap-btn ap-btn--primary ap-init-btn" onClick={handleInitializeSession}>
              <IconPlay /> Initialize Session
            </button>
          </section>
        )}

        {sessionLoading && (
          <div className="ap-loading">Loading session…</div>
        )}
        {sessionError && (
          <div className="ap-error">
            Session error: {sessionError}. Refresh or check backend.
          </div>
        )}

        {sessionInitialized && <div className="ap-grid">
          <div className="ap-col-left">
            <section className="ap-panel ap-panel--progress">
              <h2 className="ap-panel-title">
                <IconBarChart /> Session Progress
              </h2>
              <div className="ap-progress-steps">
                <div className={`ap-step ${!round1Completed && !attendanceActive ? 'ap-step--muted' : ''}`}>
                  <span className="ap-step-icon">○</span>
                  No Round Started
                </div>
                <div className={`ap-step ${attendanceActive && currentRound === 1 ? 'ap-step--active' : round1Completed ? 'ap-step--done' : 'ap-step--muted'}`}>
                  <span className="ap-step-icon">{attendanceActive && currentRound === 1 ? '▶' : round1Completed ? '✓' : '▶'}</span>
                  {attendanceActive && currentRound === 1 ? 'Round 1 Active' : round1Completed ? 'Round 1 Done' : 'Round 1'}
                </div>
                <div className={`ap-step ${attendanceActive && currentRound === 2 ? 'ap-step--active' : round2Completed ? 'ap-step--done' : 'ap-step--muted'}`}>
                  <span className="ap-step-icon">{attendanceActive && currentRound === 2 ? '▶' : round2Completed ? '✓' : '▶'}</span>
                  {attendanceActive && currentRound === 2 ? 'Round 2 Active' : round2Completed ? 'Completed' : 'Round 2'}
                </div>
              </div>
            </section>

            <section className="ap-panel ap-panel--live">
              <div className="ap-live-header">
                <span className="ap-live-dot" />
                LIVE ROUND {currentRound || 1}
              </div>
              <div className="ap-qr-row">
                <div className="ap-qr-card">
                  <p className="ap-qr-label">Dynamic attendance</p>
                  {qrPayload ? (
                    <QRCodeSVG value={qrPayload} size={200} level="M" className="ap-qr-svg" />
                  ) : (
                    <div className="ap-qr-placeholder">
                      {qrLoading ? 'Loading…' : attendanceActive ? 'Waiting for QR…' : 'Start a round to show QR'}
                    </div>
                  )}
                  {attendanceActive && (
                    <div className="ap-qr-refresh">
                      <div className="ap-qr-refresh-bar">
                        <div className="ap-qr-refresh-fill" style={{ width: `${(qrRefreshCountdown / QR_REFRESH_SECONDS) * 100}%` }} />
                      </div>
                      <span className="ap-qr-refresh-text">QR REFRESHING IN… {qrRefreshCountdown}S</span>
                    </div>
                  )}
                </div>
                <div className="ap-controls">
                  <h3 className="ap-controls-title">CONTROLS</h3>
                  {roundActionError && <p className="ap-controls-error">{roundActionError}</p>}
                  <button
                    type="button"
                    className="ap-btn ap-btn--primary ap-btn--full"
                    disabled={!canStartRound1 || roundActionLoading}
                    onClick={handleStartRound}
                  >
                    <IconPlay /> Start Round 1
                  </button>
                  <button
                    type="button"
                    className="ap-btn ap-btn--orange ap-btn--full"
                    disabled={!canStopRound1 || roundActionLoading}
                    onClick={handleEndRound}
                  >
                    <IconStop /> Stop Round 1
                  </button>
                  <button
                    type="button"
                    className="ap-btn ap-btn--primary ap-btn--full"
                    disabled={!canStartRound2 || roundActionLoading}
                    onClick={handleStartRound}
                  >
                    <IconDoublePlay /> Start Round 2
                  </button>
                  <button
                    type="button"
                    className="ap-btn ap-btn--orange ap-btn--full"
                    disabled={!canStopRound2 || roundActionLoading}
                    onClick={handleEndRound}
                  >
                    <IconStop /> Stop Round 2
                  </button>
                  <div className="ap-registered">
                    <span className="ap-registered-label">REGISTERED</span>
                    <span className="ap-registered-count">{registeredCount}/{totalCount}</span>
                    <span className="ap-registered-rate">{attendanceRate}% Attendance rate currently</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="ap-col-right">
            <section className="ap-panel ap-panel--grading">
              <h2 className="ap-panel-title">
                <IconInfo /> Grading Logic
              </h2>
              <ul className="ap-grading-list">
                <li><span className="ap-grading-desc">2/2 Rounds</span> <span className="ap-badge ap-badge--present">PRESENT</span></li>
                <li><span className="ap-grading-desc">1/1 (Single)</span> <span className="ap-badge ap-badge--present">PRESENT</span></li>
                <li><span className="ap-grading-desc">1/2 Rounds</span> <span className="ap-badge ap-badge--late">LATE</span></li>
                <li><span className="ap-grading-desc">0/2 Rounds</span> <span className="ap-badge ap-badge--absent">ABSENT</span></li>
              </ul>
            </section>

            <section className="ap-panel ap-panel--log">
              <h2 className="ap-panel-title">
                <IconLog /> SYSTEM LOG
                <span className="ap-log-autoscroll">Auto-scrolling</span>
              </h2>
              <div className="ap-log-list">
                {logEntries.map((entry, i) => (
                  <div key={i} className={`ap-log-entry ${entry.highlight ? 'ap-log-entry--highlight' : ''}`}>
                    [{entry.time}] {entry.message}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
              <div className="ap-log-status">
                <span className="ap-log-dot ap-log-dot--green" />
                Server Connection {connectionStatus.ok ? `Stable (${connectionStatus.latencyMs ?? '—'}ms)` : 'Unstable'}
              </div>
            </section>
          </div>
        </div>}
      </div>

      <footer className="ap-footer">
        © 2024 ADA University - Educational Technologies Department. For internal use only.
      </footer>
    </div>
  )
}
