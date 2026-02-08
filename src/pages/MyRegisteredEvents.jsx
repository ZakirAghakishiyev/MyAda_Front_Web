import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegisteredEvents } from '../contexts/RegisteredEventsContext'
import { getEventById } from '../data/clubEventsData'
import './MyRegisteredEvents.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconChevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const MyRegisteredEvents = () => {
  const navigate = useNavigate()
  const { getRegisteredIds } = useRegisteredEvents()
  const registeredIds = getRegisteredIds()
  const events = registeredIds
    .map((id) => getEventById(id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const handleEventClick = (eventId) => {
    navigate(`/clubs/events/${eventId}`)
  }

  return (
    <div className="my-registered-events-page">
      <header className="my-registered-events-header">
        <button type="button" className="my-registered-events-back" onClick={() => navigate(-1)} aria-label="Back">
          <IconBack />
        </button>
        <div className="my-registered-events-header-title">
          <h1>My Registered Events</h1>
          <span className="my-registered-events-subtitle">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="my-registered-events-container">
        {events.length > 0 ? (
          events.map((event) => (
            <article
              key={event.id}
              className="my-registered-events-card"
              onClick={() => handleEventClick(event.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleEventClick(event.id)}
              role="button"
              tabIndex={0}
            >
              <div className="my-registered-events-card-icon">
                <IconCalendar />
              </div>
              <div className="my-registered-events-card-body">
                <h2 className="my-registered-events-card-title">{event.title}</h2>
                <span className="my-registered-events-card-club">{event.clubName}</span>
                <span className="my-registered-events-card-date">{formatDate(event.date)} · {event.time}</span>
                <span className="my-registered-events-card-location">{event.location}</span>
              </div>
              <span className="my-registered-events-card-arrow"><IconChevron /></span>
            </article>
          ))
        ) : (
          <p className="my-registered-events-empty">You have not registered for any events yet.</p>
        )}
      </div>
    </div>
  )
}

export default MyRegisteredEvents
