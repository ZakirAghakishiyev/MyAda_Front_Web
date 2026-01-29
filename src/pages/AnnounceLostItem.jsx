import React from 'react'
import { useNavigate } from 'react-router-dom'
import './LostAndFound.css'

const AnnounceLostItem = () => {
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: integrate with backend API
    alert('Lost item announcement submitted (mock).')
    navigate('/lost-and-found')
  }

  return (
    <div className="lf-page">
      <header className="lf-header">
        <button className="lf-icon-button" onClick={() => navigate(-1)}>
          <span className="lf-back-arrow">←</span>
        </button>
        <div className="lf-header-title">
          <h1>Announce Lost Item</h1>
          <span className="lf-subtitle">ADA University Campus</span>
        </div>
      </header>

      <form className="lf-form" onSubmit={handleSubmit}>
        <label className="lf-field">
          <span className="lf-field-label">Item name</span>
          <input type="text" required placeholder="e.g. Student ID card" />
        </label>

        <label className="lf-field">
          <span className="lf-field-label">Where did you lose it?</span>
          <input type="text" required placeholder="e.g. Cafeteria - Near Entrance" />
        </label>

        <label className="lf-field">
          <span className="lf-field-label">When did you lose it?</span>
          <input type="date" required />
        </label>

        <label className="lf-field">
          <span className="lf-field-label">Category</span>
          <select defaultValue="documents">
            <option value="documents">Documents</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="lf-field">
          <span className="lf-field-label">Description</span>
          <textarea rows={4} placeholder="Add details that can help identify your item." />
        </label>

        <label className="lf-field">
          <span className="lf-field-label">Contact email</span>
          <input type="email" required placeholder="you@example.com" />
        </label>

        <div className="lf-form-actions">
          <button
            type="button"
            className="lf-secondary-button"
            onClick={() => navigate('/lost-and-found')}
          >
            Cancel
          </button>
          <button type="submit" className="lf-primary-button">
            Submit
          </button>
        </div>
      </form>
    </div>
  )
}

export default AnnounceLostItem

