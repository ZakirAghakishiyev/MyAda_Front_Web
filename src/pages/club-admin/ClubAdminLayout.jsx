import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getClubById } from '../../data/clubsData'
import adaLogo from '../../assets/ada-logo.png'
import './ClubAdmin.css'

const IconOverview = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3h8v6h-8V3zM3 21h8v-6H3v6z" />
  </svg>
)

const IconApplications = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconPeople = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const IconTag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a2 2 0 0 0-2 2v5.59A2 2 0 0 0 2.59 12L12.17 21.6a2 2 0 0 0 2.83 0l5.59-5.59a2 2 0 0 0 0-2.83Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
)

const IconProfile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

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

export default function ClubAdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const searchParams = new URLSearchParams(location.search)
  const clubIdParam = searchParams.get('club')
  const activeClub = clubIdParam ? getClubById(clubIdParam) : null

  useEffect(() => {
    // Keep a club context for all club-admin pages.
    if (!clubIdParam) {
      navigate({ pathname: location.pathname, search: '?club=1' }, { replace: true })
    }
  }, [clubIdParam, location.pathname, navigate])

  const navTo = useMemo(() => {
    const search = clubIdParam ? `?club=${encodeURIComponent(clubIdParam)}` : ''
    return (pathname) => ({ pathname, search })
  }, [clubIdParam])

  const openNotificationModal = () => {
    setNotificationTitle('')
    setNotificationMessage('')
    setShowNotificationModal(true)
  }

  const closeNotificationModal = () => {
    setShowNotificationModal(false)
  }

  const handleSendNotification = () => {
    if (!notificationTitle.trim()) return
    // TODO: integrate with notifications API when available
    console.log('Send announcement as notification:', { title: notificationTitle.trim(), message: notificationMessage.trim() })
    closeNotificationModal()
  }

  return (
    <div className={`club-admin-layout ${sidebarOpen ? 'club-admin-layout--sidebar-open' : ''}`}>
      {sidebarOpen && (
        <div className="club-admin-sidebar-overlay" aria-hidden onClick={() => setSidebarOpen(false)} />
      )}
      <button type="button" className="club-admin-sidebar-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <IconMenu />
      </button>
      <aside className="club-admin-sidebar">
        <button type="button" className="club-admin-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <IconClose />
        </button>
        <button type="button" className="club-admin-nav-item club-admin-sidebar-home club-admin-sidebar-ada-logo-wrap" onClick={() => navigate('/')} aria-label="Back to home">
          <img src={adaLogo} alt="ADA University" className="club-admin-sidebar-ada-logo" />
        </button>
        <div className="club-admin-sidebar-title">
          {activeClub ? (
            <div className="club-admin-sidebar-club">
              <div
                className="club-admin-sidebar-club-logo"
                style={activeClub.image ? { backgroundImage: `url(${activeClub.image})` } : undefined}
              />
              <div className="club-admin-sidebar-club-text">
                <div className="club-admin-sidebar-club-name">{activeClub.name}</div>
                <div className="club-admin-sidebar-club-subtitle">Club Admin</div>
              </div>
            </div>
          ) : (
            'Club Admin'
          )}
        </div>

        <button type="button" className="club-admin-sidebar-cta club-admin-sidebar-cta--top" onClick={openNotificationModal}>
          <IconPlus /> New Announcement
        </button>

        <nav className="club-admin-sidebar-nav">
          <NavLink to={navTo('/club-admin')} end className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconOverview /> Overview
          </NavLink>

          <NavLink to={navTo('/club-admin/applications')} className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconApplications /> Applications
          </NavLink>

          <NavLink to={navTo('/club-admin/vacancies')} className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconList /> Vacancies
          </NavLink>

          <NavLink to={navTo('/club-admin/events')} className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconCalendar /> Events
          </NavLink>

          <NavLink to={navTo('/club-admin/members')} className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconPeople /> Members
          </NavLink>

          <NavLink to={navTo('/club-admin/profile')} className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconProfile /> Club Profile
          </NavLink>

          <NavLink to={navTo('/club-admin/positions')} className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconTag /> Positions
          </NavLink>
        </nav>
      </aside>

      <main className="club-admin-main">
        <Outlet />
      </main>

      {showNotificationModal && (
        <div className="club-admin-popup-overlay" onClick={closeNotificationModal}>
          <div className="club-admin-popup" onClick={(e) => e.stopPropagation()}>
            <div className="club-admin-popup-header">
              <h2>Send announcement as notification</h2>
              <button type="button" className="club-admin-popup-close" onClick={closeNotificationModal} aria-label="Close">×</button>
            </div>
            <div className="club-admin-popup-body">
              <div className="club-admin-field">
                <label htmlFor="notification-title">Title</label>
                <input
                  id="notification-title"
                  type="text"
                  placeholder="Announcement title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
              </div>
              <div className="club-admin-field">
                <label htmlFor="notification-message">Message</label>
                <textarea
                  id="notification-message"
                  placeholder="Write your announcement…"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="club-admin-popup-footer">
              <button type="button" className="club-admin-btn-secondary" onClick={closeNotificationModal}>Cancel</button>
              <button type="button" className="club-admin-btn-primary" onClick={handleSendNotification} disabled={!notificationTitle.trim()}>
                Send as notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}