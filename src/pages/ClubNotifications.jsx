import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import './ClubNotifications.css'

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
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

const TABS = [
  { id: 'all', label: 'All Notifications' },
  { id: 'proposals', label: 'Club Proposals' },
  { id: 'membership', label: 'Membership' },
  { id: 'vacancies', label: 'Vacancies' },
  { id: 'events', label: 'Events' }
]

const NOTIFICATIONS = [
  {
    id: 'proposal-approved',
    type: 'proposals',
    pillClass: 'cn-pill--blue',
    pillLabel: 'Club Proposals',
    tone: 'primary',
    time: '2 hours ago'
  },
  {
    id: 'proposal-revision',
    type: 'proposals',
    pillClass: 'cn-pill--amber',
    pillLabel: 'Club Proposals',
    tone: 'warning',
    time: '5 hours ago'
  },
  {
    id: 'membership-approved',
    type: 'membership',
    pillClass: 'cn-pill--green',
    pillLabel: 'Membership Applications',
    time: '5 hours ago'
  },
  {
    id: 'vacancy-interview',
    type: 'vacancies',
    pillClass: 'cn-pill--purple',
    pillLabel: 'Vacancy Applications',
    time: 'Yesterday, 4:30 PM'
  },
  {
    id: 'event-reminder',
    type: 'events',
    pillClass: 'cn-pill--indigo',
    pillLabel: 'Events',
    time: 'Today, 6:00 PM'
  }
]

const ClubNotifications = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [showRevisionComments, setShowRevisionComments] = useState(false)

  const tabCounts = useMemo(() => {
    const base = { all: NOTIFICATIONS.length, proposals: 0, membership: 0, vacancies: 0, events: 0 }
    NOTIFICATIONS.forEach((n) => {
      base[n.type] += 1
    })
    return base
  }, [])

  const isVisible = (id, type) => {
    if (activeTab === 'all') return true
    return activeTab === type
  }

  return (
    <div className="cn-page">
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
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs')}>Clubs</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/propose')}>Propose Club</button>
          </nav>
        </div>
        <div className="vacancies-nav-right">
          <button type="button" className="vacancies-nav-icon vacancies-nav-icon--active" aria-label="Notifications">
            <IconBell />
            <span className="cn-badge" />
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

      <div className="cn-layout">
        <section className="cn-main">
          <div className="cn-header-row">
            <button type="button" className="cn-back-btn" onClick={() => navigate(-1)} aria-label="Back">
              <IconBack />
            </button>
            <div className="cn-header-text">
              <h1 className="cn-title">Notification Center</h1>
              <p className="cn-subtitle">Manage your club proposals, membership statuses, applications, and campus events.</p>
            </div>
          </div>

          <div className="cn-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`cn-tab ${tab.id === activeTab ? 'cn-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="cn-tab-count">{tabCounts[tab.id]}</span>
              </button>
            ))}
          </div>

          <div className="cn-list">
            {isVisible('proposal-approved', 'proposals') && (
            <article className="cn-card cn-card--primary">
              <header className="cn-card-header">
                <span className="cn-pill cn-pill--blue">Club Proposals</span>
                <span className="cn-time">2 hours ago</span>
              </header>
              <h2 className="cn-card-title">Your proposal for ADA Robotics has been approved!</h2>
              <p className="cn-card-body">
                Great news – your club proposal has successfully completed all reviews. You can now start configuring your club dashboard, create roles, and schedule your first events.
              </p>
              <div className="cn-card-actions">
                <button type="button" className="cn-btn cn-btn--primary" onClick={() => navigate('/club-admin')}>
                  <IconCheck />
                  Launch Club Dashboard
                </button>
                <button type="button" className="cn-btn cn-btn--ghost">
                  Download Approval PDF
                </button>
              </div>
            </article>
            )}

            {isVisible('proposal-revision', 'proposals') && (
            <article className="cn-card cn-card--warning">
              <header className="cn-card-header">
                <span className="cn-pill cn-pill--amber">Club Proposals</span>
                <span className="cn-time">5 hours ago</span>
              </header>
              <h2 className="cn-card-title">Revision required for your Photography Club proposal</h2>
              <p className="cn-card-body">
                The student life office reviewed your submission and requested some clarifications about your club&apos;s mission, executive team, and planned activities. Please update the highlighted sections and resubmit.
              </p>
              <div className="cn-card-actions">
                <button type="button" className="cn-btn cn-btn--outline" onClick={() => navigate('/clubs/propose')}>
                  <IconAlert />
                  Review Feedback &amp; Edit
                </button>
                <button
                  type="button"
                  className="cn-btn cn-btn--ghost"
                  onClick={() => setShowRevisionComments((open) => !open)}
                >
                  View Comments
                </button>
              </div>
              {showRevisionComments && (
                <div className="cn-comments">
                  <div className="cn-comments-header">Feedback from Student Life Office</div>
                  <ul className="cn-comments-list">
                    <li>Clarify the club&apos;s long‑term mission and how it differs from existing photography initiatives.</li>
                    <li>Specify at least three concrete activities you plan to organize in the first semester.</li>
                    <li>Update the executive team section with final roles and responsibilities.</li>
                    <li>Describe how new members will be onboarded and how often the club plans to meet.</li>
                  </ul>
                </div>
              )}
            </article>
            )}

            {isVisible('membership-approved', 'membership') && (
            <article className="cn-card">
              <header className="cn-card-header">
                <span className="cn-pill cn-pill--green">Membership Applications</span>
                <span className="cn-time">5 hours ago</span>
              </header>
              <h2 className="cn-card-title">You are now a member of the Photography Club</h2>
              <p className="cn-card-body">
                Your membership application has been approved by the club executive team. Welcome aboard – check the club dashboard for upcoming meetings and events.
              </p>
              <div className="cn-card-actions">
                <button type="button" className="cn-btn cn-btn--primary" onClick={() => navigate('/clubs/my-memberships')}>
                  View Club Page
                </button>
              </div>
            </article>
            )}

            {isVisible('vacancy-interview', 'vacancies') && (
            <article className="cn-card">
              <header className="cn-card-header">
                <span className="cn-pill cn-pill--purple">Vacancy Applications</span>
                <span className="cn-time">Yesterday, 4:30 PM</span>
              </header>
              <h2 className="cn-card-title">You&apos;re invited to interview for Event Coordinator</h2>
              <p className="cn-card-body">
                The Debate Society would like to schedule an interview with you for the Event Coordinator position. Please confirm your time slot or propose an alternative.
              </p>
              <div className="cn-card-actions">
                <button type="button" className="cn-btn cn-btn--primary" onClick={() => navigate('/clubs/vacancies/my-applications')}>
                  Confirm Interview Slot
                </button>
                <button type="button" className="cn-btn cn-btn--ghost">
                  Reschedule
                </button>
              </div>
            </article>
            )}

            {isVisible('event-reminder', 'events') && (
            <article className="cn-card">
              <header className="cn-card-header">
                <span className="cn-pill cn-pill--indigo">Events</span>
                <span className="cn-time">Today, 6:00 PM</span>
              </header>
              <h2 className="cn-card-title">Reminder: Jazz Ensemble live session starts in 2 hours</h2>
              <p className="cn-card-body">
                Don&apos;t forget your registration for tonight&apos;s Jazz Ensemble session hosted by the Music Society. Your QR ticket is available under My Registrations.
              </p>
              <div className="cn-card-actions">
                <button type="button" className="cn-btn cn-btn--outline" onClick={() => navigate('/clubs/events/my-registrations')}>
                  <IconCalendar />
                  Open My Registrations
                </button>
                <button type="button" className="cn-btn cn-btn--ghost" onClick={() => navigate('/clubs/events')}>
                  Browse More Events
                </button>
              </div>
            </article>
            )}

            <button type="button" className="cn-load-more">
              Load older notifications
            </button>
          </div>
        </section>

        <aside className="cn-sidebar">
          <div className="cn-sidebar-card">
            <h3 className="cn-sidebar-title">Activity Summary</h3>
            <ul className="cn-summary-list">
              <li>
                <span>Active Proposals</span>
                <span className="cn-summary-value">2</span>
              </li>
              <li>
                <span>Applications Pending</span>
                <span className="cn-summary-value">3</span>
              </li>
              <li>
                <span>Events Registered</span>
                <span className="cn-summary-value">5</span>
              </li>
            </ul>
          </div>

          <div className="cn-sidebar-card">
            <h3 className="cn-sidebar-title">Upcoming Event</h3>
            <p className="cn-sidebar-text">
              <strong>Jazz Ensemble</strong> — Music Society
            </p>
            <p className="cn-sidebar-text cn-sidebar-muted">
              Tonight at 6:00 PM · Campus Auditorium
            </p>
            <button type="button" className="cn-btn cn-btn--primary cn-sidebar-btn" onClick={() => navigate('/clubs/events/my-registrations')}>
              View Ticket
            </button>
          </div>

          {/* <div className="cn-sidebar-card">
            <h3 className="cn-sidebar-title">Keep your profile up to date</h3>
            <p className="cn-sidebar-text cn-sidebar-muted">
              Clubs use your profile to match you with relevant roles and events tailored to your interests.
            </p>
            <button type="button" className="cn-btn cn-btn--outline cn-sidebar-btn">
              Update Profile
            </button>
          </div> */}
        </aside>
      </div>
    </div>
  )
}

export default ClubNotifications

