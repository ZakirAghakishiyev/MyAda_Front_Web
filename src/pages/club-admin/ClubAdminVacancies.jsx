import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchClubAdminVacancies, patchClubAdminVacancy, patchClubAdminVacancyStatus } from '../../api/clubApi'
import { mapVacancyFromApi } from '../../api/clubMappers'
import { useClubAdminClubId, useClubAdminSearch } from '../../hooks/useClubAdminClubId'
import './ClubAdmin.css'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
    <path d="M14.06 4.94 16.88 7.76" />
  </svg>
)

const ClubAdminVacancies = () => {
  const clubId = useClubAdminClubId()
  const clubQs = useClubAdminSearch()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vacancies, setVacancies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadVacancies = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const apiStatus = statusFilter === 'all' ? undefined : statusFilter
      const data = await fetchClubAdminVacancies(clubId, {
        ...(apiStatus ? { status: apiStatus } : {}),
        page: 1,
        limit: 100,
      })
      const items = data?.items ?? data ?? []
      const arr = Array.isArray(items) ? items : []
      setVacancies(
        arr.map((row) => {
          const m = mapVacancyFromApi({
            ...row,
            id: row.id ?? row.vacancyId,
            title: row.title,
            clubName: row.clubName,
            isActive: row.isActive,
            status: row.status,
          })
          if (!m) return null
          const inactive =
            row.isActive === false ||
            /^inactive$/i.test(String(row.status ?? '')) ||
            m.isActive === false
          return { ...m, status: inactive ? 'Inactive' : 'Active' }
        }).filter(Boolean)
      )
    } catch (e) {
      setVacancies([])
      setLoadError(e?.message || 'Could not load vacancies.')
    } finally {
      setLoading(false)
    }
  }, [clubId, statusFilter])

  useEffect(() => {
    loadVacancies()
  }, [loadVacancies])
  const [editingVacancy, setEditingVacancy] = useState(null)
  const [roleTitle, setRoleTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')
  const [requirementInput, setRequirementInput] = useState('')
  const [requirements, setRequirements] = useState([
    'Excellent communication and teamwork skills.',
    'Enthusiasm for university events and student life.'
  ])
  const [pendingStatus, setPendingStatus] = useState({})

  const categories = useMemo(() => {
    const set = new Set(vacancies.map((v) => v.categoryTag || v.category))
    return Array.from(set).sort()
  }, [vacancies])

  const filteredVacancies = useMemo(() => {
    let list = vacancies
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (v) =>
          v.position.toLowerCase().includes(q) ||
          v.clubName.toLowerCase().includes(q) ||
          (v.categoryTag || v.category).toLowerCase().includes(q)
      )
    }
    if (categoryFilter) {
      list = list.filter((v) => (v.categoryTag || v.category) === categoryFilter)
    }
    return list
  }, [vacancies, search, categoryFilter])

  const handleRowStatusChange = (id, value) => {
    setPendingStatus((prev) => {
      const current = vacancies.find((v) => v.id === id)
      if (!current) return prev
      if (current.status === value) {
        const clone = { ...prev }
        delete clone[id]
        return clone
      }
      return { ...prev, [id]: value }
    })
  }

  const confirmRowStatus = async (id) => {
    const val = pendingStatus[id]
    if (!val) return
    try {
      // Backend expects { status: "draft" | "published"/"active" | "inactive" }.
      await patchClubAdminVacancyStatus(clubId, id, val === 'Active' ? 'published' : 'inactive')
    } catch (e) {
      alert(e?.message || 'Could not update status.')
      return
    }
    setVacancies((prev) => {
      const next = prev.map((v) =>
        v.id === id && pendingStatus[id] ? { ...v, status: pendingStatus[id] } : v
      )
      return next
    })
    setPendingStatus((prev) => {
      const clone = { ...prev }
      delete clone[id]
      return clone
    })
    loadVacancies()
  }

  const startEditing = (vacancy) => {
    setEditingVacancy(vacancy)
    setRoleTitle(vacancy.position || '')
    setDeadline(vacancy.deadline || '')
    const about = vacancy.aboutRole && vacancy.aboutRole.length > 0 ? vacancy.aboutRole.join('\n\n') : ''
    setDescription(about)
    setRequirements(vacancy.requirements && vacancy.requirements.length > 0 ? vacancy.requirements : [
      'Excellent communication and teamwork skills.',
      'Enthusiasm for university events and student life.'
    ])
    setRequirementInput('')
  }

  const cancelEditing = () => {
    setEditingVacancy(null)
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

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingVacancy) return
    const body = {
      title: roleTitle.trim(),
      description: description.trim(),
    }
    if (deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      body.applicationDeadline = `${deadline}T23:59:59Z`
    }
    try {
      await patchClubAdminVacancy(clubId, editingVacancy.id, body)
    } catch (err) {
      alert(err?.message || 'Save failed.')
      return
    }
    setVacancies((prev) =>
      prev.map((v) => {
        if (v.id !== editingVacancy.id) return v
        const newAboutRole = description
          ? description.split('\n').map((p) => p.trim()).filter(Boolean)
          : v.aboutRole
        return {
          ...v,
          position: roleTitle.trim() || v.position,
          deadline: deadline || v.deadline,
          aboutRole: newAboutRole,
          requirements: requirements && requirements.length > 0 ? requirements : v.requirements
        }
      })
    )
    setEditingVacancy(null)
    loadVacancies()
  }

  if (editingVacancy) {
    return (
      <>
        <header className="club-admin-header">
          <h1 className="club-admin-header-title">Edit Vacancy</h1>
        </header>

        <div className="club-admin-content">
          <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 20, paddingLeft: 24 }}>
            <Link to={`/club-admin${clubQs}`} style={{ color: '#64748b' }}>Dashboard</Link>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <Link to={`/club-admin/vacancies${clubQs}`} style={{ color: '#64748b' }}>Vacancies</Link>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Edit Vacancy</span>
          </nav>

          <form className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }} onSubmit={handleSaveEdit}>
            <h2 className="club-admin-card-title" style={{ marginBottom: 8 }}>Edit Vacancy</h2>
            <p className="club-admin-card-desc" style={{ marginBottom: 24 }}>
              Update the details of this vacancy. Changes will be visible to students immediately.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* reuse simple icon style */}
                <IconEdit />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Basic Information</h3>
                <div className="club-admin-field">
                  <label>Role title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                  />
                </div>
                <div className="club-admin-form-row">
                  <div className="club-admin-field">
                    <label>Application Deadline</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* simple document icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Role Description</h3>
                <div className="club-admin-field">
                  <label>Detailed Description</label>
                  <textarea
                    placeholder="Describe the responsibilities and day-to-day tasks..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    You can add multiple paragraphs; each line will be shown separately to students.
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Key Requirements</h3>
                <div className="club-admin-add-row">
                  <input
                    type="text"
                    placeholder="Add a qualification (e.g. Previous experience with Canva)"
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
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
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
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Changes are saved directly to backend.</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="club-admin-btn-secondary" onClick={cancelEditing}>
                  Cancel
                </button>
                <button type="submit" className="club-admin-btn-primary">
                  Save Vacancy
                </button>
              </div>
            </div>
          </form>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Club Vacancies</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <div className="club-admin-header-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search vacancies by role or club..."
              aria-label="Search vacancies"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to={`/club-admin/vacancies/new${clubQs}`} className="club-admin-btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + Announce vacancy
          </Link>
        </div>
      </header>

      <div className="club-admin-content">
        {loadError ? (
          <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#b91c1c' }}>{loadError}</p>
        ) : null}
        <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, paddingLeft: 24 }}>
          <Link to={`/club-admin${clubQs}`} style={{ color: '#64748b' }}>Dashboard</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Vacancies</span>
        </nav>

        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }}>
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">All Club Vacancies</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="club-admin-select-inline"
                  >
                    <option value="">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="club-admin-chip-btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      background: statusFilter === 'all' ? '#0f172a' : 'transparent',
                      color: statusFilter === 'all' ? '#f8fafc' : '#64748b',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('active')}
                    className="club-admin-chip-btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      background: statusFilter === 'active' ? '#16a34a' : 'transparent',
                      color: statusFilter === 'active' ? '#f0fdf4' : '#64748b',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('inactive')}
                    className="club-admin-chip-btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      background: statusFilter === 'inactive' ? '#e11d48' : 'transparent',
                      color: statusFilter === 'inactive' ? '#fef2f2' : '#64748b',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Inactive
                  </button>
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {filteredVacancies.length} vacancies
              </span>
            </div>
          </div>

          <div className="club-admin-table-wrap">
          <table className="club-admin-table">
            <thead>
              <tr>
                <th style={{ width: '24%' }}>Position</th>
                <th style={{ width: '22%' }}>Club</th>
                <th style={{ width: '12%' }}>Category</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '10%' }}>Posted</th>
                <th style={{ width: '10%' }}>Deadline</th>
                <th style={{ width: '12%' }}>Applicants</th>
                <th style={{ width: '10%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                    Loading vacancies...
                  </td>
                </tr>
              ) : null}
              {filteredVacancies.map((v) => {
                const currentStatus = pendingStatus[v.id] || v.status
                const hasPendingChange = pendingStatus[v.id] && pendingStatus[v.id] !== v.status
                return (
                  <tr key={v.id}>
                    <td>{v.position}</td>
                    <td>{v.clubName}</td>
                    <td>{v.categoryTag || v.category}</td>
                    <td>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleRowStatusChange(v.id, e.target.value)}
                        className="club-admin-select-inline"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      {hasPendingChange && (
                        <button
                          type="button"
                          onClick={() => confirmRowStatus(v.id)}
                          className="club-admin-btn-primary"
                          style={{ marginLeft: 8, padding: '4px 8px', fontSize: 11 }}
                        >
                          Confirm
                        </button>
                      )}
                    </td>
                    <td>{v.postedAt}</td>
                    <td>{v.deadline || '—'}</td>
                    <td>{v.applicants || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="club-admin-btn-secondary"
                        onClick={() => startEditing(v)}
                      >
                        <IconEdit /> Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!loading && filteredVacancies.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                    No vacancies match your filters.
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

export default ClubAdminVacancies

