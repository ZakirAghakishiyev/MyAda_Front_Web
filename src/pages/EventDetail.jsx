import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRegisteredEvents } from '../contexts/RegisteredEventsContext'
import { getEventById } from '../data/clubEventsData'
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
  const event = getEventById(id)
  const registered = isRegistered(id)

  if (!event) {
    return (
      <div className="ed-page">
        <div className="ed-not-found">
          <p>Event not found.</p>
          <button type="button" className="ed-btn ed-btn--primary" onClick={() => navigate('/clubs/events')}>
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const handleBack = () => navigate('/clubs/events')

  const handleRegister = () => {
    registerEvent(id)
    navigate(`/clubs/events/${id}/ticket`, { state: { fromRegistration: true } })
  }

  const scheduleTime = formatTimeRange(event.time, event.endTime)
  const remainingSlots = 42
  const totalSlots = 150

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
                <button type="button" className="ed-btn ed-btn--primary ed-btn--full" onClick={handleRegister}>
                  <IconCalendar />
                  Register for Event
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
              <div className="ed-host-avatar">{event.clubName.charAt(0)}</div>
              <div>
                <strong>{event.clubName}</strong>
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
