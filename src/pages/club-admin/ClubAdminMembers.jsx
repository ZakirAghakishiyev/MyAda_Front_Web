import React, { useState, useMemo } from 'react'
import { mockClubMembers as initialMembers, MEMBER_POSITIONS as memberPositionsList } from '../../data/clubAdminData'
import './ClubAdmin.css'

const mockClubMembers = Array.isArray(initialMembers) ? initialMembers : []
const MEMBER_POSITIONS = Array.isArray(memberPositionsList) ? memberPositionsList : ['Member']

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
)

const ClubAdminMembers = () => {
  const [members, setMembers] = useState(mockClubMembers)
  const [search, setSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (m) =>
        `${m.name} ${m.surname}`.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.studentId && m.studentId.toLowerCase().includes(q)) ||
        (m.position && m.position.toLowerCase().includes(q))
    )
  }, [members, search])

  const handleUpdatePosition = (id, newPosition) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, position: newPosition } : m)))
    setPendingChanges((prev) => ({
      ...prev,
      [id]: newPosition
    }))
  }

  const handleConfirmPositionChanges = async () => {
    const changes = Object.entries(pendingChanges).map(([id, position]) => ({
      id: Number(id),
      position
    }))
    if (!changes.length) return
    setIsSaving(true)
    try {
      await fetch('/api/club-admin/members/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes })
      })
      setPendingChanges({})
    } catch (error) {
      console.error('Failed to update member positions', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = (id) => {
    setRemoveConfirm(id)
  }

  const confirmRemove = () => {
    if (removeConfirm != null) {
      setMembers((prev) => prev.filter((m) => m.id !== removeConfirm))
      setRemoveConfirm(null)
    }
  }

  return (
    <div className="club-admin-page">
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Members</h1>
        <div className="club-admin-header-search" style={{ flex: '1 1 280px', maxWidth: 360 }}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search members"
          />
        </div>
      </header>

      <div className="club-admin-content">
        <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#64748b' }}>
          Manage club members. Update position or remove a member.
        </p>

        <div className="club-admin-card" style={{ margin: '0 24px 24px' }}>
          <table className="club-admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Student ID</th>
                <th>Age</th>
                <th>Position</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="club-admin-table-user">
                      <div className="club-admin-table-avatar" />
                      <div>
                        <div className="club-admin-table-name">{m.name} {m.surname}</div>
                        <a href={`mailto:${m.email}`} className="club-admin-table-email">{m.email}</a>
                      </div>
                    </div>
                  </td>
                  <td>{m.studentId ?? '—'}</td>
                  <td>{m.age != null ? m.age : '—'}</td>
                  <td>
                    <select
                      className="club-admin-select-inline"
                      value={m.position ?? ''}
                      onChange={(e) => handleUpdatePosition(m.id, e.target.value)}
                      aria-label={`Update position for ${m.name} ${m.surname}`}
                    >
                      {MEMBER_POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </td>
                  <td>{m.joinedDate ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="club-admin-btn-icon club-admin-btn-icon--reject"
                      aria-label="Remove member"
                      onClick={() => handleRemove(m.id)}
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="club-admin-table-empty">No members found.</p>
          )}
          {Object.keys(pendingChanges).length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#0f172a' }}>You have unsaved position changes.</span>
              <button
                type="button"
                className="club-admin-btn-primary"
                onClick={handleConfirmPositionChanges}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Confirm changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {removeConfirm != null && (
        <div
          className="club-admin-popup-overlay"
          onClick={(e) => e.target === e.currentTarget && setRemoveConfirm(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
        >
          <div className="club-admin-popup club-admin-popup--sm" onClick={(e) => e.stopPropagation()}>
            <div className="club-admin-popup-header">
              <h2 id="remove-member-title">Remove member</h2>
              <button type="button" className="club-admin-popup-close" onClick={() => setRemoveConfirm(null)} aria-label="Close">×</button>
            </div>
            <div className="club-admin-popup-body">
              <p>Are you sure you want to remove this member from the club? This action cannot be undone.</p>
            </div>
            <div className="club-admin-popup-footer">
              <button type="button" className="club-admin-btn-secondary" onClick={() => setRemoveConfirm(null)}>Cancel</button>
              <button type="button" className="club-admin-btn-danger" onClick={confirmRemove}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubAdminMembers
