import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import './MyVacancyApplications.css'

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v2" />
    <path d="M3 12h18" />
  </svg>
)

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconHourglass = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4z" />
  </svg>
)
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const MOCK_APPLICATIONS = [
  {
    id: 'APP-001',
    position: 'Media & Content Creator',
    clubName: 'Campus Media Club',
    status: 'Under Review',
    appliedOn: '2024-03-01'
  },
  {
    id: 'APP-002',
    position: 'Finance Officer',
    clubName: 'Business Leaders Society',
    status: 'Submitted',
    appliedOn: '2024-02-25'
  },
  {
    id: 'APP-003',
    position: 'Events Coordinator',
    clubName: 'Student Activities Board',
    status: 'Accepted',
    appliedOn: '2024-02-10'
  },
  {
    id: 'APP-004',
    position: 'Marketing Coordinator',
    clubName: 'Campus Media Club',
    status: 'Called for Interview',
    appliedOn: '2024-03-03'
  },
  {
    id: 'APP-005',
    position: 'Marketing Coordinator',
    clubName: 'Campus Media Club',
    status: 'Called for Interview',
    appliedOn: '2024-03-02'
  }
]

const MOCK_INTERVIEW_SLOTS = [
  {
    id: 'SLOT-1',
    clubName: 'Campus Media Club',
    position: 'Marketing Coordinator',
    date: '2026-04-20',
    startTime: '15:00',
    endTime: '15:20',
    bookedByApplicationId: null
  },
  {
    id: 'SLOT-2',
    clubName: 'Campus Media Club',
    position: 'Marketing Coordinator',
    date: '2026-04-20',
    startTime: '15:20',
    endTime: '15:40',
    bookedByApplicationId: 'APP-999'
  },
  {
    id: 'SLOT-3',
    clubName: 'Campus Media Club',
    position: 'Marketing Coordinator',
    date: '2026-04-20',
    startTime: '15:40',
    endTime: '16:00',
    bookedByApplicationId: null
  }
]

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusPillClass = (status) => {
  if (status === 'Accepted') return 'mva-status-pill--accepted'
  if (status === 'Interview Scheduled') return 'mva-status-pill--interview-scheduled'
  if (status === 'Called for Interview') return 'mva-status-pill--interview'
  if (status === 'Under Review') return 'mva-status-pill--review'
  if (status === 'Submitted') return 'mva-status-pill--submitted'
  return 'mva-status-pill--other'
}

const statusIcon = (status) => {
  if (status === 'Accepted') return <IconCheck />
  if (status === 'Interview Scheduled' || status === 'Called for Interview') return <IconCalendar />
  if (status === 'Under Review') return <IconHourglass />
  if (status === 'Submitted') return <IconClock />
  return <IconX />
}

const MyVacancyApplications = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [applications, setApplications] = useState(MOCK_APPLICATIONS)
  const [slots, setSlots] = useState(MOCK_INTERVIEW_SLOTS)
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [selectedInterviewDate, setSelectedInterviewDate] = useState('')
  const [draftSlotId, setDraftSlotId] = useState(null)

  const selectedApp = useMemo(
    () => applications.find((app) => app.id === selectedAppId) || null,
    [applications, selectedAppId]
  )

  const availableSlotsForSelected = useMemo(() => {
    if (!selectedApp) return []
    return slots.filter(
      (slot) =>
        slot.clubName === selectedApp.clubName &&
        slot.position === selectedApp.position
    )
  }, [selectedApp, slots])

  const availableDatesForSelected = useMemo(
    () => [...new Set(availableSlotsForSelected.map((slot) => slot.date))].sort(),
    [availableSlotsForSelected]
  )

  const visibleSlots = useMemo(
    () => availableSlotsForSelected.filter((slot) => slot.date === selectedInterviewDate),
    [availableSlotsForSelected, selectedInterviewDate]
  )

  useEffect(() => {
    if (!selectedApp) {
      setSelectedInterviewDate('')
      return
    }
    if (!availableDatesForSelected.length) {
      setSelectedInterviewDate('')
      return
    }
    if (!availableDatesForSelected.includes(selectedInterviewDate)) {
      setSelectedInterviewDate(availableDatesForSelected[0])
    }
  }, [selectedApp, availableDatesForSelected, selectedInterviewDate])

  const handleOpenInterviewPicker = (app) => {
    if (app.status !== 'Called for Interview' && app.status !== 'Interview Scheduled') return
    setSelectedAppId(app.id)
  }

  useEffect(() => {
    if (!location.state?.openInterviewPicker) return
    if (selectedAppId) return

    const target = applications.find((app) => app.status === 'Called for Interview') ||
      applications.find((app) => app.status === 'Interview Scheduled')

    if (target) {
      setSelectedAppId(target.id)
    }
    navigate(location.pathname, { replace: true, state: null })
  }, [applications, location.pathname, location.state, navigate, selectedAppId])

  const handleCloseInterviewPicker = () => {
    setSelectedAppId(null)
    setDraftSlotId(null)
  }

  const handleChooseSlot = (slotId) => {
    if (!selectedApp) return

    setSlots((prevSlots) => {
      const target = prevSlots.find((slot) => slot.id === slotId)
      if (!target || (target.bookedByApplicationId && target.bookedByApplicationId !== selectedApp.id)) {
        return prevSlots
      }
      return prevSlots.map((slot) => {
        if (slot.id === slotId) return { ...slot, bookedByApplicationId: selectedApp.id }
        if (slot.bookedByApplicationId === selectedApp.id) return { ...slot, bookedByApplicationId: null }
        return slot
      })
    })

    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApp.id
          ? { ...app, status: 'Interview Scheduled', interviewSlotId: slotId }
          : app
      )
    )
    setSelectedAppId(null)
    setDraftSlotId(null)
  }

  useEffect(() => {
    if (!selectedApp) {
      setDraftSlotId(null)
      return
    }
    setDraftSlotId(selectedApp.interviewSlotId || null)
  }, [selectedApp])

  return (
    <div className="mva-page">
      <header className="vacancies-nav">
        <div className="vacancies-nav-left">
          <div
            className="vacancies-nav-logo"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
          >
            <img src={adaLogo} alt="ADA University" className="vacancies-ada-logo" />
          </div>
          <nav className="vacancies-nav-links">
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/vacancies')}>Vacancies</button>
            <button type="button" className="vacancies-nav-link vacancies-nav-link--active">My Applications</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/events')}>Events</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs')}>Clubs</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/propose')}>Propose Club</button>
          </nav>
        </div>
        <div className="vacancies-nav-right">
          <div className="vacancies-nav-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search roles or clubs"
              aria-label="Search roles or clubs"
              readOnly
            />
          </div>
          <button
            type="button"
            className="vacancies-nav-icon"
            aria-label="Notifications"
            onClick={() => navigate('/clubs/notifications')}
          >
            <IconBell />
          </button>
          <button
            type="button"
            className="vacancies-nav-avatar"
            aria-label="My memberships"
            onClick={() => navigate('/clubs/my-memberships')}
          >
            U
          </button>
        </div>
      </header>

      <div className="mva-main">
        <div className="mva-breadcrumb">DASHBOARD / APPLICATIONS</div>
        <div className="mva-title-row">
          <div>
            <h1 className="mva-title">My Applications</h1>
            <span className="mva-tag">{applications.length} total applications</span>
          </div>
          {/* <button
            type="button"
            className="mva-btn mva-btn--primary"
            onClick={() => navigate('/clubs/vacancies')}
          >
            Browse Open Roles
          </button> */}
        </div>
        <p className="mva-desc">
          Track the status of the club vacancies you&apos;ve applied to across campus.
        </p>

        <div className="mva-list">
          {applications.map((app) => (
            <article
              key={app.id}
              className={`mva-card ${(app.status === 'Called for Interview' || app.status === 'Interview Scheduled') ? 'mva-card--clickable' : ''}`}
              onClick={() => handleOpenInterviewPicker(app)}
              onKeyDown={(e) => e.key === 'Enter' && handleOpenInterviewPicker(app)}
              role={(app.status === 'Called for Interview' || app.status === 'Interview Scheduled') ? 'button' : undefined}
              tabIndex={(app.status === 'Called for Interview' || app.status === 'Interview Scheduled') ? 0 : undefined}
            >
              <div className="mva-card-icon">
                <IconBriefcase />
              </div>
              <div className="mva-card-body">
                <div className="mva-card-header">
                  <h2 className="mva-card-position">{app.position}</h2>
                  <span className={`mva-status-pill ${statusPillClass(app.status)}`}>
                    {statusIcon(app.status)}
                    {app.status}
                  </span>
                </div>
                <span className="mva-card-club">{app.clubName}</span>
                <div className="mva-card-meta">
                  <span>
                    <IconClock />
                    Applied on {formatDate(app.appliedOn)}
                  </span>
                  <span className="mva-card-id">Application ID: {app.id}</span>
                  {app.status === 'Called for Interview' && (
                    <span className="mva-card-link">Click to choose interview slot</span>
                  )}
                </div>
              </div>
            </article>
          ))}

          {applications.length === 0 && (
            <p className="mva-empty">
              You haven&apos;t applied to any club vacancies yet. Start by browsing open roles.
            </p>
          )}
        </div>
      </div>

      {selectedApp && (
        <div className="mva-modal-overlay" onClick={handleCloseInterviewPicker}>
          <div className="mva-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mva-modal-header">
              <h3>Choose Interview Time Slot</h3>
              <button type="button" className="mva-modal-close" onClick={handleCloseInterviewPicker}>×</button>
            </div>
            <p className="mva-modal-subtitle">
              {selectedApp.position} at {selectedApp.clubName}
            </p>
            {availableDatesForSelected.length > 0 && (
              <div className="mva-date-pills">
                {availableDatesForSelected.map((date) => (
                  <button
                    key={date}
                    type="button"
                    className={`mva-date-pill ${selectedInterviewDate === date ? 'mva-date-pill--active' : ''}`}
                    onClick={() => setSelectedInterviewDate(date)}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            )}
            <div className="mva-slot-list">
              {availableSlotsForSelected.length === 0 && (
                <p className="mva-empty">No interview slots have been published by admin yet.</p>
              )}
              {visibleSlots.map((slot) => {
                const takenByAnother = Boolean(slot.bookedByApplicationId && slot.bookedByApplicationId !== selectedApp.id)
                const selectedInDraft = draftSlotId === slot.id
                return (
                  <div
                    key={slot.id}
                    className={`mva-slot-item ${takenByAnother ? 'mva-slot-item--taken' : ''} ${selectedInDraft ? 'mva-slot-item--selected' : ''}`}
                    role={!takenByAnother ? 'button' : undefined}
                    tabIndex={!takenByAnother ? 0 : undefined}
                    onClick={() => {
                      if (!takenByAnother) setDraftSlotId(slot.id)
                    }}
                    onKeyDown={(e) => {
                      if (!takenByAnother && e.key === 'Enter') setDraftSlotId(slot.id)
                    }}
                  >
                    <div>
                      <strong>{slot.startTime} - {slot.endTime}</strong>
                    </div>
                    {takenByAnother ? (
                      <span className="mva-slot-state">Taken</span>
                    ) : selectedInDraft ? (
                      <span className="mva-slot-state mva-slot-state--selected">Selected</span>
                    ) : (
                      <span className="mva-slot-state">Available</span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mva-modal-actions">
              <button
                type="button"
                className="mva-btn mva-btn--primary"
                disabled={!draftSlotId}
                onClick={() => draftSlotId && handleChooseSlot(draftSlotId)}
              >
                Choose
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mva-footer">
        <span className="mva-footer-logo">ADA University</span>
        <span className="mva-footer-copy">© 2024 University Recruitment Portal. All rights reserved.</span>
      </footer>
    </div>
  )
}

export default MyVacancyApplications

