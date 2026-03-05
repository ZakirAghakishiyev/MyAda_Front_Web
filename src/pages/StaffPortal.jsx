import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './StaffPortal.css'

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconPerson = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m13 18 6-6-6-6" />
  </svg>
)

const initialJobs = [
  { id: 'REQ-8821', tag: 'EMERGENCY', tagClass: 'emergency', timeAgo: '12m ago', title: 'Server Room AC Unit Failure', location: 'Main Library, Server Rm 204', sub: 'Facilities Support', status: 'pending', service: 'fm' },
  { id: 'REQ-8819', tag: 'IT SUPPORT', tagClass: 'it', timeAgo: '25m ago', title: 'Wi-Fi dead zone in North Wing', location: 'North Wing, 3rd Floor', sub: 'Dr. Sarah Jenkins', subIcon: 'person', status: 'pending', service: 'it' },
  { id: 'REQ-8815', tag: 'FACILITIES', tagClass: 'fm', timeAgo: '1h ago', title: 'Light fixture replacement', location: 'Admin Building, Hallway B', sub: 'Facilities Support', status: 'in_progress', service: 'fm' },
  { id: 'REQ-8812', tag: 'IT SUPPORT', tagClass: 'it', timeAgo: '2h ago', title: 'Projector not displaying in Room 101', location: 'Main Building, Room 101', sub: 'Prof. James Wilson', subIcon: 'person', status: 'pending', service: 'it' }
]

const StaffPortal = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(() => initialJobs.map((j) => ({ ...j })))
  const [updatedId, setUpdatedId] = useState(null)

  const openTicket = (id) => navigate(`/staff-portal/ticket/${id}`)

  const handleMarkStarted = useCallback((id) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'in_progress' } : j))
    )
    setUpdatedId(id)
    setTimeout(() => setUpdatedId(null), 600)
  }, [])

  const handleComplete = useCallback((id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id))
    setUpdatedId(null)
  }, [])

  return (
    <>
      <div className="sp-main-header">
        <div>
          <h1 className="sp-main-title">My Assigned Jobs</h1>
          <p className="sp-main-subtitle">Priority queue for campus maintenance</p>
        </div>
      </div>

      <div className="sp-job-list">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`sp-job-card sp-job-card--transition ${updatedId === job.id ? 'sp-job-card--updated' : ''} sp-job-card--clickable`}
            onClick={() => openTicket(job.id)}
            onKeyDown={(e) => e.key === 'Enter' && openTicket(job.id)}
            role="button"
            tabIndex={0}
          >
            <div className="sp-job-card-top">
              <span className={`sp-job-tag sp-job-tag--${job.tagClass}`}>{job.tag}</span>
              <span className="sp-job-time">{job.timeAgo}</span>
            </div>
            <h3 className="sp-job-title">{job.title}</h3>
            <div className="sp-job-location">
              <IconLocation />
              <span>{job.location}</span>
            </div>
            <div className="sp-job-sub">
              {job.subIcon === 'person' ? <IconPerson /> : null}
              <span>{job.sub}</span>
            </div>
            <div className="sp-job-actions" onClick={(e) => e.stopPropagation()}>
              {job.status === 'pending' && (
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--transition"
                  onClick={() => handleMarkStarted(job.id)}
                >
                  Mark as Started
                </button>
              )}
              {job.status === 'in_progress' && (
                <>
                  <span className="sp-status-inline">
                    <span className="sp-dot sp-dot--orange" />
                    In Progress
                  </span>
                  <button
                    type="button"
                    className="sp-btn sp-btn--success sp-btn--transition"
                    onClick={() => handleComplete(job.id)}
                  >
                    Complete
                  </button>
                </>
              )}
            </div>
            <button type="button" className="sp-job-more" aria-label="More options" onClick={(e) => e.stopPropagation()}>⋯</button>
          </div>
        ))}

        <div className="sp-end-of-queue">
          <IconCheck />
          <h3 className="sp-end-title">End of Queue</h3>
          <p className="sp-end-text">You&apos;ve reached the end of your assigned tasks. New requests will appear here as they are dispatched.</p>
        </div>
      </div>

      <div className="sp-offline-wrap">
        <button type="button" className="sp-offline-btn">
          Go Offline
          <IconArrowRight />
        </button>
      </div>
    </>
  )
}

export default StaffPortal
