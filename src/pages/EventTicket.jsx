import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchEvent, fetchEventTicket } from '../api/clubApi'
import { mapEventFromApi } from '../api/clubMappers'
import adaLogo from '../assets/ada-logo.png'
import './ClubVacancies.css'
import './EventTicket.css'

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconMapPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconPerson = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconDownload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTimeRange = (start, end) => {
  if (!start) return ''
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }
  return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start)
}

const EventTicket = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [ticketPayload, setTicketPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      try {
        const [rawEv, ticket] = await Promise.all([
          fetchEvent(id),
          fetchEventTicket(id).catch(() => null),
        ])
        if (cancelled) return
        setEvent(mapEventFromApi(rawEv))
        setTicketPayload(ticket && typeof ticket === 'object' ? ticket : null)
      } catch (e) {
        if (!cancelled) {
          setEvent(null)
          setLoadError(e?.message || 'Could not load ticket.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [id])

  if (loadError || !event) {
    return (
      <div className="et-page">
        <div className="et-not-found">
          <p>{loadError || 'Ticket not found.'}</p>
          <button type="button" className="et-btn" onClick={() => navigate('/clubs/events')}>
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const ticketId =
    ticketPayload?.ticketId ??
    ticketPayload?.id ??
    `TC-2024-${String(event.id).padStart(4, '0')}`
  const attendeeName =
    ticketPayload?.attendeeName ??
    ticketPayload?.holderName ??
    ticketPayload?.name ??
    'Attendee'
  const qrData = encodeURIComponent(JSON.stringify({ eventId: event.id, ticketId, attendee: attendeeName }))
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`

  const handleDownload = () => {
    fetch(qrUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ticket-${event.title.replace(/\s+/g, '-')}-qr.png`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => {
        const a = document.createElement('a')
        a.href = qrUrl
        a.download = `ticket-${event.id}-qr.png`
        a.target = '_blank'
        a.rel = 'noopener'
        a.click()
      })
  }

  const scheduleTime = formatTimeRange(event.time, event.endTime)

  return (
    <div className="et-page">
      <header className="vacancies-nav">
        <div className="vacancies-nav-left">
          <div
            className="vacancies-nav-logo"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
          >
            <img src={adaLogo} alt="ADA University" className="vacancies-ada-logo" />
          </div>
          <nav className="vacancies-nav-links">
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/vacancies')}>Vacancies</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/vacancies/my-applications')}>My Applications</button>
            <button type="button" className="vacancies-nav-link vacancies-nav-link--active">Events</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs')}>Clubs</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/propose')}>Propose Club</button>
          </nav>
        </div>
        <div className="vacancies-nav-right">
          <button
            type="button"
            className="vacancies-nav-icon"
            aria-label="Notifications"
            onClick={() => navigate('/clubs/notifications')}
          >
            <IconBell />
          </button>
          <button
            type="button"
            className="vacancies-nav-avatar"
            aria-label="My memberships"
            onClick={() => navigate('/clubs/my-memberships')}
          >
            U
          </button>
        </div>
      </header>

      <div className="et-page-content">
      <div className="et-breadcrumb">
        Home &gt; {event.clubName} &gt; {event.title}
      </div>

      <div className="et-confirm-banner">
        <IconCheck />
        <div>
          <strong>Registration Confirmed!</strong>
          <p>You&apos;re all set for the {event.title}. A confirmation email has been sent to student.name@university.edu.</p>
        </div>
      </div>

      <div className="et-ticket-wrap">
        <div className="et-ticket">
          <div className="et-ticket-head">
            <span className="et-ticket-label">OFFICIAL ENTRY PASS</span>
            <span className="et-ticket-id">{ticketId}</span>
          </div>
          <div className="et-ticket-body">
            <div className="et-ticket-qr">
              <img src={qrUrl} alt="QR Code" width={200} height={200} />
              <span className="et-ticket-scan">SCAN AT ENTRANCE</span>
            </div>
            <div className="et-ticket-details">
              <h2 className="et-ticket-title">{event.title}</h2>
              <p className="et-ticket-presented">Presented by {event.clubName}</p>
              <div className="et-ticket-meta">
                <span><IconCalendar /> {formatDate(event.date)}</span>
                <span><IconClock /> {scheduleTime}</span>
                <span><IconMapPin /> {event.location}</span>
                <span><IconPerson /> {attendeeName}</span>
              </div>
              <div className="et-ticket-actions">
                <button type="button" className="et-btn et-btn--download" onClick={handleDownload}>
                  <IconDownload />
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="et-footer">
        <span className="et-footer-logo">CampusEvents</span>
        <span className="et-footer-copy">© 2023 University Events Platform. All rights reserved.</span>
        <nav className="et-footer-links">
          <span>Help Center</span>
          <span>Privacy Policy</span>
          <span>Contact</span>
        </nav>
      </footer>
      </div>
    </div>
  )
}

export default EventTicket
