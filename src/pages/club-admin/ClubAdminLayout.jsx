import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { fetchClub, fetchClubAdminDashboard, fetchMyClubMemberships, postClubAdminAnnouncement } from '../../api/clubApi'
import { mapClubFromApi } from '../../api/clubMappers'
import { userHasJwtAdminRole } from '../../auth/jwtRoles'
import { roleMayManageClub } from '../../auth/clubStaffRoles'
import { ClubAdminAccessContext } from '../../contexts/ClubAdminAccessContext'
import { normalizeClubRouteKey } from '../../utils/clubRouteKey'
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

function ClubAdminClubPicker({ onChoose, membershipsLoading, membershipOptions, manualId, setManualId }) {
  return (
    <div className="club-admin-content" style={{ maxWidth: 560, margin: '48px auto', padding: 24 }}>
      <div className="club-admin-card">
        <h1 className="club-admin-card-title" style={{ marginBottom: 20 }}>Club administration</h1>
        {membershipsLoading ? (
          <p style={{ color: '#64748b' }}>Loading your memberships…</p>
        ) : membershipOptions.length > 0 ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {membershipOptions.map((m) => (
              <li key={String(m.clubId)} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => onChoose(String(m.clubId))}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 4px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                >
                  <strong>{m.clubName}</strong>
                  <span style={{ display: 'block', fontSize: 13, color: '#64748b' }}>Role: {m.role}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#64748b', fontSize: 14 }}>No memberships loaded. Sign in or open admin with a club id below.</p>
        )}
        <div className="club-admin-field" style={{ marginTop: 24 }}>
          <label htmlFor="club-admin-manual-id">Club id (numeric)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="club-admin-manual-id"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 3"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
            <button
              type="button"
              className="club-admin-btn-primary"
              disabled={!manualId.trim()}
              onClick={() => onChoose(manualId.trim())}
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClubAdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [access, setAccess] = useState('loading')
  const [accessError, setAccessError] = useState('')
  const [membershipsLoading, setMembershipsLoading] = useState(true)
  const [membershipOptions, setMembershipOptions] = useState([])
  const [manualClubId, setManualClubId] = useState('')

  const searchParams = new URLSearchParams(location.search)
  const clubIdParam = normalizeClubRouteKey(searchParams.get('club')) || ''

  const [activeClub, setActiveClub] = useState(null)

  useEffect(() => {
    let cancelled = false
    setMembershipsLoading(true)
    ;(async () => {
      try {
        const raw = await fetchMyClubMemberships()
        if (cancelled) return
        const items = raw?.items ?? raw ?? []
        const rows = (Array.isArray(items) ? items : []).map((row) => ({
          clubId: row.clubId ?? row.club?.id ?? '',
          clubName: String(row.clubName ?? row.club?.name ?? 'Club'),
          role: String(row.role ?? 'Member'),
        }))
        const preferred = rows.filter((r) => r.clubId !== '' && roleMayManageClub(r.role))
        setMembershipOptions(preferred.length > 0 ? preferred : rows.filter((r) => r.clubId !== ''))
      } catch {
        if (!cancelled) setMembershipOptions([])
      } finally {
        if (!cancelled) setMembershipsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!clubIdParam) {
      setAccess('need-club')
      setAccessError('')
      return
    }
    if (userHasJwtAdminRole()) {
      setAccess('ok')
      setAccessError('')
      return
    }
    setAccess('loading')
    setAccessError('')
    ;(async () => {
      try {
        await fetchClubAdminDashboard(clubIdParam)
        if (!cancelled) setAccess('ok')
      } catch (e) {
        if (cancelled) return
        const st = e?.status
        if (st === 403 || st === 404) setAccess('denied')
        else {
          setAccess('error')
          setAccessError(e?.message || 'Could not verify club admin access.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [clubIdParam])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!clubIdParam || access !== 'ok') {
        if (!cancelled) setActiveClub(null)
        return
      }
      try {
        const raw = await fetchClub(clubIdParam)
        if (!cancelled) setActiveClub(mapClubFromApi(raw))
      } catch {
        if (!cancelled) setActiveClub(null)
      }
    })()
    return () => { cancelled = true }
  }, [clubIdParam, access])

  const goClub = (id) => {
    navigate({ pathname: location.pathname, search: `?club=${encodeURIComponent(id)}` }, { replace: true })
  }

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

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !clubIdParam) return
    try {
      await postClubAdminAnnouncement(clubIdParam, {
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
      })
    } catch (e) {
      alert(e?.message || 'Could not post announcement.')
      return
    }
    closeNotificationModal()
  }

  const ctxValue = useMemo(
    () => ({
      clubId: clubIdParam,
      clubSearch: clubIdParam ? `?club=${encodeURIComponent(clubIdParam)}` : '',
      accessState: access,
    }),
    [clubIdParam, access]
  )

  return (
    <ClubAdminAccessContext.Provider value={ctxValue}>
      <div className={`club-admin-layout ${sidebarOpen ? 'club-admin-layout--sidebar-open' : ''}`}>
        {access === 'ok' && (
          <>
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
          </>
        )}

        <main className="club-admin-main">
          {access === 'loading' && clubIdParam ? (
            <p style={{ padding: 32, color: '#64748b' }}>Checking access…</p>
          ) : null}
          {access === 'need-club' ? (
            <ClubAdminClubPicker
              onChoose={goClub}
              membershipsLoading={membershipsLoading}
              membershipOptions={membershipOptions}
              manualId={manualClubId}
              setManualId={setManualClubId}
            />
          ) : null}
          {access === 'denied' ? (
            <div className="club-admin-content" style={{ maxWidth: 520, margin: '48px auto', padding: 24 }}>
              <div className="club-admin-card">
                <h1 className="club-admin-card-title">Access denied</h1>
                <p style={{ fontSize: 15, color: '#475569', marginBottom: 16 }}>
                  You do not have permission to manage this club. Only employees and designated admins of a club can open its admin panel, unless your account has the global Admin role.
                </p>
                <button type="button" className="club-admin-btn-primary" onClick={() => navigate('/club-admin', { replace: true })}>
                  Choose another club
                </button>
                <button type="button" className="club-admin-btn-secondary" style={{ marginLeft: 8 }} onClick={() => navigate('/')}>
                  Back to home
                </button>
              </div>
            </div>
          ) : null}
          {access === 'error' ? (
            <div className="club-admin-content" style={{ maxWidth: 520, margin: '48px auto', padding: 24 }}>
              <div className="club-admin-card">
                <h1 className="club-admin-card-title">Could not load club admin</h1>
                <p style={{ fontSize: 14, color: '#b91c1c' }}>{accessError}</p>
                <button type="button" className="club-admin-btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/club-admin', { replace: true })}>
                  Try again
                </button>
              </div>
            </div>
          ) : null}
          {access === 'ok' ? <Outlet /> : null}
        </main>

        {access === 'ok' && showNotificationModal && (
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
    </ClubAdminAccessContext.Provider>
  )
}
