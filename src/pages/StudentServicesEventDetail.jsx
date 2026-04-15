import React from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
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
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTime = (t) => {
  if (!t) return ''
  const parts = t.toString().split(':').map(Number)
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

const StudentServicesEventDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const event = location.state?.event ?? null

  const handleBack = () => {
    navigate('/student-services', { state: { section: 'events' } })
  }

  if (!event || event.id !== id) {
    return (
      <div className="ed-page">
        <div className="ed-not-found">
          <p>Event not found or link expired.</p>
          <button type="button" className="ed-btn ed-btn--primary" onClick={handleBack}>
            Back to Student Services
          </button>
        </div>
      </div>
    )
  }

  const hasSubEvents = Array.isArray(event.subEvents) && event.subEvents.length > 0

  return (
    <div className="ed-page">
      <header className="ed-nav">
        <button type="button" className="ed-back" onClick={handleBack} aria-label="Back">
          <IconBack />
        </button>
        <span className="ed-nav-logo">Student Services</span>
        <nav className="ed-nav-links">
          <button type="button" className="ed-nav-active" onClick={handleBack}>Events</button>
          <button type="button" onClick={() => navigate('/student-services')}>Dashboard</button>
        </nav>
      </header>

      <div
        className="ed-hero"
        style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
      >
        <span className="ed-hero-category">{event.club || 'Event'}</span>
        <h1 id="event-detail-title" className="ed-hero-title">{event.title}</h1>
      </div>

      <div className="ed-info-cards">
        <div className="ed-info-card">
          <IconCalendar />
          <span>{formatDate(event.date)}{event.time ? ` · ${formatTime(event.time)}` : ''}</span>
        </div>
        <div className="ed-info-card">
          <IconClock />
          <span>{event.durationHours ? `${event.durationHours} hour(s)` : '—'}</span>
        </div>
        <div className="ed-info-card">
          <IconMapPin />
          <span>{event.venue || '—'}</span>
        </div>
      </div>

      <div className="ed-main">
        <div className="ed-content">
          <section className="ed-section">
            <h2 className="ed-section-title">
              <IconInfo />
              Description
            </h2>
            <p className="ed-desc">{event.description || 'No description provided.'}</p>
          </section>

          <section className="ed-section">
            <h2 className="ed-section-title">Sub-events / Schedule</h2>
            <div className="ed-agenda-wrap">
              <table className="ed-agenda">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {hasSubEvents ? (
                    event.subEvents.map((sub, index) => (
                      <tr key={index}>
                        <td>{sub.title}</td>
                        <td>{sub.date || event.date}</td>
                        <td>{formatTime(sub.start)}</td>
                        <td>{formatTime(sub.end)}</td>
                        <td>{sub.capacity ?? '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>{event.title}</td>
                      <td>{event.date}</td>
                      <td>—</td>
                      <td>—</td>
                      <td>{event.capacity ?? '—'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="ed-sidebar">
          <div className="ed-sidebar-card">
            <span className="ed-sidebar-label">Capacity</span>
            <p className="ed-sidebar-fee">{event.capacity ?? '—'} <small>attendees</small></p>
          </div>
          <div className="ed-sidebar-card">
            <span className="ed-sidebar-label">Hosted by</span>
            <div className="ed-host">
              <div className="ed-host-avatar">{(event.club || 'E').charAt(0)}</div>
              <div>
                <strong>{event.club || '—'}</strong>
              </div>
            </div>
          </div>
          <button type="button" className="ed-btn ed-btn--secondary ed-btn--full" onClick={handleBack}>
            Back to Events
          </button>
        </aside>
      </div>
    </div>
  )
}

export default StudentServicesEventDetail
