import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { VACANCY_CATEGORIES } from '../../data/clubAdminData'
import './ClubAdmin.css'

const IconTag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a2 2 0 0 0-2 2v5.59A2 2 0 0 0 2.59 12L12.17 21.6a2 2 0 0 0 2.83 0l5.59-5.59a2 2 0 0 0 0-2.83Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
)

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ClubAdminNewPosition = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [requirementInput, setRequirementInput] = useState('')
  const [requirements, setRequirements] = useState([
    'Excellent communication and teamwork skills.',
    'Enthusiasm for university events and student life.'
  ])

  const handleCreate = (e) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || !category) return
    // In this mock UI we don’t persist to backend – just redirect to positions list.
    navigate('/club-admin/positions')
  }

  const addRequirement = () => {
    const t = requirementInput.trim()
    if (!t) return
    setRequirements((prev) => [...prev, t])
    setRequirementInput('')
  }

  const removeRequirement = (index) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Create Position</h1>
      </header>

      <div className="club-admin-content">
        <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 20, paddingLeft: 24 }}>
          <Link to="/club-admin" style={{ color: '#64748b' }}>Dashboard</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <Link to="/club-admin/positions" style={{ color: '#64748b' }}>Positions</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Create Position</span>
        </nav>

        <form className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }} onSubmit={handleCreate}>
          <h2 className="club-admin-card-title" style={{ marginBottom: 8 }}>New Position</h2>
          <p className="club-admin-card-desc" style={{ marginBottom: 24 }}>
            Define a reusable role for your club and attach the general requirements for this position.
          </p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconTag />
            </div>
            <div style={{ flex: 1 }}>
              <div className="club-admin-field">
                <label>Position title</label>
                <input
                  type="text"
                  placeholder="e.g. Outreach Lead"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="club-admin-field">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {VACANCY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="club-admin-field">
            <label>Requirements for this position</label>
            <div className="club-admin-add-row">
              <input
                type="text"
                placeholder="Add a requirement (e.g. Previous experience with Canva)"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <button type="button" className="club-admin-btn-primary" onClick={addRequirement}>
                + Add
              </button>
            </div>
            <ul className="club-admin-requirements-list">
              {requirements.map((r, i) => (
                <li key={i}>
                  <span style={{ flex: 1 }}>{r}</span>
                  <button
                    type="button"
                    className="club-admin-btn-icon"
                    onClick={() => removeRequirement(i)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>This will add a reusable position to your club.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="club-admin-btn-secondary" onClick={() => navigate('/club-admin/positions')}>
                Cancel
              </button>
              <button type="submit" className="club-admin-btn-primary" disabled={!title.trim() || !category}>
                <IconCheck /> Create Position
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

export default ClubAdminNewPosition

