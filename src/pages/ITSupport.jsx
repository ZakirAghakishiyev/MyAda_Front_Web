import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ITSupport.css'

const CATEGORY_OPTIONS = [
  'Wi-Fi & Network',
  'Email & Office 365',
  'Password Reset',
  'Projector/Display',
  'Printer/Scanner',
  'Software Installation',
  'Computer Repair',
  'Other'
]

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const IconLocation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const IconAttach = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const ITSupport = () => {
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('not-urgent')
  const [attachments, setAttachments] = useState([])
  const [showError, setShowError] = useState(false)

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!category.trim() || !location.trim() || !description.trim()) {
      setShowError(true)
      return
    }
    setShowError(false)
    // TODO: integrate with backend API
    navigate('/my-requests')
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  return (
    <div
      className="it-support-overlay"
      onClick={(e) => e.target === e.currentTarget && goBack()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="it-support-title"
    >
      <div className="it-support-popup">
        <header className="it-support-header">
          <button type="button" className="it-support-back" onClick={goBack} aria-label="Back">
            <IconBack />
          </button>
          <div className="it-support-header-title">
            <h1 id="it-support-title">New IT Request</h1>
            <span className="it-support-subtitle">Fill in the details below</span>
          </div>
          <div className="it-support-header-spacer" aria-hidden="true" />
        </header>

        <form className="it-support-form" onSubmit={handleSubmit}>
          {/* 1. Issue Category */}
          <section className="it-support-section">
            <h2 className="it-support-section-title">
              <span className="it-support-section-num">1</span>
              Issue Category *
            </h2>
            <div className="it-support-fields">
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="it-support-select"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </section>

          {/* 2. Location */}
          <section className="it-support-section">
            <h2 className="it-support-section-title">
              <span className="it-support-section-num">2</span>
              Location *
            </h2>
            <div className="it-support-fields">
              <div className="it-support-input-wrap it-support-input-wrap--icon">
                <span className="it-support-input-icon"><IconLocation /></span>
                <input
                  type="text"
                  required
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="it-support-input"
                />
              </div>
            </div>
          </section>

          {/* 3. Detailed Description */}
          <section className="it-support-section">
            <h2 className="it-support-section-title">
              <span className="it-support-section-num">3</span>
              Detailed Description *
            </h2>
            <div className="it-support-fields">
              <textarea
                required
                rows={5}
                placeholder="Provide as much detail as possible about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="it-support-textarea"
              />
              <p className="it-support-hint">
                Include error messages, what you were doing when the issue occurred, and any steps you've already tried.
              </p>
            </div>
          </section>

          {/* 4. Attachments (Optional) */}
          <section className="it-support-section">
            <h2 className="it-support-section-title">
              <span className="it-support-section-num">4</span>
              Attachments <span className="it-support-optional">(Optional)</span>
            </h2>
            <div className="it-support-fields">
              <label className="it-support-add-photo">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="it-support-add-photo-input"
                  onChange={handleFileChange}
                />
                <span className="it-support-add-photo-icon"><IconAttach /></span>
                <span className="it-support-add-photo-text">Add Photo or Video</span>
              </label>
              {attachments.length > 0 && (
                <div className="it-support-attachments-list">
                  {attachments.map((f, i) => (
                    <span key={i} className="it-support-attachment-name">{f.name}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 5. Urgency Level */}
          <section className="it-support-section">
            <h2 className="it-support-section-title">
              <span className="it-support-section-num">5</span>
              Urgency Level *
            </h2>
            <div className="it-support-fields">
              <label className="it-support-radio">
                <span className="it-support-radio-inner">
                  <input
                    type="radio"
                    name="urgency"
                    value="not-urgent"
                    checked={urgency === 'not-urgent'}
                    onChange={() => setUrgency('not-urgent')}
                  />
                  <span className="it-support-radio-label">Not Urgent</span>
                </span>
                <span className="it-support-radio-desc">Can wait 24+ hours</span>
              </label>
              <label className="it-support-radio">
                <span className="it-support-radio-inner">
                  <input
                    type="radio"
                    name="urgency"
                    value="urgent"
                    checked={urgency === 'urgent'}
                    onChange={() => setUrgency('urgent')}
                  />
                  <span className="it-support-radio-label">Urgent</span>
                </span>
                <span className="it-support-radio-desc">Needed ASAP</span>
              </label>
            </div>
          </section>

          {/* What happens next? */}
          <div className="it-support-info-box">
            <p className="it-support-info-title">
              <IconInfo />
              What happens next?
            </p>
            <ul className="it-support-info-list">
              <li>Your request will be reviewed by our support team</li>
              <li>You'll receive a ticket number for tracking</li>
              <li>Support staff will contact you via chat or email</li>
              <li>Average response time: 2-4 hours</li>
            </ul>
          </div>

          {showError && (
            <p className="it-support-error" role="alert">Please fill in all required fields</p>
          )}

          <button type="submit" className="it-support-submit">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  )
}

export default ITSupport
