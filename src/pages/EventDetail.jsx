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

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const EventDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { registerEvent, isRegistered } = useRegisteredEvents()
  const event = getEventById(id)
  const registered = isRegistered(id)

  if (!event) {
    return (
      <div className="event-detail-overlay" onClick={() => navigate(-1)}>
        <div className="event-detail-popup" onClick={(e) => e.stopPropagation()}>
          <p>Event not found.</p>
          <button type="button" className="event-detail-back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    )
  }

  const handleBack = () => navigate(-1)

  const handleRegister = () => {
    registerEvent(id)
  }

  const scheduleTime = event.endTime ? `${event.time} – ${event.endTime}` : event.time

  return (
    <div
      className="event-detail-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
    >
      <div className="event-detail-popup" onClick={(e) => e.stopPropagation()}>
        <header className="event-detail-header">
          <button type="button" className="event-detail-back" onClick={handleBack} aria-label="Back">
            <IconBack />
          </button>
        </header>

        <div className="event-detail-body">
          <div className="event-detail-hero">
            <span className="event-detail-category">{event.category}</span>
            <h1 id="event-detail-title" className="event-detail-title">{event.title}</h1>
            <p className="event-detail-club">{event.clubName}</p>
          </div>

          <section className="event-detail-schedule">
            <h2 className="event-detail-section-title">Schedule</h2>
            <div className="event-detail-schedule-list">
              <div className="event-detail-schedule-item">
                <IconCalendar />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="event-detail-schedule-item">
                <IconClock />
                <span>{scheduleTime}</span>
              </div>
              <div className="event-detail-schedule-item">
                <IconMapPin />
                <span>{event.location}</span>
              </div>
            </div>
          </section>

          {event.description && (
            <section className="event-detail-description">
              <h2 className="event-detail-section-title">About</h2>
              <p className="event-detail-desc-text">{event.description}</p>
            </section>
          )}

          <div className="event-detail-actions">
            {registered ? (
              <div className="event-detail-registered">
                You are registered for this event.
              </div>
            ) : (
              <button type="button" className="event-detail-register-btn" onClick={handleRegister}>
                Register for Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
