import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchEventTicket } from '../api/clubApi'
import './AttendanceQrTestPage.css'

function base64UrlToUtf8(input) {
  const s = String(input || '').trim()
  if (!s) return ''
  const normalized = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  // atob returns latin1; JSON payloads are ASCII/UTF-8 safe for typical JWTs.
  return atob(padded)
}

function tryJsonParse(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function decodeJwtParts(jwt) {
  const raw = String(jwt || '').trim()
  if (!raw) return { ok: false, error: 'QR payload is empty.' }
  if (raw.includes('\n') || raw.includes('\r')) return { ok: false, error: 'Payload contains newlines.' }
  const parts = raw.split('.')
  if (parts.length < 2) return { ok: false, error: 'Not a JWT (expected 3 dot-separated parts).' }
  const [h, p] = parts
  try {
    const headerText = base64UrlToUtf8(h)
    const payloadText = base64UrlToUtf8(p)
    const headerJson = tryJsonParse(headerText)
    const payloadJson = tryJsonParse(payloadText)
    return {
      ok: true,
      raw,
      headerText,
      payloadText,
      headerJson,
      payloadJson,
    }
  } catch (e) {
    return { ok: false, error: e?.message || 'Failed to decode JWT.' }
  }
}

function formatEpochSeconds(sec) {
  const n = Number(sec)
  if (!Number.isFinite(n)) return null
  const d = new Date(n * 1000)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

export default function EventTicketQrTestPage() {
  const [eventId, setEventId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [manualToken, setManualToken] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  const decoded = useMemo(() => decodeJwtParts(manualToken), [manualToken])

  const expText = useMemo(() => {
    if (!decoded.ok) return null
    const exp = decoded.payloadJson?.exp
    return exp != null ? formatEpochSeconds(exp) : null
  }, [decoded])

  const isExpired = useMemo(() => {
    if (!decoded.ok) return null
    const exp = Number(decoded.payloadJson?.exp)
    if (!Number.isFinite(exp)) return null
    return Date.now() >= exp * 1000
  }, [decoded])

  const handleLoadTicket = useCallback(async () => {
    setLoadError('')
    setCopyMessage('')
    const trimmed = String(eventId || '').trim()
    if (!trimmed) {
      setLoadError('Event id is required.')
      return
    }
    setIsLoading(true)
    try {
      const ticket = await fetchEventTicket(trimmed)
      const jwtToken =
        ticket?.jwt ?? ticket?.token ?? ticket?.accessToken ?? ticket?.ticketToken ?? ticket?.qrToken ?? null
      if (!jwtToken) {
        setLoadError('Backend did not return a ticket JWT field (jwt/token/accessToken/ticketToken/qrToken).')
        return
      }
      setManualToken(String(jwtToken))
    } catch (e) {
      setLoadError(e?.message || 'Could not load event ticket.')
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  const handleCopy = useCallback(async () => {
    const value = String(manualToken || '').trim()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage('Copied.')
      setTimeout(() => setCopyMessage(''), 1200)
    } catch {
      setCopyMessage('Copy failed. Select and copy manually.')
    }
  }, [manualToken])

  const prettyHeader = useMemo(() => {
    if (!decoded.ok) return ''
    return decoded.headerJson ? JSON.stringify(decoded.headerJson, null, 2) : decoded.headerText
  }, [decoded])

  const prettyPayload = useMemo(() => {
    if (!decoded.ok) return ''
    return decoded.payloadJson ? JSON.stringify(decoded.payloadJson, null, 2) : decoded.payloadText
  }, [decoded])

  return (
    <div className="attendance-qr-test">
      <div className="attendance-qr-test__container">
        <header className="attendance-qr-test__header">
          <div>
            <p className="attendance-qr-test__eyebrow">Event Ticket Test</p>
            <h1>QR ticket test page (no camera)</h1>
            <p className="attendance-qr-test__subtitle">
              Paste the QR text from the ticket (usually a JWT), or load your ticket by event id to inspect the decoded
              payload.
            </p>
          </div>
          <Link to="/clubs/events" className="attendance-qr-test__link">
            Back to events
          </Link>
        </header>

        <div className="attendance-qr-test__grid">
          <section className="attendance-qr-test__card">
            <h2>1. Load ticket (optional)</h2>
            <p className="attendance-qr-test__hint">Fetches <code>GET /events/&lt;id&gt;/ticket</code> and fills the JWT here.</p>

            <label className="attendance-qr-test__field">
              <span>Event id</span>
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Example: 12"
              />
            </label>

            <div className="attendance-qr-test__actions">
              <button type="button" onClick={() => void handleLoadTicket()} disabled={isLoading}>
                {isLoading ? 'Loading…' : 'Load my ticket'}
              </button>
              <button type="button" onClick={() => void handleCopy()} disabled={!String(manualToken || '').trim()}>
                Copy current payload
              </button>
            </div>

            {copyMessage ? <p className="attendance-qr-test__success">{copyMessage}</p> : null}
            {loadError ? <p className="attendance-qr-test__error">{loadError}</p> : null}
          </section>

          <section className="attendance-qr-test__card">
            <h2>2. Paste QR payload</h2>
            <p className="attendance-qr-test__hint">Paste the raw QR string. For tickets, this should be the ticket JWT.</p>

            <label className="attendance-qr-test__field">
              <span>Payload</span>
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste ticket QR payload here"
                spellCheck={false}
              />
            </label>

            {!decoded.ok ? (
              <p className="attendance-qr-test__error" role="alert">
                {decoded.error}
              </p>
            ) : (
              <div className="attendance-qr-test__meta">
                <span>
                  JWT exp: <strong>{expText || '—'}</strong>
                </span>
                <span>
                  Expired: <strong>{isExpired == null ? '—' : isExpired ? 'Yes' : 'No'}</strong>
                </span>
              </div>
            )}
          </section>

          <section className="attendance-qr-test__card attendance-qr-test__card--full">
            <h2>3. Decoded JWT (local)</h2>
            <p className="attendance-qr-test__hint">This page does not verify signatures — it only decodes base64url.</p>
            <div className="attendance-qr-test__grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Header</p>
                <pre className="attendance-qr-test__code">{prettyHeader || '—'}</pre>
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Payload</p>
                <pre className="attendance-qr-test__code">{prettyPayload || '—'}</pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

