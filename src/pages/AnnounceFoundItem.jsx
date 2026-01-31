import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LostAndFound.css'

const MAX_DESCRIPTION_LENGTH = 500

const AnnounceFoundItem = () => {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: integrate with backend API
    alert('Found item report submitted for review (mock).')
    navigate(-1)
  }

  const handleDescriptionChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_DESCRIPTION_LENGTH) setDescription(value)
  }

  return (
    <div
      className="lf-report-popup-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lf-report-found-title"
    >
      <div className="lf-report-popup">
        <header className="lf-report-popup-header">
          <button type="button" className="lf-icon-button lf-report-popup-back" onClick={() => navigate(-1)} aria-label="Close">
            <span className="lf-back-arrow">‹</span>
          </button>
          <div className="lf-header-title lf-report-popup-header-title">
            <h1 id="lf-report-found-title">Report Found Item</h1>
            <span className="lf-subtitle">Report a found item to help the owner get it back</span>
          </div>
          <div className="lf-report-popup-header-spacer" aria-hidden="true" />
        </header>

        <form className="lf-report-form" onSubmit={handleSubmit}>
          {/* 1. Basic Information */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">1</span>
              Basic Information
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field">
                <input type="text" required placeholder="Item Name *" />
              </label>
              <label className="lf-field">
                <select required defaultValue="">
                  <option value="" disabled>Category *</option>
                  <option value="electronics">Electronics</option>
                  <option value="documents">Documents</option>
                  <option value="clothing">Clothing</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <div className="lf-field-row">
                <label className="lf-field">
                  <input type="text" placeholder="Color" />
                </label>
                <label className="lf-field">
                  <input type="text" placeholder="Brand" />
                </label>
              </div>
            </div>
          </section>

          {/* 2. Location Details */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">2</span>
              Location Details
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field">
                <select required defaultValue="">
                  <option value="" disabled>Building *</option>
                  <option value="main">Main Building</option>
                  <option value="library">Library</option>
                  <option value="sports">Sports Complex</option>
                  <option value="cafeteria">Cafeteria</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <div className="lf-field-row">
                <label className="lf-field">
                  <input type="text" placeholder="Floor" />
                </label>
                <label className="lf-field">
                  <input type="text" placeholder="Room/Area" />
                </label>
              </div>
              <label className="lf-field">
                <input type="text" required placeholder="Where did you find it? *" />
              </label>
            </div>
          </section>

          {/* 3. When did you find it? */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">3</span>
              When did you find it?
            </h2>
            <div className="lf-report-fields">
              <div className="lf-field-row">
                <label className="lf-field">
                  <span className="lf-field-label">Date</span>
                  <input type="date" required />
                </label>
                <label className="lf-field">
                  <span className="lf-field-label">Time</span>
                  <input type="time" />
                </label>
              </div>
            </div>
          </section>

          {/* 4. Additional Details */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">4</span>
              Additional Details
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field lf-field-textarea-wrap">
                <textarea
                  rows={4}
                  placeholder="Description"
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                <span className="lf-char-count">{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
              </label>
            </div>
          </section>

          {/* 5. Photos */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">5</span>
              Photos
            </h2>
            <div className="lf-report-fields">
              <label className="lf-add-photo">
                <input
                  type="file"
                  accept="image/*"
                  className="lf-add-photo-input"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
                <span className="lf-add-photo-icon">🖼️+</span>
                <span className="lf-add-photo-text">Add Photo</span>
                {photoFile && <span className="lf-add-photo-filename">{photoFile.name}</span>}
              </label>
            </div>
          </section>

          {/* 6. Your Contact Information & Collection */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">6</span>
              Your Contact Information
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field">
                <input type="text" placeholder="Your Name" />
              </label>
              <label className="lf-field">
                <input type="tel" placeholder="Phone Number" />
              </label>
              <label className="lf-field">
                <input type="text" required placeholder="Where can it be collected? *" />
              </label>
            </div>
          </section>

          <button type="submit" className="lf-submit-review">
            Submit for Review
          </button>
        </form>
      </div>
    </div>
  )
}

export default AnnounceFoundItem
