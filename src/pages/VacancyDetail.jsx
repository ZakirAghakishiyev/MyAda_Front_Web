import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getVacancyById } from '../data/clubVacanciesData'
import './VacancyDetail.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconBriefcase = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const VacancyDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const vacancy = getVacancyById(id)

  if (!vacancy) {
    return (
      <div className="vacancy-detail-overlay" onClick={() => navigate(-1)}>
        <div className="vacancy-detail-popup" onClick={(e) => e.stopPropagation()}>
          <p>Vacancy not found.</p>
          <button type="button" className="vacancy-detail-back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    )
  }

  const handleApply = () => {
    navigate(`/clubs/vacancies/${id}/apply`)
  }

  return (
    <div
      className="vacancy-detail-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vacancy-detail-title"
    >
      <div className="vacancy-detail-popup" onClick={(e) => e.stopPropagation()}>
        <header className="vacancy-detail-header">
          <button type="button" className="vacancy-detail-back" onClick={() => navigate(-1)} aria-label="Back">
            <IconBack />
          </button>
        </header>

        <div className="vacancy-detail-body">
          <div className="vacancy-detail-hero">
            <div className="vacancy-detail-icon">
              <IconBriefcase />
            </div>
            <span className="vacancy-detail-category">{vacancy.category}</span>
            <h1 id="vacancy-detail-title" className="vacancy-detail-position">{vacancy.position}</h1>
            <p className="vacancy-detail-club">{vacancy.clubName}</p>
          </div>

          <section className="vacancy-detail-section">
            <h2 className="vacancy-detail-section-title">Requirements</h2>
            <ul className="vacancy-detail-requirements">
              {vacancy.requirements.map((req, i) => (
                <li key={i} className="vacancy-detail-requirement">
                  <span className="vacancy-detail-requirement-icon"><IconCheck /></span>
                  {req}
                </li>
              ))}
            </ul>
          </section>

          <div className="vacancy-detail-actions">
            <button type="button" className="vacancy-detail-apply-btn" onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VacancyDetail
