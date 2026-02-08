import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockClubEvents } from '../data/clubEventsData'
import './ClubEvents.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconGrid = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
)
const IconList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
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

const ClubEvents = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('grid')

  const handleEventClick = (eventId) => {
    navigate(`/clubs/events/${eventId}`)
  }

  return (
    <div className="club-events-page">
      <header className="club-events-header">
        <button type="button" className="club-events-back" onClick={() => navigate(-1)} aria-label="Back">
          <IconBack />
        </button>
        <div className="club-events-header-title">
          <h1>Club Events</h1>
          <span className="club-events-subtitle">{mockClubEvents.length} events</span>
        </div>
        <button
          type="button"
          className="club-events-my-registrations"
          onClick={() => navigate('/clubs/events/my-registrations')}
        >
          My Registrations
        </button>
        <div className="club-events-view-toggle">
          <button
            type="button"
            className={`club-events-view-btn ${viewMode === 'grid' ? 'club-events-view-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            title="Grid view"
          >
            <IconGrid />
          </button>
          <button
            type="button"
            className={`club-events-view-btn ${viewMode === 'list' ? 'club-events-view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
            title="List view"
          >
            <IconList />
          </button>
        </div>
      </header>

      <div className={`club-events-container club-events-container--${viewMode}`}>
        {mockClubEvents.map((event) => (
          <article
            key={event.id}
            className="club-event-card"
            onClick={() => handleEventClick(event.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleEventClick(event.id)}
            role="button"
            tabIndex={0}
          >
            <div className="club-event-card-icon">
              <IconCalendar />
            </div>
            <div className="club-event-card-body">
              <h2 className="club-event-card-title">{event.title}</h2>
              <span className="club-event-card-club">{event.clubName}</span>
              <span className="club-event-card-date">{formatDate(event.date)} · {event.time}</span>
              <span className="club-event-card-category">{event.category}</span>
            </div>
            <span className="club-event-card-arrow"><IconChevron /></span>
          </article>
        ))}
      </div>
    </div>
  )
}

export default ClubEvents
