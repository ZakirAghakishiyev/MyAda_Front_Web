import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getVacancyById } from '../data/clubVacanciesData'
import './ApplyVacancy.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconUploadDoc = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
)

const ApplyVacancy = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const vacancy = getVacancyById(id)

  const [purpose, setPurpose] = useState('')
  const [cvFile, setCvFile] = useState(null)

  const canSubmit = purpose.trim().length > 0 && cvFile

  const handleBack = () => navigate(-1)

  const handleSubmit = () => {
    if (!canSubmit) return
    // Placeholder – submit logic would go here
    navigate(-1)
  }

  if (!vacancy) {
    return (
      <div className="apply-vacancy-overlay" onClick={() => navigate(-1)}>
        <div className="apply-vacancy-popup" onClick={(e) => e.stopPropagation()}>
          <p>Vacancy not found.</p>
          <button type="button" className="apply-vacancy-back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="apply-vacancy-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-vacancy-title"
    >
      <div className="apply-vacancy-popup" onClick={(e) => e.stopPropagation()}>
        <header className="apply-vacancy-header">
          <button type="button" className="apply-vacancy-back" onClick={handleBack} aria-label="Back">
            <IconBack />
          </button>
          <h1 id="apply-vacancy-title" className="apply-vacancy-title">Apply for {vacancy.position}</h1>
        </header>

        <div className="apply-vacancy-body">
          <p className="apply-vacancy-subtitle">{vacancy.clubName}</p>

          <div className="apply-vacancy-field">
            <label className="apply-vacancy-label">Purpose of Application <span className="apply-vacancy-required">*</span></label>
            <textarea
              className="apply-vacancy-textarea"
              placeholder="Explain why you want to apply for this position and what you hope to contribute..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={5}
              aria-required="true"
            />
          </div>

          <div className="apply-vacancy-field">
            <label className="apply-vacancy-label">CV / Resume <span className="apply-vacancy-required">*</span></label>
            <label className="apply-vacancy-upload">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                className="apply-vacancy-upload-input"
              />
              <IconUploadDoc />
              <span className="apply-vacancy-upload-text">Upload CV (PDF or DOC)</span>
              <span className="apply-vacancy-upload-hint">Max file size: 5MB</span>
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
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplyVacancy
