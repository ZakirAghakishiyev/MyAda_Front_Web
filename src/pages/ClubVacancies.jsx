import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockVacancies } from '../data/clubVacanciesData'
import adaLogo from '../assets/ada-logo.png'
import './ClubVacancies.css'

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconChevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconGraduation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const CATEGORY_ICONS = {
  Technology: { color: '#3b82f6', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="14" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /></svg> },
  Marketing: { color: '#f97316', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a2 2 0 0 1-2.2-3.2L15 9" /></svg> },
  Finance: { color: '#22c55e', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8M8 12h8" /></svg> },
  Media: { color: '#ec4899', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="8" cy="8" r="2" /><path d="M22 16l-5-5L5 22" /></svg> },
  Engineering: { color: '#8b5cf6', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
  Arts: { color: '#ef4444', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /></svg> },
  Business: { color: '#22c55e', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8M8 12h8" /></svg> },
  Academic: { color: '#6366f1', Icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /></svg> }
}

const getCategoryStyle = (category) => CATEGORY_ICONS[category] || CATEGORY_ICONS.Technology

const POSITIONS_PER_PAGE = 6
const TOTAL_PAGES = Math.ceil(mockVacancies.length / POSITIONS_PER_PAGE) || 1

const ClubVacancies = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('grid')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const categories = useMemo(() => {
    const set = new Set(mockVacancies.map((v) => v.categoryTag || v.category.toUpperCase()))
    return Array.from(set).sort()
  }, [])

  const filteredVacancies = useMemo(() => {
    let list = mockVacancies
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (v) =>
          v.position.toLowerCase().includes(q) ||
          v.clubName.toLowerCase().includes(q) ||
          (v.categoryTag || v.category).toLowerCase().includes(q)
      )
    }
    if (categoryFilter) {
      list = list.filter((v) => (v.categoryTag || v.category.toUpperCase()) === categoryFilter)
    }
    return list
  }, [search, categoryFilter])

  const paginatedVacancies = useMemo(() => {
    const start = (currentPage - 1) * POSITIONS_PER_PAGE
    return filteredVacancies.slice(start, start + POSITIONS_PER_PAGE)
  }, [filteredVacancies, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredVacancies.length / POSITIONS_PER_PAGE))

  const handleVacancyClick = (vacancyId) => {
    navigate(`/clubs/vacancies/${vacancyId}`)
  }

  return (
    <div className="vacancies-page">
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
            <button type="button" className="vacancies-nav-link vacancies-nav-link--active">Vacancies</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/vacancies/my-applications')}>My Applications</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/events')}>Events</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs')}>Clubs</button>
            <button type="button" className="vacancies-nav-link" onClick={() => navigate('/clubs/propose')}>Propose Club</button>
          </nav>
        </div>
        <div className="vacancies-nav-right">
          <div className="vacancies-nav-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search roles or clubs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search roles or clubs"
            />
          </div>
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

      <div className="vacancies-content">
        {/* <a href="/clubs" className="vacancies-back-link" onClick={(e) => { e.preventDefault(); navigate('/clubs') }}>
          <IconBack />
          Back to Dashboard
        </a> */}

        <div className="vacancies-header">
          <div className="vacancies-header-title">
            <h1>Club Vacancies</h1>
            <span className="vacancies-subtitle">{filteredVacancies.length} positions available for your profile</span>
          </div>
          <div className="vacancies-header-actions">
            {/* <button
              type="button"
              className="vacancies-my-applications-btn"
              onClick={() => navigate('/clubs/vacancies/my-applications')}
            >
              My Applications
            </button> */}
            <div className="vacancies-view-toggle">
              <button
                type="button"
                className={`vacancies-view-btn ${viewMode === 'grid' ? 'vacancies-view-btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid view"
              >
                <IconGrid />
              </button>
              <button
                type="button"
                className={`vacancies-view-btn ${viewMode === 'list' ? 'vacancies-view-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
              >
                <IconList />
              </button>
            </div>
            <div className="vacancies-filter-wrap">
              <button
                type="button"
                className="vacancies-filter-btn"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-haspopup="true"
              >
                <IconFilter />
                Filter
              </button>
              {filterOpen && (
                <div className="vacancies-filter-dropdown">
                  <p className="vacancies-filter-label">Category</p>
                  {categories.map((cat) => (
                    <label key={cat} className="vacancies-filter-option">
                      <input
                        type="radio"
                        name="category"
                        checked={categoryFilter === cat}
                        onChange={() => { setCategoryFilter(categoryFilter === cat ? '' : cat); setFilterOpen(false) }}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                  {categoryFilter && (
                    <button type="button" className="vacancies-filter-clear" onClick={() => setCategoryFilter('')}>
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`vacancies-container vacancies-container--${viewMode}`}>
          {paginatedVacancies.map((vacancy) => {
            const style = getCategoryStyle(vacancy.category)
            const Tag = style.Icon
            return (
              <article
                key={vacancy.id}
                className="vacancy-card"
                onClick={() => handleVacancyClick(vacancy.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleVacancyClick(vacancy.id)}
                role="button"
                tabIndex={0}
              >
                <div className="vacancy-card-top">
                  <div className="vacancy-card-icon" style={{ backgroundColor: `${style.color}20`, color: style.color }}>
                    <Tag />
                  </div>
                  <span className="vacancy-card-tag">{vacancy.categoryTag || vacancy.category}</span>
                </div>
                <div className="vacancy-card-body">
                  <h2 className="vacancy-card-position">{vacancy.position}</h2>
                  <span className="vacancy-card-club">{vacancy.clubName}</span>
                </div>
                <div className="vacancy-card-meta">
                  <span className="vacancy-card-posted">
                    <IconClock />
                    Posted {vacancy.postedAt || 'recently'}
                  </span>
                  <span className="vacancy-card-arrow"><IconChevron /></span>
                </div>
              </article>
            )
          })}
        </div>

        {totalPages > 1 && (
          <nav className="vacancies-pagination" aria-label="Pagination">
            <button
              type="button"
              className="vacancies-pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`vacancies-pagination-btn vacancies-pagination-btn--num ${currentPage === p ? 'vacancies-pagination-btn--active' : ''}`}
                onClick={() => setCurrentPage(p)}
                aria-label={`Page ${p}`}
                aria-current={currentPage === p ? 'page' : undefined}
              >
                {p}
              </button>
            ))}
            {totalPages > 3 && <span className="vacancies-pagination-ellipsis">...</span>}
            {totalPages > 3 && (
              <button
                type="button"
                className="vacancies-pagination-btn vacancies-pagination-btn--num"
                onClick={() => setCurrentPage(totalPages)}
                aria-label={`Page ${totalPages}`}
              >
                {totalPages}
              </button>
            )}
            <button
              type="button"
              className="vacancies-pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              &gt;
            </button>
          </nav>
        )}
      </div>

      <footer className="vacancies-footer">
        <div className="vacancies-footer-left">
          <IconGraduation />
          <span>© 2024 University Recruitment Portal. All rights reserved.</span>
        </div>
        <div className="vacancies-footer-right">
          <a href="/">Privacy Policy</a>
          <a href="/">Terms of Service</a>
          <a href="/">Help Center</a>
        </div>
      </footer>
    </div>
  )
}

export default ClubVacancies
