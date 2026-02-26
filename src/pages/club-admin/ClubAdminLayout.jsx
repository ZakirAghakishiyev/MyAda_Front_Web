import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './ClubAdmin.css'

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

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

const IconMegaphone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
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

const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const IconTag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a2 2 0 0 0-2 2v5.59A2 2 0 0 0 2.59 12L12.17 21.6a2 2 0 0 0 2.83 0l5.59-5.59a2 2 0 0 0 0-2.83Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
)

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default function ClubAdminLayout() {
  const navigate = useNavigate()
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')

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
    <div className="club-admin-layout">
      <aside className="club-admin-sidebar">
        <button type="button" className="club-admin-nav-item club-admin-sidebar-home" onClick={() => navigate('/')} aria-label="Back to home">
          <IconHome /> Back to Home
        </button>
        <div className="club-admin-sidebar-title">Club Admin</div>

        <nav className="club-admin-sidebar-nav">
          <NavLink to="/club-admin" end className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconOverview /> Overview
          </NavLink>

          <NavLink to="/club-admin/applications" className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconApplications /> Applications
          </NavLink>

          <NavLink to="/club-admin/members" className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconPeople /> Members
          </NavLink>

          <NavLink to="/club-admin/employees" className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconBriefcase /> Employees
          </NavLink>

          <NavLink to="/club-admin/vacancies/new" className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconMegaphone /> Announce Vacancy
          </NavLink>

          <NavLink to="/club-admin/positions/new" className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconTag /> Create Position
          </NavLink>

          <NavLink to="/club-admin/events/propose" className={({ isActive }) => isActive ? 'club-admin-nav-item club-admin-nav-item--active' : 'club-admin-nav-item'}>
            <IconCalendar /> Suggest Event
          </NavLink>
        </nav>

        <button type="button" className="club-admin-sidebar-cta" onClick={openNotificationModal}>
          <IconPlus /> New Announcement
        </button>
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