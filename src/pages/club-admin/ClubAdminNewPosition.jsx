import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  const [isSaving, setIsSaving] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setIsSaving(true)
    try {
      await fetch('/api/club-admin/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      })
      navigate('/club-admin/employees')
    } catch (error) {
      console.error('Failed to create position', error)
      setIsSaving(false)
    }
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
          <Link to="/club-admin/employees" style={{ color: '#64748b' }}>Employees</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Create Position</span>
        </nav>

        <form className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }} onSubmit={handleCreate}>
          <h2 className="club-admin-card-title" style={{ marginBottom: 8 }}>New Position</h2>
          <p className="club-admin-card-desc" style={{ marginBottom: 24 }}>
            Define a new role by specifying only its title. You can later use it when assigning positions to employees.
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
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>This will add a reusable position to your club.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="club-admin-btn-secondary" onClick={() => navigate('/club-admin/employees')}>
                Cancel
              </button>
              <button type="submit" className="club-admin-btn-primary" disabled={!title.trim() || isSaving}>
                <IconCheck /> {isSaving ? 'Creating...' : 'Create Position'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

export default ClubAdminNewPosition

