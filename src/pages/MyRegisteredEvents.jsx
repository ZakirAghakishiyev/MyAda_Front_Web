import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegisteredEvents } from '../contexts/RegisteredEventsContext'
import { getEventById } from '../data/clubEventsData'
import './MyRegisteredEvents.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
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

const TABS = [
  { key: 'upcoming', label: 'Upcoming Events' },
  { key: 'past', label: 'Past Events' },
  { key: 'drafts', label: 'Drafts & Saved' }
]

const MyRegisteredEvents = () => {
  const navigate = useNavigate()
  const { getRegisteredIds } = useRegisteredEvents()
  const [activeTab, setActiveTab] = useState('upcoming')

  const registeredIds = getRegisteredIds()
  const events = useMemo(() => {
    return registeredIds
      .map((id) => getEventById(id))
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [registeredIds])

  const upcomingCount = events.length
  const handleEventClick = (eventId) => navigate(`/clubs/events/${eventId}`)
  const handleViewTicket = (e, eventId) => {
    e.stopPropagation()
    navigate(`/clubs/events/${eventId}/ticket`)
  }

  return (
    <div className="mre-page">
      <header className="mre-header">
        <button type="button" className="mre-back" onClick={() => navigate('/clubs/events')} aria-label="Back">
          <IconBack />
        </button>
        <span className="mre-logo">CampusEvents</span>
        <nav className="mre-nav">
          <button type="button" onClick={() => navigate('/clubs/events')}>Discover</button>
          <button type="button" className="mre-nav-active">My Events</button>
          <button type="button" onClick={() => navigate('/clubs')}>Clubs</button>
          <span>Calendar</span>
        </nav>
        <div className="mre-search">Search events...</div>
        <div className="mre-profile">Profile</div>
      </header>

      <div className="mre-main">
        <div className="mre-breadcrumb">DASHBOARD / REGISTRATIONS</div>
        <div className="mre-title-row">
          <div>
            <h1 className="mre-title">My Registered Events</h1>
            <span className="mre-tag">{upcomingCount} Upcoming</span>
          </div>
          <div className="mre-header-actions">
            <button type="button" className="mre-btn mre-btn--secondary">
              <IconCalendar />
              Sync to Calendar
            </button>
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
                  <span className="mre-card-attendees">240 Attending</span>
                  <div className="mre-card-actions">
                    <button
                      type="button"
                      className="mre-icon-btn"
                      onClick={(e) => { e.stopPropagation() }}
                      aria-label="Cancel registration"
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
          {activeTab === 'drafts' && (
            <p className="mre-empty">No saved drafts.</p>
          )}
        </div>

        <div className="mre-help-section">
          <div className="mre-help-content">
            <h3 className="mre-help-title">Can&apos;t make it to an event?</h3>
            <p className="mre-help-desc">
              Make sure to cancel your registration at least 24 hours in advance to allow others to join.
            </p>
          </div>
          <div className="mre-help-actions">
            <button type="button" className="mre-btn mre-btn--secondary">Help Center</button>
            <button type="button" className="mre-btn mre-btn--primary">Contact Support</button>
          </div>
        </div>
      </div>

      <footer className="mre-footer">
        <span className="mre-footer-logo">CampusEvents</span>
        <span className="mre-footer-copy">© 2024 University Student Life. All rights reserved.</span>
      </footer>
    </div>
  )
}

export default MyRegisteredEvents
