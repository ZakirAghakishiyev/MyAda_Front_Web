import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchMyVacancyApplications,
  fetchApplicationInterviewSlots,
  selectInterviewSlot,
} from '../api/clubApi'
import {
  mapMeVacancyStatusToDisplay,
  mapInterviewSlotForStudent,
  normalizeInterviewSlotsResponse,
} from '../api/clubApplicationMappers'
import adaLogo from '../assets/ada-logo.png'
import './MyVacancyApplications.css'

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

function mapMeRowToApplication(row, index) {
  const submitted = row.submittedAt ? String(row.submittedAt) : ''
  const appliedOn = submitted ? submitted.slice(0, 10) : ''
  return {
    id: String(row.applicationId ?? row.id ?? `app-${index}`),
    vacancyId: row.vacancyId != null ? String(row.vacancyId) : '',
    position: String(row.vacancyTitle ?? row.title ?? row.position ?? 'Role'),
    clubName: String(row.clubName ?? '—'),
    status: mapMeVacancyStatusToDisplay(row.status),
    appliedOn,
  }
}

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
  if (status === 'Declined') return 'mva-status-pill--other'
  return 'mva-status-pill--other'
}

const statusIcon = (status) => {
  if (status === 'Accepted') return <IconCheck />
  if (status === 'Interview Scheduled' || status === 'Called for Interview') return <IconCalendar />
  if (status === 'Under Review') return <IconHourglass />
  if (status === 'Submitted') return <IconClock />
  if (status === 'Declined') return <IconX />
  return <IconX />
}

const MyVacancyApplications = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [modalSlots, setModalSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [choosingSlot, setChoosingSlot] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [selectedInterviewDate, setSelectedInterviewDate] = useState('')
  const [draftSlotId, setDraftSlotId] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setListLoading(true)
      setListError('')
      try {
        const raw = await fetchMyVacancyApplications({ page: 1, limit: 50 })
        const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []
        if (cancelled) return
        setApplications(items.map(mapMeRowToApplication))
      } catch (e) {
        if (!cancelled) {
          setApplications([])
          setListError(e?.message || 'Could not load your applications.')
        }
      } finally {
        if (!cancelled) setListLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedAppId) {
      setModalSlots([])
      setSlotsError('')
      return
    }
    let cancelled = false
    setSlotsLoading(true)
    setSlotsError('')
    setDraftSlotId(null)
    ;(async () => {
      try {
        const raw = await fetchApplicationInterviewSlots(selectedAppId)
        const list = normalizeInterviewSlotsResponse(raw)
        if (cancelled) return
        setModalSlots(list.map((s, i) => mapInterviewSlotForStudent(s, i)).filter(Boolean))
      } catch (e) {
        if (!cancelled) {
          setModalSlots([])
          setSlotsError(e?.message || 'Could not load interview slots.')
        }
      } finally {
        if (!cancelled) setSlotsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedAppId])

  const selectedApp = useMemo(
    () => applications.find((app) => app.id === selectedAppId) || null,
    [applications, selectedAppId]
  )

  const availableSlotsForSelected = useMemo(() => {
    if (!selectedApp) return []
    return modalSlots
  }, [selectedApp, modalSlots])

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
    if (app.status !== 'Called for Interview') return
    setSelectedAppId(app.id)
  }

  useEffect(() => {
    if (!location.state?.openInterviewPicker) return
    if (selectedAppId) return

    const target = applications.find((app) => app.status === 'Called for Interview')

    if (target) {
      setSelectedAppId(target.id)
    }
    navigate(location.pathname, { replace: true, state: null })
  }, [applications, location.pathname, location.state, navigate, selectedAppId])

  const handleCloseInterviewPicker = () => {
    setSelectedAppId(null)
    setDraftSlotId(null)
  }

  const handleChooseSlot = async (slotId) => {
    if (!selectedApp || !slotId) return
    setChoosingSlot(true)
    setSlotsError('')
    try {
      await selectInterviewSlot(selectedApp.id, slotId)
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApp.id ? { ...app, status: 'Interview Scheduled' } : app
        )
      )
      setSelectedAppId(null)
      setDraftSlotId(null)
    } catch (e) {
      setSlotsError(e?.message || 'Could not reserve this slot.')
    } finally {
      setChoosingSlot(false)
    }
  }

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

        {listError && (
          <p className="mva-empty" role="alert" style={{ marginBottom: 12 }}>
            {listError}
          </p>
        )}
        {listLoading && (
          <p className="mva-empty">Loading your applications…</p>
        )}

        <div className="mva-list">
          {!listLoading && applications.map((app) => (
            <article
              key={app.id}
              className={`mva-card ${app.status === 'Called for Interview' ? 'mva-card--clickable' : ''}`}
              onClick={() => handleOpenInterviewPicker(app)}
              onKeyDown={(e) => e.key === 'Enter' && handleOpenInterviewPicker(app)}
              role={app.status === 'Called for Interview' ? 'button' : undefined}
              tabIndex={app.status === 'Called for Interview' ? 0 : undefined}
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
                    Applied on {app.appliedOn ? formatDate(app.appliedOn) : '—'}
                  </span>
                  <span className="mva-card-id">Application ID: {app.id}</span>
                  {app.status === 'Called for Interview' && (
                    <span className="mva-card-link">Click to choose interview slot</span>
                  )}
                  {app.status === 'Interview Scheduled' && (
                    <span className="mva-card-link">Interview time confirmed</span>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!listLoading && applications.length === 0 && !listError && (
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
            {slotsError && (
              <p className="mva-empty" role="alert" style={{ marginBottom: 8 }}>{slotsError}</p>
            )}
            {slotsLoading && (
              <p className="mva-empty">Loading available slots…</p>
            )}
            {!slotsLoading && availableDatesForSelected.length > 0 && (
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
              {!slotsLoading && availableSlotsForSelected.length === 0 && !slotsError && (
                <p className="mva-empty">No interview slots have been published by admin yet.</p>
              )}
              {!slotsLoading && visibleSlots.map((slot) => {
                const takenByAnother = Boolean(slot.takenByAnother)
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
                disabled={!draftSlotId || choosingSlot || slotsLoading}
                onClick={() => draftSlotId && handleChooseSlot(draftSlotId)}
              >
                {choosingSlot ? 'Saving…' : 'Choose'}
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

