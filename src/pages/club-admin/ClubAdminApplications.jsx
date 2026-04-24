import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchClubAdminApplications,
  fetchClubAdminApplication,
  approveClubAdminApplication,
  rejectClubAdminApplication,
  inviteClubAdminApplicationToInterview,
  requestChangesClubAdminApplication,
  clubAdminBulkDecision,
  addClubAdminApplicationNote,
} from '../../api/clubApi'
import { splitClubAdminApplications, mapClubAdminApplicationDetailFromApi } from '../../api/clubAdminMappers'
import { formatInterviewTimeShort } from '../../api/clubApplicationMappers'
import { useClubAdminClubId, useClubAdminSearch } from '../../hooks/useClubAdminClubId'
import ClubAdminApplicationDetail from './ClubAdminApplicationDetail'
import './ClubAdmin.css'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
)

const ClubAdminApplications = () => {
  const navigate = useNavigate()
  const clubId = useClubAdminClubId()
  const clubQs = useClubAdminSearch()
  const [activeTab, setActiveTab] = useState('membership')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [detailApplication, setDetailApplication] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [applications, setApplications] = useState({
    membership: [],
    job: []
  })

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const apiStatus = statusFilter === 'All' ? undefined : String(statusFilter).toLowerCase()
      const data = await fetchClubAdminApplications(clubId, {
        ...(apiStatus ? { status: apiStatus } : {}),
        page: 1,
        limit: 100,
      })
      const items = data?.items ?? data ?? []
      const arr = Array.isArray(items) ? items : []
      const { membership, job } = splitClubAdminApplications(arr)
      setApplications({ membership, job })
    } catch (e) {
      setApplications({ membership: [], job: [] })
      setLoadError(e?.message || 'Could not load applications.')
    } finally {
      setLoading(false)
    }
  }, [clubId, statusFilter])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const appType = activeTab === 'membership' ? 'membership' : 'job'
  const list = applications[appType]
  const pendingCount = applications.membership.filter((a) => a.status === 'Pending' || a.status === 'Reviewing').length
  const jobPendingCount = applications.job.filter((a) => a.status === 'Pending' || a.status === 'Reviewing').length

  const filteredList = useMemo(() => list.filter((app) => {
    const matchSearch = !search.trim() ||
      app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.studentId.includes(search) ||
      app.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || app.status === statusFilter
    const matchRole = appType !== 'job' || roleFilter === 'All' || app.roleType === roleFilter
    return matchSearch && matchStatus && matchRole
  }), [list, search, statusFilter, roleFilter, appType])

  const filteredIds = useMemo(() => new Set(filteredList.map((a) => a.id)), [filteredList])
  const allSelected = filteredList.length > 0 && filteredList.every((a) => selectedIds.has(a.id))
  const someSelected = selectedIds.size > 0

  const toggleTab = (tab) => {
    setActiveTab(tab)
    setRoleFilter('All')
    setSelectedIds(new Set())
    setDetailApplication(null)
  }

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredList.map((a) => a.id)))
  }

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleApprove = async (id, typeOverride) => {
    const t = typeOverride ?? appType
    const row = (applications?.[t] || []).find((a) => a.id === id)
    const who = row?.applicantName ? ` from ${row.applicantName}` : ''
    const kind = t === 'job' ? 'job application' : 'membership application'
    if (!window.confirm(`Approve this ${kind}${who}?`)) return
    try {
      await approveClubAdminApplication(clubId, id)
    } catch (e) {
      alert(e?.message || 'Approve failed.')
      return
    }
    setApplications((prev) => ({
      ...prev,
      [t]: prev[t].map((a) => (a.id === id ? { ...a, status: 'Approved' } : a))
    }))
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
    loadApplications()
  }
  const handleDisapprove = async (id, typeOverride) => {
    const t = typeOverride ?? appType
    const reason = window.prompt('Reason for rejection (optional)') || 'Rejected'
    try {
      await rejectClubAdminApplication(clubId, id, reason)
    } catch (e) {
      alert(e?.message || 'Reject failed.')
      return
    }
    setApplications((prev) => ({
      ...prev,
      [t]: prev[t].map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a))
    }))
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
    loadApplications()
  }

  const handleCallForInterview = async (id, typeOverride) => {
    const t = typeOverride ?? appType
    try {
      if (t === 'job') {
        await inviteClubAdminApplicationToInterview(clubId, id)
      } else {
        const changes = window.prompt('Note for applicant (optional)', 'Please update your application') ?? ''
        await requestChangesClubAdminApplication(clubId, id, changes || 'Review requested')
      }
    } catch (e) {
      alert(e?.message || 'Could not update application.')
      return
    }
    setApplications((prev) => ({
      ...prev,
      [t]: prev[t].map((a) => (a.id === id ? { ...a, status: t === 'job' ? 'InterviewInvited' : 'Reviewing' } : a))
    }))
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
    setDetailApplication(null)
    loadApplications()
  }

  const handleAddNote = async (id, _typeOverride, note) => {
    try {
      await addClubAdminApplicationNote(clubId, id, note)
    } catch (e) {
      alert(e?.message || 'Could not save note.')
    }
  }

  const handleBulkApprove = async () => {
    const ids = [...selectedIds]
    try {
      await clubAdminBulkDecision(clubId, { applicationIds: ids, decision: 'approve' })
    } catch (e) {
      alert(e?.message || 'Bulk approve failed.')
      return
    }
    setApplications((prev) => ({
      ...prev,
      [appType]: prev[appType].map((a) => (selectedIds.has(a.id) ? { ...a, status: 'Approved' } : a))
    }))
    setSelectedIds(new Set())
    loadApplications()
  }
  const handleBulkDisapprove = async () => {
    const ids = [...selectedIds]
    try {
      await clubAdminBulkDecision(clubId, { applicationIds: ids, decision: 'reject', reason: 'Bulk reject' })
    } catch (e) {
      alert(e?.message || 'Bulk reject failed.')
      return
    }
    setApplications((prev) => ({
      ...prev,
      [appType]: prev[appType].map((a) => (selectedIds.has(a.id) ? { ...a, status: 'Rejected' } : a))
    }))
    setSelectedIds(new Set())
    loadApplications()
  }

  const pillClass = (status) => {
    if (status === 'Approved') return 'club-admin-pill--approved'
    if (status === 'Rejected') return 'club-admin-pill--rejected'
    if (status === 'Reviewing') return 'club-admin-pill--reviewing'
    return 'club-admin-pill--pending'
  }

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Application Management</h1>
        <div className="club-admin-header-actions" style={{ marginLeft: 'auto' }}>
          <button type="button" className="club-admin-btn-secondary" onClick={() => navigate(`/club-admin/interview-times${clubQs}`)}>
            Interview Times
          </button>
          <button type="button" className="club-admin-btn-primary" onClick={() => navigate(`/club-admin/vacancies/new${clubQs}`)}>
            <IconPlus /> New Vacancy
          </button>
        </div>
      </header>

      <div className="club-admin-content">
        <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#64748b' }}>
          You have <strong>{pendingCount + jobPendingCount} pending</strong> applications requiring review.
        </p>
        {loadError ? (
          <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#b91c1c' }}>{loadError}</p>
        ) : null}

        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }}>
          <div className="club-admin-sidebar-nav" style={{ flexDirection: 'row', padding: 0, borderBottom: '1px solid #e2e8f0', gap: 0, marginBottom: 20 }}>
            <button
              type="button"
              className={`club-admin-nav-item ${activeTab === 'membership' ? 'club-admin-nav-item--active' : ''}`}
              style={{ borderRadius: 0, borderBottom: activeTab === 'membership' ? '2px solid #2563eb' : '2px solid transparent' }}
              onClick={() => toggleTab('membership')}
            >
              Membership Requests
              <span className="club-admin-pill club-admin-pill--pending" style={{ marginLeft: 8 }}>{pendingCount}</span>
            </button>
            <button
              type="button"
              className={`club-admin-nav-item ${activeTab === 'job' ? 'club-admin-nav-item--active' : ''}`}
              style={{ borderRadius: 0, borderBottom: activeTab === 'job' ? '2px solid #2563eb' : '2px solid transparent' }}
              onClick={() => toggleTab('job')}
            >
              Job Vacancy Applications
              <span className="club-admin-pill club-admin-pill--pending" style={{ marginLeft: 8 }}>{jobPendingCount}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div className="club-admin-header-search" style={{ flex: '1 1 280px', maxWidth: 'none' }}>
              <IconSearch />
              <input
                type="text"
                placeholder="Search by name, student ID, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search"
              />
            </div>
            <select style={{ width: 140, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSelectedIds(new Set()) }}>
              <option value="All">Status: All</option>
              <option value="Pending">Pending</option>
              <option value="Reviewing">Reviewing</option>
              <option value="InterviewInvited">InterviewInvited</option>
              <option value="InterviewScheduled">InterviewScheduled</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            {activeTab === 'job' && (
              <select style={{ width: 160, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">Role: All</option>
                {[...new Set(list.map((a) => a.roleType))].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}
          </div>

          {someSelected && (
            <div className="club-admin-bulk-bar">
              <span><strong>{selectedIds.size}</strong> selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="club-admin-btn-secondary" onClick={handleBulkApprove}><IconCheck /> Approve selected</button>
                <button type="button" className="club-admin-btn-danger" onClick={handleBulkDisapprove}><IconX /> Disapprove selected</button>
              </div>
            </div>
          )}

          <div className="club-admin-table-wrap">
          <table className="club-admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={filteredList.length > 0 && allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Applicant</th>
                <th>Student ID</th>
                {activeTab === 'job' && <th>Role / Type</th>}
                <th>Applied On</th>
                {activeTab === 'job' && <th>Interview</th>}
                {activeTab === 'job' && <th>Status</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'job' ? 8 : 6} style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                    Loading applications...
                  </td>
                </tr>
              ) : null}
              {filteredList.slice(0, 10).map((app) => (
                <tr key={app.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${app.applicantName}`}
                      checked={selectedIds.has(app.id)}
                      onChange={() => toggleSelectOne(app.id)}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{app.applicantName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{app.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{app.studentId}</td>
                  {activeTab === 'job' && <td>{app.roleType}</td>}
                  <td>{app.appliedOn}</td>
                  {activeTab === 'job' && (
                    <td style={{ fontSize: 13, color: '#475569', maxWidth: 200 }}>
                      {app.interviewStartsAt
                        ? formatInterviewTimeShort(app.interviewStartsAt, app.interviewEndsAt)
                        : app.interviewSlotId
                          ? 'See details'
                          : '—'}
                    </td>
                  )}
                  {activeTab === 'job' && <td><span className={`club-admin-pill ${pillClass(app.status)}`}>{app.status}</span></td>}
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        className="club-admin-btn-icon"
                        aria-label="View details"
                        onClick={async () => {
                          try {
                            const raw = await fetchClubAdminApplication(clubId, app.id)
                            const mapped = mapClubAdminApplicationDetailFromApi(raw)
                            setDetailApplication({ app: mapped || app, type: appType })
                          } catch {
                            setDetailApplication({ app, type: appType })
                          }
                        }}
                      ><IconEye /></button>
                      <button type="button" className="club-admin-btn-icon club-admin-btn-icon--approve" aria-label="Approve" onClick={() => handleApprove(app.id)}><IconCheck /></button>
                      <button type="button" className="club-admin-btn-icon club-admin-btn-icon--reject" aria-label="Disapprove" onClick={() => handleDisapprove(app.id)}><IconX /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'job' ? 8 : 6} style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                    No applications found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>

          <div className="club-admin-pagination">
            <span>Showing 1 - {Math.min(filteredList.length, 10)} of {filteredList.length} requests</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="club-admin-btn-secondary" disabled>Previous</button>
              <button type="button" className="club-admin-btn-secondary">Next</button>
            </div>
          </div>
        </div>
      </div>

      {detailApplication && (
        <ClubAdminApplicationDetail
          application={detailApplication.app}
          type={detailApplication.type}
          onClose={() => setDetailApplication(null)}
          onApprove={handleApprove}
          onDisapprove={handleDisapprove}
          onCallForInterview={handleCallForInterview}
          onAddNote={handleAddNote}
        />
      )}
    </>
  )
}

export default ClubAdminApplications