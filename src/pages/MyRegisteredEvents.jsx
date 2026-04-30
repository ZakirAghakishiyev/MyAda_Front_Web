import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegisteredEvents } from '../contexts/RegisteredEventsContext'
import { fetchEvent, fetchMyEventRegistrations, unregisterFromEvent } from '../api/clubApi'
import { mapEventFromApi } from '../api/clubMappers'
import ClubsAreaNav from '../components/clubs/ClubsAreaNav'
import './MyRegisteredEvents.css'

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
const IconTicket = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
  </svg>
)
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
)
const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
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

function attendeesLabelFor(event) {
  const raw = event?.raw && typeof event.raw === 'object' ? event.raw : null
  const count = pickFirstFiniteNonNegativeInt(raw, [
    'registeredCount',
    'registrationsCount',
    'registrationCount',
    'attendeesCount',
    'attendeeCount',
    'participantsCount',
    'participantCount',
    'participants',
    'attendees',
  ])
  if (count == null) return '— Attending'
  return `${count} Attending`
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming Events' },
  { key: 'past', label: 'Past Events' }
]

const MyRegisteredEvents = () => {
  const navigate = useNavigate()
  const { getRegisteredIds, unregisterEvent } = useRegisteredEvents()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [apiEvents, setApiEvents] = useState([])
  const [removingEventId, setRemovingEventId] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = await fetchMyEventRegistrations()
        const items = raw?.items ?? raw ?? []
        const list = Array.isArray(items) ? items : []
        // Preferred contract returns `row.event` snapshot (including `imageUrl`) so we can render
        // ticket cards without refetching event details.
        const mappedFromSnapshots = list
          .map((row) => {
            const eid = row.eventId ?? row.event?.id ?? row.id
            if (!eid) return null
            const snapshot = row.event && typeof row.event === 'object'
              ? row.event
              : {
                  id: eid,
                  name: row.eventName ?? row.title ?? 'Event',
                  startTime: row.startTime,
                  endTime: row.endTime,
                  location: row.location ?? '',
                  imageUrl: row.imageUrl ?? row.eventImageUrl ?? row.eventImageUrlSnapshot,
                  seatLimit: row.seatLimit ?? row.eventSeatLimitSnapshot,
                  registeredCount: row.registeredCount,
                }
            const m = mapEventFromApi({ id: eid, ...snapshot })
            if (!m) return null
            // Keep registration metadata accessible via `raw` so attendee counts can be read.
            return { ...m, raw: { ...(m.raw || {}), ...(snapshot || {}), ...(row || {}) } }
          })
          .filter(Boolean)

        // Fallback: older API only returns eventId list; then we refetch event detail.
        const missingSnapshots = list.filter((row) => !row?.event && (row.eventId ?? row.event?.id))
        const fetchedFallback = await Promise.all(
          missingSnapshots.map(async (row) => {
            const eid = row.eventId ?? row.event?.id
            if (!eid) return null
            try {
              const ev = await fetchEvent(eid)
              const m = mapEventFromApi(ev)
              return m ? { ...m, raw: { ...(m.raw || {}), ...(row || {}) } } : null
            } catch {
              return null
            }
          })
        )

        const merged = [...mappedFromSnapshots, ...fetchedFallback.filter(Boolean)]
        const seen = new Set(merged.map((e) => String(e.id)))
        const ctxIds = getRegisteredIds()
        for (const eid of ctxIds) {
          if (seen.has(String(eid))) continue
          try {
            const ev = await fetchEvent(eid)
            const m = mapEventFromApi(ev)
            if (m) merged.push(m)
          } catch {
            /* skip */
          }
        }
        if (!cancelled) setApiEvents(merged)
      } catch {
        if (!cancelled) setApiEvents([])
      }
    })()
    return () => { cancelled = true }
  }, [])

  const events = useMemo(
    () => [...apiEvents].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [apiEvents]
  )

  const upcomingCount = events.length
  const handleEventClick = (eventId) => navigate(`/clubs/events/${eventId}`)
  const handleViewTicket = (e, eventId) => {
    e.stopPropagation()
    navigate(`/clubs/events/${eventId}/ticket`)
  }
  const handleCancelRegistration = async (e, eventId) => {
    e.stopPropagation()
    if (removingEventId != null) return
    const ok = window.confirm('Cancel this event registration?')
    if (!ok) return
    setRemovingEventId(String(eventId))
    try {
      await unregisterFromEvent(eventId)
      unregisterEvent(eventId)
      setApiEvents((prev) => prev.filter((event) => String(event.id) !== String(eventId)))
    } catch (error) {
      alert(error?.message || 'Could not cancel registration.')
    } finally {
      setRemovingEventId(null)
    }
  }

  return (
    <div className="mre-page">
      <ClubsAreaNav />

      <div className="mre-main">
        <div className="mre-breadcrumb">DASHBOARD / REGISTRATIONS</div>
        <div className="mre-title-row">
          <div>
            <h1 className="mre-title">My Registered Events</h1>
            <span className="mre-tag">{upcomingCount} Upcoming</span>
          </div>
          <div className="mre-header-actions">
            <button type="button" className="mre-btn mre-btn--primary" onClick={() => navigate('/clubs/events')}>
              <IconPlus />
              Browse More
            </button>
          </div>
        </div>
        <p className="mre-desc">
          Manage your attendance and access digital tickets for upcoming campus activities.
        </p>

        <div className="mre-tabs">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`mre-tab ${activeTab === key ? 'mre-tab--active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mre-list">
          {activeTab === 'upcoming' && events.length > 0 && events.map((event) => (
            <article
              key={event.id}
              className="mre-card"
              onClick={() => handleEventClick(event.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleEventClick(event.id)}
              role="button"
              tabIndex={0}
            >
              <div
                className="mre-card-media"
                style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
              />
              <div className="mre-card-body">
                <span className="mre-card-club">{event.clubName.toUpperCase()}</span>
                <h2 className="mre-card-title">{event.title}</h2>
                <div className="mre-card-meta">
                  <span><IconCalendar /> {formatDate(event.date)}</span>
                  <span><IconClock /> {formatTimeRange(event.time, event.endTime)}</span>
                  <span><IconMapPin /> {event.location}</span>
                </div>
                <div className="mre-card-footer">
                  <span className="mre-card-attendees">{attendeesLabelFor(event)}</span>
                  <div className="mre-card-actions">
                      <button
                        type="button"
                        className="mre-icon-btn"
                        onClick={(e) => handleCancelRegistration(e, event.id)}
                        aria-label="Cancel registration"
                        disabled={removingEventId === String(event.id)}
                      >
                        <IconX />
                      </button>
                    <button
                      type="button"
                      className="mre-btn mre-btn--primary"
                      onClick={(e) => handleViewTicket(e, event.id)}
                    >
                      <IconTicket />
                      View Ticket
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {activeTab === 'upcoming' && events.length === 0 && (
            <p className="mre-empty">You have not registered for any events yet.</p>
          )}
          {activeTab === 'past' && (
            <p className="mre-empty">No past events.</p>
          )}
        </div>
      </div>

      <footer className="mre-footer">
        <span className="mre-footer-logo">MyAda</span>
        <span className="mre-footer-copy">© 2024 University Student Life. All rights reserved.</span>
      </footer>
    </div>
  )
}

export default MyRegisteredEvents
