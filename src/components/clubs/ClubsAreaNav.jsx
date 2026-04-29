import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import adaLogo from '../../assets/ada-logo.png'
import '../../pages/ClubVacancies.css'

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

/**
 * Which primary nav tab is active for the current clubs area URL.
 * @param {string} pathname
 * @returns {'vacancies'|'applications'|'events'|'clubs'|'propose'|null}
 */
export function clubsAreaNavActiveSection(pathname) {
  const p = pathname || ''
  if (p.startsWith('/clubs/vacancies/my-applications')) return 'applications'
  if (p.startsWith('/clubs/vacancies')) return 'vacancies'
  if (p.startsWith('/clubs/events')) return 'events'
  if (p.startsWith('/clubs/propose')) return 'propose'
  if (p.startsWith('/clubs/my-memberships')) return null
  if (p.startsWith('/clubs/notifications')) return null
  if (p === '/clubs' || p === '/clubs/') return 'clubs'
  if (/^\/clubs\/[^/]+(\/join)?$/.test(p)) return 'clubs'
  return null
}

/**
 * Shared top bar for student clubs area: same links and actions on every page; only the active tab changes.
 * @param {{ rightSlot?: React.ReactNode; showNotificationDot?: boolean }} props
 */
export default function ClubsAreaNav({ rightSlot = null, showNotificationDot = false }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = clubsAreaNavActiveSection(pathname)
  const onNotifications = pathname.startsWith('/clubs/notifications')

  const tabClass = (key) =>
    active === key ? 'vacancies-nav-link vacancies-nav-link--active' : 'vacancies-nav-link'

  return (
    <header className="vacancies-nav">
      <div className="vacancies-nav-inner">
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
          <nav className="vacancies-nav-links" aria-label="Clubs area">
            <button type="button" className={tabClass('vacancies')} onClick={() => navigate('/clubs/vacancies')}>
              Vacancies
            </button>
            <button type="button" className={tabClass('applications')} onClick={() => navigate('/clubs/vacancies/my-applications')}>
              My Applications
            </button>
            <button type="button" className={tabClass('events')} onClick={() => navigate('/clubs/events')}>
              Events
            </button>
            <button type="button" className={tabClass('clubs')} onClick={() => navigate('/clubs')}>
              Clubs
            </button>
            <button type="button" className={tabClass('propose')} onClick={() => navigate('/clubs/propose')}>
              Propose Club
            </button>
          </nav>
        </div>
        <div className="vacancies-nav-right">
          {rightSlot}
          <button
            type="button"
            className={onNotifications ? 'vacancies-nav-icon vacancies-nav-icon--active' : 'vacancies-nav-icon'}
            aria-label="Notifications"
            onClick={() => navigate('/clubs/notifications')}
          >
            <IconBell />
            {showNotificationDot ? <span className="cn-badge" /> : null}
          </button>
          <button
            type="button"
            className="vacancies-nav-avatar"
            aria-label="Profile and my clubs"
            onClick={() => navigate('/clubs/my-memberships')}
          >
            U
          </button>
        </div>
      </div>
    </header>
  )
}
