import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { parseAttendanceQrPayload, resolveAuthenticatedStudentId, scanAttendanceQrCode } from '../api/attendance'
import { getAccessToken } from '../auth'
import './AttendanceStudentScanner.css'

const REPEAT_WINDOW_MS = 1_500
const READER_ELEMENT_ID = 'attendance-qr-reader-h5'

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

function tokenDebugTail(value) {
  const s = String(value || '')
  if (!s) return '—'
  if (s.length <= 8) return '****'
  return `…${s.slice(-6)}`
}

function mapScanErrorMessage(error) {
  if (!error) return 'Attendance scan failed.'
  const code = error.code || error?.body?.errorCode || error?.body?.code
  const supportCodes = new Set([
    'token_expired',
    'student_not_enrolled',
    'already_scanned_this_round',
    'replay_token',
    'student_token_mismatch',
    'activation_inactive',
    'outside_attendance_window',
  ])
  if (code && String(code).toLowerCase && supportCodes.has(String(code).toLowerCase())) {
    return `${error.message || 'Scan not accepted.'} (ref: ${code})`
  }
  if (error.status === 400) return error.message || 'Invalid or expired QR code.'
  if (error.status === 401 || error.status === 403) {
    return error.message || 'Unauthorized request or wrong student.'
  }
  if (code) return `${error.message || 'Request failed.'} (ref: ${code})`
  return error.message || 'Attendance scan failed.'
}

export default function AttendanceStudentScanner() {
  const lastDupRef = useRef({ t: 0, s: '' })
  const html5Ref = useRef(null)
  const isSubmittingRef = useRef(false)

  const [manualToken, setManualToken] = useState('')
  const [lastScannedForPreview, setLastScannedForPreview] = useState('')
  const [scannerStatus, setScannerStatus] = useState('idle')
  const [cameraError, setCameraError] = useState('')
  const [scanMessage, setScanMessage] = useState(
    'Start the camera and point it at the instructor QR, or paste the code manually for testing.',
  )
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [studentIdOverride, setStudentIdOverride] = useState('')

  const accessToken = getAccessToken()

  const resolvedStudentId = useMemo(() => {
    try {
      return resolveAuthenticatedStudentId(studentIdOverride)
    } catch {
      return ''
    }
  }, [studentIdOverride])

  const stopScanner = useCallback(async () => {
    if (html5Ref.current) {
      try {
        const h = html5Ref.current
        const state = h.getState?.()
        if (state === 2 || state === 'SCANNING') {
          await h.stop()
        }
        await h.clear()
      } catch {
        // ignore
      }
      html5Ref.current = null
    }
    setIsCameraOpen(false)
    setScannerStatus('idle')
  }, [])

  const submitScannedToken = useCallback(
    async (rawToken, sourceLabel) => {
      if (isSubmittingRef.current) return
      const trimmed = String(rawToken || '').trim()
      if (!trimmed) return
      const now = Date.now()
      if (trimmed === lastDupRef.current.s && now - lastDupRef.current.t < REPEAT_WINDOW_MS) {
        return
      }

      isSubmittingRef.current = true
      setIsSubmitting(true)
      setSubmitError('')
      setResult(null)
      setLastScannedForPreview(trimmed)
      setScanMessage(`Code received (${sourceLabel}). Submitting check-in…`)

      try {
        const response = await scanAttendanceQrCode({
          studentId: studentIdOverride || undefined,
          scannedToken: rawToken,
        })
        setResult(response)
        lastDupRef.current = { t: Date.now(), s: trimmed }
        setScanMessage(response.message || 'Check-in successful.')
        await stopScanner()
      } catch (error) {
        setSubmitError(mapScanErrorMessage(error))
        setResult(null)
        setScanMessage('Scan not accepted. Try again or use manual entry.')
      } finally {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      }
    },
    [stopScanner, studentIdOverride],
  )

  const startScanner = useCallback(async () => {
    setCameraError('')
    setSubmitError('')
    setResult(null)

    if (!accessToken) {
      setSubmitError('You must be signed in before scanning attendance.')
      return
    }
    if (!resolvedStudentId) {
      setSubmitError('Student id is unavailable. Sign in again or set an override.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available in this browser. Use manual paste instead.')
      return
    }

    await stopScanner()

    setScannerStatus('starting')
    try {
      const h = new Html5Qrcode(READER_ELEMENT_ID, { verbose: false })
      html5Ref.current = h
      await h.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          void submitScannedToken(decodedText, 'camera')
        },
        () => {},
      )
      setIsCameraOpen(true)
      setScannerStatus('scanning')
      setScanMessage('Camera is live. Hold the QR in frame until the check-in is sent.')
    } catch (error) {
      await stopScanner()
      setCameraError(error?.message || 'Unable to start the camera. Try manual entry.')
    }
  }, [accessToken, resolvedStudentId, stopScanner, submitScannedToken])

  const handleManualSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      await submitScannedToken(manualToken, 'manual')
    },
    [manualToken, submitScannedToken],
  )

  useEffect(
    () => () => {
      void stopScanner()
    },
    [stopScanner],
  )

  const requestPreview = useMemo(() => {
    const raw = manualToken.trim() || lastScannedForPreview
    let sampleToken = 'eyJ...'
    try {
      if (raw) {
        const p = parseAttendanceQrPayload(raw)
        sampleToken = p.token
      }
    } catch {
      sampleToken = '…'
    }
    const student = resolvedStudentId || '<studentId>'
    const withPipe = String(sampleToken).includes('|') ? String(sampleToken) : `${String(sampleToken)}|${student}`
    return {
      endpoint: `/api/students/${student}/attendance/scan`,
      body: JSON.stringify(
        {
          token: withPipe,
          studentId: student,
          deviceInfo: 'Web (preview)',
        },
        null,
        2,
      ),
    }
  }, [lastScannedForPreview, manualToken, resolvedStudentId])

  return (
    <div className="attendance-student-scanner">
      <div className="attendance-student-scanner__container">
        <header className="attendance-student-scanner__header">
          <div>
            <p className="attendance-student-scanner__eyebrow">Student Attendance</p>
            <h1>Scan attendance QR</h1>
            <p className="attendance-student-scanner__subtitle">
              The code is a short-lived JWT. The app posts <code>jwt|yourStudentId</code> to link the
              token to your account, then shows the server result.
            </p>
          </div>
          <Link to="/" className="attendance-student-scanner__link">
            Back to home
          </Link>
        </header>

        <section className="attendance-student-scanner__grid">
          <div className="attendance-student-scanner__card">
            <h2>1. Verify session &amp; camera</h2>
            <div className="attendance-student-scanner__meta">
              <div>
                <span className="attendance-student-scanner__meta-label">JWT access token</span>
                <strong>{accessToken ? 'Available' : 'Missing'}</strong>
              </div>
              <div>
                <span className="attendance-student-scanner__meta-label">Resolved student id</span>
                <strong>{resolvedStudentId || 'Unavailable'}</strong>
              </div>
            </div>

            <label className="attendance-student-scanner__field">
              <span>Student id override</span>
              <input
                type="text"
                value={studentIdOverride}
                onChange={(e) => setStudentIdOverride(e.target.value)}
                placeholder="Optional if your session already has student id"
              />
            </label>

            <div className="attendance-student-scanner__actions">
              <button type="button" onClick={() => void startScanner()} disabled={isSubmitting}>
                Start camera
              </button>
              <button type="button" onClick={() => void stopScanner()} disabled={!isCameraOpen && scannerStatus === 'idle'}>
                Stop camera
              </button>
            </div>

            <div
              className="attendance-student-scanner__camera"
              style={{ minHeight: 300, background: '#0f172a' }}
            >
              <div id={READER_ELEMENT_ID} className="attendance-student-scanner__video" />
            </div>

            <p className="attendance-student-scanner__status">
              Scanner: <strong>{scannerStatus}</strong> · repeat suppress: {REPEAT_WINDOW_MS}ms
            </p>
            <p className="attendance-student-scanner__hint">{scanMessage}</p>
            {cameraError ? <p className="attendance-student-scanner__error">{cameraError}</p> : null}
          </div>

          <div className="attendance-student-scanner__card">
            <h2>2. Manual (testing)</h2>
            <p className="attendance-student-scanner__hint">Paste the raw QR string (JWT) or a full <code>jwt|studentGuid</code> line.</p>

            <form onSubmit={handleManualSubmit} className="attendance-student-scanner__form">
              <label className="attendance-student-scanner__field">
                <span>Payload</span>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste from QR (JWT only, or legacy JSON)"
                />
              </label>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit check-in'}
              </button>
            </form>

            {submitError ? (
              <p className="attendance-student-scanner__error" role="alert">
                {submitError}
              </p>
            ) : null}

            {result && result.success ? (
              <div className="attendance-student-scanner__success" role="status">
                <strong>{result.message || 'OK'}</strong>
                {result.status != null ? <span>Status: {String(result.status)}</span> : null}
                {result.round != null ? <span>Round: {String(result.round)}</span> : null}
                {result.validScanCount != null ? (
                  <span>Rounds completed (this session): {String(result.validScanCount)}</span>
                ) : null}
                <span>Token end: {tokenDebugTail(lastScannedForPreview || manualToken)}</span>
                <span>Recorded: {formatRecordedAt(result.recordedAt) || '—'}</span>
              </div>
            ) : null}
          </div>

          <div className="attendance-student-scanner__card attendance-student-scanner__card--full">
            <h2>3. Request preview (shape)</h2>
            <p className="attendance-student-scanner__hint">
              Production uses <code>POST /api/students/&#123;id&#125;/attendance/scan</code> with
              <code>Authorization: Bearer &lt;access_token&gt;</code>
            </p>
            <div className="attendance-student-scanner__preview">
              <div>
                <span className="attendance-student-scanner__meta-label">POST</span>
                <code>{requestPreview.endpoint}</code>
              </div>
              <div>
                <span className="attendance-student-scanner__meta-label">Body</span>
                <pre>{requestPreview.body}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
