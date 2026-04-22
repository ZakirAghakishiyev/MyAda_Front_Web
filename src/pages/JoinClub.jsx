import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchClub, submitClubJoinApplication } from '../api/clubApi'
import { mapClubFromApi } from '../api/clubMappers'
import { getJwtUserId } from '../auth/jwtRoles'
import './JoinClub.css'

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

const JoinClub = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [club, setClub] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [letterOfPurpose, setLetterOfPurpose] = useState('')
  const [portfolioLinks, setPortfolioLinks] = useState('')
  const [portfolioFiles, setPortfolioFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const canSubmit = letterOfPurpose.trim().length > 0 && !submitting

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      try {
        const raw = await fetchClub(id)
        if (!cancelled) setClub(mapClubFromApi(raw))
      } catch (e) {
        if (!cancelled) {
          setClub(null)
          setLoadError(e?.message || 'Could not load club.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const handleBack = () => navigate(-1)

  const handleSubmit = async () => {
    if (!canSubmit || !id) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      const fd = new FormData()
      // Optional: backend uses JWT sub/user_id when omitted, but we send it when available.
      const uid = getJwtUserId()
      if (uid) fd.append('userId', String(uid))
      fd.append('letterOfPurpose', letterOfPurpose.trim())
      if (portfolioLinks.trim()) fd.append('portfolioLinks', portfolioLinks.trim())
      // Backend accepts file[] under `portfolioFiles` (and some implementations prefer `portfolioFiles[]`).
      portfolioFiles.forEach((file) => {
        fd.append('portfolioFiles', file)
        fd.append('portfolioFiles[]', file)
      })
      await submitClubJoinApplication(id, fd)
      navigate(`/clubs/${id}`)
    } catch (e) {
      setSubmitError(e?.message || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setPortfolioFiles(files)
  }

  if (loadError || !club) {
    return (
      <div className="join-club-overlay" onClick={() => navigate(-1)}>
        <div className="join-club-popup" onClick={(e) => e.stopPropagation()}>
          <p>{loadError || 'Club not found.'}</p>
          <button type="button" className="join-club-back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="join-club-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-club-title"
    >
      <div className="join-club-popup" onClick={(e) => e.stopPropagation()}>
        <header className="join-club-header">
          <button type="button" className="join-club-back" onClick={handleBack} aria-label="Back">
            <IconBack />
          </button>
          <h1 id="join-club-title" className="join-club-title">Join {club.name}</h1>
        </header>

        <div className="join-club-body">
          <div className="join-club-field join-club-field--num">
            <span className="join-club-num">1</span>
            <div className="join-club-field-inner">
            <label className="join-club-label">Letter of Purpose <span className="join-club-required">*</span></label>
            <textarea
              className="join-club-textarea"
              placeholder="Explain why you want to join this club and what you hope to contribute..."
              value={letterOfPurpose}
              onChange={(e) => setLetterOfPurpose(e.target.value)}
              rows={5}
              aria-required="true"
            />
            </div>
          </div>

          <div className="join-club-field join-club-field--num">
            <span className="join-club-num">2</span>
            <div className="join-club-field-inner">
              <label className="join-club-label">Any previous experience, works or portfolio links?</label>
              <input
                type="url"
                className="join-club-input"
                placeholder="https://example.com/portfolio"
                value={portfolioLinks}
                onChange={(e) => setPortfolioLinks(e.target.value)}
                aria-describedby="join-club-portfolio-hint"
              />
            </div>
          </div>

          <div className="join-club-field join-club-field--num">
            <span className="join-club-num">3</span>
            <div className="join-club-field-inner">
              <label className="join-club-label">Any previous works or portfolio files? <span className="join-club-optional">(optional)</span></label>
              <label className="join-club-upload">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="join-club-upload-input"
                />
                <IconUploadDoc />
                <span className="join-club-upload-text">Upload Files</span>
                <span id="join-club-portfolio-hint" className="join-club-upload-hint">10 files, 1GB each</span>
                {portfolioFiles.length > 0 && (
                  <span className="join-club-upload-filename">{portfolioFiles.length} file(s) selected</span>
                )}
              </label>
            </div>
          </div>

          {submitError && (
            <p className="join-club-upload-hint" style={{ color: '#b91c1c' }} role="alert">
              {submitError}
            </p>
          )}
          <div className="join-club-actions">
            <button
              type="button"
              className="join-club-btn-submit"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinClub
