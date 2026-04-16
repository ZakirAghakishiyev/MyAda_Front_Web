import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  getSessionState,
  getQRPayload,
  resolveAuthenticatedStudentId,
  scanAttendanceQrCode,
  validateAttendanceQrToken,
} from '../api/attendance'
import './AttendanceQrTestPage.css'

const QR_REFRESH_INTERVAL_MS = 5_000
const QR_REFRESH_SECONDS = QR_REFRESH_INTERVAL_MS / 1000

function formatRecordedAt(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function mapSubmitError(error) {
  if (!error) return 'Attendance request failed.'
  if (error.status === 400) return error.message || 'Invalid or expired QR code.'
  if (error.status === 401 || error.status === 403) {
    return error.message || 'Unauthorized or wrong student.'
  }
  return error.message || 'Attendance request failed.'
}

export default function AttendanceQrTestPage() {
  const refreshTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)

  const [currentToken, setCurrentToken] = useState('')
  const [countdown, setCountdown] = useState(QR_REFRESH_SECONDS)
  const [tokenError, setTokenError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [resolvedSessionState, setResolvedSessionState] = useState(null)
  const [studentIdOverride, setStudentIdOverride] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitResult, setSubmitResult] = useState(null)

  const resolvedStudentId = useMemo(() => {
    try {
      return resolveAuthenticatedStudentId(studentIdOverride)
    } catch {
      return ''
    }
  }, [studentIdOverride])

  const resolveSession = useCallback(async () => {
    const state = await getSessionState({ instructorId, lessonId })
    setResolvedSessionState(state)
    setSessionId(String(state.sessionId || ''))
    return state
  }, [instructorId, lessonId])

  const refreshQrToken = useCallback(async () => {
    setTokenError('')
    try {
      const activeSessionId =
        String(sessionId || '').trim() ||
        String(resolvedSessionState?.sessionId || '').trim() ||
        String((await resolveSession()).sessionId || '').trim()

      const data = await getQRPayload({
        instructorId,
        sessionId: activeSessionId,
      })
      const token = String(data?.payload || data?.token || '').trim()
      setCurrentToken(token)
      setManualToken(token)
      setCountdown(QR_REFRESH_SECONDS)
    } catch (error) {
      setTokenError(error?.message || 'Failed to generate a QR token.')
    }
  }, [instructorId, resolveSession, resolvedSessionState?.sessionId, sessionId])

  useEffect(() => {
    countdownTimerRef.current = setInterval(() => {
      setCountdown((value) => (value <= 1 ? QR_REFRESH_SECONDS : value - 1))
    }, 1000)

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!String(instructorId).trim() || !String(lessonId).trim()) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      setCurrentToken('')
      return
    }

    void refreshQrToken()

    refreshTimerRef.current = setInterval(() => {
      void refreshQrToken()
    }, QR_REFRESH_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [instructorId, lessonId, refreshQrToken])

  const handleCopyToken = useCallback(async () => {
    if (!currentToken) return

    try {
      await navigator.clipboard.writeText(currentToken)
      setCopyMessage('Token copied.')
      setTimeout(() => setCopyMessage(''), 1500)
    } catch {
      setCopyMessage('Copy failed. Select and copy the token manually.')
    }
  }, [currentToken])

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitResult(null)

    let safeToken
    try {
      safeToken = validateAttendanceQrToken(manualToken)
    } catch (error) {
      setSubmitError(error.message)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await scanAttendanceQrCode({
        studentId: studentIdOverride || undefined,
        scannedToken: safeToken,
      })
      setSubmitResult(result)
    } catch (error) {
      setSubmitError(mapSubmitError(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [manualToken, studentIdOverride])

  const requestPreview = useMemo(() => {
    return JSON.stringify({ token: manualToken.trim() || currentToken || 'ADA_abc12' }, null, 2)
  }, [currentToken, manualToken])

  return (
    <div className="attendance-qr-test">
      <div className="attendance-qr-test__container">
        <header className="attendance-qr-test__header">
          <div>
            <p className="attendance-qr-test__eyebrow">Attendance Test</p>
            <h1>Desktop QR test page</h1>
            <p className="attendance-qr-test__subtitle">
              Open this page on your computer, scan the QR with your phone camera, copy the plain
              token text from the phone result, then paste it here to send the attendance request.
            </p>
          </div>
          <Link to="/attendance/student/scan" className="attendance-qr-test__link">
            Open student scanner
          </Link>
        </header>

        <div className="attendance-qr-test__grid">
          <section className="attendance-qr-test__card">
            <h2>1. Live QR to scan</h2>
            <p className="attendance-qr-test__hint">
              Enter the real instructor and lesson ids first. The QR refreshes every {QR_REFRESH_SECONDS} seconds and contains only the plain token returned by the attendance backend.
            </p>

            <label className="attendance-qr-test__field">
              <span>Instructor id</span>
              <input
                type="text"
                value={instructorId}
                onChange={(event) => setInstructorId(event.target.value)}
                placeholder="Example: 1"
              />
            </label>

            <label className="attendance-qr-test__field">
              <span>Lesson id</span>
              <input
                type="text"
                value={lessonId}
                onChange={(event) => setLessonId(event.target.value)}
                placeholder="Example: 101"
              />
            </label>

            <label className="attendance-qr-test__field">
              <span>Resolved session id</span>
              <input
                type="text"
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
                placeholder="Auto-filled from backend session lookup"
              />
            </label>

            <div className="attendance-qr-test__qr-box">
              {currentToken ? (
                <QRCodeSVG value={currentToken} size={220} level="M" includeMargin />
              ) : (
                <div className="attendance-qr-test__placeholder">
                  Enter instructor and lesson ids to load a real QR token.
                </div>
              )}
            </div>

            <div className="attendance-qr-test__countdown">
              <span>Refresh in {countdown}s</span>
              <div className="attendance-qr-test__progress">
                <div
                  className="attendance-qr-test__progress-fill"
                  style={{ width: `${(countdown / QR_REFRESH_SECONDS) * 100}%` }}
                />
              </div>
            </div>

            <label className="attendance-qr-test__field">
              <span>Current token</span>
              <input type="text" value={currentToken} readOnly />
            </label>

            <div className="attendance-qr-test__actions">
              <button type="button" onClick={() => void resolveSession()}>
                Resolve session
              </button>
              <button type="button" onClick={() => void refreshQrToken()}>
                Refresh token now
              </button>
              <button type="button" onClick={() => void handleCopyToken()}>
                Copy token
              </button>
            </div>

            {copyMessage ? <p className="attendance-qr-test__success">{copyMessage}</p> : null}
            {tokenError ? <p className="attendance-qr-test__error">{tokenError}</p> : null}
            {resolvedSessionState ? (
              <p className="attendance-qr-test__success">
                Session loaded: {resolvedSessionState.sessionId}
              </p>
            ) : null}
          </section>

          <section className="attendance-qr-test__card">
            <h2>2. Paste token and send request</h2>
            <p className="attendance-qr-test__hint">
              After your phone camera reads the QR, copy the plain token and paste it below.
            </p>

            <form className="attendance-qr-test__form" onSubmit={handleSubmit}>
              <label className="attendance-qr-test__field">
                <span>Student id override</span>
                <input
                  type="text"
                  value={studentIdOverride}
                  onChange={(event) => setStudentIdOverride(event.target.value)}
                  placeholder="Optional if already available in auth context"
                />
              </label>

              <label className="attendance-qr-test__field">
                <span>Pasted QR token</span>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(event) => setManualToken(event.target.value)}
                  placeholder="Paste the token scanned from the QR"
                />
              </label>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending request...' : 'Send attendance request'}
              </button>
            </form>

            <div className="attendance-qr-test__meta">
              <span>Resolved student id: <strong>{resolvedStudentId || 'Unavailable'}</strong></span>
              <span>Endpoint: <code>/api/students/{resolvedStudentId || '<studentId>'}/attendance/qr/scan</code></span>
            </div>

            {submitError ? (
              <p className="attendance-qr-test__error" role="alert">
                {submitError}
              </p>
            ) : null}

            {submitResult ? (
              <div className="attendance-qr-test__result" role="status">
                <strong>{submitResult.message || 'Attendance marked successfully.'}</strong>
                <span>Token sent: {manualToken.trim()}</span>
                <span>Recorded at: {formatRecordedAt(submitResult.recordedAt) || 'No timestamp returned'}</span>
              </div>
            ) : null}
          </section>

          <section className="attendance-qr-test__card attendance-qr-test__card--full">
            <h2>3. What your request sends</h2>
            <pre className="attendance-qr-test__code">{requestPreview}</pre>
          </section>
        </div>
      </div>
    </div>
  )
}
