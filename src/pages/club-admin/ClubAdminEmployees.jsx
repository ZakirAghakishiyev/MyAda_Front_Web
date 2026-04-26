import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  fetchClubAdminEmployees,
  fetchClubAdminPositions,
  patchClubAdminEmployeesPositions,
  deleteClubAdminEmployee,
  clubAdminListItems,
} from '../../api/clubApi'
import { displayNameFromAuthUserDto, fetchAuthUserForClubRoster, personNamePartsFromClubRosterDto } from '../../api/authUsersApi'
import { useClubAdminClubId } from '../../hooks/useClubAdminClubId'
import { clubEmployeePositionDropdownFromApi, findClubPositionByName } from '../../data/clubAdminData'
import { pickClubEmployeePersonLookupKey } from '../../utils/userGuids'
import './ClubAdmin.css'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
)

const ClubAdminEmployees = () => {
  const clubId = useClubAdminClubId()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState({})
  const [positionOptions, setPositionOptions] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(null)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [res, posRes] = await Promise.all([
        fetchClubAdminEmployees(clubId),
        fetchClubAdminPositions(clubId).catch(() => ({ items: [] })),
      ])
      const items = clubAdminListItems(res)
      const posItems = clubAdminListItems(posRes)
      const positions = clubEmployeePositionDropdownFromApi(posItems)
      setPositionOptions(positions)
      const base = (Array.isArray(items) ? items : []).map((e, index) => {
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
        const pre = personNamePartsFromClubRosterDto(e)
        const lookupKey = pickClubEmployeePersonLookupKey(e) ?? ''
        return {
          id: String(e.id ?? e.employeeId ?? `e-${index}`),
          userId: lookupKey,
          name: pre.name,
          surname: pre.surname,
          email: pre.email,
          positionId,
          positionName,
          department: e.department ?? '',
          age: e.age,
          joinedDate: e.joinedDate ?? e.joinedAt ?? '—',
          raw: e,
        }
      })
      setEmployees(base)

      const uniqueKeys = Array.from(new Set(base.map((row) => row.userId).filter(Boolean)))
      const byId = new Map()
      if (uniqueKeys.length) {
        const profiles = await Promise.all(
          uniqueKeys.map((uid) => fetchAuthUserForClubRoster(uid).catch(() => null))
        )
        uniqueKeys.forEach((uid, i) => {
          const p = profiles[i]
          if (p && typeof p === 'object') byId.set(uid, p)
        })
      }
      // Always run name fallbacks: when no auth lookup key, or profile 403, club DTO + nested fields must still surface names.
      setEmployees((prev) =>
        prev.map((row) => {
          const p = row.userId ? byId.get(row.userId) : null
          const raw = row.raw
          if (!p) {
            const fromRaw =
              displayNameFromAuthUserDto(raw) ||
              String(raw?.name ?? raw?.Name ?? raw?.firstName ?? raw?.FirstName ?? '').trim() ||
              `${row.name} ${row.surname}`.trim()
            if (!fromRaw || fromRaw === '—') return { ...row, raw: undefined }
            const parts = fromRaw.split(/\s+/).filter(Boolean)
            return {
              ...row,
              name: parts[0] || row.name,
              surname: parts.slice(1).join(' ') || row.surname,
              email: String(raw?.email ?? raw?.Email ?? '').trim() || row.email,
              raw: undefined,
            }
          }
          const first = String(p.firstName ?? p.FirstName ?? '').trim()
          const last = String(p.lastName ?? p.LastName ?? '').trim()
          const full = displayNameFromAuthUserDto(p)
          const next =
            first || last
              ? { name: first || row.name, surname: last, email: String(p.email ?? p.Email ?? '').trim() || row.email }
              : {
                  name: full || row.name,
                  surname: '',
                  email: String(p.email ?? p.Email ?? '').trim() || row.email,
                }
          return { ...row, ...next, raw: undefined }
        })
      )
    } catch (e) {
      setEmployees([])
      setLoadError(e?.message || 'Could not load employees.')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const filtered = useMemo(() => {
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

  const handleUpdatePosition = (id, newPositionId) => {
    const name = positionOptions.find((p) => p.id === newPositionId)?.name ?? '—'
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, positionId: newPositionId, positionName: name } : e)))
    setPendingChanges((prev) => ({
      ...prev,
      [id]: newPositionId
    }))
  }

  const handleConfirmPositionChanges = async () => {
    const changes = Object.entries(pendingChanges).map(([employeeId, positionId]) => ({
      employeeId: String(employeeId),
      positionId: String(positionId),
    }))
    if (!changes.length) return
    setIsSaving(true)
    try {
      await patchClubAdminEmployeesPositions(clubId, { changes })
      setPendingChanges({})
    } catch (error) {
      alert(error?.message || 'Failed to update employee positions.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = (id) => {
    setRemoveConfirm(id)
  }

  const confirmRemove = async () => {
    if (removeConfirm != null) {
      try {
        await deleteClubAdminEmployee(clubId, removeConfirm)
      } catch (e) {
        alert(e?.message || 'Could not remove employee.')
        return
      }
      setEmployees((prev) => prev.filter((e) => e.id !== removeConfirm))
      setRemoveConfirm(null)
    }
  }

  return (
    <div className="club-admin-page">
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Employees</h1>
        <div className="club-admin-header-search" style={{ flex: '1 1 280px', maxWidth: 360 }}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search employees"
          />
        </div>
      </header>

      <div className="club-admin-content">
        {loadError ? (
          <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#b91c1c' }}>{loadError}</p>
        ) : null}
        <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#64748b' }}>
          Manage club employees (filled roles). Update position or remove.
        </p>

        <div className="club-admin-card" style={{ margin: '0 24px 24px' }}>
          <div className="club-admin-table-wrap">
          <table className="club-admin-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Age</th>
                <th>Position</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="club-admin-table-empty">Loading employees...</td>
                </tr>
              ) : null}
              {filtered.map((e) => (
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
                  <td>{e.age != null ? e.age : '—'}</td>
                  <td>
                    {positionOptions.length > 0 ? (
                      <select
                        className="club-admin-select-inline"
                        value={e.positionId ?? ''}
                        onChange={(ev) => handleUpdatePosition(e.id, ev.target.value)}
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
                      onClick={() => handleRemove(e.id)}
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {!loading && filtered.length === 0 && (
            <p className="club-admin-table-empty">No employees found.</p>
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
          onClick={(ev) => ev.target === ev.currentTarget && setRemoveConfirm(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-employee-title"
        >
          <div className="club-admin-popup club-admin-popup--sm" onClick={(ev) => ev.stopPropagation()}>
            <div className="club-admin-popup-header">
              <h2 id="remove-employee-title">Remove employee</h2>
              <button type="button" className="club-admin-popup-close" onClick={() => setRemoveConfirm(null)} aria-label="Close">×</button>
            </div>
            <div className="club-admin-popup-body">
              <p>Are you sure you want to remove this employee from their role? This action cannot be undone.</p>
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

export default ClubAdminEmployees
