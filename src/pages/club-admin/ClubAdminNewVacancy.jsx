import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createClubAdminVacancy, fetchClubAdminPositions } from '../../api/clubApi'
import { useClubAdminClubId, useClubAdminSearch } from '../../hooks/useClubAdminClubId'
import './ClubAdmin.css'

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
)
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
)
const IconDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
)
const IconList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
)
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
)
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
)
const IconBulb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>
)
const IconHelp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
)

const ClubAdminNewVacancy = () => {
  const clubId = useClubAdminClubId()
  const clubQs = useClubAdminSearch()
  const navigate = useNavigate()
  const [positions, setPositions] = useState([])
  const [loadingPositions, setLoadingPositions] = useState(true)
  const [positionId, setPositionId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')

  const loadPositions = useCallback(async () => {
    setLoadingPositions(true)
    try {
      const res = await fetchClubAdminPositions(clubId)
      const items = res?.items ?? res ?? []
      setPositions(
        (Array.isArray(items) ? items : []).map((p, index) => ({
          id: String(p.id ?? p.positionId ?? `p-${index}`),
          title: String(p.name ?? p.title ?? p.positionTitle ?? 'Position'),
          requirements: Array.isArray(p.requirements) ? p.requirements : [],
        }))
      )
    } catch {
      setPositions([])
    } finally {
      setLoadingPositions(false)
    }
  }, [clubId])

  useEffect(() => {
    loadPositions()
  }, [loadPositions])

  const selectedPosition = useMemo(
    () => positions.find((p) => String(p.id) === String(positionId)) || null,
    [positions, positionId]
  )

  const handlePublish = async (e) => {
    e.preventDefault()
    const titleText = (selectedPosition?.title || customTitle.trim()).trim()
    if (!titleText) return
    try {
      await createClubAdminVacancy(clubId, {
        title: titleText,
        description: description.trim() || '—',
      })
    } catch (err) {
      alert(err?.message || 'Could not publish vacancy.')
      return
    }
    navigate(`/club-admin/vacancies${clubQs}`)
  }

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Announce New Vacancy</h1>
      </header>

      <div className="club-admin-content">
        <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 20, paddingLeft: 24 }}>
          <Link to={`/club-admin${clubQs}`} style={{ color: '#64748b' }}>Dashboard</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <Link to={`/club-admin/vacancies${clubQs}`} style={{ color: '#64748b' }}>Vacancies</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>New Vacancy</span>
        </nav>

        <form className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }} onSubmit={handlePublish}>
          <h2 className="club-admin-card-title" style={{ marginBottom: 8 }}>Announce New Vacancy</h2>
          <p className="club-admin-card-desc" style={{ marginBottom: 24 }}>Recruit talented members for your organization by filling out the details below.</p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconInfo style={{ color: '#0284c7' }} /></div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Basic Information</h3>
              <div className="club-admin-field">
                <label>Position (optional)</label>
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                >
                  <option value="">Select a position or enter title below</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                {loadingPositions ? <small className="club-admin-char-limit">Loading positions...</small> : null}
              </div>
              <div className="club-admin-field">
                <label>Vacancy title (if no position selected)</label>
                <input
                  type="text"
                  placeholder="e.g. Design Lead"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
              <div className="club-admin-form-row">
                <div className="club-admin-field">
                  <label>Application deadline (local only)</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {selectedPosition && (
            <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24, marginTop: 0, background: '#f8fafc' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                Requirements for {selectedPosition.title}
              </h3>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b' }}>
                These come from the position definition and help applicants understand expectations.
              </p>
              <ul className="club-admin-requirements-list">
                {(selectedPosition.requirements || []).map((r, i) => (
                  <li key={i}>
                    <IconCheck />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconDoc style={{ color: '#0284c7' }} /></div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Role Description</h3>
              <div className="club-admin-field">
                <label>Detailed Description</label>
                <textarea placeholder="Describe the responsibilities and day-to-day tasks..." value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Minimum 100 characters. Be specific about the goals of this role.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Draft saved 2 mins ago</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {/* <button type="button" className="club-admin-btn-secondary"><IconEye /> Preview</button> */}
              <button
                type="submit"
                className="club-admin-btn-primary"
                disabled={loadingPositions || !(selectedPosition?.title || customTitle.trim())}
              >
                <IconUpload /> Publish Vacancy
              </button>
            </div>
          </div>
        </form>

        <div className="club-admin-tip-card" style={{ marginLeft: 24, marginRight: 24 }}>
          <IconBulb />
          <p>Vacancies with at least 3 specific requirements get 40% more high-quality applications.</p>
        </div>
        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24, background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <IconHelp style={{ color: '#64748b', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>Check out our <a href="#guide" style={{ color: '#2563eb' }}>Recruitment Guide</a> for club leaders.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ClubAdminNewVacancy
