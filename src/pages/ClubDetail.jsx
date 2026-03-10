import React, { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getClubById } from '../data/clubsData'
import { getEventsByClubId } from '../data/clubEventsData'
import adaLogo from '../assets/ada-logo.png'
import './ClubVacancies.css'
import './ClubDetail.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
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
const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
const IconQuote = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" opacity="0.3" />
  </svg>
)
const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const TABS = [
  { id: 'about', label: 'About Us' },
  { id: 'activities', label: 'Activities' },
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
  const club = getClubById(id)
  const [activeTab, setActiveTab] = useState('about')
  const upcomingEvents = club ? getEventsByClubId(club.id).slice(0, 3) : []

  if (!club) {
    return (
      <div className="club-detail-page club-detail-page--not-found">
        <div className="club-detail-container">
          <p>Club not found.</p>
          <button type="button" className="club-detail-btn-primary" onClick={() => navigate('/clubs')}>
            Back to Clubs
          </button>
        </div>
      </div>
    )
  }

  const focusAreas = club.focusAreas || []
  const testimonials = club.testimonials || []

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
            <button type="button" className="club-detail-btn-secondary">
              <IconStar /> Follow
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

              {testimonials.length > 0 && (
                <section className="club-detail-section">
                  <h2 className="club-detail-section-title">Member Testimonials</h2>
                  <div className="club-detail-testimonial">
                    <span className="club-detail-testimonial-quote-icon"><IconQuote /></span>
                    <p className="club-detail-testimonial-text">"{testimonials[0].quote}"</p>
                    <div className="club-detail-testimonial-author">
                      <span className="club-detail-testimonial-avatar" />
                      <div>
                        <strong>{testimonials[0].authorName}</strong>
                        <span>{testimonials[0].authorRole}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="club-detail-content">
              <p className="club-detail-placeholder">Activities and events for this club.</p>
              <Link to={`/clubs/events?club=${club.id}`} className="club-detail-btn-primary">View events</Link>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="club-detail-content">
              <p className="club-detail-placeholder">Member list and roles.</p>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="club-detail-content">
              <p className="club-detail-placeholder">Resources and documents.</p>
            </div>
          )}
        </main>

        <aside className="club-detail-sidebar">
          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Club Officers</h3>
            <ul className="club-detail-officers">
              {club.officers.map((o, i) => (
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
            <Link to={`/clubs/events?club=${club.id}`} className="club-detail-btn-outline">View Full Calendar</Link>
          </section>

          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Contact & Links</h3>
            <div className="club-detail-contact">
              <a href={`mailto:${club.email}`} className="club-detail-contact-row">
                <IconMail /> {club.email}
              </a>
              {club.website && (
                <a href={club.website} target="_blank" rel="noopener noreferrer" className="club-detail-contact-row">
                  <IconGlobe /> {club.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            <div className="club-detail-share">
              <button type="button" className="club-detail-nav-icon" aria-label="Share"><IconShare /></button>
            </div>
            <button type="button" className="club-detail-btn-primary club-detail-btn-full">Message Admin</button>
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
