import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  fetchClubAdminMembers,
  fetchClubAdminEmployees,
  fetchClubAdminPositions,
  patchClubAdminEmployeesPositions,
  deleteClubAdminMember,
  deleteClubAdminEmployee,
} from '../../api/clubApi'
import { useClubAdminClubId } from '../../hooks/useClubAdminClubId'
import './ClubAdmin.css'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
)

const ClubAdminMembers = () => {
  const clubId = useClubAdminClubId()
  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [employeePendingChanges, setEmployeePendingChanges] = useState({})
  const [positionOptions, setPositionOptions] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState({ id: null, type: null })

  const loadPeople = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [memRes, empRes, posRes] = await Promise.all([
        fetchClubAdminMembers(clubId),
        fetchClubAdminEmployees(clubId),
        fetchClubAdminPositions(clubId).catch(() => ({ items: [] })),
      ])
      const memItems = memRes?.items ?? memRes ?? []
      const empItems = empRes?.items ?? empRes ?? []
      const posItems = posRes?.items ?? posRes ?? []
      const positions = (Array.isArray(posItems) ? posItems : []).map((p, index) => ({
        id: String(p.id ?? p.positionId ?? `pos-${index}`),
        name: String(p.name ?? p.title ?? 'Position'),
      }))
      setPositionOptions(positions)

      setMembers(
        (Array.isArray(memItems) ? memItems : []).map((m, index) => ({
          id: m.id ?? m.memberId ?? `m-${index}`,
          name: m.name ?? m.firstName ?? 'Member',
          surname: m.surname ?? m.lastName ?? '',
          email: m.email ?? '',
          studentId: m.studentId ?? '—',
          joinedDate: m.joinedDate ?? m.joinedAt ?? '—',
        }))
      )
      setEmployees(
        (Array.isArray(empItems) ? empItems : []).map((e, index) => {
          const positionId = String(
            e.positionId ?? e.position?.id ?? positions[0]?.id ?? ''
          )
          const positionName =
            (typeof e.position === 'string' ? e.position : null) ??
            e.position?.name ??
            positions.find((p) => p.id === positionId)?.name ??
            '—'
          return {
            id: String(e.id ?? e.employeeId ?? `e-${index}`),
            name: e.name ?? e.firstName ?? 'Employee',
            surname: e.surname ?? e.lastName ?? '',
            email: e.email ?? '',
            positionId,
            positionName,
            department: e.department ?? '',
            joinedDate: e.joinedDate ?? e.joinedAt ?? '—',
          }
        })
      )
    } catch (e) {
      setMembers([])
      setEmployees([])
      setLoadError(e?.message || 'Could not load members and employees.')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    loadPeople()
  }, [loadPeople])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (m) =>
        `${m.name} ${m.surname}`.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.studentId && m.studentId.toLowerCase().includes(q))
    )
  }, [members, search])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(
      (e) =>
        `${e.name} ${e.surname}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.positionName && e.positionName.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
    )
  }, [employees, search])

  const handleUpdateEmployeePosition = (id, newPositionId) => {
    const name = positionOptions.find((p) => p.id === newPositionId)?.name ?? '—'
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, positionId: newPositionId, positionName: name } : e)))
    setEmployeePendingChanges((prev) => ({
      ...prev,
      [id]: newPositionId
    }))
  }

  const handleConfirmEmployeePositionChanges = async () => {
    const changes = Object.entries(employeePendingChanges).map(([employeeId, positionId]) => ({
      employeeId: String(employeeId),
      positionId: String(positionId),
    }))
    if (!changes.length) return
    setIsSaving(true)
    try {
      await patchClubAdminEmployeesPositions(clubId, { changes })
      setEmployeePendingChanges({})
    } catch (error) {
      alert(error?.message || 'Failed to update employee positions.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = (id, type) => {
    setRemoveConfirm({ id, type })
  }

  const confirmRemove = async () => {
    if (removeConfirm.id == null) return
    if (removeConfirm.type === 'members') {
      try {
        await deleteClubAdminMember(clubId, removeConfirm.id)
      } catch (e) {
        alert(e?.message || 'Could not remove member.')
        return
      }
      setMembers((prev) => prev.filter((m) => m.id !== removeConfirm.id))
    } else {
      try {
        await deleteClubAdminEmployee(clubId, removeConfirm.id)
      } catch (e) {
        alert(e?.message || 'Could not remove employee.')
        return
      }
      setEmployees((prev) => prev.filter((e) => e.id !== removeConfirm.id))
      setEmployeePendingChanges((prev) => {
        const next = { ...prev }
        delete next[removeConfirm.id]
        return next
      })
    }
    setRemoveConfirm({ id: null, type: null })
  }

  return (
    <div className="club-admin-page">
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Members</h1>
        <div className="club-admin-header-search" style={{ flex: '1 1 280px', maxWidth: 360 }}>
          <IconSearch />
          <input
            type="text"
            placeholder={activeTab === 'members' ? 'Search members by name, email, or student ID...' : 'Search employees by name, email, or position...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
        </div>
      </header>

      <div className="club-admin-content">
        {loadError ? (
          <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#b91c1c' }}>{loadError}</p>
        ) : null}
        <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#64748b' }}>
          Manage your club members and employees in one place.
        </p>

        <div className="club-admin-card" style={{ margin: '0 24px 24px' }}>
          <div className="club-admin-sidebar-nav" style={{ flexDirection: 'row', padding: 0, borderBottom: '1px solid #e2e8f0', gap: 0, marginBottom: 20 }}>
            <button
              type="button"
              className={`club-admin-nav-item ${activeTab === 'members' ? 'club-admin-nav-item--active' : ''}`}
              style={{ borderRadius: 0, borderBottom: activeTab === 'members' ? '2px solid #2563eb' : '2px solid transparent' }}
              onClick={() => {
                setActiveTab('members')
                setSearch('')
              }}
            >
              Members
              <span className="club-admin-pill club-admin-pill--pending" style={{ marginLeft: 8 }}>{members.length}</span>
            </button>
            <button
              type="button"
              className={`club-admin-nav-item ${activeTab === 'employees' ? 'club-admin-nav-item--active' : ''}`}
              style={{ borderRadius: 0, borderBottom: activeTab === 'employees' ? '2px solid #2563eb' : '2px solid transparent' }}
              onClick={() => {
                setActiveTab('employees')
                setSearch('')
              }}
            >
              Employees
              <span className="club-admin-pill club-admin-pill--pending" style={{ marginLeft: 8 }}>{employees.length}</span>
            </button>
          </div>

          <div className="club-admin-table-wrap">
            {activeTab === 'members' ? (
              <table className="club-admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Student ID</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="club-admin-table-empty">Loading members...</td>
                    </tr>
                  ) : null}
                  {filteredMembers.map((m) => (
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
                      <td>{m.joinedDate ?? '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="club-admin-btn-icon club-admin-btn-icon--reject"
                          aria-label="Remove member"
                          onClick={() => handleRemove(m.id, 'members')}
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="club-admin-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Position</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="club-admin-table-empty">Loading employees...</td>
                    </tr>
                  ) : null}
                  {filteredEmployees.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="club-admin-table-user">
                          <div className="club-admin-table-avatar" />
                          <div>
                            <div className="club-admin-table-name">{e.name} {e.surname}</div>
                            <a href={`mailto:${e.email}`} className="club-admin-table-email">{e.email}</a>
                          </div>
                        </div>
                      </td>
                      <td>
                        {positionOptions.length > 0 ? (
                          <select
                            className="club-admin-select-inline"
                            value={e.positionId ?? ''}
                            onChange={(ev) => handleUpdateEmployeePosition(e.id, ev.target.value)}
                            aria-label={`Update position for ${e.name} ${e.surname}`}
                          >
                            {positionOptions.map((pos) => (
                              <option key={pos.id} value={pos.id}>{pos.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: 13, color: '#64748b' }}>{e.positionName}</span>
                        )}
                      </td>
                      <td>{e.joinedDate ?? '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="club-admin-btn-icon club-admin-btn-icon--reject"
                          aria-label="Remove employee"
                          onClick={() => handleRemove(e.id, 'employees')}
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {activeTab === 'members' && !loading && filteredMembers.length === 0 && (
            <p className="club-admin-table-empty">No members found.</p>
          )}
          {activeTab === 'employees' && !loading && filteredEmployees.length === 0 && (
            <p className="club-admin-table-empty">No employees found.</p>
          )}
          {activeTab === 'employees' && Object.keys(employeePendingChanges).length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#0f172a' }}>You have unsaved position changes.</span>
              <button
                type="button"
                className="club-admin-btn-primary"
                onClick={handleConfirmEmployeePositionChanges}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Confirm changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {removeConfirm.id != null && (
        <div
          className="club-admin-popup-overlay"
          onClick={(e) => e.target === e.currentTarget && setRemoveConfirm({ id: null, type: null })}
          role="dialog"
          aria-modal="true"
          aria-labelledby={removeConfirm.type === 'members' ? 'remove-member-title' : 'remove-employee-title'}
        >
          <div className="club-admin-popup club-admin-popup--sm" onClick={(e) => e.stopPropagation()}>
            <div className="club-admin-popup-header">
              <h2 id={removeConfirm.type === 'members' ? 'remove-member-title' : 'remove-employee-title'}>
                {removeConfirm.type === 'members' ? 'Remove member' : 'Remove employee'}
              </h2>
              <button type="button" className="club-admin-popup-close" onClick={() => setRemoveConfirm({ id: null, type: null })} aria-label="Close">×</button>
            </div>
            <div className="club-admin-popup-body">
              <p>
                {removeConfirm.type === 'members'
                  ? 'Are you sure you want to remove this member from the club? This action cannot be undone.'
                  : 'Are you sure you want to remove this employee from their role? This action cannot be undone.'}
              </p>
            </div>
            <div className="club-admin-popup-footer">
              <button type="button" className="club-admin-btn-secondary" onClick={() => setRemoveConfirm({ id: null, type: null })}>Cancel</button>
              <button type="button" className="club-admin-btn-danger" onClick={confirmRemove}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubAdminMembers
