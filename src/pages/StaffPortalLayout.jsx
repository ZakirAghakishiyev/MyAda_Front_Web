import React, { useState } from 'react'
import { useNavigate, NavLink, Outlet } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import { getJwtDisplayName, getJwtProfileInitial, getJwtRoleLabel } from '../auth/jwtRoles'
import './StaffPortal.css'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const STAFF_NOTIFICATIONS = [
  {
    id: 2,
    type: 'assignment',
    title: 'New job assigned',
    message: 'You have been assigned ticket REQ-8821 (Server Room AC Unit Failure).',
    time: '10 min ago',
    unread: true,
  },
  {
    id: 3,
    type: 'reminder',
    title: 'Reminder: add completion notes',
    message: 'Remember to add short completion notes before closing each job.',
    time: 'Today',
    unread: false,
  },
]

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const StaffPortalLayout = () => {
  const navigate = useNavigate()
  const [activeDuty, setActiveDuty] = useState(true)
  const [dutyStatus, setDutyStatus] = useState('available')
  const [showNotifications, setShowNotifications] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const hasUnreadNotifications = STAFF_NOTIFICATIONS.some((n) => n.unread)

  return (
    <div className={`staff-portal staff-portal--light ${sidebarOpen ? '' : 'staff-portal--sidebar-closed'}`}>
      <header className="sp-navbar">
        <div className="sp-nav-left">
          <button type="button" className="sp-nav-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <IconMenu />
          </button>
          <button type="button" className="sp-logo-btn" onClick={() => navigate('/')} aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="sp-logo-img" />
          </button>
          <nav className="sp-nav-links">
            <NavLink to="/staff-portal" end className={({ isActive }) => `sp-nav-link ${isActive ? 'sp-nav-link--active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/staff-portal/history" className={({ isActive }) => `sp-nav-link ${isActive ? 'sp-nav-link--active' : ''}`}>
              History
            </NavLink>
          </nav>
        </div>
        <button
          type="button"
          className="sp-nav-search-toggle"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <IconSearch />
        </button>
        <div className={`sp-nav-search ${searchOpen ? 'sp-nav-search--open' : ''}`}>
          <IconSearch />
          <input type="text" placeholder="Search Request ID or keyword..." className="sp-search-input" />
          <button
            type="button"
            className="sp-nav-search-close"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            ×
          </button>
        </div>
        <div className="sp-nav-right">
          <button
            type="button"
            className="sp-icon-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <IconBell />
            {hasUnreadNotifications && <span className="sp-badge-unread" aria-hidden="true" />}
          </button>
          <div className="sp-user">
            <div className="sp-user-avatar">{getJwtProfileInitial()}</div>
            <div className="sp-user-info">
              <span className="sp-user-name">{getJwtDisplayName() || 'User'}</span>
              <span className="sp-user-role">{getJwtRoleLabel() || 'Staff'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="sp-body">
        {showNotifications && (
          <div className="sp-notifications-panel" role="dialog" aria-label="Staff notifications and instructions">
            <div className="sp-notifications-header">
              <div>
                <h3 className="sp-notifications-title">Notifications &amp; Instructions</h3>
                <p className="sp-notifications-subtitle">
                  Review dispatcher notes and important updates before starting work.
                </p>
              </div>
              <button
                type="button"
                className="sp-notifications-close"
                onClick={() => setShowNotifications(false)}
                aria-label="Close notifications"
              >
                ×
              </button>
            </div>
            <ul className="sp-notifications-list">
              {STAFF_NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className={`sp-notification-item ${n.unread ? 'sp-notification-item--unread' : ''}`}
                >
                  <div className="sp-notification-main">
                    <div className="sp-notification-title-row">
                      <span className="sp-notification-title">{n.title}</span>
                      {n.unread && <span className="sp-notification-badge">New</span>}
                    </div>
                    <p className="sp-notification-message">{n.message}</p>
                  </div>
                  <div className="sp-notification-meta-row">
                    <span className="sp-notification-time">{n.time}</span>
                    <button
                      type="button"
                      className="sp-notification-link"
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/staff-portal')
                      }}
                    >
                      View job
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sidebarOpen && (
          <div className="sp-sidebar-overlay" aria-hidden onClick={() => setSidebarOpen(false)} />
        )}
        <aside className="sp-sidebar">
          <button type="button" className="sp-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <IconClose />
          </button>
          <section className="sp-panel">
            <h3 className="sp-panel-title">AVAILABILITY</h3>
            <div className="sp-toggle-row">
              <span className="sp-toggle-label">Active Duty</span>
              <button
                type="button"
                role="switch"
                aria-checked={activeDuty}
                className={`sp-toggle sp-toggle--transition ${activeDuty ? 'sp-toggle--on' : ''}`}
                onClick={() => setActiveDuty(!activeDuty)}
              >
                <span className="sp-toggle-thumb" />
              </button>
            </div>
            {activeDuty && (
              <div className="sp-status-options">
                <button
                  type="button"
                  className={`sp-status-option sp-status-option--transition ${dutyStatus === 'available' ? 'sp-status-option--active' : ''}`}
                  onClick={() => setDutyStatus('available')}
                >
                  <span className="sp-dot sp-dot--green" />
                  Available for assignments
                </button>
                <button
                  type="button"
                  className={`sp-status-option sp-status-option--transition ${dutyStatus === 'on_break' ? 'sp-status-option--active' : ''}`}
                  onClick={() => setDutyStatus('on_break')}
                >
                  <span className="sp-dot sp-dot--amber" />
                  On break
                </button>
              </div>
            )}
          </section>

          <section className="sp-panel">
            <h3 className="sp-panel-title">WEEKLY PERFORMANCE</h3>
            <div className="sp-perf-item">
              <div className="sp-perf-head">
                <span className="sp-perf-label">Tasks Completed</span>
                <span className="sp-perf-value">12/15</span>
              </div>
              <div className="sp-perf-bar">
                <div className="sp-perf-fill sp-perf-fill--transition" style={{ width: '80%' }} />
              </div>
              <span className="sp-perf-meta sp-perf-meta--up">+15%</span>
            </div>
          </section>
        </aside>

        <main className="sp-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StaffPortalLayout
