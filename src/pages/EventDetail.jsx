import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRegisteredEvents } from '../contexts/RegisteredEventsContext'
import { fetchEvent, fetchMyEventRegistrations, registerForEvent } from '../api/clubApi'
import { mapEventFromApi } from '../api/clubMappers'
import './EventDetail.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconMapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
)

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

const formatTimeRange = (start, end) => {
  if (!start) return ''
  return end ? `${formatTime(start)} - ${formatTime(end)}` : formatTime(start)
}

const EventDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { registerEvent, isRegistered } = useRegisteredEvents()
  const [event, setEvent] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiRegistered, setApiRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      setLoading(true)
      setLoadError(null)
      try {
        const [rawEv, rawReg] = await Promise.all([
          fetchEvent(id),
          fetchMyEventRegistrations().catch(() => null),
        ])
        if (cancelled) return
        setEvent(mapEventFromApi(rawEv))
        const items = rawReg?.items ?? rawReg ?? []
        const list = Array.isArray(items) ? items : []
        const found = list.some((r) => String(r.eventId ?? r.event?.id ?? r.id) === String(id))
        setApiRegistered(found)
      } catch (e) {
        if (!cancelled) {
          setEvent(null)
          setLoadError(e?.message || 'Failed to load event.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const registered = apiRegistered || isRegistered(id)

  const totalSlots = useMemo(() => {
    if (!event) return 150
    const cap = Number(event.seatLimit)
    return Number.isFinite(cap) && cap > 0 ? cap : 150
  }, [event])

  const remainingSlots = useMemo(() => Math.max(0, Math.floor(totalSlots * 0.72)), [totalSlots])

  if (loading) {
    return (
      <div className="ed-page">
        <div className="ed-not-found">
          <p>Loading event…</p>
        </div>
      </div>
    )
  }

  if (loadError || !event) {
    return (
      <div className="ed-page">
        <div className="ed-not-found">
          <p>{loadError || 'Event not found.'}</p>
          <button type="button" className="ed-btn ed-btn--primary" onClick={() => navigate('/clubs/events')}>
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const handleBack = () => navigate('/clubs/events')

  const handleRegister = async () => {
    if (registering) return
    setRegistering(true)
    try {
      await registerForEvent(id)
      registerEvent(id)
      setApiRegistered(true)
      navigate(`/clubs/events/${id}/ticket`, { state: { fromRegistration: true } })
    } catch (e) {
      alert(e?.message || 'Could not register.')
    } finally {
      setRegistering(false)
    }
  }

  const scheduleTime = formatTimeRange(event.time, event.endTime)

  return (
    <div className="ed-page">
      <header className="ed-nav">
        <button type="button" className="ed-back" onClick={handleBack} aria-label="Back">
          <IconBack />
        </button>
        <span className="ed-nav-logo">CampusEvents</span>
        <nav className="ed-nav-links">
          <button type="button" onClick={() => navigate('/clubs/events')}>Explore</button>
          <button type="button" onClick={() => navigate('/clubs')}>Clubs</button>
          <button type="button" className="ed-nav-active" onClick={() => navigate('/clubs/events/my-registrations')}>My Events</button>
          <span>Calendar</span>
        </nav>
        <div className="ed-nav-search">
          <input type="text" placeholder="Search events..." readOnly aria-label="Search" />
        </div>
        <span className="ed-nav-profile">Profile</span>
      </header>

      <div
        className="ed-hero"
        style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
      >
        <h1 id="event-detail-title" className="ed-hero-title">{event.title}</h1>
      </div>

      <div className="ed-info-cards">
        <div className="ed-info-card">
          <IconCalendar />
          <span>{formatDate(event.date)}</span>
        </div>
        <div className="ed-info-card">
          <IconClock />
          <span>{scheduleTime}</span>
        </div>
        <div className="ed-info-card">
          <IconMapPin />
          <span>{event.location}</span>
        </div>
      </div>

      <div className="ed-main">
        <div className="ed-content">
          <section className="ed-section">
            <h2 className="ed-section-title">
              <IconInfo />
              Purpose / Objectives of the Event
            </h2>
            <p className="ed-desc">{event.description}</p>
          </section>

          <section className="ed-section">
            <h2 className="ed-section-title">Event Agenda / Schedule (Sub-events)</h2>
            <div className="ed-agenda-wrap">
              <table className="ed-agenda">
                <thead>
                  <tr>
                    <th>Sub-event Title</th>
                    <th>Sub-event Start Time</th>
                    <th>Sub-event End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(event.subEvents) && event.subEvents.length > 0 ? (
                    event.subEvents.map((sub, index) => (
                      <tr key={index}>
                        <td>{sub.title}</td>
                        <td>{formatTime(sub.startTime)}</td>
                        <td>{formatTime(sub.endTime)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>{event.title}</td>
                      <td>{formatTime(event.time)}</td>
                      <td>{formatTime(event.endTime)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="ed-sidebar">
          <div className="ed-sidebar-card">
            <span className="ed-sidebar-label">Remaining Slots</span>
            <p className="ed-sidebar-slots">{remainingSlots} / {totalSlots}</p>
            <div className="ed-progress">
              <div className="ed-progress-fill" style={{ width: `${((totalSlots - remainingSlots) / totalSlots) * 100}%` }} />
            </div>
            {registered ? (
              <button
                type="button"
                className="ed-btn ed-btn--primary ed-btn--full"
                onClick={() => navigate(`/clubs/events/${id}/ticket`)}
              >
                View Ticket
              </button>
            ) : (
              <>
                <button type="button" className="ed-btn ed-btn--primary ed-btn--full" onClick={handleRegister} disabled={registering}>
                  <IconCalendar />
                  {registering ? 'Registering…' : 'Register for Event'}
                </button>
                <button type="button" className="ed-btn ed-btn--secondary ed-btn--full">
                  Add to Calendar
                </button>
              </>
            )}
          </div>

          <div className="ed-sidebar-card">
            <span className="ed-sidebar-label">Hosted by</span>
            <div className="ed-host">
              <div className="ed-host-avatar">{(event.clubName || 'C').charAt(0)}</div>
              <div>
                <strong>{event.clubName || 'Club'}</strong>
                <span>2,400 members</span>
                <span>Established 2015</span>
              </div>
            </div>
          </div>

        </aside>
      </div>

      <footer className="ed-footer">
        <span className="ed-footer-logo">CampusEvents</span>
        <span className="ed-footer-copy">© 2023 University Student Association. All rights reserved.</span>
        <nav className="ed-footer-links">
          <span>Privacy Policy</span>
          <span>Contact Support</span>
        </nav>
      </footer>
    </div>
  )
}

export default EventDetail
