import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockMemberships } from '../data/clubsData'
import { getClubById } from '../data/clubsData'
import adaLogo from '../assets/ada-logo.png'
import './ClubsList.css'
import './MyMemberships.css'
import './MyVacancyApplications.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconChevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
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

const MOCK_VACANCY_APPLICATIONS = [
  {
    id: 'APP-001',
    position: 'Media & Content Creator',
    clubName: 'Campus Media Club',
    status: 'Under Review'
  },
  {
    id: 'APP-002',
    position: 'Finance Officer',
    clubName: 'Business Leaders Society',
    status: 'Submitted'
  },
  {
    id: 'APP-003',
    position: 'Events Coordinator',
    clubName: 'Student Activities Board',
    status: 'Accepted'
  },
  {
    id: 'APP-004',
    position: 'Marketing Coordinator',
    clubName: 'Campus Media Club',
    status: 'Called for Interview'
  }
]

const MOCK_MEMBERSHIP_APPLICATIONS = [
  {
    id: 'MEM-001',
    position: 'Membership Application',
    clubName: 'ADA Digital Entertainment Club',
    status: 'Submitted'
  },
  {
    id: 'MEM-002',
    position: 'Membership Application',
    clubName: 'Business Society',
    status: 'Under Review'
  }
]

const ALL_APPLICATIONS = [
  ...MOCK_VACANCY_APPLICATIONS.map((app, index) => ({
    ...app,
    applicationType: 'vacancy',
    appliedOn: ['2024-03-01', '2024-02-25', '2024-02-10', '2024-03-03'][index] || '2024-03-01'
  })),
  ...MOCK_MEMBERSHIP_APPLICATIONS.map((app, index) => ({
    ...app,
    applicationType: 'membership',
    appliedOn: ['2024-03-05', '2024-03-02'][index] || '2024-03-01'
  }))
]

const MOCK_INTERVIEW_SLOTS = [
  { id: 'SLOT-1', clubName: 'Campus Media Club', position: 'Marketing Coordinator', date: '2026-04-20', startTime: '15:00', endTime: '15:20', bookedByApplicationId: null },
  { id: 'SLOT-2', clubName: 'Campus Media Club', position: 'Marketing Coordinator', date: '2026-04-20', startTime: '15:20', endTime: '15:40', bookedByApplicationId: 'APP-999' },
  { id: 'SLOT-3', clubName: 'Campus Media Club', position: 'Marketing Coordinator', date: '2026-04-20', startTime: '15:40', endTime: '16:00', bookedByApplicationId: null }
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

const MyMemberships = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('active')
  const [applications, setApplications] = useState(ALL_APPLICATIONS)
  const [slots, setSlots] = useState(MOCK_INTERVIEW_SLOTS)
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [selectedInterviewDate, setSelectedInterviewDate] = useState('')
  const [draftSlotId, setDraftSlotId] = useState(null)

  const filtered = useMemo(() => {
    if (tab === 'active') return mockMemberships.filter((m) => m.status === 'Active')
    if (tab === 'pending') return mockMemberships.filter((m) => m.status === 'Pending')
    if (tab === 'declined') return mockMemberships.filter((m) => m.status === 'Declined')
    if (tab === 'applied') return []
    return mockMemberships
  }, [tab])

  const activeCount = mockMemberships.filter((m) => m.status === 'Active').length
  const pendingCount = mockMemberships.filter((m) => m.status === 'Pending').length
  const declinedCount = mockMemberships.filter((m) => m.status === 'Declined').length
  const appliedCount = applications.length

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

  const canChooseInterviewSlot = (app) =>
    app.applicationType === 'vacancy' && (app.status === 'Called for Interview' || app.status === 'Interview Scheduled')

  const handleOpenInterviewPicker = (app) => {
    if (!canChooseInterviewSlot(app)) return
    setSelectedAppId(app.id)
  }

  const handleCloseInterviewPicker = () => {
    setSelectedAppId(null)
    setDraftSlotId(null)
  }

  const handleChooseSlot = (slotId) => {
    if (!selectedApp) return
    setSlots((prevSlots) => {
      const target = prevSlots.find((slot) => slot.id === slotId)
      if (!target || (target.bookedByApplicationId && target.bookedByApplicationId !== selectedApp.id)) return prevSlots
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
    <div className="clubs-page">
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
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/vacancies/my-applications')}>My Applications</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/events')}>Events</button>
            <button type="button" className="vacancies-nav-link vacancies-nav-link--active" onClick={() => navigate('/clubs')}>Clubs</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/propose')}>Propose Club</button>
          </nav>
        </div>
        <div className="vacancies-nav-right">
          <div className="vacancies-nav-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search your clubs"
              aria-label="Search your clubs"
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

      <div className="clubs-main">
        <div className="mm-header-row">
          <div className="mm-header-left">
            {/* <button type="button" className="clubs-back" onClick={() => navigate('/clubs')} aria-label="Back to clubs">
              <IconBack />
            </button> */}
            <div className="mm-header-text">
              <h1 className="mm-title">My Memberships</h1>
              <span className="mm-subtitle">
                {tab === 'applied'
                  ? `${appliedCount} applied position${appliedCount !== 1 ? 's' : ''}`
                  : `${filtered.length} ${tab === 'active' ? 'active' : tab === 'pending' ? 'pending' : 'declined'} membership${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
          {/* <div className="mm-header-actions">
            <button
              type="button"
              className="mm-discover-btn"
              onClick={() => navigate('/clubs')}
            >
              Discover Clubs
            </button>
          </div> */}
        </div>

        <div className="mm-tabs">
          <button
            type="button"
            className={`mm-tab ${tab === 'active' ? 'mm-tab--active' : ''}`}
            onClick={() => setTab('active')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            className={`mm-tab ${tab === 'pending' ? 'mm-tab--active' : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`mm-tab ${tab === 'declined' ? 'mm-tab--active' : ''}`}
            onClick={() => setTab('declined')}
          >
            Declined ({declinedCount})
          </button>
          <button
            type="button"
            className={`mm-tab ${tab === 'applied' ? 'mm-tab--active' : ''}`}
            onClick={() => setTab('applied')}
          >
            Applied ({appliedCount})
          </button>
        </div>

        {tab === 'applied' ? (
          <section className="mm-applications-section" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
            <div className="mva-list">
              {applications.map((app) => (
                <article
                  key={app.id}
                  className={`mva-card ${canChooseInterviewSlot(app) ? 'mva-card--clickable' : ''}`}
                  onClick={() => handleOpenInterviewPicker(app)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenInterviewPicker(app)}
                  role={canChooseInterviewSlot(app) ? 'button' : undefined}
                  tabIndex={canChooseInterviewSlot(app) ? 0 : undefined}
                >
                  <div className="mva-card-icon">
                    {app.applicationType === 'vacancy' ? <IconBriefcase /> : <IconPerson />}
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
                      <span className="mva-card-id">{app.applicationType === 'vacancy' ? 'Vacancy' : 'Membership'}</span>
                      {app.status === 'Called for Interview' && app.applicationType === 'vacancy' && (
                        <span className="mva-card-link">Click to choose interview slot</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <div className="clubs-grid">
            {filtered.length > 0 ? (
              filtered.map((m) => {
                const club = getClubById(m.clubId)
                const roleLabel = m.role && m.memberSince ? `${m.role} · Since ${m.memberSince}` : m.memberSince ? `Member since ${m.memberSince}` : m.role || 'Member'
                return (
                  <article
                    key={`${m.clubId}-${m.status}`}
                    className="clubs-card"
                    onClick={() => club && navigate(`/clubs/${m.clubId}`)}
                    onKeyDown={(e) => club && e.key === 'Enter' && navigate(`/clubs/${m.clubId}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="clubs-card-media"
                      style={club?.image ? { backgroundImage: `url(${club.image})` } : undefined}
                    >
                      <span className="clubs-card-tag">{club?.category ?? 'Club'}</span>
                      <span className={`mm-card-status-badge mm-card-status-badge--${m.status.toLowerCase()}`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="clubs-card-body">
                      <h2 className="clubs-card-name">{m.clubName}</h2>
                      <p className="clubs-card-description mm-card-role">{roleLabel}</p>
                      <div className="clubs-card-footer">
                        {club && (
                          <span className="clubs-card-members">
                            <IconPerson />
                            {club.members} members
                          </span>
                        )}
                        {!club && <span />}
                        <button
                          type="button"
                          className="clubs-card-cta"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (club) navigate(`/clubs/${m.clubId}`)
                          }}
                        >
                          View Details
                          <span className="clubs-card-cta-icon">
                            <IconChevron />
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="clubs-empty">No memberships in this category.</p>
            )}
          </div>
        )}
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
    </div>
  )
}

export default MyMemberships
