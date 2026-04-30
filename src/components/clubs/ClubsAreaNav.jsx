import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import adaLogo from '../../assets/ada-logo.png'
import '../../pages/ClubVacancies.css'
import { fetchStudentServicesProposalRequirements } from '../../api/clubApi'

function parseDeadlineToDate(deadlineRaw) {
  const s = (deadlineRaw || '').trim()
  if (!s) return null

  // If backend sends an ISO timestamp (e.g. "2026-04-25T08:00:00Z"), Date parses it as UTC and
  // displays it in the user's local timezone when formatting.
  if (s.includes('T')) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // If backend sends an ISO date only (e.g. "2026-05-01"), treat it as end-of-day local time.
  const endOfDay = new Date(`${s}T23:59:59.999`)
  return Number.isNaN(endOfDay.getTime()) ? null : endOfDay
}

function isAfterDeadline(deadlineRaw) {
  const d = parseDeadlineToDate(deadlineRaw)
  if (!d) return false
  return Date.now() > d.getTime()
}

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
 * @param {{ rightSlot?: React.ReactNode }} props
 */
export default function ClubsAreaNav({ rightSlot = null }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = clubsAreaNavActiveSection(pathname)
  const [policyDeadlineRaw, setPolicyDeadlineRaw] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const dto = await fetchStudentServicesProposalRequirements()
        if (cancelled) return
        setPolicyDeadlineRaw(dto?.deadline != null ? String(dto.deadline) : null)
      } catch {
        // If this fails, we keep the tab visible (fallback behavior).
      }
    })()
    return () => { cancelled = true }
  }, [])

  const deadlinePassed = useMemo(() => isAfterDeadline(policyDeadlineRaw), [policyDeadlineRaw])

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
            {!deadlinePassed ? (
              <button type="button" className={tabClass('propose')} onClick={() => navigate('/clubs/propose')}>
                Propose Club
              </button>
            ) : null}
          </nav>
        </div>
        <div className="vacancies-nav-right">
          {rightSlot}
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
