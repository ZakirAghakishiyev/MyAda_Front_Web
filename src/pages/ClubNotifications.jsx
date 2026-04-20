import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyClubNotifications, markClubNotificationRead } from '../api/clubApi'
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

function mapApiNotificationType(t) {
  const s = String(t || '').toLowerCase()
  if (s.includes('proposal') || s.includes('club_proposal')) return 'proposals'
  if (s.includes('member')) return 'membership'
  if (s.includes('vacanc') || s.includes('job')) return 'vacancies'
  if (s.includes('event')) return 'events'
  return 'membership'
}

const ClubNotifications = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [showRevisionComments, setShowRevisionComments] = useState(false)
  const [apiItems, setApiItems] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchMyClubNotifications('all')
        const rows = Array.isArray(data) ? data : data?.items ?? []
        if (!cancelled) setApiItems(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setApiItems([])
      }
    })()
    return () => { cancelled = true }
  }, [])

  const displayNotifications = apiItems.length > 0
    ? apiItems.map((row, i) => {
        const id = String(row.id ?? row.notificationId ?? `n-${i}`)
        const type = mapApiNotificationType(row.type ?? row.category ?? row.channel)
        return {
          id,
          type,
          pillClass: 'cn-pill--blue',
          pillLabel: String(row.category ?? row.type ?? 'Notification'),
          time: row.createdAt ? new Date(row.createdAt).toLocaleString() : row.time ?? '',
          title: String(row.title ?? row.subject ?? row.message ?? 'Notification'),
          body: String(row.body ?? row.description ?? row.message ?? ''),
          read: Boolean(row.read ?? row.isRead),
          raw: row,
        }
      })
    : NOTIFICATIONS.map((n) => ({
        id: n.id,
        type: n.type,
        pillClass: n.pillClass,
        pillLabel: n.pillLabel,
        time: n.time,
        title: n.id === 'proposal-approved'
          ? 'Your proposal for ADA Robotics has been approved!'
          : n.id === 'proposal-revision'
            ? 'Revision required for your Photography Club proposal'
            : n.id === 'membership-approved'
              ? 'You are now a member of the Photography Club'
              : n.id === 'vacancy-interview'
                ? 'Interview scheduled for Media & Content Creator role'
                : 'Event reminder',
        body: '',
        read: true,
        raw: null,
      }))

  const tabCounts = useMemo(() => {
    const base = { all: displayNotifications.length, proposals: 0, membership: 0, vacancies: 0, events: 0 }
    displayNotifications.forEach((n) => {
      if (base[n.type] != null) base[n.type] += 1
    })
    return base
  }, [displayNotifications])

  const isVisible = (type) => {
    if (activeTab === 'all') return true
    if (type === 'all') return false
    return activeTab === type
  }

  const handleMarkRead = async (n) => {
    if (!n?.raw || n.read) return
    const nid = n.raw.id ?? n.raw.notificationId
    if (!nid) return
    try {
      await markClubNotificationRead(nid)
      setApiItems((prev) =>
        prev.map((row) =>
          String(row.id ?? row.notificationId) === String(nid) ? { ...row, read: true, isRead: true } : row
        )
      )
    } catch {
      /* ignore */
    }
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
            {displayNotifications.filter((n) => isVisible(n.type)).length === 0 && (
              <p className="cn-card-body" style={{ padding: '24px 0' }}>No notifications in this tab.</p>
            )}
            {displayNotifications.filter((n) => isVisible(n.type)).map((n) => (
              <article
                key={n.id}
                className={`cn-card ${!n.read && apiItems.length ? 'cn-card--primary' : ''}`}
              >
                <header className="cn-card-header">
                  <span className={`cn-pill ${n.pillClass || 'cn-pill--blue'}`}>{n.pillLabel}</span>
                  <span className="cn-time">{n.time}</span>
                </header>
                <h2 className="cn-card-title">{n.title}</h2>
                {n.body ? <p className="cn-card-body">{n.body}</p> : null}
                <div className="cn-card-actions">
                  {!n.read && apiItems.length > 0 && (
                    <button type="button" className="cn-btn cn-btn--outline" onClick={() => handleMarkRead(n)}>
                      Mark as read
                    </button>
                  )}
                  {n.type === 'events' && (
                    <button type="button" className="cn-btn cn-btn--outline" onClick={() => navigate('/clubs/events/my-registrations')}>
                      <IconCalendar />
                      My Registrations
                    </button>
                  )}
                  {n.type === 'vacancies' && (
                    <button
                      type="button"
                      className="cn-btn cn-btn--primary"
                      onClick={() => navigate('/clubs/vacancies/my-applications')}
                    >
                      My applications
                    </button>
                  )}
                  {n.type === 'membership' && (
                    <button type="button" className="cn-btn cn-btn--primary" onClick={() => navigate('/clubs/my-memberships')}>
                      My clubs
                    </button>
                  )}
                  {n.type === 'proposals' && apiItems.length === 0 && n.id === 'proposal-revision' && (
                    <>
                      <button type="button" className="cn-btn cn-btn--outline" onClick={() => navigate('/clubs/propose')}>
                        <IconAlert />
                        Review feedback
                      </button>
                      <button
                        type="button"
                        className="cn-btn cn-btn--ghost"
                        onClick={() => setShowRevisionComments((open) => !open)}
                      >
                        View comments
                      </button>
                    </>
                  )}
                </div>
                {n.id === 'proposal-revision' && showRevisionComments && apiItems.length === 0 && (
                  <div className="cn-comments">
                    <div className="cn-comments-header">Sample feedback</div>
                    <ul className="cn-comments-list">
                      <li>Update mission and planned activities in your proposal.</li>
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ClubNotifications

