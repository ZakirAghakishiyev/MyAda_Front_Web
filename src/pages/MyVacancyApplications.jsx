import React from 'react'
import { useNavigate } from 'react-router-dom'
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
  }
]

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusPillClass = (status) => {
  if (status === 'Accepted') return 'mva-status-pill--accepted'
  if (status === 'Under Review') return 'mva-status-pill--review'
  if (status === 'Submitted') return 'mva-status-pill--submitted'
  return 'mva-status-pill--other'
}

const statusIcon = (status) => {
  if (status === 'Accepted') return <IconCheck />
  if (status === 'Under Review') return <IconHourglass />
  if (status === 'Submitted') return <IconClock />
  return <IconX />
}

const MyVacancyApplications = () => {
  const navigate = useNavigate()

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
            <span className="mva-tag">{MOCK_APPLICATIONS.length} total applications</span>
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
          {MOCK_APPLICATIONS.map((app) => (
            <article key={app.id} className="mva-card">
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
                </div>
              </div>
            </article>
          ))}

          {MOCK_APPLICATIONS.length === 0 && (
            <p className="mva-empty">
              You haven&apos;t applied to any club vacancies yet. Start by browsing open roles.
            </p>
          )}
        </div>
      </div>

      <footer className="mva-footer">
        <span className="mva-footer-logo">ADA University</span>
        <span className="mva-footer-copy">© 2024 University Recruitment Portal. All rights reserved.</span>
      </footer>
    </div>
  )
}

export default MyVacancyApplications

