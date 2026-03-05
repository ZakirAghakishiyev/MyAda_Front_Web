import React, { useState } from 'react'
import { useNavigate, NavLink, Outlet } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
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

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const StaffPortalLayout = () => {
  const navigate = useNavigate()
  const [activeDuty, setActiveDuty] = useState(true)
  const [dutyStatus, setDutyStatus] = useState('available')

  return (
    <div className="staff-portal staff-portal--light">
      <header className="sp-navbar">
        <div className="sp-nav-left">
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
        <div className="sp-nav-search">
          <IconSearch />
          <input type="text" placeholder="Search Request ID or keyword..." className="sp-search-input" />
        </div>
        <div className="sp-nav-right">
          <button type="button" className="sp-icon-btn" aria-label="Notifications">
            <IconBell />
          </button>
          <div className="sp-user">
            <div className="sp-user-avatar">JD</div>
            <div className="sp-user-info">
              <span className="sp-user-name">John Doe</span>
              <span className="sp-user-role">IT Specialist</span>
            </div>
          </div>
        </div>
      </header>

      <div className="sp-body">
        <aside className="sp-sidebar">
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
            <div className="sp-perf-item">
              <div className="sp-perf-head">
                <span className="sp-perf-label">Avg. Resolution</span>
                <span className="sp-perf-value">42m</span>
              </div>
              <span className="sp-perf-meta sp-perf-meta--down">-5%</span>
            </div>
            <div className="sp-perf-item">
              <div className="sp-perf-head">
                <span className="sp-perf-label">Customer Rating</span>
                <span className="sp-perf-value sp-perf-value--rating">
                  <IconStar />
                  4.9
                </span>
              </div>
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
