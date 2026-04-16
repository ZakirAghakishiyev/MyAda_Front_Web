import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  resolveAuthenticatedStudentId,
  scanAttendanceQrCode,
  validateAttendanceQrToken,
} from '../api/attendance'
import { getAccessToken } from '../auth'
import './AttendanceStudentScanner.css'

const SCAN_INTERVAL_MS = 350

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

function mapScanErrorMessage(error) {
  if (!error) return 'Attendance scan failed.'
  if (error.status === 400) return error.message || 'Invalid or expired QR code.'
  if (error.status === 401 || error.status === 403) {
    return error.message || 'Unauthorized request or wrong student.'
  }
  return error.message || 'Attendance scan failed.'
}

export default function AttendanceStudentScanner() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const scanTimerRef = useRef(null)
  const isSubmittingRef = useRef(false)

  const [manualToken, setManualToken] = useState('')
  const [lastScannedToken, setLastScannedToken] = useState('')
  const [scannerStatus, setScannerStatus] = useState('idle')
  const [cameraError, setCameraError] = useState('')
  const [scanMessage, setScanMessage] = useState('Open the scanner, point the camera at the QR code, and we will post the token automatically.')
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

  const barcodeDetectorSupported =
    typeof window !== 'undefined' && 'BarcodeDetector' in window

  const stopScanner = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current)
      scanTimerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraOpen(false)
    setScannerStatus('idle')
  }, [])

  const submitScannedToken = useCallback(async (rawToken, sourceLabel) => {
    if (isSubmittingRef.current) return

    let token
    try {
      token = validateAttendanceQrToken(rawToken)
    } catch (error) {
      setSubmitError(error.message)
      setResult(null)
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError('')
    setResult(null)
    setLastScannedToken(token)
    setScanMessage(`Token detected from ${sourceLabel}. Sending attendance request...`)

    try {
      const response = await scanAttendanceQrCode({
        studentId: studentIdOverride || undefined,
        scannedToken: token,
      })

      setResult(response)
      setScanMessage(response.message || 'Attendance marked successfully.')
      stopScanner()
    } catch (error) {
      setSubmitError(mapScanErrorMessage(error))
      setResult(null)
      setScanMessage('Scan failed. You can retry with the camera or submit the token manually.')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [stopScanner, studentIdOverride])

  const handleManualSubmit = useCallback(async (event) => {
    event.preventDefault()
    await submitScannedToken(manualToken, 'manual entry')
  }, [manualToken, submitScannedToken])

  const scanFrame = useCallback(async () => {
    if (
      !barcodeDetectorSupported ||
      !videoRef.current ||
      videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      isSubmittingRef.current
    ) {
      return
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const barcodes = await detector.detect(videoRef.current)
      const rawValue = String(barcodes?.[0]?.rawValue ?? '').trim()

      if (!rawValue) return

      await submitScannedToken(rawValue, 'camera scan')
    } catch (error) {
      setCameraError(error?.message || 'Unable to read QR code from camera.')
    }
  }, [barcodeDetectorSupported, submitScannedToken])

  const startScanner = useCallback(async () => {
    setCameraError('')
    setSubmitError('')
    setResult(null)

    if (!accessToken) {
      setSubmitError('You must be signed in before scanning attendance.')
      return
    }

    if (!resolvedStudentId) {
      setSubmitError('Student id is unavailable. Provide it in context or sign in again.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available in this browser. Use manual token entry instead.')
      return
    }

    if (!barcodeDetectorSupported) {
      setCameraError('QR scanning is not supported in this browser. Use manual token entry instead.')
      return
    }

    try {
      stopScanner()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'environment' },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsCameraOpen(true)
      setScannerStatus('scanning')
      setScanMessage('Camera is live. Hold the QR code steady until the token is detected.')
      scanTimerRef.current = setInterval(() => {
        void scanFrame()
      }, SCAN_INTERVAL_MS)
    } catch (error) {
      stopScanner()
      setCameraError(error?.message || 'Unable to start the camera.')
    }
  }, [accessToken, barcodeDetectorSupported, resolvedStudentId, scanFrame, stopScanner])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const requestPreview = useMemo(() => {
    const safeToken = lastScannedToken || manualToken.trim() || 'ADA_d4f8k9x1'
    const studentId = resolvedStudentId || '<studentId>'
    return {
      endpoint: `/api/students/${studentId}/attendance/qr/scan`,
      body: JSON.stringify({ token: safeToken }, null, 2),
    }
  }, [lastScannedToken, manualToken, resolvedStudentId])

  return (
    <div className="attendance-student-scanner">
      <div className="attendance-student-scanner__container">
        <header className="attendance-student-scanner__header">
          <div>
            <p className="attendance-student-scanner__eyebrow">Student Attendance</p>
            <h1>Scan attendance QR</h1>
            <p className="attendance-student-scanner__subtitle">
              The QR payload must be the plain token value only. Once detected, the client posts
              it to the authenticated student attendance scan endpoint.
            </p>
          </div>
          <Link to="/" className="attendance-student-scanner__link">
            Back to home
          </Link>
        </header>

        <section className="attendance-student-scanner__grid">
          <div className="attendance-student-scanner__card">
            <h2>1. Verify session context</h2>
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
                onChange={(event) => setStudentIdOverride(event.target.value)}
                placeholder="Optional if already available in auth context"
              />
            </label>

            <div className="attendance-student-scanner__actions">
              <button type="button" onClick={() => void startScanner()} disabled={isSubmitting}>
                Start camera scanner
              </button>
              <button type="button" onClick={stopScanner} disabled={!isCameraOpen}>
                Stop scanner
              </button>
            </div>

            <div className="attendance-student-scanner__camera">
              {isCameraOpen ? (
                <video ref={videoRef} muted playsInline className="attendance-student-scanner__video" />
              ) : (
                <div className="attendance-student-scanner__camera-placeholder">
                  Camera preview appears here after you start scanning.
                </div>
              )}
            </div>

            <p className="attendance-student-scanner__status">
              Scanner status: <strong>{scannerStatus}</strong>
            </p>
            <p className="attendance-student-scanner__hint">{scanMessage}</p>
            {cameraError ? <p className="attendance-student-scanner__error">{cameraError}</p> : null}
          </div>

          <div className="attendance-student-scanner__card">
            <h2>2. Manual fallback</h2>
            <p className="attendance-student-scanner__hint">
              Use this when camera scanning is unavailable. The same validation runs before the
              request is sent.
            </p>

            <form onSubmit={handleManualSubmit} className="attendance-student-scanner__form">
              <label className="attendance-student-scanner__field">
                <span>Scanned QR token</span>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(event) => setManualToken(event.target.value)}
                  placeholder="Paste the plain token from the QR code"
                />
              </label>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit attendance token'}
              </button>
            </form>

            {submitError ? (
              <p className="attendance-student-scanner__error" role="alert">
                {submitError}
              </p>
            ) : null}

            {result ? (
              <div className="attendance-student-scanner__success" role="status">
                <strong>{result.message || 'Attendance marked successfully.'}</strong>
                <span>Student: {resolvedStudentId || studentIdOverride}</span>
                <span>Token: {lastScannedToken}</span>
                <span>Recorded at: {formatRecordedAt(result.recordedAt) || 'Returned by server without timestamp'}</span>
              </div>
            ) : null}
          </div>

          <div className="attendance-student-scanner__card attendance-student-scanner__card--full">
            <h2>3. Request preview</h2>
            <p className="attendance-student-scanner__hint">
              Example of a scanned token being posted to the endpoint after validation succeeds.
            </p>

            <div className="attendance-student-scanner__preview">
              <div>
                <span className="attendance-student-scanner__meta-label">POST endpoint</span>
                <code>{requestPreview.endpoint}</code>
              </div>
              <div>
                <span className="attendance-student-scanner__meta-label">Authorization</span>
                <code>Bearer &lt;jwt_access_token&gt;</code>
              </div>
              <div>
                <span className="attendance-student-scanner__meta-label">JSON body</span>
                <pre>{requestPreview.body}</pre>
              </div>
            </div>

            <div className="attendance-student-scanner__responses">
              <span className="attendance-student-scanner__response attendance-student-scanner__response--success">
                Success: attendance marked successfully
              </span>
              <span className="attendance-student-scanner__response attendance-student-scanner__response--error">
                400: invalid or expired QR code
              </span>
              <span className="attendance-student-scanner__response attendance-student-scanner__response--warning">
                401/403: unauthorized or wrong student
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
