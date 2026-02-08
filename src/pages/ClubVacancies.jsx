import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockVacancies } from '../data/clubVacanciesData'
import './ClubVacancies.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
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
const IconBriefcase = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const ClubVacancies = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const handleVacancyClick = (vacancyId) => {
    navigate(`/clubs/vacancies/${vacancyId}`)
  }

  return (
    <div className="vacancies-page">
      <header className="vacancies-header">
        <button type="button" className="vacancies-back" onClick={() => navigate(-1)} aria-label="Back">
          <IconBack />
        </button>
        <div className="vacancies-header-title">
          <h1>Club Vacancies</h1>
          <span className="vacancies-subtitle">{mockVacancies.length} positions available</span>
        </div>
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
      </header>

      <div className={`vacancies-container vacancies-container--${viewMode}`}>
        {mockVacancies.map((vacancy) => (
          <article
            key={vacancy.id}
            className="vacancy-card"
            onClick={() => handleVacancyClick(vacancy.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleVacancyClick(vacancy.id)}
            role="button"
            tabIndex={0}
          >
            <div className="vacancy-card-icon">
              <IconBriefcase />
            </div>
            <div className="vacancy-card-body">
              <h2 className="vacancy-card-position">{vacancy.position}</h2>
              <span className="vacancy-card-club">{vacancy.clubName}</span>
              <span className="vacancy-card-category">{vacancy.category}</span>
            </div>
            <span className="vacancy-card-arrow"><IconChevron /></span>
          </article>
        ))}
      </div>
    </div>
  )
}

export default ClubVacancies
