import React, { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { mockClubEvents } from '../data/clubEventsData'
import { mockMemberships } from '../data/clubsData'
import adaLogo from '../assets/ada-logo.png'
import './ClubEvents.css'

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
const IconGrid = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
)
const IconList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconChevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13 21a1 1 0 0 1-2 0" />
  </svg>
)
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconPlus = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const CATEGORIES = ['All Events', 'Technology', 'Social', 'Academic', 'Sports', 'Arts']
const CATEGORY_COLORS = {
  Technology: 'ce-tag--tech',
  Social: 'ce-tag--social',
  Academic: 'ce-tag--academic',
  Sports: 'ce-tag--sports',
  Arts: 'ce-tag--arts',
  Business: 'ce-tag--tech'
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

const ClubEvents = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [viewMode, setViewMode] = useState('grid')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Events')
  const [clubFilter, setClubFilter] = useState('all') // 'all' | 'myClubs'

  const myClubIds = useMemo(
    () => new Set(mockMemberships.filter((m) => m.status === 'Active').map((m) => m.clubId)),
    []
  )

  const filteredEvents = useMemo(() => {
    let list = mockClubEvents
    if (clubFilter === 'myClubs') {
      list = list.filter((e) => myClubIds.has(e.clubId))
    }
    if (category !== 'All Events') {
      list = list.filter((e) => e.category.toLowerCase() === category.toLowerCase())
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.clubName.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      )
    }
    return list
  }, [search, category, clubFilter, myClubIds])

  const handleEventClick = (eventId) => {
    navigate(`/clubs/events/${eventId}`)
  }

  const isEventDetail = location.pathname.match(/^\/clubs\/events\/\d+$/)
  if (isEventDetail) return null

  return (
    <div className="ce-page">
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
            <button type="button" className="vacancies-nav-link vacancies-nav-link--active">Events</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs')}>Clubs</button>
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
      <div className="ce-main">
        <header className="ce-header">
          {/* <button type="button" className="ce-back" onClick={() => navigate('/')} aria-label="Back">
            <IconBack />
          </button> */}
          <div className="ce-header-title">
            <h1>Club Events</h1>
            <span className="ce-subtitle">{filteredEvents.length} events discovered</span>
          </div>
          <div className="ce-header-right">
            <div className="ce-search-wrap">
              <span className="ce-search-icon"><IconSearch /></span>
              <input
                type="text"
                className="ce-search-input"
                placeholder="Find an event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search events"
              />
            </div>
            <button
              type="button"
              className="ce-my-registrations-btn"
              onClick={() => navigate('/clubs/events/my-registrations')}
            >
              <IconCalendar />
              My Registrations
            </button>
            {/* <button
              type="button"
              className="ce-icon-btn"
              aria-label="Notifications"
              onClick={() => navigate('/clubs/notifications')}
            >
              <IconBell />
            </button>
            <button
              type="button"
              className="ce-icon-btn ce-profile-btn"
              onClick={() => navigate('/clubs/my-memberships')}
              aria-label="Profile"
            >
              <IconPerson />
            </button> */}
          </div>
        </header>

        <div className="ce-filter-row">
          <div className="ce-club-filter">
            <button
              type="button"
              className={`ce-club-filter-btn ${clubFilter === 'all' ? 'ce-club-filter-btn--active' : ''}`}
              onClick={() => setClubFilter('all')}
            >
              All events
            </button>
            <button
              type="button"
              className={`ce-club-filter-btn ${clubFilter === 'myClubs' ? 'ce-club-filter-btn--active' : ''}`}
              onClick={() => setClubFilter('myClubs')}
            >
              My clubs only
            </button>
          </div>
        </div>
        <div className="ce-tabs-row">
        <div className="ce-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ce-tab ${category === cat ? 'ce-tab--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="ce-view-toggle">
          <button
            type="button"
            className={`ce-view-btn ${viewMode === 'grid' ? 'ce-view-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <IconGrid />
          </button>
          <button
            type="button"
            className={`ce-view-btn ${viewMode === 'list' ? 'ce-view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <IconList />
          </button>
        </div>
        </div>

        <div className={`ce-grid ce-grid--${viewMode}`}>
        {filteredEvents.map((event) => (
          <article
            key={event.id}
            className="ce-card"
            onClick={() => handleEventClick(event.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleEventClick(event.id)}
            role="button"
            tabIndex={0}
          >
            <div
              className="ce-card-media"
              style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
            >
              <span className={`ce-card-tag ${CATEGORY_COLORS[event.category] || 'ce-tag--tech'}`}>
                {event.category.toUpperCase()}
              </span>
            </div>
            <div className="ce-card-body">
              <h2 className="ce-card-title">{event.title}</h2>
              <span className="ce-card-club">{event.clubName}</span>
              <div className="ce-card-meta">
                <span><IconCalendar /> {formatDate(event.date)}</span>
                <span><IconClock /> {formatTime(event.time)}</span>
              </div>
            </div>
            <span className="ce-card-arrow"><IconChevron /></span>
          </article>
        ))}
        <article
          className="ce-card ce-card--host"
          onClick={() => navigate('/club-admin/events/propose')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/club-admin/events/propose')}
          role="button"
          tabIndex={0}
        >
          <div className="ce-card-host-inner">
            <IconPlus />
            <strong>Host an Event</strong>
            <span>Register your club activity</span>
          </div>
        </article>
        </div>

        {filteredEvents.length > 0 && (
          <div className="ce-load-more-wrap">
            <button type="button" className="ce-load-more">
              <span>Load More Events</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
        )}

        <footer className="ce-footer">
          <span className="ce-footer-logo">CampusEvents</span>
          <nav className="ce-footer-nav">
            <button type="button" onClick={() => navigate('/clubs')}>Clubs Directory</button>
            <span>Safety Guidelines</span>
            <span>Contact Support</span>
            <span>Privacy Policy</span>
          </nav>
          <span className="ce-footer-copy">© 2024 University Student Life. All rights reserved.</span>
        </footer>
      </div>
    </div>
  )
}

export default ClubEvents
