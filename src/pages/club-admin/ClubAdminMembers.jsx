import React, { useState, useMemo } from 'react'
import {
  mockClubMembers as initialMembers,
  mockClubEmployees as initialEmployees,
  EMPLOYEE_POSITIONS as employeePositionsList
} from '../../data/clubAdminData'
import './ClubAdmin.css'

const mockClubMembers = Array.isArray(initialMembers) ? initialMembers : []
const mockClubEmployees = Array.isArray(initialEmployees) ? initialEmployees : []
const EMPLOYEE_POSITION_TITLES = Array.isArray(employeePositionsList)
  ? employeePositionsList.map((p) => (typeof p === 'string' ? p : p.title))
  : ['Marketing Coordinator', 'Event Coordinator', 'Lead Designer', 'Content Writer', 'Treasurer', 'Outreach Lead']

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
)

const ClubAdminMembers = () => {
  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers] = useState(mockClubMembers)
  const [employees, setEmployees] = useState(mockClubEmployees)
  const [search, setSearch] = useState('')
  const [employeePendingChanges, setEmployeePendingChanges] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState({ id: null, type: null })

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
        (e.position && e.position.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
    )
  }, [employees, search])

  const handleUpdateEmployeePosition = (id, newPosition) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, position: newPosition } : e)))
    setEmployeePendingChanges((prev) => ({
      ...prev,
      [id]: newPosition
    }))
  }

  const handleConfirmEmployeePositionChanges = async () => {
    const changes = Object.entries(employeePendingChanges).map(([id, position]) => ({
      id: Number(id),
      position
    }))
    if (!changes.length) return
    setIsSaving(true)
    try {
      await fetch('/api/club-admin/employees/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes })
      })
      setEmployeePendingChanges({})
    } catch (error) {
      console.error('Failed to update employee positions', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = (id, type) => {
    setRemoveConfirm({ id, type })
  }

  const confirmRemove = () => {
    if (removeConfirm.id == null) return
    if (removeConfirm.type === 'members') {
      setMembers((prev) => prev.filter((m) => m.id !== removeConfirm.id))
    } else {
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
                        <select
                          className="club-admin-select-inline"
                          value={e.position ?? ''}
                          onChange={(ev) => handleUpdateEmployeePosition(e.id, ev.target.value)}
                          aria-label={`Update position for ${e.name} ${e.surname}`}
                        >
                          {EMPLOYEE_POSITION_TITLES.map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
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

          {activeTab === 'members' && filteredMembers.length === 0 && (
            <p className="club-admin-table-empty">No members found.</p>
          )}
          {activeTab === 'employees' && filteredEmployees.length === 0 && (
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
