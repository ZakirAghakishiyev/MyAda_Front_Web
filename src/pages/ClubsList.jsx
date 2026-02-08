import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockClubs } from '../data/clubsData'
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

const CATEGORIES = ['All', 'Technology', 'Arts', 'Business', 'Academic', 'Sports']
const STATUSES = ['All Status', 'Open', 'Closed', 'Paused', 'Disabled', 'By Invitation']

const ClubsList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All Status')

  const filteredClubs = useMemo(() => {
    let list = mockClubs
    if (category !== 'All') list = list.filter((c) => c.category === category)
    if (statusFilter !== 'All Status') list = list.filter((c) => c.status === statusFilter)
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
  }, [search, category, statusFilter])

  return (
    <div className="clubs-page">
      <header className="clubs-header">
        <button type="button" className="clubs-back" onClick={() => navigate('/')} aria-label="Back">
          <IconBack />
        </button>
        <div className="clubs-header-title">
          <h1>Club Management</h1>
          <span className="clubs-subtitle">{filteredClubs.length} clubs available</span>
        </div>
        <button
          type="button"
          className="clubs-propose-btn"
          onClick={() => navigate('/clubs/propose')}
        >
          Propose a Club
        </button>
        <button
          type="button"
          className="clubs-vacancies-btn"
          onClick={() => navigate('/clubs/vacancies')}
        >
          Club Vacancies
        </button>
        <button
          type="button"
          className="clubs-profile-btn"
          onClick={() => navigate('/clubs/my-memberships')}
          aria-label="My Memberships"
        >
          <IconPerson />
        </button>
      </header>

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
          {CATEGORIES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <select
          className="clubs-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Status"
        >
          {STATUSES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
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
              <div className="clubs-card-image" />
              <div className="clubs-card-body">
                <h2 className="clubs-card-name">{club.name}</h2>
                <span className="clubs-card-category">{club.category}</span>
                <div className="clubs-card-meta">
                  <span className="clubs-card-members">
                    <IconPerson />
                    {club.members}
                  </span>
                  <span className={`clubs-card-status clubs-card-status--${club.status.toLowerCase()}`}>
                    {club.status}
                  </span>
                </div>
              </div>
              <span className="clubs-card-arrow"><IconChevron /></span>
            </article>
          ))
        ) : (
          <p className="clubs-empty">No clubs match your search.</p>
        )}
      </div>
    </div>
  )
}

export default ClubsList
