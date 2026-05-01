import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchVacancy, fetchClubPositionRequirements } from '../api/clubApi'
import { mapVacancyFromApi } from '../api/clubMappers'
import { getSavedVacancyIds, setSavedVacancyIds } from '../utils/savedVacanciesCookie'
import './VacancyDetail.css'

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconBookmark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

function IconChart () {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
}
function IconCertificate () {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><path d="M12 22c-4 0-6-2-6-6V6a4 4 0 0 1 8 0v10c0 4-2 6-6 6z" /></svg>
}
function IconNetwork () {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function IconPalette () {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.1 2.5-.3" /></svg>
}
const BenefitIcons = { chart: IconChart, certificate: IconCertificate, network: IconNetwork, palette: IconPalette }

const VacancyDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [vacancy, setVacancy] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const vacancyId = vacancy ? vacancy.id : null
  const [saved, setSaved] = useState(() => (vacancyId != null ? getSavedVacancyIds().includes(vacancyId) : false))

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      try {
        const raw = await fetchVacancy(id)
        if (cancelled) return
        setVacancy(mapVacancyFromApi(raw))
        setLoadError(null)
      } catch (e) {
        if (!cancelled) {
          setVacancy(null)
          const status = e?.status || e?.response?.status
          if (status === 404) setLoadError('Vacancy not found.')
          else setLoadError(e?.message || 'Failed to load vacancy.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!vacancy?.positionId) return
      if (Array.isArray(vacancy.requirements) && vacancy.requirements.length > 0) return
      try {
        const reqs = await fetchClubPositionRequirements(vacancy.positionId)
        if (cancelled) return
        if (!reqs || reqs.length === 0) return
        setVacancy((prev) => {
          if (!prev) return prev
          if (Array.isArray(prev.requirements) && prev.requirements.length > 0) return prev
          return { ...prev, requirements: reqs }
        })
      } catch {
        /* optional enrichment only */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vacancy?.positionId, vacancy?.requirements])

  useEffect(() => {
    if (vacancyId == null) return
    setSaved(getSavedVacancyIds().includes(vacancyId))
  }, [vacancyId])

  if (loadError || !vacancy) {
    return (
      <div className="vacancy-detail-overlay" onClick={() => navigate(-1)}>
        <div className="vacancy-detail-page vacancy-detail-page--narrow" onClick={(e) => e.stopPropagation()}>
          <p>{loadError || 'Vacancy not found.'}</p>
          <button type="button" className="vacancy-detail-back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    )
  }

  const handleApply = () => navigate(`/clubs/vacancies/${id}/apply`)
  const handleBack = () => navigate('/clubs/vacancies')

  const benefits = vacancy.benefits || [
    { text: 'Hands-on experience.', icon: 'chart' },
    { text: 'Certificate of contribution.', icon: 'certificate' },
    { text: 'Networking opportunities.', icon: 'network' },
    { text: 'Creative freedom.', icon: 'palette' }
  ]

  return (
    <div
      className="vacancy-detail-overlay"
      onClick={(e) => e.target === e.currentTarget && handleBack()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vacancy-detail-title"
    >
      <div className="vacancy-detail-page" onClick={(e) => e.stopPropagation()}>
        <nav className="vacancy-detail-breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="vacancy-detail-breadcrumb-link" onClick={() => navigate('/clubs/vacancies')}>Recruitment</button>
          <span className="vacancy-detail-breadcrumb-sep">&gt;</span>
          <span className="vacancy-detail-breadcrumb-link vacancy-detail-breadcrumb-link--current">{vacancy.clubName}</span>
          <span className="vacancy-detail-breadcrumb-sep">&gt;</span>
          <span className="vacancy-detail-breadcrumb-link vacancy-detail-breadcrumb-link--current">{vacancy.position}</span>
        </nav>

        <div className="vacancy-detail-hero-banner">
          <div className="vacancy-detail-hero-card">
            <div className="vacancy-detail-hero-tags">
              <span className="vacancy-detail-hero-tag vacancy-detail-hero-tag--fill">{vacancy.employmentType || 'Part-time'}</span>
              <span className="vacancy-detail-hero-tag vacancy-detail-hero-tag--outline">{vacancy.location || 'On-campus'}</span>
            </div>
            <div className="vacancy-detail-hero-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4" />
              </svg>
            </div>
            <h1 id="vacancy-detail-title" className="vacancy-detail-hero-title">{vacancy.position}</h1>
            <p className="vacancy-detail-hero-club">{vacancy.clubName}</p>
          </div>
        </div>

        <div className="vacancy-detail-main">
          <div className="vacancy-detail-column vacancy-detail-column--left">
            <section className="vacancy-detail-section">
              <h2 className="vacancy-detail-section-title">
                <IconDoc />
                About the Role
              </h2>
              {(vacancy.aboutRole || []).map((p, i) => (
                <p key={i} className="vacancy-detail-about-p">{p}</p>
              ))}
              {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
                <ul className="vacancy-detail-responsibilities">
                  {vacancy.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </section>
            <section className="vacancy-detail-section">
              <h2 className="vacancy-detail-section-title">What You&apos;ll Gain</h2>
              <div className="vacancy-detail-benefits">
                {benefits.map((b, i) => {
                  const Icon = BenefitIcons[b.icon] || IconChart
                  return (
                    <div key={i} className="vacancy-detail-benefit">
                      <span className="vacancy-detail-benefit-icon"><Icon /></span>
                      <span>{b.text}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
          <div className="vacancy-detail-column vacancy-detail-column--right">
            <section className="vacancy-detail-section">
              <h2 className="vacancy-detail-section-title">
                <IconDoc />
                Requirements
              </h2>
              <ul className="vacancy-detail-requirements">
                {(vacancy.requirements || []).map((req, i) => (
                  <li key={i} className="vacancy-detail-requirement">
                    <span className="vacancy-detail-requirement-icon"><IconCheck /></span>
                    {req}
                  </li>
                ))}
              </ul>
            </section>
            <div className="vacancy-detail-application-details">
              <p><strong>Deadline:</strong> <span>{vacancy.deadline || '—'}</span></p>
              {vacancy.applicants != null && vacancy.applicants !== '' ? (
                <p><strong>Applicants:</strong> <span>{vacancy.applicants}</span></p>
              ) : null}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default VacancyDetail
