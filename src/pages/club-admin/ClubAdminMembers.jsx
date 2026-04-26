import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  fetchClubAdminMembers,
  fetchClubAdminEmployees,
  fetchClubAdminPositions,
  patchClubAdminEmployeesPositions,
  deleteClubAdminMember,
  deleteClubAdminEmployee,
  clubAdminListItems,
} from '../../api/clubApi'
import { displayNameFromAuthUserDto, fetchAuthUserForClubRoster, personNamePartsFromClubRosterDto } from '../../api/authUsersApi'
import { useClubAdminClubId } from '../../hooks/useClubAdminClubId'
import { clubEmployeePositionDropdownFromApi, findClubPositionByName } from '../../data/clubAdminData'
import { parseUserGuidString, pickClubEmployeePersonLookupKey, pickClubRosterLookupKey, pickMemberUserGuidFromApiDto } from '../../utils/userGuids'
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
      const memItems = clubAdminListItems(memRes)
      const empItems = clubAdminListItems(empRes)
      const posItems = clubAdminListItems(posRes)
      const positions = clubEmployeePositionDropdownFromApi(posItems)
      setPositionOptions(positions)

      const baseMembers = (Array.isArray(memItems) ? memItems : []).map((m, index) => {
        const lookupKey = pickClubRosterLookupKey(m) ?? ''
        const pre = personNamePartsFromClubRosterDto(m)
        return {
          // DELETE /members/{memberId} — backend expects the same user GUID as the list DTO.
          id: lookupKey || `m-${index}`,
          userId: lookupKey,
          name: pre.name,
          surname: pre.surname,
          email: pre.email,
          joinedDate: m.joinedDate ?? m.joinedAt ?? m.createdAt ?? '—',
          raw: m,
        }
      })
      setMembers(baseMembers)
      const uniqueMemberKeys = Array.from(new Set(baseMembers.map((m) => m.userId).filter(Boolean)))
      const memberById = new Map()
      if (uniqueMemberKeys.length) {
        const profiles = await Promise.all(
          uniqueMemberKeys.map((uid) => fetchAuthUserForClubRoster(uid).catch(() => null))
        )
        uniqueMemberKeys.forEach((uid, i) => {
          const p = profiles[i]
          if (p && typeof p === 'object') memberById.set(uid, p)
        })
      }
      setMembers((prev) =>
        prev.map((m) => {
          const p = m.userId ? memberById.get(m.userId) : null
          const raw = m.raw
          if (!p) {
            const fromRaw =
              displayNameFromAuthUserDto(raw) ||
              String(raw?.name ?? raw?.firstName ?? '').trim() ||
              `${m.name} ${m.surname}`.trim()
            if (!fromRaw || fromRaw === '—') return m
            const parts = fromRaw.split(/\s+/).filter(Boolean)
            return {
              ...m,
              name: parts[0] || m.name,
              surname: parts.slice(1).join(' ') || m.surname,
              email: String(raw?.email ?? '').trim() || m.email,
            }
          }
          const first = String(p.firstName ?? p.FirstName ?? '').trim()
          const last = String(p.lastName ?? p.LastName ?? '').trim()
          const full = displayNameFromAuthUserDto(p)
          if (first || last) {
            return {
              ...m,
              name: first || m.name,
              surname: last,
              email: String(p.email ?? p.Email ?? '').trim() || m.email,
            }
          }
          return {
            ...m,
            name: full || m.name,
            surname: '',
            email: String(p.email ?? p.Email ?? '').trim() || m.email,
          }
        })
      )
      const baseEmployees = (Array.isArray(empItems) ? empItems : []).map((e, index) => {
        let positionId = String(e.positionId ?? e.position?.id ?? '').trim()
        const titleFromDto =
          (typeof e.position === 'string' ? e.position : null) ??
          e.position?.name ??
          ''
        if (!positionId && titleFromDto) {
          const hit = findClubPositionByName(positions, titleFromDto)
          if (hit) positionId = hit.id
        }
        if (!positionId) positionId = String(positions[0]?.id ?? '')
        const positionName =
          (typeof e.position === 'string' ? e.position : null) ??
          e.position?.name ??
          positions.find((p) => p.id === positionId)?.name ??
          '—'
        const lookupKey = pickClubEmployeePersonLookupKey(e) ?? ''
        const pre = personNamePartsFromClubRosterDto(e)
        return {
          id: String(e.id ?? e.employeeId ?? `e-${index}`),
          userId: lookupKey,
          name: pre.name,
          surname: pre.surname,
          email: pre.email,
          positionId,
          positionName,
          department: e.department ?? '',
          joinedDate: e.joinedDate ?? e.joinedAt ?? '—',
          raw: e,
        }
      })
      setEmployees(baseEmployees)
      const uniqueEmployeeKeys = Array.from(new Set(baseEmployees.map((e) => e.userId).filter(Boolean)))
      const empById = new Map()
      if (uniqueEmployeeKeys.length) {
        const empProfiles = await Promise.all(
          uniqueEmployeeKeys.map((uid) => fetchAuthUserForClubRoster(uid).catch(() => null))
        )
        uniqueEmployeeKeys.forEach((uid, i) => {
          const p = empProfiles[i]
          if (p && typeof p === 'object') empById.set(uid, p)
        })
      }
      setEmployees((prev) =>
        prev.map((e) => {
          const p = e.userId ? empById.get(e.userId) : null
          const raw = e.raw
          if (!p) {
            const member = raw?.member ?? raw?.Member
            const fromNested =
              (member && typeof member === 'object' && displayNameFromAuthUserDto(member)) || ''
            const fromRaw =
              fromNested ||
              displayNameFromAuthUserDto(raw) ||
              String(raw?.name ?? raw?.firstName ?? '').trim() ||
              `${e.name} ${e.surname}`.trim()
            if (!fromRaw || fromRaw === '—') return e
            const parts = fromRaw.split(/\s+/).filter(Boolean)
            return {
              ...e,
              name: parts[0] || e.name,
              surname: parts.slice(1).join(' ') || e.surname,
              email:
                String(raw?.email ?? member?.email ?? member?.Email ?? '').trim() || e.email,
            }
          }
          const first = String(p.firstName ?? p.FirstName ?? '').trim()
          const last = String(p.lastName ?? p.LastName ?? '').trim()
          const full = displayNameFromAuthUserDto(p)
          if (first || last) {
            return {
              ...e,
              name: first || e.name,
              surname: last,
              email: String(p.email ?? p.Email ?? '').trim() || e.email,
            }
          }
          return {
            ...e,
            name: full || e.name,
            surname: '',
            email: String(p.email ?? p.Email ?? '').trim() || e.email,
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
        m.email.toLowerCase().includes(q)
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
      const member = members.find((m) => m.id === removeConfirm.id)
      const idForApi =
        pickMemberUserGuidFromApiDto(member?.raw) ||
        parseUserGuidString(member?.id) ||
        parseUserGuidString(member?.userId) ||
        null
      if (!idForApi) {
        alert('Could not remove member: missing valid user id. Refresh the page and try again.')
        return
      }
      try {
        await deleteClubAdminMember(clubId, idForApi)
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="club-admin-table-empty">Loading members...</td>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="club-admin-table-empty">Loading employees...</td>
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
