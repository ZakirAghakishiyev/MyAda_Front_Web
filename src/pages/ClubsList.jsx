import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCategories, fetchClubs } from '../api/clubApi'
import { mapClubFromApi } from '../api/clubMappers'
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

const ClubsList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [apiCategories, setApiCategories] = useState([])
  const [clubs, setClubs] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 24

  const isInactiveClubStatus = useCallback((status) => {
    const v = String(status ?? '').trim().toLowerCase()
    if (!v) return false
    return v === 'inactive' || v === 'archived' || v === '3' || v === 'disabled'
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchCategories()
        const rows = Array.isArray(data) ? data : data?.items ?? []
        if (!cancelled && Array.isArray(rows)) {
          setApiCategories(
            rows.map((row) => ({ id: row.id, name: String(row.name ?? '') })).filter((c) => c.name)
          )
        }
      } catch {
        if (!cancelled) setApiCategories([])
      }
    })()
    return () => { cancelled = true }
  }, [])

  const loadClubs = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const data = await fetchClubs({
        search: search.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        page,
        limit,
      })
      const items = data?.items ?? []
      const mapped = items
        .map((row) => mapClubFromApi(row))
        .filter(Boolean)
        .filter((club) => !isInactiveClubStatus(club.status) && !isInactiveClubStatus(club.raw?.status))
      setClubs((prev) => (page === 1 ? mapped : [...prev, ...mapped]))
      setTotal(Number(data?.total) || items.length)
    } catch (e) {
      setClubs([])
      setTotal(0)
      setListError(e?.message || 'Could not load clubs.')
    } finally {
      setListLoading(false)
    }
  }, [search, category, page, limit])

  useEffect(() => {
    loadClubs()
  }, [loadClubs])

  useEffect(() => {
    setPage(1)
  }, [search, category])

  const filteredClubs = clubs
  const hasMore = page * limit < total

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

        {listError && (
          <p className="clubs-empty" role="alert">
            {listError}
            {' '}
            <button type="button" className="clubs-card-cta" onClick={() => loadClubs()}>
              Retry
            </button>
          </p>
        )}
        {listLoading && page === 1 && !listError && (
          <p className="clubs-empty">Loading clubs…</p>
        )}

        <div className="clubs-grid">
          {!listLoading && !listError && filteredClubs.length === 0 ? (
            <p className="clubs-empty">No clubs match your search.</p>
          ) : null}
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
          ) : null}
        </div>
        {hasMore && !listError && (
          <div className="clubs-search-row" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button
              type="button"
              className="clubs-card-cta"
              disabled={listLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              {listLoading && page > 1 ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClubsList
