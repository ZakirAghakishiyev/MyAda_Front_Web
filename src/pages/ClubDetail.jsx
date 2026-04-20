import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchClub, fetchClubMembers, fetchEvents, fetchMyClubMemberships } from '../api/clubApi'
import { mapClubFromApi, mapEventFromApi } from '../api/clubMappers'
import adaLogo from '../assets/ada-logo.png'
import inClassTaskPdf from '../assets/In-Class Task.pdf'
import './ClubVacancies.css'
import './ClubDetail.css'

const IconPerson = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)
const IconYouTube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 12s0-3.25-.42-4.81a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.5 2.5 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77C22 15.25 22 12 22 12z" />
    <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
  </svg>
)
const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37a4 4 0 1 1-3.37-3.37 4 4 0 0 1 3.37 3.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
)
const IconTikTok = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3v10.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c1.2 2 2.8 3 5 3" />
  </svg>
)
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconChip = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="15" x2="15" y2="15" /><line x1="9" y1="9" x2="9" y2="15" /><line x1="15" y1="9" x2="15" y2="15" />
  </svg>
)
const IconCode = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
)

const TABS = [
  { id: 'about', label: 'About Us' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'members', label: 'Members' },
  { id: 'resources', label: 'Resources' }
]

const formatEventDate = (dateStr) => {
  if (!dateStr) return { month: '', day: '' }
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = d.getDate()
  return { month, day }
}

const ClubDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('about')
  const [club, setClub] = useState(null)
  const [memberRows, setMemberRows] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loadState, setLoadState] = useState({ loading: true, error: null })
  const [isClubMember, setIsClubMember] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      setLoadState({ loading: true, error: null })
      try {
        const [rawClub, rawMembers, rawEvents, myMemberships] = await Promise.all([
          fetchClub(id),
          fetchClubMembers(id).catch(() => ({ items: [] })),
          fetchEvents({ limit: 48 }).catch(() => ({ items: [] })),
          fetchMyClubMemberships().catch(() => ({ items: [] })),
        ])
        if (cancelled) return
        const mapped = mapClubFromApi(rawClub)
        setClub(
          mapped || {
            id: String(id),
            name: 'Club',
            category: '',
            image: null,
            tags: [],
            members: 0,
            about: '',
            officers: [],
            announcements: [],
            email: 'clubs@ada.edu.az',
          }
        )
        const mItems = rawMembers?.items ?? rawMembers ?? []
        setMemberRows(Array.isArray(mItems) ? mItems : [])
        const evItems = (rawEvents?.items ?? []).map((row) => mapEventFromApi(row)).filter(Boolean)
        const sid = String(id)
        const filtered = evItems.filter(
          (e) =>
            String(e.clubId) === sid ||
            (mapped?.name && e.clubName && e.clubName === mapped.name)
        )
        setUpcomingEvents((filtered.length ? filtered : evItems).slice(0, 6))
        const memList = myMemberships?.items ?? myMemberships ?? []
        const active = Array.isArray(memList) && memList.some((m) => {
          const cid = m.clubId ?? m.club?.id ?? m.id
          const st = (m.status ?? m.membershipStatus ?? '').toString().toLowerCase()
          return String(cid) === sid && (!st || st === 'active' || st === 'approved')
        })
        setIsClubMember(Boolean(active))
        setLoadState({ loading: false, error: null })
      } catch (e) {
        if (!cancelled) {
          setClub(null)
          setLoadState({ loading: false, error: e?.message || 'Failed to load club.' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const focusAreas = useMemo(() => {
    const raw = club?.focusAreas || []
    return raw.map((area, i) =>
      typeof area === 'string'
        ? { title: area, description: '' }
        : { title: area.title ?? area.name ?? `Area ${i + 1}`, description: area.description ?? '' }
    )
  }, [club])

  const members = useMemo(() => {
    if (!club) return []
    if (memberRows.length > 0) {
      return memberRows.map((m, index) => ({
        name: m.name ?? m.fullName ?? m.studentName ?? `Member ${index + 1}`,
        role: m.role ?? m.position ?? 'Member',
        department: m.department ?? m.program ?? club.category,
      }))
    }
    const offs = Array.isArray(club.officers) ? club.officers : []
    if (offs.length === 0) {
      return [
        { name: 'Members', role: 'Roster', department: 'See club officers when available' },
      ]
    }
    return offs.map((officer) => ({
      name: officer.name ?? officer.studentName ?? 'Officer',
      role: officer.role ?? officer.title ?? '',
      department: club.category,
    }))
  }, [club, memberRows])

  const officersList = useMemo(() => {
    if (!club) return []
    const offs = Array.isArray(club.officers) ? club.officers : []
    if (offs.length) {
      return offs.map((o) => ({
        name: o.name ?? o.studentName ?? '—',
        role: o.role ?? o.title ?? '',
      }))
    }
    return [{ name: 'TBD', role: 'President' }]
  }, [club])

  if (loadState.loading) {
    return (
      <div className="club-detail-page club-detail-page--not-found">
        <div className="club-detail-container">
          <p>Loading club…</p>
        </div>
      </div>
    )
  }

  if (loadState.error || !club) {
    return (
      <div className="club-detail-page club-detail-page--not-found">
        <div className="club-detail-container">
          <p>{loadState.error || 'Club not found.'}</p>
          <button type="button" className="club-detail-btn-primary" onClick={() => navigate('/clubs')}>
            Back to Clubs
          </button>
        </div>
      </div>
    )
  }

  const announcements = club.announcements || []

  return (
    <div className="club-detail-page">
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
            <button type="button" className="vacancies-nav-link vacancies-nav-link--active">Clubs</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/propose')}>Propose Club</button>
          </nav>
        </div>
        <div className="vacancies-nav-right">
          <button
            type="button"
            className="vacancies-nav-icon"
            aria-label="Notifications"
            onClick={() => navigate('/clubs/notifications')}
          >
            <IconBell />
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

      {/* Hero with banner and floating card */}
      <section className="club-detail-hero">
        <div
          className="club-detail-hero-banner"
          style={{ backgroundImage: club.image ? `url(${club.image})` : undefined }}
        />
        <div className="club-detail-hero-card">
          <div className="club-detail-hero-card-logo" style={{ backgroundImage: club.image ? `url(${club.image})` : undefined }} />
          <div className="club-detail-hero-card-info">
            <h1 className="club-detail-hero-title">{club.name}</h1>
            <span className="club-detail-hero-tag">{club.category}</span>
            <div className="club-detail-hero-stats">
              <span><IconPerson /> {club.members} Members</span>
              {club.establishedYear && <span>Est. {club.establishedYear}</span>}
              {club.location && <span>{club.location}</span>}
            </div>
          </div>
          <div className="club-detail-hero-actions">
            <button type="button" className="club-detail-btn-primary" onClick={() => navigate(`/clubs/${id}/join`)}>
              <IconPlus /> Join Club
            </button>
          </div>
        </div>
      </section>

      <div className="club-detail-layout">
        <main className="club-detail-main">
          <div className="club-detail-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`club-detail-tab ${activeTab === tab.id ? 'club-detail-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'about' && (
            <div className="club-detail-content">
              <section className="club-detail-section">
                <h2 className="club-detail-section-title">Our Mission</h2>
                <p className="club-detail-mission">{club.about}</p>
              </section>

              {focusAreas.length > 0 && (
                <section className="club-detail-section">
                  <h2 className="club-detail-section-title">Key Focus Areas</h2>
                  <div className="club-detail-focus-grid">
                    {focusAreas.map((area, i) => (
                      <div key={i} className="club-detail-focus-card">
                        <span className="club-detail-focus-icon">{i === 0 ? <IconChip /> : <IconCode />}</span>
                        <h3 className="club-detail-focus-title">{area.title}</h3>
                        <p className="club-detail-focus-desc">{area.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="club-detail-section">
                <div className="club-detail-section-head">
                  <h2 className="club-detail-section-title">Recent Activities</h2>
                  <Link to={`/clubs/events?club=${club.id}`} className="club-detail-link">View All</Link>
                </div>
                <div className="club-detail-activities-grid">
                  {upcomingEvents.slice(0, 2).map((ev) => (
                    <Link key={ev.id} to={`/clubs/events/${ev.id}`} className="club-detail-activity-card">
                      <div className="club-detail-activity-img" style={{ backgroundImage: club.image ? `url(${club.image})` : undefined }} />
                      <span className="club-detail-activity-title">{ev.title}</span>
                    </Link>
                  ))}
                  {upcomingEvents.length < 2 && (
                    <div className="club-detail-activity-card club-detail-activity-card--placeholder">
                      <div className="club-detail-activity-img" style={{ backgroundImage: club.image ? `url(${club.image})` : undefined }} />
                      <span className="club-detail-activity-title">More activities coming soon</span>
                    </div>
                  )}
                </div>
              </section>

            </div>
          )}

          {activeTab === 'members' && (
            <div className="club-detail-content">
              <section className="club-detail-section">
                <h2 className="club-detail-section-title">Club Members</h2>
                <ul className="club-detail-members-list">
                  {members.map((member, index) => (
                    <li key={`${member.name}-${index}`} className="club-detail-member-item">
                      <span className="club-detail-member-avatar" />
                      <div>
                        <span className="club-detail-member-name">{member.name}</span>
                        <span className="club-detail-member-meta">
                          {member.role}{member.department ? ` · ${member.department}` : ''}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="club-detail-content">
              {isClubMember ? (
                <section className="club-detail-section">
                  <h2 className="club-detail-section-title">Club Announcements</h2>
                  {announcements.length > 0 ? (
                    <ul className="club-detail-announcements-list">
                      {announcements.map((announcement, index) => (
                        <li key={`${announcement.title}-${index}`} className="club-detail-announcement-item">
                          <span className="club-detail-announcement-date">{announcement.date}</span>
                          <h3 className="club-detail-announcement-title">{announcement.title}</h3>
                          <p className="club-detail-announcement-text">{announcement.message}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="club-detail-placeholder">No announcements yet.</p>
                  )}
                </section>
              ) : (
                <section className="club-detail-section">
                  <h2 className="club-detail-section-title">Club Announcements</h2>
                  <p className="club-detail-placeholder">Announcements are visible only to club members.</p>
                </section>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="club-detail-content">
              <section className="club-detail-section">
                <h2 className="club-detail-section-title">Resources and documents</h2>
                <a
                  href={inClassTaskPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="club-detail-resource-link"
                >
                  In-Class Task.pdf
                </a>
              </section>
            </div>
          )}
        </main>

        <aside className="club-detail-sidebar">
          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Club Officers</h3>
            <ul className="club-detail-officers">
              {officersList.map((o, i) => (
                <li key={i} className="club-detail-officer">
                  <span className="club-detail-officer-avatar" />
                  <div>
                    <span className="club-detail-officer-name">{o.name}</span>
                    <span className="club-detail-officer-role">{o.role}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Upcoming Events</h3>
            <ul className="club-detail-events">
              {upcomingEvents.map((ev) => {
                const { month, day } = formatEventDate(ev.date)
                return (
                  <li key={ev.id} className="club-detail-event">
                    <div className="club-detail-event-date">
                      <span className="club-detail-event-month">{month}</span>
                      <span className="club-detail-event-day">{day}</span>
                    </div>
                    <div className="club-detail-event-info">
                      <Link to={`/clubs/events/${ev.id}`} className="club-detail-event-title">{ev.title}</Link>
                      <span className="club-detail-event-meta">{ev.time} · {ev.location}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Link to={`/clubs/events?club=${club.id}`} className="club-detail-btn-outline">View Upcoming Events</Link>
          </section>

          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Contact & Links</h3>
            <div className="club-detail-contact">
              <a href={`mailto:${club.email}`} className="club-detail-contact-row">
                <IconMail /> {club.email}
              </a>
              {club.website && (
                <a href={club.website} target="_blank" rel="noopener noreferrer" className="club-detail-contact-row">
                  <IconYouTube /> {club.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <a href={club.instagram || 'https://instagram.com'} target="_blank" rel="noopener noreferrer" className="club-detail-contact-row">
                <IconInstagram /> Instagram
              </a>
              <a href={club.x || 'https://x.com'} target="_blank" rel="noopener noreferrer" className="club-detail-contact-row">
                <IconX /> X (Twitter)
              </a>
              <a href={club.tiktok || 'https://tiktok.com'} target="_blank" rel="noopener noreferrer" className="club-detail-contact-row">
                <IconTikTok /> TikTok
              </a>
            </div>
          </section>
        </aside>
      </div>

      <footer className="club-detail-footer">
        <div className="club-detail-footer-inner">
          <Link to="/" className="club-detail-nav-logo">CampusConnect</Link>
          <nav className="club-detail-footer-links">
            <a href="#help">Help Center</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#guidelines">University Guidelines</a>
          </nav>
          <span className="club-detail-footer-copy">© {new Date().getFullYear()} CampusConnect University Platforms.</span>
        </div>
      </footer>
    </div>
  )
}

export default ClubDetail
