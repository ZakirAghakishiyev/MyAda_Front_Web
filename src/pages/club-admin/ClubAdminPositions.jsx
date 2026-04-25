import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CLUB_POSITION_CATEGORIES, positionCategoryOptionsFromApi } from '../../data/clubAdminData'
import {
  fetchClubAdminPositions,
  patchClubAdminPosition,
} from '../../api/clubApi'
import { useClubAdminClubId, useClubAdminSearch } from '../../hooks/useClubAdminClubId'
import './ClubAdmin.css'

const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
    <path d="M14.06 4.94 16.88 7.76" />
  </svg>
)

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ClubAdminPositions = () => {
  const clubId = useClubAdminClubId()
  const clubQs = useClubAdminSearch()
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [reqInput, setReqInput] = useState('')
  const [requirements, setRequirements] = useState([])

  const loadPositions = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetchClubAdminPositions(clubId)
      const items = res?.items ?? res ?? []
      setPositions(
        (Array.isArray(items) ? items : []).map((p, index) => {
          const fromApi = String(p.categoryName ?? p.category ?? '').trim()
          const legacyIdx = Number(p.categoryId)
          const legacy =
            !Number.isNaN(legacyIdx) && legacyIdx >= 1 && legacyIdx <= CLUB_POSITION_CATEGORIES.length
              ? CLUB_POSITION_CATEGORIES[legacyIdx - 1]
              : ''
          const category = (fromApi || legacy || 'Other').trim() || 'Other'
          return {
          id: p.id ?? p.positionId ?? `p-${index}`,
          title: p.title ?? p.name ?? p.positionTitle ?? 'Position',
          category,
          requirements: Array.isArray(p.requirements) ? p.requirements : [],
          raw: p,
        }})
      )
    } catch (e) {
      setPositions([])
      setLoadError(e?.message || 'Could not load positions.')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    loadPositions()
  }, [loadPositions])

  const categoryOptions = useMemo(
    () => positionCategoryOptionsFromApi(positions.map((p) => p.category)),
    [positions]
  )

  const filteredPositions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return positions
    return positions.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.requirements || []).some((r) => r.toLowerCase().includes(q))
    )
  }, [positions, search])

  const startEdit = (pos) => {
    setEditing(pos.id)
    setTitle(pos.title)
    setCategory(pos.category || 'Other')
    setRequirements(pos.requirements || [])
    setReqInput('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setTitle('')
    setCategory('')
    setRequirements([])
    setReqInput('')
  }

  const addRequirement = () => {
    const trimmed = reqInput.trim()
    if (!trimmed) return
    setRequirements((prev) => [...prev, trimmed])
    setReqInput('')
  }

  const removeRequirement = (idx) => {
    setRequirements((prev) => prev.filter((_, i) => i !== idx))
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editing || !title.trim() || !category) return
    try {
      await patchClubAdminPosition(clubId, editing, {
        title: title.trim(),
        name: title.trim(),
        category: category.trim(),
        requirements: (requirements || []).map((r) => String(r).trim()).filter(Boolean),
      })
      await loadPositions()
    } catch (e) {
      alert(e?.message || 'Could not save position changes.')
      return
    }
    cancelEdit()
  }

  if (editing) {
    return (
      <>
        <header className="club-admin-header">
          <h1 className="club-admin-header-title">Edit Position</h1>
        </header>

        <div className="club-admin-content">
          <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, paddingLeft: 24 }}>
            <Link to={`/club-admin${clubQs}`} style={{ color: '#64748b' }}>Dashboard</Link>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <Link to={`/club-admin/positions${clubQs}`} style={{ color: '#64748b' }}>Positions</Link>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Edit Position</span>
          </nav>

          <form
            className="club-admin-card"
            style={{ marginLeft: 24, marginRight: 24 }}
            onSubmit={saveEdit}
          >
            <div className="club-admin-card-head">
              <h2 className="club-admin-card-title">Edit Position</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="club-admin-btn-secondary" onClick={cancelEdit}>
                  <IconX /> Cancel
                </button>
                <button type="submit" className="club-admin-btn-primary">
                  <IconCheck /> Save changes
                </button>
              </div>
            </div>

            <div className="club-admin-form-row">
              <div className="club-admin-field">
                <label>Position title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Marketing Coordinator"
                />
              </div>
              <div className="club-admin-field">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="club-admin-field">
              <label>Requirements for this position</label>
              <div className="club-admin-add-row">
                <input
                  type="text"
                  placeholder="Add a requirement (e.g. Previous experience with Canva)"
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
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
          </form>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Positions & Requirements</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <div className="club-admin-header-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search positions or requirements..."
              aria-label="Search positions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link
            to={`/club-admin/positions/new${clubQs}`}
            className="club-admin-btn-primary"
            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <IconPlus /> New position
          </Link>
        </div>
      </header>

      <div className="club-admin-content">
        {loadError ? (
          <p style={{ margin: '0 24px 16px', fontSize: 14, color: '#b91c1c' }}>{loadError}</p>
        ) : null}
        <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, paddingLeft: 24 }}>
          <Link to={`/club-admin${clubQs}`} style={{ color: '#64748b' }}>Dashboard</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Positions</span>
        </nav>

        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }}>
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">All Positions</h2>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{filteredPositions.length} positions</span>
          </div>

          <div className="club-admin-table-wrap">
          <table className="club-admin-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Title</th>
                <th style={{ width: '16%' }}>Category</th>
                <th>Key requirements</th>
                <th style={{ width: '14%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="club-admin-table-empty">
                    Loading positions...
                  </td>
                </tr>
              ) : null}
              {filteredPositions.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.category || '—'}</td>
                  <td>
                    {(p.requirements || []).length === 0 ? (
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>No requirements defined</span>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#334155' }}>
                        {p.requirements.slice(0, 3).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                        {p.requirements.length > 3 && (
                          <li style={{ color: '#64748b' }}>+{p.requirements.length - 3} more…</li>
                        )}
                      </ul>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="club-admin-btn-secondary"
                      onClick={() => startEdit(p)}
                    >
                      <IconEdit /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={4} className="club-admin-table-empty">
                    No positions match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </>
  )
}

export default ClubAdminPositions

