import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchVacancy, submitVacancyApplication } from '../api/clubApi'
import { mapVacancyFromApi } from '../api/clubMappers'
import { getJwtUserId } from '../auth/jwtRoles'
import './ApplyVacancy.css'

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconUpload = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)
const IconDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
)
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconPeople = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconTrophy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M6 9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3M9 22h6M12 22v-6M9 12v3M15 12v3" /><path d="M9 12a3 3 0 0 0 3-3V5h0a3 3 0 0 0-3 3v4z" /><path d="M15 12a3 3 0 0 1-3-3V5h0a3 3 0 0 1 3 3v4z" />
  </svg>
)

function clubApplyErrorMessage(err) {
  const b = err?.body
  if (typeof b === 'string') return b
  if (b && typeof b === 'object') {
    if (b.message) return String(b.message)
    if (b.title) return String(b.title)
    if (b.detail) return String(b.detail)
    if (b.errors && typeof b.errors === 'object') {
      const vals = Object.values(b.errors).flat().filter(Boolean)
      if (vals.length) return String(vals[0])
    }
  }
  return err?.message || 'Application failed.'
}

const ApplyVacancy = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [vacancy, setVacancy] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [purpose, setPurpose] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      try {
        const raw = await fetchVacancy(id)
        if (!cancelled) setVacancy(mapVacancyFromApi(raw))
      } catch (e) {
        if (!cancelled) {
          setVacancy(null)
          setLoadError(e?.message || 'Could not load vacancy.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const purposeTrimmed = purpose.trim()
  const purposeValid = purposeTrimmed.length > 0
  const canSubmit = purposeValid && !submitting

  const handleBack = () => navigate(-1)
  const handleBackToRole = () => navigate(`/clubs/vacancies/${id}`)

  const handleSubmit = async () => {
    if (!canSubmit || !id) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      const fd = new FormData()
      const uid = getJwtUserId()
      if (uid) fd.append('userId', uid)
      fd.append('purposeOfApplication', purposeTrimmed)
      if (cvFile) fd.append('cvFile', cvFile)
      await submitVacancyApplication(id, fd)
      navigate(`/clubs/vacancies/${id}`)
    } catch (e) {
      setSubmitError(clubApplyErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && /\.(pdf|doc|docx)$/i.test(file.name)) setCvFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  if (loadError || !vacancy) {
    return (
      <div className="apply-vacancy-overlay" onClick={() => navigate(-1)}>
        <div className="apply-vacancy-page apply-vacancy-page--narrow" onClick={(e) => e.stopPropagation()}>
          <p>{loadError || 'Vacancy not found.'}</p>
          <button type="button" className="apply-vacancy-back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="apply-vacancy-overlay"
      onClick={(e) => e.target === e.currentTarget && handleBack()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-vacancy-title"
    >
      <div className="apply-vacancy-page" onClick={(e) => e.stopPropagation()}>
        <nav className="apply-vacancy-breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="apply-vacancy-breadcrumb-link" onClick={() => navigate('/clubs/vacancies')}>Home</button>
          <span className="apply-vacancy-breadcrumb-sep">&gt;</span>
          <span className="apply-vacancy-breadcrumb-current">{vacancy.clubName}</span>
          <span className="apply-vacancy-breadcrumb-sep">&gt;</span>
          <span className="apply-vacancy-breadcrumb-current">Apply for {vacancy.position}</span>
        </nav>

        <div className="apply-vacancy-content">
          <h1 id="apply-vacancy-title" className="apply-vacancy-title">Apply for {vacancy.position}</h1>
          <p className="apply-vacancy-role-meta">
            <span className="apply-vacancy-role-club">{vacancy.clubName}</span>
            <span className="apply-vacancy-role-dot">•</span>
            <span>Recruitment Spring 2024</span>
          </p>

          <div className="apply-vacancy-card">
            <div className="apply-vacancy-field">
              <div className="apply-vacancy-field-head">
                <label className="apply-vacancy-label">Purpose of Application</label>
                <span className="apply-vacancy-required-badge">Required</span>
              </div>
              <p className="apply-vacancy-hint">
                Tell us why you&apos;re interested in this role and what makes you a great fit.
              </p>
              <textarea
                className="apply-vacancy-textarea"
                placeholder="I am passionate about..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={6}
                aria-required="true"
              />
              <span className={`apply-vacancy-wordcount ${purposeValid ? 'apply-vacancy-wordcount--ok' : ''}`}>
                Required — non-empty text.
              </span>
            </div>

            {submitError && (
              <p className="apply-vacancy-hint" style={{ color: '#b91c1c' }} role="alert">{submitError}</p>
            )}
            <div className="apply-vacancy-field">
              <div className="apply-vacancy-field-head">
                <label className="apply-vacancy-label">CV / Resume Upload</label>
                <span className="apply-vacancy-required-badge">Optional</span>
              </div>
              <label
                className={`apply-vacancy-upload ${dragOver ? 'apply-vacancy-upload--drag' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                  className="apply-vacancy-upload-input"
                />
                <IconUpload />
                <span className="apply-vacancy-upload-text">Drag and drop your CV here</span>
                <span className="apply-vacancy-upload-browse">or browse your files to upload.</span>
                <span className="apply-vacancy-upload-hint">
                  <IconDoc />
                  PDF, DOC, DOCX
                </span>
                <span className="apply-vacancy-upload-hint">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                  Max 10MB
                </span>
                {cvFile && <span className="apply-vacancy-upload-filename">{cvFile.name}</span>}
              </label>
            </div>

            <div className="apply-vacancy-actions">
              <button
                type="button"
                className="apply-vacancy-btn-submit"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
                <IconArrowRight />
              </button>
              <button type="button" className="apply-vacancy-back-link" onClick={handleBackToRole}>
                Back to Role Details
              </button>
            </div>

            <p className="apply-vacancy-disclaimer">
              All applications are reviewable by the club board members. By clicking submit, you agree to share your profile and resume data.
            </p>
          </div>

          <div className="apply-vacancy-features">
            <div className="apply-vacancy-feature">
              <span className="apply-vacancy-feature-icon"><IconCheck /></span>
              <h3 className="apply-vacancy-feature-title">Portfolio Building</h3>
              <p className="apply-vacancy-feature-desc">Showcase your work to a university-wide audience.</p>
            </div>
            <div className="apply-vacancy-feature">
              <span className="apply-vacancy-feature-icon"><IconPeople /></span>
              <h3 className="apply-vacancy-feature-title">Networking</h3>
              <p className="apply-vacancy-feature-desc">Connect with industry mentors and media pros.</p>
            </div>
            <div className="apply-vacancy-feature">
              <span className="apply-vacancy-feature-icon"><IconTrophy /></span>
              <h3 className="apply-vacancy-feature-title">Leadership Credits</h3>
              <p className="apply-vacancy-feature-desc">Earn official co-curricular leadership recognition.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ApplyVacancy
