import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import * as attendanceApi from '../api/attendance'
import SessionCalendarPicker from '../components/SessionCalendarPicker'
import { displayNameFromAuthUserDto, fetchAuthUserById } from '../api/authUsersApi'
import adaLogo from '../assets/ada-logo.png'
import './AttendancePortal.css'

/** Short-lived JWT: refresh on this interval (see backend QrToken lifetime). */
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

function toUtcIsoFromLocalDateTimeInput(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  // `datetime-local` yields e.g. "2026-04-03T12:00" (no timezone). Treat as *user local time*.
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return ''
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const hour = Number(m[4])
  const minute = Number(m[5])
  const second = m[6] ? Number(m[6]) : 0
  const d = new Date(year, month - 1, day, hour, minute, second, 0)
  if (Number.isNaN(d.getTime())) return ''
  // Send in UTC (GMT) so backend stores consistent timestamps regardless of user timezone.
  return d.toISOString()
}

function addMinutesToUtcIso(utcIso, minutes) {
  const base = new Date(String(utcIso || ''))
  if (Number.isNaN(base.getTime())) return ''
  const ms = Number(minutes) * 60_000
  if (!Number.isFinite(ms) || ms <= 0) return ''
  return new Date(base.getTime() + ms).toISOString()
}

function progressStorageKey(instructorId, lessonId, sessionId) {
  return `attendance_progress:${String(instructorId || '')}:${String(lessonId || '')}:${String(sessionId || '')}`
}

const defaultCourse = {
  university: 'ADA UNIVERSITY',
  semester: 'SPRING 2024',
  title: 'CSCI 101: Computer Science I',
  section: 'Section A',
  room: 'Room 302',
  instructor: 'Dr. Aliyev',
}

function formatSemesterLabel(semester, academicYear) {
  const sem = String(semester || '').trim()
  const yr = String(academicYear || '').trim()
  const base = [sem ? sem.toUpperCase() : '', yr].filter(Boolean).join(' ')
  return base || defaultCourse.semester
}

function formatCourseTitle(code, title) {
  const c = String(code || '').trim()
  const t = String(title || '').trim()
  if (c && t) return `${c}: ${t}`
  return t || c || defaultCourse.title
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
  const [sessionOptions, setSessionOptions] = useState([])
  const [sessionOptionsLoading, setSessionOptionsLoading] = useState(false)
  const [sessionOptionsError, setSessionOptionsError] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)
  const [createSessionError, setCreateSessionError] = useState('')
  const [createSessionStart, setCreateSessionStart] = useState('')
  const [createSessionDurationMinutes, setCreateSessionDurationMinutes] = useState('90')
  const [createSessionTopic, setCreateSessionTopic] = useState('')
  const [showCreateSession, setShowCreateSession] = useState(false)

  const [attendanceActive, setAttendanceActive] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [round1Completed, setRound1Completed] = useState(false)
  const [round2Completed, setRound2Completed] = useState(false)
  const [sessionClosed, setSessionClosed] = useState(false)
  const [sessionFinalized, setSessionFinalized] = useState(false)
  const [canActivate, setCanActivate] = useState(false)
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [finalizeError, setFinalizeError] = useState(null)

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
    sessionId: sessionState?.sessionId ?? (selectedSessionId ? Number(selectedSessionId) : undefined),
    attendanceSessionId: sessionState?.attendanceSessionId,
    roundCount: currentRound,
  }

  useEffect(() => {
    let cancelled = false
    async function loadLessonMeta() {
      const isDemo = String(instructorId || '').toLowerCase() === 'demo' || String(lessonId || '').toLowerCase() === 'demo'
      if (isDemo) {
        setCourse(defaultCourse)
        return
      }

      try {
        const lessons = await attendanceApi.getInstructorLessons({ instructorId })
        if (cancelled) return
        const targetId = Number(lessonId)
        const lesson = lessons.find((l) => Number(l.lessonId) === targetId) || null

        // Instructor profile (self should be accessible; if not, fall back to id label).
        let instructorName = ''
        try {
          const profile = await fetchAuthUserById(instructorId)
          instructorName = displayNameFromAuthUserDto(profile)
        } catch {
          instructorName = ''
        }
        if (cancelled) return

        setCourse({
          university: defaultCourse.university,
          semester: formatSemesterLabel(lesson?.semester, lesson?.academicYear),
          title: formatCourseTitle(lesson?.code, lesson?.title),
          section: String(lesson?.section || '').trim() || (lesson?.crn ? `CRN ${lesson.crn}` : defaultCourse.section),
          room: defaultCourse.room, // not exposed by current attendance endpoints
          instructor: instructorName || defaultCourse.instructor,
        })
      } catch {
        // If lesson metadata cannot be loaded, keep the last known header instead of breaking the page.
      }
    }
    loadLessonMeta()
    return () => { cancelled = true }
  }, [instructorId, lessonId])

  const addLog = useCallback((message, highlight = false) => {
    setLogEntries((prev) => [...prev, { time: formatTime(), message, highlight }])
  }, [])

  const applySessionState = useCallback(
    (data) => {
      setSessionState(data)
      setSessionClosed(Boolean(data.closed))
      setRound1Completed(Boolean(data.round1Completed))
      setRound2Completed(Boolean(data.round2Completed))
      setCanActivate(Boolean(data.canActivate))
      setCurrentRound(Number(data.currentRound) || 0)
      setAttendanceActive(Boolean(data.currentRound))
      setSessionInitialized(true)
    },
    []
  )

  const persistProgress = useCallback(
    (patch = {}) => {
      if (!instructorId || !lessonId || !selectedSessionId) return
      try {
        const key = progressStorageKey(instructorId, lessonId, selectedSessionId)
        const current = {
          currentRound,
          round1Completed,
          round2Completed,
          sessionClosed,
          canActivate,
          attendanceActive,
          ...patch,
        }
        localStorage.setItem(key, JSON.stringify(current))
      } catch {
        // ignore storage failures
      }
    },
    [
      instructorId,
      lessonId,
      selectedSessionId,
      currentRound,
      round1Completed,
      round2Completed,
      sessionClosed,
      canActivate,
      attendanceActive,
    ]
  )

  const loadSessionOptions = useCallback(async () => {
    if (!instructorId || !lessonId || String(instructorId).toLowerCase() === 'demo') return
    setSessionOptionsLoading(true)
    setSessionOptionsError('')
    try {
      const list = await attendanceApi.getLessonSessions({ instructorId, lessonId })
      setSessionOptions(list)
      if (!selectedSessionId && list.length) {
        setSelectedSessionId(String(list[0].sessionId))
      }
    } catch (e) {
      setSessionOptionsError(e.message || 'Could not load sessions for this lesson.')
      setSessionOptions([])
    } finally {
      setSessionOptionsLoading(false)
    }
  }, [instructorId, lessonId, selectedSessionId])

  useEffect(() => {
    loadSessionOptions().catch(() => {})
  }, [loadSessionOptions])

  useEffect(() => {
    setSessionFinalized(false)
    setFinalizeError(null)
  }, [selectedSessionId])

  useEffect(() => {
    if (!instructorId || !lessonId || !selectedSessionId) return
    const isDemo = String(instructorId).toLowerCase() === 'demo' || String(lessonId).toLowerCase() === 'demo'
    if (isDemo) return

    async function tryResume() {
      try {
        const data = await attendanceApi.getSessionStateForSession({
          instructorId,
          lessonId,
          sessionId: Number(selectedSessionId),
        })
        applySessionState(data)
        addLog(`Session ${selectedSessionId} restored.`, true)
      } catch {
        // Fall back to local storage snapshot if backend state is unavailable.
        try {
          const key = progressStorageKey(instructorId, lessonId, selectedSessionId)
          const saved = JSON.parse(localStorage.getItem(key) || 'null')
          if (!saved) return
          applySessionState({
            sessionId: Number(selectedSessionId),
            attendanceSessionId: Number(selectedSessionId),
            currentRound: Number(saved.currentRound) || 0,
            round1Completed: Boolean(saved.round1Completed),
            round2Completed: Boolean(saved.round2Completed),
            closed: Boolean(saved.sessionClosed),
            canActivate: Boolean(saved.canActivate),
            totalCount: 45,
            registeredCount: 0,
          })
          addLog(`Session ${selectedSessionId} restored from local progress.`, true)
        } catch {
          // ignore parse/storage failures
        }
      }
    }

    tryResume().catch(() => {})
  }, [instructorId, lessonId, selectedSessionId, applySessionState, addLog])

  const handleInitializeSession = useCallback(async () => {
    if (!instructorId || !lessonId) return
    setSessionLoading(true)
    setSessionError(null)
    try {
      const isDemo = String(instructorId).toLowerCase() === 'demo' || String(lessonId).toLowerCase() === 'demo'
      const data = isDemo
        ? attendanceApi.getStaticSessionState()
        : selectedSessionId
          ? await attendanceApi.getSessionStateForSession({
              instructorId,
              lessonId,
              sessionId: Number(selectedSessionId),
            })
          : await attendanceApi.getSessionState({
              instructorId,
              lessonId,
            })
      applySessionState(data)
      persistProgress({
        currentRound: Number(data.currentRound) || 0,
        round1Completed: Boolean(data.round1Completed),
        round2Completed: Boolean(data.round2Completed),
        sessionClosed: Boolean(data.closed),
        canActivate: Boolean(data.canActivate),
        attendanceActive: Boolean(data.currentRound),
      })
      addLog(`Session initialized from backend: ${lessonId || 'demo'}`, true)
    } catch (e) {
      setSessionError(e.message || 'Failed to load attendance session')
    } finally {
      setSessionLoading(false)
    }
  }, [instructorId, lessonId, selectedSessionId, applySessionState, persistProgress, addLog])

  const handleCreateSession = useCallback(async () => {
    const startIso = toUtcIsoFromLocalDateTimeInput(createSessionStart)
    const durationMinutes = Number.parseInt(String(createSessionDurationMinutes || '').trim(), 10)
    const endIso = addMinutesToUtcIso(startIso, durationMinutes)
    if (!startIso) {
      setCreateSessionError('Select a valid start date-time value.')
      return
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setCreateSessionError('Duration must be a valid number of minutes (> 0).')
      return
    }
    if (!endIso) {
      setCreateSessionError('Could not compute end time from duration. Please check the values.')
      return
    }
    setCreatingSession(true)
    setCreateSessionError('')
    try {
      const created = await attendanceApi.createLessonSession({
        instructorId,
        lessonId,
        startAt: startIso,
        endAt: endIso,
        topic: createSessionTopic.trim() || undefined,
      })
      await loadSessionOptions()
      if (created?.sessionId != null) setSelectedSessionId(String(created.sessionId))
      setCreateSessionTopic('')
      setCreateSessionDurationMinutes('90')
      addLog('New session created for this lesson.', true)
    } catch (e) {
      setCreateSessionError(e.message || 'Could not create session.')
    } finally {
      setCreatingSession(false)
    }
  }, [
    createSessionStart,
    createSessionDurationMinutes,
    createSessionTopic,
    instructorId,
    lessonId,
    loadSessionOptions,
    addLog,
  ])

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
      const tok = String(data.token || payload || '')
      const tail = tok ? `…${tok.slice(-8)}` : '—'
      addLog(`QR refreshed (token end ${tail})`)
    } catch (e) {
      setQrError(e.message || 'QR retrieval failed')
      addLog(`QR refresh failed: ${e.message}`, true)
      retryTimeoutRef.current = setTimeout(() => {
        if (attendanceActive && !sessionClosed) fetchQR()
      }, QR_RETRY_DELAY_MS)
    } finally {
      setQrLoading(false)
    }
  }, [attendanceActive, sessionClosed, ids.instructorId, ids.lessonId, ids.sessionId, ids.attendanceSessionId, ids.roundCount, addLog])

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
    const nextRound = round1Completed ? 2 : 1
    try {
      await attendanceApi.activateAttendanceRound({
        instructorId: ids.instructorId,
        sessionId: ids.sessionId,
        round: nextRound,
      })
      addLog(`Attendance round ${nextRound} started (activate).`, true)
      setCurrentRound(nextRound)
      setAttendanceActive(true)
      setCanActivate(true)
      setSessionState((s) => ({ ...(s || {}), currentRound: nextRound, closed: false, canActivate: true }))
      persistProgress({
        currentRound: nextRound,
        attendanceActive: true,
        canActivate: true,
        sessionClosed: false,
      })
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
    const endedRound = currentRound
    try {
      await attendanceApi.deactivateAttendanceRound({
        instructorId: ids.instructorId,
        sessionId: ids.sessionId,
        round: endedRound,
      })
      addLog(`Attendance round ${endedRound} ended (deactivate).`)
      if (endedRound === 1) {
        setRound1Completed(true)
        setCurrentRound(0)
        setAttendanceActive(false)
        setCanActivate(true)
        setSessionState((s) => ({ ...(s || {}), round1Completed: true, currentRound: 0, canActivate: true }))
        persistProgress({
          round1Completed: true,
          currentRound: 0,
          attendanceActive: false,
          canActivate: true,
          sessionClosed: false,
        })
      } else if (endedRound === 2) {
        setRound2Completed(true)
        setCurrentRound(0)
        setAttendanceActive(false)
        // Round 1 must be deactivated before round 2 can start.
        setCanActivate(false)
        setSessionState((s) => ({ ...(s || {}), round2Completed: true, currentRound: 0, canActivate: false }))
        persistProgress({
          round2Completed: true,
          currentRound: 0,
          attendanceActive: false,
          sessionClosed: false,
          canActivate: false,
        })
      }
    } catch (e) {
      setRoundActionError(e.message || 'Failed to end round')
    } finally {
      setRoundActionLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (finalizeLoading || !ids.sessionId) return
    setFinalizeLoading(true)
    setFinalizeError(null)
    try {
      await attendanceApi.finalizeSessionAttendance({ instructorId: ids.instructorId, sessionId: ids.sessionId })
      setSessionFinalized(true)
      setSessionClosed(true)
      setCanActivate(false)
      setAttendanceActive(false)
      setCurrentRound(0)
      setSessionState((s) => (s ? { ...s, closed: true, canActivate: false, currentRound: 0 } : null))
      addLog('Session attendance finalized on server.', true)
    } catch (e) {
      setFinalizeError(e?.message || 'Could not finalize session.')
    } finally {
      setFinalizeLoading(false)
    }
  }

  const registeredCount = sessionState?.registeredCount ?? 0
  const totalCount = sessionState?.totalCount ?? 45
  const attendanceRate = totalCount ? Math.round((registeredCount / totalCount) * 100) : 0

  const canStartRound1 =
    sessionInitialized &&
    canActivate &&
    !attendanceActive &&
    !round1Completed &&
    !round2Completed &&
    !sessionFinalized
  const canStopRound1 = attendanceActive && currentRound === 1 && !sessionFinalized
  const canStartRound2 =
    sessionInitialized &&
    canActivate &&
    !attendanceActive &&
    round1Completed &&
    !round2Completed &&
    !sessionFinalized
  const canStopRound2 = attendanceActive && currentRound === 2 && !sessionFinalized
  const canFinalizeSession =
    sessionInitialized &&
    round1Completed &&
    !attendanceActive &&
    !sessionFinalized
  const showRound2Controls =
    sessionInitialized &&
    !sessionFinalized &&
    (round1Completed || currentRound === 2 || round2Completed)

  const handleEndSession = useCallback(() => {
    if (!sessionInitialized || sessionFinalized) return
    if (!window.confirm('End this UI session locally? This does not call the server—use “Finalize session” to close attendance in the system.')) return
    setAttendanceActive(false)
    setCurrentRound(0)
    setSessionClosed(true)
    setCanActivate(false)
    setQrPayload(null)
    setSessionState((s) => (s ? { ...s, closed: true, canActivate: false, currentRound: 0 } : null))
    persistProgress({
      currentRound: 0,
      attendanceActive: false,
      sessionClosed: true,
      canActivate: false,
    })
    addLog('Session ended by instructor', true)
  }, [sessionInitialized, sessionFinalized, persistProgress, addLog])

  return (
    <div className="attendance-portal">
      <header className="ap-navbar">
        <div className="ap-nav-left">
          <button type="button" className="ap-logo-btn" onClick={() => navigate('/')} aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="ap-logo-img" />
          </button>
          <nav className="ap-nav-links">
            <span className="ap-nav-link ap-nav-link--active">Dashboard</span>
            <button
              type="button"
              className="ap-nav-link"
              onClick={() => navigate(`/attendance/${encodeURIComponent(instructorId || 'demo')}`)}
            >
              Lessons
            </button>
            <button type="button" className="ap-nav-link" onClick={() => navigate(`${lessonBase}/history`)}>History</button>
            <button type="button" className="ap-nav-link" onClick={() => navigate(`${lessonBase}/students`)}>Students</button>
          </nav>
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
            <button type="button" className="ap-btn ap-btn--danger" onClick={handleEndSession} disabled={!sessionInitialized || sessionFinalized}>
              <IconClose /> End local session
            </button>
          </div>
        </section>

        <section className="ap-panel">
          <h2 className="ap-panel-title">Lesson sessions</h2>
          <div className="ap-session-picker ap-session-picker--calendar">
            <SessionCalendarPicker
              sessions={sessionOptions}
              selectedSessionId={selectedSessionId}
              loading={sessionOptionsLoading}
              onSelectSessionId={(nextSessionId) => {
                setSelectedSessionId(nextSessionId)
                setSessionInitialized(false)
              }}
              emptyMessage="No sessions for this lesson yet."
            />
            <button
              type="button"
              className="ap-btn ap-btn--secondary"
              onClick={() => loadSessionOptions()}
              disabled={sessionOptionsLoading}
            >
              Refresh sessions
            </button>
          </div>
          {sessionOptionsError ? <p className="ap-controls-error">{sessionOptionsError}</p> : null}

          <div className="ap-create-session">
            <button
              type="button"
              className="ap-btn ap-btn--secondary"
              onClick={() => setShowCreateSession((v) => !v)}
            >
              {showCreateSession ? 'Close create session' : 'Create new session'}
            </button>
            {showCreateSession ? (
              <div className="ap-create-session-body">
                <h3>Create new session</h3>
                <div className="ap-create-session-grid">
                  <label className="ap-session-field">
                    <span>Start</span>
                    <input type="datetime-local" value={createSessionStart} onChange={(e) => setCreateSessionStart(e.target.value)} />
                  </label>
                  <label className="ap-session-field">
                    <span>Duration (minutes)</span>
                    <input
                      type="number"
                      min={1}
                      step={5}
                      value={createSessionDurationMinutes}
                      onChange={(e) => setCreateSessionDurationMinutes(e.target.value)}
                      placeholder="e.g. 90"
                    />
                  </label>
                  <label className="ap-session-field ap-session-field--wide">
                    <span>Topic (optional)</span>
                    <input type="text" value={createSessionTopic} onChange={(e) => setCreateSessionTopic(e.target.value)} />
                  </label>
                </div>
                <button type="button" className="ap-btn ap-btn--primary" onClick={handleCreateSession} disabled={creatingSession}>
                  {creatingSession ? 'Creating…' : 'Create session'}
                </button>
              </div>
            ) : null}
            {createSessionError ? <p className="ap-controls-error">{createSessionError}</p> : null}
          </div>
        </section>

        {!sessionInitialized && (
          <section className="ap-init-card">
            <h2 className="ap-init-title">Session not started</h2>
            <p className="ap-init-text">Select a lesson session, initialize, and run round 1 first. Round 2 is optional and appears after round 1 ends. Use Finalize to close attendance on the server when no round is active.</p>
            <button
              type="button"
              className="ap-btn ap-btn--primary ap-init-btn"
              onClick={handleInitializeSession}
              disabled={!selectedSessionId && String(instructorId).toLowerCase() !== 'demo'}
            >
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
                    <QRCodeSVG value={String(qrPayload)} size={200} level="M" className="ap-qr-svg" />
                  ) : (
                    <div className="ap-qr-placeholder">
                      {qrLoading ? (
                        <div className="ap-loading-indicator" role="status" aria-live="polite">
                          <span className="ap-loading-spinner" aria-hidden="true" />
                          <span>Loading...</span>
                        </div>
                      ) : attendanceActive ? 'Waiting for QR…' : 'Start a round to show QR'}
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
                  {showRound2Controls ? (
                    <>
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
                    </>
                  ) : null}
                  {finalizeError ? <p className="ap-controls-error">{finalizeError}</p> : null}
                  <button
                    type="button"
                    className="ap-btn ap-btn--primary ap-btn--full"
                    disabled={!canFinalizeSession || finalizeLoading}
                    onClick={() => void handleFinalize()}
                  >
                    {finalizeLoading ? 'Finalizing…' : 'Finalize session'}
                  </button>
                  {sessionFinalized ? (
                    <p className="ap-registered-rate" style={{ marginTop: 8 }}>This session is finalized for attendance.</p>
                  ) : null}
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

    </div>
  )
}
