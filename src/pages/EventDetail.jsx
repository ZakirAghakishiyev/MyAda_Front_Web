import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRegisteredEvents } from '../contexts/RegisteredEventsContext'
import { fetchEvent, fetchMyEventRegistrations, registerForEvent, fetchClub } from '../api/clubApi'
import { mapEventFromApi, mapClubFromApi } from '../api/clubMappers'
import ClubsAreaNav from '../components/clubs/ClubsAreaNav'
import './EventDetail.css'

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

function toFiniteNonNegativeInt(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const i = Math.floor(n)
  return i >= 0 ? i : null
}

function pickFirstFiniteNonNegativeInt(obj, keys) {
  if (!obj || typeof obj !== 'object') return null
  for (const key of keys) {
    const v = toFiniteNonNegativeInt(obj[key])
    if (v != null) return v
  }
  return null
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
  const [hostClub, setHostClub] = useState(null)
  const [hostClubLoading, setHostClubLoading] = useState(false)
  const [registeredCountOverride, setRegisteredCountOverride] = useState(null)

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
        const mapped = mapEventFromApi(rawEv)
        setEvent(mapped)
        const rawObj = mapped?.raw && typeof mapped.raw === 'object' ? mapped.raw : rawEv
        const initialRegisteredCount = pickFirstFiniteNonNegativeInt(rawObj, [
          'registeredCount',
          'registrationsCount',
          'registrationCount',
          'attendeesCount',
          'attendeeCount',
          'participantsCount',
          'participantCount',
          'participants',
          'attendees',
          'spotsTaken',
          'seatsTaken',
          'takenSeats',
          'filledSeats',
        ])
        setRegisteredCountOverride(initialRegisteredCount)
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

  useEffect(() => {
    if (!event) {
      setHostClub(null)
      return
    }
    const raw = event.raw && typeof event.raw === 'object' ? event.raw : {}
    const clubId = event.clubId ?? raw.clubId ?? raw.club?.id
    if (clubId == null || clubId === '') {
      setHostClub(null)
      return
    }
    let cancelled = false
    setHostClubLoading(true)
    ;(async () => {
      try {
        const rawClub = await fetchClub(clubId)
        if (cancelled) return
        setHostClub(mapClubFromApi(rawClub))
      } catch {
        if (!cancelled) setHostClub(null)
      } finally {
        if (!cancelled) setHostClubLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [event])

  const registered = apiRegistered || isRegistered(id)

  const totalSlots = useMemo(() => {
    if (!event) return 0
    const raw = event.raw && typeof event.raw === 'object' ? event.raw : {}
    const cap =
      toFiniteNonNegativeInt(event.seatLimit) ??
      pickFirstFiniteNonNegativeInt(raw, [
        'seatLimit',
        'capacity',
        'maxCapacity',
        'maxAttendees',
        'totalSlots',
        'totalSeats',
        'totalCapacity',
      ])
    return cap != null && cap > 0 ? cap : 0
  }, [event])

  const registeredCount = useMemo(() => {
    if (registeredCountOverride != null) return registeredCountOverride
    const raw = event?.raw && typeof event.raw === 'object' ? event.raw : null
    return (
      pickFirstFiniteNonNegativeInt(raw, [
        'registeredCount',
        'registrationsCount',
        'registrationCount',
        'attendeesCount',
        'attendeeCount',
        'participantsCount',
        'participantCount',
        'participants',
        'attendees',
        'spotsTaken',
        'seatsTaken',
        'takenSeats',
        'filledSeats',
      ]) ?? 0
    )
  }, [event, registeredCountOverride])

  const remainingSlots = useMemo(() => {
    if (!totalSlots) return 0
    return Math.max(0, totalSlots - (registeredCount || 0))
  }, [registeredCount, totalSlots])

  const isSoldOut = totalSlots > 0 && remainingSlots <= 0

  if (loading) {
    return (
      <div className="ed-page">
        <ClubsAreaNav />
        <div className="ed-not-found">
          <p>Loading event…</p>
        </div>
      </div>
    )
  }

  if (loadError || !event) {
    return (
      <div className="ed-page">
        <ClubsAreaNav />
        <div className="ed-not-found">
          <p>{loadError || 'Event not found.'}</p>
          <button type="button" className="ed-btn ed-btn--primary" onClick={() => navigate('/clubs/events')}>
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const handleRegister = async () => {
    if (registering) return
    if (isSoldOut) return
    setRegistering(true)
    try {
      const regResult = await registerForEvent(id)
      registerEvent(id)
      setApiRegistered(true)
      setRegisteredCountOverride((prev) => (prev == null ? (registeredCount || 0) + 1 : prev + 1))
      navigate(`/clubs/events/${id}/ticket`, { state: { fromRegistration: true, registration: regResult } })
    } catch (e) {
      alert(e?.message || 'Could not register.')
    } finally {
      setRegistering(false)
    }
  }

  const scheduleTime = formatTimeRange(event.time, event.endTime)

  return (
    <div className="ed-page">
      <ClubsAreaNav />

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
              <div
                className="ed-progress-fill"
                style={{ width: `${totalSlots ? ((Math.min(totalSlots, registeredCount) / totalSlots) * 100) : 0}%` }}
              />
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
                <button
                  type="button"
                  className="ed-btn ed-btn--primary ed-btn--full"
                  onClick={handleRegister}
                  disabled={registering || isSoldOut || !totalSlots}
                  aria-disabled={registering || isSoldOut || !totalSlots}
                  title={isSoldOut ? 'All spaces are taken.' : undefined}
                >
                  <IconCalendar />
                  {registering ? 'Registering…' : isSoldOut ? 'Sold Out' : 'Register for Event'}
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
              <div
                className="ed-host-avatar"
                style={
                  hostClub?.image
                    ? { backgroundImage: `url(${hostClub.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : undefined
                }
              >
                {!hostClub?.image ? (hostClub?.name || event.clubName || 'C').charAt(0) : null}
              </div>
              <div>
                <strong>{hostClub?.name || event.clubName || 'Club'}</strong>
                <span>
                  {hostClubLoading
                    ? 'Loading club…'
                    : hostClub
                      ? `${Number(hostClub.members) || 0} members`
                      : '—'}
                </span>
                <span>
                  {hostClub?.establishedYear
                    ? `Established ${hostClub.establishedYear}`
                    : hostClub?.raw?.foundedAt
                      ? `Established ${String(hostClub.raw.foundedAt).slice(0, 4)}`
                      : '—'}
                </span>
              </div>
            </div>
          </div>

        </aside>
      </div>

      <footer className="ed-footer">
        <span className="ed-footer-logo">MyAda</span>
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
