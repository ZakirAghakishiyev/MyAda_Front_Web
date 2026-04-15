import React, { useMemo, useState } from 'react'
import { mockJobVacancyApplications } from '../../data/clubAdminData'
import './ClubAdmin.css'

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

const buildTimeSlots = ({ date, startTime, endTime, interviewLength, vacancy }) => {
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
      id: `${date}-${slotStart}-${slotEnd}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      startTime: formatTimeLabel(slotStart),
      endTime: formatTimeLabel(slotEnd),
      duration: interviewLength,
      vacancy: vacancy || 'All vacancies'
    })
    cursor += interviewLength
  }
  return slots
}

export default function ClubAdminInterviewTimes() {
  const vacancies = useMemo(
    () => ['All vacancies', ...new Set(mockJobVacancyApplications.map((a) => a.roleType))],
    []
  )

  const [form, setForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    interviewLength: 20,
    vacancy: 'All vacancies'
  })
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkVacancy, setBulkVacancy] = useState('All vacancies')

  const [editingId, setEditingId] = useState(null)
  const [editingDraft, setEditingDraft] = useState(null)

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleGenerateSlots = (e) => {
    e.preventDefault()
    setError('')

    const generated = buildTimeSlots(form)
    if (!generated.length) {
      setError('Please provide a valid date, interval, and interview length to generate slots.')
      return
    }

    setSlots((prev) => [...generated, ...prev])
  }

  const handleDeleteSlot = (id) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== id))
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

  const handleBulkAssignVacancy = () => {
    if (!selectedIds.size) return
    setSlots((prev) =>
      prev.map((slot) =>
        selectedIds.has(slot.id)
          ? { ...slot, vacancy: bulkVacancy || 'All vacancies' }
          : slot
      )
    )
  }

  const handleStartEdit = (slot) => {
    setEditingId(slot.id)
    setEditingDraft({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      vacancy: slot.vacancy
    })
  }

  const handleSaveEdit = (id) => {
    const duration = Number(editingDraft.duration)
    if (!editingDraft.date || !editingDraft.startTime || !editingDraft.endTime || duration <= 0) {
      return
    }
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === id
          ? {
              ...slot,
              date: editingDraft.date,
              startTime: editingDraft.startTime,
              endTime: editingDraft.endTime,
              duration,
              vacancy: editingDraft.vacancy || 'All vacancies'
            }
          : slot
      )
    )
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
              <label htmlFor="interview-vacancy">Vacancy specificity</label>
              <select
                id="interview-vacancy"
                value={form.vacancy}
                onChange={(e) => updateForm('vacancy', e.target.value)}
              >
                {vacancies.map((vacancy) => (
                  <option key={vacancy} value={vacancy}>
                    {vacancy}
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
                  value={bulkVacancy}
                  onChange={(e) => setBulkVacancy(e.target.value)}
                >
                  {vacancies.map((vacancy) => (
                    <option key={vacancy} value={vacancy}>
                      {vacancy}
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

          {!slots.length ? (
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
                              value={editingDraft.vacancy}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, vacancy: e.target.value }))}
                            >
                              {vacancies.map((vacancy) => (
                                <option key={vacancy} value={vacancy}>
                                  {vacancy}
                                </option>
                              ))}
                            </select>
                          ) : (
                            slot.vacancy
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
