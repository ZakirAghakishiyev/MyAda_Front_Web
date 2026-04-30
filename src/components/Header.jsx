import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useFilter } from '../contexts/FilterContext'
import { logout, changePassword } from '../auth'
import { getAccessToken } from '../auth/tokenStorage'
import { userHasJwtAdminRole, getJwtProfileInitial } from '../auth/jwtRoles'
import { fetchCurrentUserEmail } from '../api/authUsersApi'
import { useNotifications } from '../notifications/NotificationContext'
import adaLogo from '../assets/ada-logo.png'
import campusBanner from '../assets/campus-banner.png'
import './Header.css'

const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getNotificationChannelTone(channel) {
  const normalized = String(channel || '').trim().toLowerCase()
  if (normalized === 'email') return 'email'
  if (normalized === 'sms') return 'sms'
  return 'push'
}

function getRealtimeStatus(connectionState) {
  if (connectionState === 'connected') return { label: 'Live updates', tone: 'live' }
  if (connectionState === 'connecting' || connectionState === 'reconnecting') {
    return { label: 'Connecting', tone: 'syncing' }
  }
  return { label: 'API refresh mode', tone: 'fallback' }
}

const Header = () => {
  const { activeFilter, setActiveFilter } = useFilter()
  const location = useLocation()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [cpEmail, setCpEmail] = useState('')
  const [cpOld, setCpOld] = useState('')
  const [cpNew, setCpNew] = useState('')
  const [cpConfirm, setCpConfirm] = useState('')
  const [cpError, setCpError] = useState('')
  const [cpSuccess, setCpSuccess] = useState('')
  const [cpLoading, setCpLoading] = useState(false)
  const [cpResolvingEmail, setCpResolvingEmail] = useState(false)
  const [showCpOld, setShowCpOld] = useState(false)
  const [showCpNew, setShowCpNew] = useState(false)
  const [showCpConfirm, setShowCpConfirm] = useState(false)
  const profileMenuRef = useRef(null)
  const notificationMenuRef = useRef(null)
  const notificationPanelRef = useRef(null)
  const notificationButtonRef = useRef(null)
  const loggedIn = Boolean(getAccessToken())
  const isHomePage = location.pathname === '/'
  const showFilterNav = !isHomePage || !getAccessToken() || userHasJwtAdminRole()
  const {
    items: notifications,
    loading: notificationsLoading,
    refreshing: notificationsRefreshing,
    error: notificationsError,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh: refreshNotifications,
  } = useNotifications()
  const recentNotifications = notifications.slice(0, 6)
  const realtimeStatus = getRealtimeStatus(connectionState)
  const [notificationPanelStyle, setNotificationPanelStyle] = useState({
    top: 60,
    left: 16,
    width: 360,
  })

  const handleFilterClick = (filterName) => {
    setActiveFilter(filterName)
  }

  const filters = [
    { name: 'home', label: 'Home' },
    { name: 'academics', label: 'Academics' },
    { name: 'community', label: 'Community' },
    { name: 'account', label: 'My Account' },
    { name: 'work', label: 'Work' }
  ]

  useEffect(() => {
    const handleOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
      const clickedInsideBell = notificationMenuRef.current?.contains(e.target)
      const clickedInsidePanel = notificationPanelRef.current?.contains(e.target)
      if (!clickedInsideBell && !clickedInsidePanel) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    if (!showNotifications || notificationsLoading || recentNotifications.length > 0) return
    void refreshNotifications()
  }, [notificationsLoading, recentNotifications.length, refreshNotifications, showNotifications])

  useEffect(() => {
    if (!showNotifications) return undefined

    const updateNotificationPanelPosition = () => {
      const button = notificationButtonRef.current
      if (!button || typeof window === 'undefined') return

      const rect = button.getBoundingClientRect()
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
      const panelWidth = Math.min(360, Math.max(280, viewportWidth - 16))
      const preferredLeft = rect.right - panelWidth
      const left = Math.max(8, Math.min(preferredLeft, viewportWidth - panelWidth - 8))

      setNotificationPanelStyle({
        top: Math.max(rect.bottom + 10, 8),
        left,
        width: panelWidth,
      })
    }

    updateNotificationPanelPosition()
    window.addEventListener('resize', updateNotificationPanelPosition)
    window.addEventListener('scroll', updateNotificationPanelPosition, true)

    return () => {
      window.removeEventListener('resize', updateNotificationPanelPosition)
      window.removeEventListener('scroll', updateNotificationPanelPosition, true)
    }
  }, [showNotifications])

  useEffect(() => {
    if (!showChangePassword) return
    let cancelled = false
    setCpEmail('')
    setCpResolvingEmail(true)
    ;(async () => {
      try {
        const em = await fetchCurrentUserEmail()
        if (!cancelled && em) setCpEmail(em)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setCpResolvingEmail(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showChangePassword])

  useEffect(() => {
    if (!showChangePassword) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowChangePassword(false)
        setCpError('')
        setCpSuccess('')
        setCpLoading(false)
        setCpResolvingEmail(false)
        setShowCpOld(false)
        setShowCpNew(false)
        setShowCpConfirm(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showChangePassword])

  const handleLogout = async () => {
    await logout()
    setShowProfileMenu(false)
    setShowNotifications(false)
    navigate('/login', { replace: true })
  }

  const openChangePassword = () => {
    setShowProfileMenu(false)
    setCpError('')
    setCpSuccess('')
    setCpOld('')
    setCpNew('')
    setCpConfirm('')
    setCpEmail('')
    setShowCpOld(false)
    setShowCpNew(false)
    setShowCpConfirm(false)
    setShowChangePassword(true)
  }

  const closeChangePassword = () => {
    setShowChangePassword(false)
    setCpError('')
    setCpSuccess('')
    setCpLoading(false)
    setCpResolvingEmail(false)
    setShowCpOld(false)
    setShowCpNew(false)
    setShowCpConfirm(false)
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setCpError('')
    setCpSuccess('')
    if (cpResolvingEmail) return
    const email = cpEmail.trim()
    if (!email) {
      setCpError('Email is required. Sign in again, or enter your email above.')
      return
    }
    if (!cpConfirm.trim()) {
      setCpError('Please confirm your new password.')
      return
    }
    if (cpNew !== cpConfirm) {
      setCpError('New password and confirmation do not match.')
      return
    }
    setCpLoading(true)
    try {
      await changePassword(email, cpOld, cpNew)
      setCpSuccess('Password changed successfully. Use your new password next time you sign in.')
      setCpOld('')
      setCpNew('')
      setCpConfirm('')
    } catch (err) {
      setCpError(err.message || 'Could not change password.')
    } finally {
      setCpLoading(false)
    }
  }

  const changePasswordModal =
    typeof document !== 'undefined' && showChangePassword
      ? createPortal(
          <div className="header-modal-overlay" role="presentation" onClick={closeChangePassword}>
            <div
              className="header-modal header-modal--password"
              role="dialog"
              aria-modal="true"
              aria-labelledby="header-change-password-title"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="header-modal-hero">
                <div className="header-modal-hero-icon" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="header-modal-hero-text">
                  <h2 id="header-change-password-title" className="header-modal-title">
                    Change password
                  </h2>
                  <p className="header-modal-subtitle">Use your current password, then enter your new password twice.</p>
                </div>
                <button type="button" className="header-modal-close" aria-label="Close" onClick={closeChangePassword}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <form className="header-modal-form" onSubmit={handleChangePasswordSubmit}>
                <p className="header-modal-section-label">Account</p>
                {cpResolvingEmail ? (
                  <p className="header-modal-muted" role="status">
                    Looking up your account email…
                  </p>
                ) : cpEmail ? (
                  <p className="header-modal-muted">
                    Request will use <span className="header-modal-email-strong">{cpEmail}</span>.
                  </p>
                ) : (
                  <label className="header-modal-label" htmlFor="header-cp-email">
                    Email (required — not found on your session)
                    <input
                      id="header-cp-email"
                      type="email"
                      className="header-modal-input"
                      value={cpEmail}
                      onChange={(e) => setCpEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </label>
                )}
                <p className="header-modal-section-label">Passwords</p>
                <label className="header-modal-label" htmlFor="header-cp-old">
                  Current password
                  <span className="header-modal-field-wrap">
                    <input
                      id="header-cp-old"
                      type={showCpOld ? 'text' : 'password'}
                      className="header-modal-input header-modal-input--with-toggle"
                      value={cpOld}
                      onChange={(e) => setCpOld(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="header-modal-toggle-vis"
                      onClick={() => setShowCpOld((v) => !v)}
                      aria-label={showCpOld ? 'Hide current password' : 'Show current password'}
                      aria-pressed={showCpOld}
                    >
                      {showCpOld ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </span>
                </label>
                <label className="header-modal-label" htmlFor="header-cp-new">
                  New password
                  <span className="header-modal-field-wrap">
                    <input
                      id="header-cp-new"
                      type={showCpNew ? 'text' : 'password'}
                      className="header-modal-input header-modal-input--with-toggle"
                      value={cpNew}
                      onChange={(e) => setCpNew(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="header-modal-toggle-vis"
                      onClick={() => setShowCpNew((v) => !v)}
                      aria-label={showCpNew ? 'Hide new password' : 'Show new password'}
                      aria-pressed={showCpNew}
                    >
                      {showCpNew ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </span>
                </label>
                <label className="header-modal-label" htmlFor="header-cp-confirm">
                  Confirm new password
                  <span className="header-modal-field-wrap">
                    <input
                      id="header-cp-confirm"
                      type={showCpConfirm ? 'text' : 'password'}
                      className="header-modal-input header-modal-input--with-toggle"
                      value={cpConfirm}
                      onChange={(e) => setCpConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="header-modal-toggle-vis"
                      onClick={() => setShowCpConfirm((v) => !v)}
                      aria-label={showCpConfirm ? 'Hide confirmation' : 'Show confirmation'}
                      aria-pressed={showCpConfirm}
                    >
                      {showCpConfirm ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </span>
                </label>
                {!cpError && cpConfirm.length > 0 && cpNew !== cpConfirm ? (
                  <p className="header-modal-error" role="alert">
                    New password and confirmation do not match.
                  </p>
                ) : null}
                {cpError ? (
                  <p className="header-modal-error" role="alert">
                    {cpError}
                  </p>
                ) : null}
                {cpSuccess ? (
                  <p className="header-modal-success" role="status">
                    {cpSuccess}
                  </p>
                ) : null}
                <div className="header-modal-actions">
                  <button type="button" className="header-modal-btn secondary" onClick={closeChangePassword}>
                    {cpSuccess ? 'Close' : 'Cancel'}
                  </button>
                  {!cpSuccess ? (
                    <button
                      type="submit"
                      className="header-modal-btn primary"
                      disabled={
                        cpLoading ||
                        cpResolvingEmail ||
                        !cpNew.trim() ||
                        !cpConfirm.trim() ||
                        cpNew !== cpConfirm
                      }
                    >
                      {cpLoading ? 'Saving…' : 'Update password'}
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null

  const notificationPanel =
    typeof document !== 'undefined' && showNotifications
      ? createPortal(
          <div
            ref={notificationPanelRef}
            className="notification-panel"
            role="dialog"
            aria-label="Notifications"
            style={notificationPanelStyle}
          >
            <div className="notification-panel-header">
              <div>
                <p className="notification-panel-eyebrow">Notifications</p>
                <h3 className="notification-panel-title">Inbox</h3>
              </div>
              <button
                type="button"
                className="notification-panel-close"
                aria-label="Close notifications"
                onClick={() => setShowNotifications(false)}
              >
                <IconClose />
              </button>
            </div>

            <div className="notification-panel-toolbar">
              <span className={`notification-status notification-status--${realtimeStatus.tone}`}>
                <span className="notification-status-dot" aria-hidden />
                {realtimeStatus.label}
              </span>
              <div className="notification-panel-actions">
                <button
                  type="button"
                  className="notification-panel-action"
                  onClick={() => void refreshNotifications()}
                  disabled={notificationsLoading || notificationsRefreshing}
                >
                  {notificationsRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  className="notification-panel-action"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>
            </div>

            {notificationsError ? (
              <p className="notification-panel-error" role="alert">
                {notificationsError}
              </p>
            ) : null}

            <div className="notification-panel-list">
              {notificationsLoading ? (
                <p className="notification-panel-empty">Loading notifications...</p>
              ) : recentNotifications.length === 0 ? (
                <p className="notification-panel-empty">No notifications yet.</p>
              ) : (
                recentNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`notification-item ${notification.read ? '' : 'notification-item--unread'}`}
                  >
                    <div className="notification-item-meta">
                      <span
                        className={`notification-item-channel notification-item-channel--${getNotificationChannelTone(
                          notification.channel
                        )}`}
                      >
                        {notification.channel}
                      </span>
                      <span className="notification-item-time">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="notification-item-type">{notification.type}</p>
                    <p className="notification-item-message">
                      {notification.message || 'New activity was added to your notification stream.'}
                    </p>
                    <div className="notification-item-footer">
                      {!notification.read ? (
                        <button
                          type="button"
                          className="notification-item-action"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      ) : (
                        <span className="notification-item-read-label">Read</span>
                      )}
                      {notification.id && notification.removable !== false ? (
                        <button
                          type="button"
                          className="notification-item-action"
                          onClick={() => void removeNotification(notification.id)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
    <header className="header">
      <div className="header-top">
        <div className="header-left">
          <button className="hamburger-menu" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <Link to="/" className="logo" aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="logo-image" />
          </Link>
        </div>
        <div className="header-right">
          <button className="icon-button calendar-icon" aria-label="Calendar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <svg className="checkmark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          {loggedIn && (
            <div className="notification-wrap" ref={notificationMenuRef}>
              <button
                type="button"
                className={`icon-button notification-icon ${showNotifications ? 'notification-icon--open' : ''}`}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                ref={notificationButtonRef}
                onClick={() => {
                  setShowProfileMenu(false)
                  setShowNotifications((prev) => !prev)
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 ? (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                ) : null}
              </button>
            </div>
          )}
          {isHomePage && loggedIn && (
            <div className="profile-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="profile-icon"
                aria-label="Open profile menu"
                onClick={() => {
                  setShowNotifications(false)
                  setShowProfileMenu((prev) => !prev)
                }}
              >
                {getJwtProfileInitial()}
              </button>
              {showProfileMenu && (
                <div className="profile-menu">
                  <button type="button" className="profile-menu-item" onClick={openChangePassword}>
                    Change password
                  </button>
                  <div className="profile-menu-divider" role="separator" />
                  <button type="button" className="profile-menu-item" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="banner-container">
        <div className="banner-image" style={{ backgroundImage: `url(${campusBanner})` }}></div>
        <div className="banner-overlay"></div>
      </div>
      {showFilterNav && (
        <nav className="filter-navbar">
          <div className="filter-nav-links">
            {filters.map((filter) => (
              <button
                key={filter.name}
                className={`nav-link ${activeFilter === filter.name ? 'active' : ''}`}
                onClick={() => handleFilterClick(filter.name)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="view-all-cards">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span>VIEW ALL CARDS</span>
          </div>
        </nav>
      )}
    </header>
    {notificationPanel}
    {changePasswordModal}
    </>
  )
}

export default Header
