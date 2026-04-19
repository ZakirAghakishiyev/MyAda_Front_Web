import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockClubs } from '../data/clubsData'
import adaLogo from '../assets/ada-logo.png'
import './ClubsList.css'

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
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconChevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const CLUB_CATEGORIES_URL =
  import.meta.env.VITE_CLUB_CATEGORIES_URL ?? 'http://13.60.31.141:5000/club/api/v1/categories'

const ClubsList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [apiCategories, setApiCategories] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(CLUB_CATEGORIES_URL)
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) {
          setApiCategories(data.map((row) => ({ id: row.id, name: String(row.name ?? '') })).filter((c) => c.name))
        }
      } catch {
        if (!cancelled) setApiCategories([])
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filteredClubs = useMemo(() => {
    let list = mockClubs
    if (category !== 'All') list = list.filter((c) => c.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [search, category])

  return (
    <div className="clubs-page">
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
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/my-memberships')}>My Clubs</button>
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
      <div className="clubs-main">
        <div className="clubs-search-row">
          <div className="clubs-search-wrap">
            <span className="clubs-search-icon"><IconSearch /></span>
            <input
              type="text"
              className="clubs-search-input"
              placeholder="Search clubs, categories, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search clubs"
            />
          </div>
          <button type="button" className="clubs-grid-btn" aria-label="Grid view" title="Grid view">
            <IconGrid />
          </button>
        </div>

        <div className="clubs-filters">
          <select
            className="clubs-filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
          >
            <option value="All">All categories</option>
            {apiCategories.map((opt) => (
              <option key={opt.id} value={opt.name}>{opt.name}</option>
            ))}
          </select>
        </div>

        <div className="clubs-grid">
          {filteredClubs.length > 0 ? (
            filteredClubs.map((club) => (
              <article
                key={club.id}
                className="clubs-card"
                onClick={() => navigate(`/clubs/${club.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/clubs/${club.id}`)}
                role="button"
                tabIndex={0}
              >
                <div
                  className="clubs-card-media"
                  style={club.image ? { backgroundImage: `url(${club.image})` } : undefined}
                >
                  <span className="clubs-card-tag">{club.category}</span>
                </div>
                <div className="clubs-card-body">
                  <h2 className="clubs-card-name">{club.name}</h2>
                  <p className="clubs-card-description">{club.about}</p>
                  <div className="clubs-card-footer">
                    <span className="clubs-card-members">
                      <IconPerson />
                      {club.members} members
                    </span>
                    <button
                      type="button"
                      className="clubs-card-cta"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/clubs/${club.id}`)
                      }}
                    >
                      View Details
                      <span className="clubs-card-cta-icon">
                        <IconChevron />
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="clubs-empty">No clubs match your search.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClubsList
