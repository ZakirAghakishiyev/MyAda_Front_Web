import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchClubAdminInterviewSlots,
  fetchClubAdminVacancies,
  generateClubAdminInterviewSlots,
  patchClubAdminInterviewSlot,
  deleteClubAdminInterviewSlot,
} from '../../api/clubApi'
import { useClubAdminClubId } from '../../hooks/useClubAdminClubId'
import './ClubAdmin.css'

const pad2 = (n) => String(n).padStart(2, '0')

const formatDateLabel = (dateValue) => {
  if (!dateValue) return '-'
  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateValue
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatTimeLabel = (minutes) => {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

const toMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

const buildTimeSlots = ({ date, startTime, endTime, interviewLength }) => {
  const startMinutes = toMinutes(startTime)
  const endMinutes = toMinutes(endTime)
  if (!date || !startTime || !endTime || !interviewLength || interviewLength <= 0) return []
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return []
  const slots = []
  let cursor = startMinutes
  while (cursor + interviewLength <= endMinutes) {
    const slotStart = cursor
    const slotEnd = cursor + interviewLength
    slots.push({
      date,
      startTime: formatTimeLabel(slotStart),
      endTime: formatTimeLabel(slotEnd),
      duration: interviewLength,
    })
    cursor += interviewLength
  }
  return slots
}

function vacancyLabel(vacancies, vacancyId) {
  if (vacancyId == null || vacancyId === '') return 'All vacancies'
  const v = vacancies.find((x) => String(x.id) === String(vacancyId))
  return v ? v.title : String(vacancyId)
}

function mapSlotFromApi(s, idx, vacancies) {
  const startsAt = s.startsAt ? new Date(s.startsAt) : null
  const endsAt = s.endsAt ? new Date(s.endsAt) : null
  let date = ''
  let startTime = ''
  let endTime = ''
  if (startsAt && !Number.isNaN(startsAt.getTime())) {
    date = `${startsAt.getFullYear()}-${pad2(startsAt.getMonth() + 1)}-${pad2(startsAt.getDate())}`
    startTime = `${pad2(startsAt.getHours())}:${pad2(startsAt.getMinutes())}`
  }
  if (endsAt && !Number.isNaN(endsAt.getTime())) {
    endTime = `${pad2(endsAt.getHours())}:${pad2(endsAt.getMinutes())}`
  }
  const duration =
    startsAt && endsAt && !Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime())
      ? Math.max(5, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))
      : Number(s.interviewLength ?? s.duration ?? 30) || 30
  const vacancyId = s.vacancyId != null ? String(s.vacancyId) : ''
  return {
    id: String(s.id ?? s.slotId ?? `slot-${idx}`),
    date,
    startTime,
    endTime,
    duration,
    vacancyId,
    vacancyLabel: vacancyLabel(vacancies, vacancyId),
    capacity: s.capacity != null ? Number(s.capacity) : undefined,
  }
}

function combineLocalDateTimeIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return undefined
  const [hh, mm] = timeStr.split(':').map((x) => Number(x))
  const [y, mo, d] = dateStr.split('-').map((x) => Number(x))
  if ([hh, mm, y, mo, d].some((n) => Number.isNaN(n))) return undefined
  const dt = new Date(y, mo - 1, d, hh, mm, 0, 0)
  return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString()
}

export default function ClubAdminInterviewTimes() {
  const clubId = useClubAdminClubId()
  const [vacancies, setVacancies] = useState([])

  const [form, setForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    interviewLength: 30,
    vacancyId: '',
  })
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkVacancyId, setBulkVacancyId] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editingDraft, setEditingDraft] = useState(null)

  const loadSlots = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [slotRes, vacancyRes] = await Promise.all([
        fetchClubAdminInterviewSlots(clubId),
        fetchClubAdminVacancies(clubId).catch(() => ({ items: [] })),
      ])
      const vacItems = vacancyRes?.items ?? vacancyRes ?? []
      const vacList = (Array.isArray(vacItems) ? vacItems : [])
        .map((v) => ({
          id: String(v.id ?? ''),
          title: String(v.title ?? v.position ?? 'Vacancy'),
        }))
        .filter((v) => v.id)
      setVacancies(vacList)

      const slotItems = slotRes?.items ?? slotRes ?? []
      const mappedSlots = Array.isArray(slotItems)
        ? slotItems.map((s, idx) => mapSlotFromApi(s, idx, vacList))
        : []
      setSlots(mappedSlots)
      setForm((prev) =>
        prev.vacancyId && !vacList.some((v) => v.id === prev.vacancyId)
          ? { ...prev, vacancyId: '' }
          : prev
      )
    } catch (e) {
      setSlots([])
      setVacancies([])
      setLoadError(e?.message || 'Could not load interview slots.')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleGenerateSlots = async (e) => {
    e.preventDefault()
    setError('')
    const generated = buildTimeSlots(form)
    if (!generated.length) {
      setError('Please provide a valid date, interval, and interview length to generate slots.')
      return
    }
    try {
      const body = {
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        interviewLength: Number(form.interviewLength) || 30,
      }
      if (form.vacancyId) body.vacancy = form.vacancyId
      await generateClubAdminInterviewSlots(clubId, body)
      await loadSlots()
    } catch (err) {
      setError(err?.message || 'Could not generate interview slots.')
    }
  }

  const handleDeleteSlot = async (id) => {
    try {
      await deleteClubAdminInterviewSlot(clubId, id)
    } catch (err) {
      alert(err?.message || 'Could not delete slot.')
      return
    }
    await loadSlots()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (editingId === id) {
      setEditingId(null)
      setEditingDraft(null)
    }
  }

  const toggleSelectAll = () => {
    if (slots.length && selectedIds.size === slots.length) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(slots.map((slot) => slot.id)))
  }

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkAssignVacancy = async () => {
    if (!selectedIds.size) return
    const ids = [...selectedIds]
    try {
      await Promise.all(
        ids.map((id) =>
          patchClubAdminInterviewSlot(clubId, id, {
            vacancyId: bulkVacancyId || undefined,
          })
        )
      )
      await loadSlots()
    } catch (err) {
      alert(err?.message || 'Could not assign vacancy to selected slots.')
    }
  }

  const handleStartEdit = (slot) => {
    setEditingId(slot.id)
    setEditingDraft({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      vacancyId: slot.vacancyId,
      capacity: slot.capacity,
    })
  }

  const handleSaveEdit = async (id) => {
    const duration = Number(editingDraft.duration)
    if (!editingDraft.date || !editingDraft.startTime || !editingDraft.endTime || duration <= 0) {
      return
    }
    const startsAt = combineLocalDateTimeIso(editingDraft.date, editingDraft.startTime)
    let endsAt = combineLocalDateTimeIso(editingDraft.date, editingDraft.endTime)
    if (startsAt && endsAt) {
      const sMs = new Date(startsAt).getTime()
      let eMs = new Date(endsAt).getTime()
      if (eMs <= sMs) {
        eMs = sMs + duration * 60000
        endsAt = new Date(eMs).toISOString()
      }
    }
    try {
      await patchClubAdminInterviewSlot(clubId, id, {
        startsAt,
        endsAt,
        vacancyId: editingDraft.vacancyId || undefined,
        capacity: editingDraft.capacity != null && editingDraft.capacity !== '' ? Number(editingDraft.capacity) : undefined,
      })
      await loadSlots()
    } catch (err) {
      alert(err?.message || 'Could not save slot changes.')
      return
    }
    setEditingId(null)
    setEditingDraft(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDraft(null)
  }

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Interview Times</h1>
      </header>

      <div className="club-admin-content">
        {loadError ? (
          <p style={{ margin: '0 24px 16px', fontSize: 14, color: '#b91c1c' }}>{loadError}</p>
        ) : null}
        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }}>
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Create Interview Time Slots</h2>
          </div>

          <form onSubmit={handleGenerateSlots}>
            <div className="club-admin-form-row club-admin-form-row--interview-times">
              <div className="club-admin-field">
                <label htmlFor="interview-date">Date</label>
                <input
                  id="interview-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  required
                />
              </div>

              <div className="club-admin-field">
                <label htmlFor="interview-start">Start time</label>
                <input
                  id="interview-start"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => updateForm('startTime', e.target.value)}
                  required
                />
              </div>

              <div className="club-admin-field">
                <label htmlFor="interview-end">End time</label>
                <input
                  id="interview-end"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => updateForm('endTime', e.target.value)}
                  required
                />
              </div>

              <div className="club-admin-field">
                <label htmlFor="interview-length">Approx. interview length (minutes)</label>
                <input
                  id="interview-length"
                  type="number"
                  min="5"
                  step="5"
                  value={form.interviewLength}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    updateForm('interviewLength', Number.isNaN(value) ? 5 : Math.max(5, value))
                  }}
                  required
                />
              </div>
            </div>

            <div className="club-admin-field">
              <label htmlFor="interview-vacancy">Vacancy (optional)</label>
              <select
                id="interview-vacancy"
                value={form.vacancyId}
                onChange={(e) => updateForm('vacancyId', e.target.value)}
              >
                <option value="">All vacancies</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="club-admin-interview-error">{error}</p>}

            <button type="submit" className="club-admin-btn-primary">
              Generate time slots
            </button>
          </form>
        </div>

        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }}>
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Created Time Slots</h2>
          </div>

          {slots.length > 0 && (
            <div className="club-admin-bulk-bar" style={{ marginBottom: 16 }}>
              <span>
                <strong>{selectedIds.size}</strong> selected
              </span>
              <div className="club-admin-interview-bulk-controls">
                <select
                  className="club-admin-interview-bulk-select"
                  value={bulkVacancyId}
                  onChange={(e) => setBulkVacancyId(e.target.value)}
                >
                  <option value="">All vacancies</option>
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="club-admin-btn-secondary"
                  onClick={handleBulkAssignVacancy}
                  disabled={!selectedIds.size}
                >
                  Assign selected to vacancy
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="club-admin-table-empty">Loading timeslots...</p>
          ) : !slots.length ? (
            <p className="club-admin-table-empty">No timeslots yet. Create a batch from the form above.</p>
          ) : (
            <div className="club-admin-table-wrap">
              <table className="club-admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        aria-label="Select all time slots"
                        checked={slots.length > 0 && selectedIds.size === slots.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Length</th>
                    <th>Vacancy</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => {
                    const isEditing = editingId === slot.id
                    return (
                      <tr key={slot.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select timeslot ${slot.startTime}`}
                            checked={selectedIds.has(slot.id)}
                            onChange={() => toggleSelectOne(slot.id)}
                          />
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="date"
                              value={editingDraft.date}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, date: e.target.value }))}
                            />
                          ) : (
                            formatDateLabel(slot.date)
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="time"
                              value={editingDraft.startTime}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, startTime: e.target.value }))}
                            />
                          ) : (
                            slot.startTime
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="time"
                              value={editingDraft.endTime}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, endTime: e.target.value }))}
                            />
                          ) : (
                            slot.endTime
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min="5"
                              step="5"
                              value={editingDraft.duration}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                            />
                          ) : (
                            `${slot.duration} min`
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              value={editingDraft.vacancyId}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, vacancyId: e.target.value }))}
                            >
                              <option value="">All vacancies</option>
                              {vacancies.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.title}
                                </option>
                              ))}
                            </select>
                          ) : (
                            slot.vacancyLabel
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {isEditing ? (
                              <>
                                <button type="button" className="club-admin-btn-secondary" onClick={() => handleSaveEdit(slot.id)}>
                                  Save
                                </button>
                                <button type="button" className="club-admin-btn-secondary" onClick={handleCancelEdit}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="club-admin-btn-secondary" onClick={() => handleStartEdit(slot)}>
                                  Amend
                                </button>
                                <button type="button" className="club-admin-btn-danger" onClick={() => handleDeleteSlot(slot.id)}>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
