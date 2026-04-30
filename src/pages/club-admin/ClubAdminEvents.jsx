import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  clubAdminListItems,
  fetchClubAdminEvents,
  patchClubAdminEvent,
  fetchClubAdminEventAttendees,
  patchClubAdminEventAttendee,
  deleteClubAdminEventAttendee,
} from '../../api/clubApi'
import { mapEventFromApi } from '../../api/clubMappers'
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

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const IconMegaphone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
)

const todayIso = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatLocalDateTime = (dateValue, timeValue) => {
  const date = String(dateValue ?? '').trim()
  if (!date) return ''
  const rawTime = String(timeValue ?? '').trim() || '00:00'
  const normalizedTime =
    rawTime.length === 5 ? `${rawTime}:00` : rawTime.length === 8 ? rawTime : `${rawTime}:00`
  return `${date}T${normalizedTime}`
}

const calculateDurationHours = (startTime, endTime) => {
  const start = String(startTime ?? '').trim()
  const end = String(endTime ?? '').trim()
  if (!start || !end) return ''
  const base = '2026-01-01'
  const startDate = new Date(`${base}T${start.length === 5 ? `${start}:00` : start}`)
  const endDate = new Date(`${base}T${end.length === 5 ? `${end}:00` : end}`)
  const diffMs = endDate.getTime() - startDate.getTime()
  if (!Number.isFinite(diffMs) || diffMs <= 0) return ''
  const hours = diffMs / (60 * 60 * 1000)
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
}

const addHoursToLocalDateTime = (dateValue, startTime, durationHours, fallbackEndTime) => {
  const startDateTime = formatLocalDateTime(dateValue, startTime)
  if (!startDateTime) return ''
  const [datePart, timePart = '00:00:00'] = startDateTime.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes, seconds] = timePart.split(':').map(Number)
  const baseDate = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, seconds || 0)
  const parsedHours = Number(durationHours)
  if (Number.isFinite(parsedHours) && parsedHours > 0) {
    const result = new Date(baseDate.getTime() + parsedHours * 60 * 60 * 1000)
    const yyyy = result.getFullYear()
    const mm = String(result.getMonth() + 1).padStart(2, '0')
    const dd = String(result.getDate()).padStart(2, '0')
    const hh = String(result.getHours()).padStart(2, '0')
    const min = String(result.getMinutes()).padStart(2, '0')
    const ss = String(result.getSeconds()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`
  }
  return formatLocalDateTime(dateValue, fallbackEndTime || startTime)
}

const getEventStatusForUpdate = (event) =>
  String(
    event?.status ??
      event?.raw?.status ??
      event?.raw?.Status ??
      'Approved'
  ).trim() || 'Approved'

const getEventLocationPair = (event) => {
  const raw = event?.raw && typeof event.raw === 'object' ? event.raw : {}
  const buildingId = raw.buildingId ?? raw.BuildingId
  const roomId = raw.roomId ?? raw.RoomId
  if (buildingId == null || roomId == null || String(buildingId).trim() === '' || String(roomId).trim() === '') {
    return {}
  }
  return { buildingId, roomId }
}

/** @returns {number | null} Positive seat limit, or `null` if the API did not publish one. */
const getEventSeatLimit = (event) => {
  if (!event) return null
  const fromSeat = Number(event.seatLimit)
  if (Number.isFinite(fromSeat) && fromSeat > 0) return fromSeat
  const raw = event.raw && typeof event.raw === 'object' ? event.raw : {}
  const n = Number(
    raw.seatLimit ??
      raw.SeatLimit ??
      raw.capacity ??
      raw.Capacity ??
      raw.maxCapacity ??
      raw.MaxCapacity ??
      raw.maxAttendees ??
      raw.MaxAttendees
  )
  if (Number.isFinite(n) && n > 0) return n
  return null
}

const ClubAdminEvents = () => {
  const clubIdParam = useClubAdminClubId()
  const clubQs = useClubAdminSearch()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await fetchClubAdminEvents(clubIdParam)
      const items = data?.items ?? data ?? []
      const arr = Array.isArray(items) ? items : []
      setEvents(arr.map((row) => mapEventFromApi(row)).filter(Boolean))
    } catch (e) {
      setEvents([])
      setLoadError(e?.message || 'Could not load events.')
    } finally {
      setLoading(false)
    }
  }, [clubIdParam])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingEvent, setEditingEvent] = useState(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('')
  const [capacity, setCapacity] = useState('')
  const [locationField, setLocationField] = useState('')
  const [description, setDescription] = useState('')
  const [subEvents, setSubEvents] = useState([])
  const [subEventTitle, setSubEventTitle] = useState('')
  const [subEventCapacity, setSubEventCapacity] = useState('')
  const [subEventDate, setSubEventDate] = useState('')
  const [subEventStart, setSubEventStart] = useState('')
  const [subEventEnd, setSubEventEnd] = useState('')
  const [subEventError, setSubEventError] = useState('')
  const [posterFile, setPosterFile] = useState(null)
  const posterInputRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendeesByEvent, setAttendeesByEvent] = useState({})
  const [attendeesEventId, setAttendeesEventId] = useState(null)

  const filteredEvents = useMemo(() => {
    const today = todayIso()
    let list = events
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.clubName.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      )
    }
    if (statusFilter === 'upcoming') {
      list = list.filter((e) => !e.date || e.date >= today)
    } else if (statusFilter === 'past') {
      list = list.filter((e) => e.date && e.date < today)
    }
    return list
  }, [events, search, statusFilter])

  const startEdit = (event) => {
    setEditingEvent(event)
    setTitle(event.title || '')
    setDate(event.date || '')
    setTime(event.time || '')
    setDuration(calculateDurationHours(event.time, event.endTime))
    setCapacity(getEventSeatLimit(event) != null ? String(getEventSeatLimit(event)) : '')
    setLocationField(event.location || '')
    setDescription(event.description || '')
    setSubEvents([])
    setSubEventTitle('')
    setSubEventCapacity('')
    setSubEventDate('')
    setSubEventStart('')
    setSubEventEnd('')
    setSubEventError('')
    setPosterFile(null)
  }

  const cancelEdit = () => {
    setEditingEvent(null)
    setTitle('')
    setDate('')
    setTime('')
    setDuration('')
    setCapacity('')
    setLocationField('')
    setDescription('')
    setSubEvents([])
    setSubEventTitle('')
    setSubEventCapacity('')
    setSubEventDate('')
    setSubEventStart('')
    setSubEventEnd('')
    setSubEventError('')
    setPosterFile(null)
  }

  const addSubEvent = () => {
    const t = subEventTitle.trim()
    const cap = subEventCapacity.trim()
    const start = subEventStart.trim()
    const end = subEventEnd.trim()
    const dateVal = (subEventDate || date).trim()

    if (!t || !cap || !start || !end) {
      setSubEventError('Please fill in title, capacity, start, and end time.')
      return
    }
    if (start && end && start >= end) {
      setSubEventError('End time must be later than start time.')
      return
    }

    setSubEvents((prev) => [...prev, { title: t, capacity: cap, start, end, date: dateVal }])
    setSubEventError('')
    setSubEventTitle('')
    setSubEventCapacity('')
    setSubEventStart('')
    setSubEventEnd('')
    setSubEventDate('')
  }

  const removeSubEvent = (index) => {
    setSubEvents((prev) => prev.filter((_, i) => i !== index))
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editingEvent) return
    setIsSubmitting(true)

    try {
      const nextTitle = title || editingEvent.title
      const nextDate = date || editingEvent.date
      const nextTime = time || editingEvent.time
      const nextLocation = locationField || editingEvent.location || 'TBD'
      const nextDescription = description || editingEvent.description || ''
      const nextSeatLimit = capacity ? Number(capacity) : getEventSeatLimit(editingEvent) ?? 1
      await patchClubAdminEvent(clubIdParam, editingEvent.id, {
        name: nextTitle,
        description: nextDescription,
        startTime: formatLocalDateTime(nextDate, nextTime),
        endTime: addHoursToLocalDateTime(nextDate, nextTime, duration, editingEvent.endTime),
        location: nextLocation,
        ...getEventLocationPair(editingEvent),
        seatLimit: nextSeatLimit,
        requirements: editingEvent.requirements || 'None',
        prerequisites: editingEvent.prerequisites || 'None',
        notes: editingEvent.notes || 'No additional notes.',
        status: getEventStatusForUpdate(editingEvent),
        imageFile: posterFile || undefined,
      })
      await loadEvents()
      cancelEdit()
    } catch (error) {
      alert(error?.message || 'Could not update event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const attendeesEvent = attendeesEventId != null
    ? events.find((ev) => String(ev.id) === String(attendeesEventId))
    : null

  const attendeesForSelectedEvent = attendeesEvent ? (attendeesByEvent[attendeesEvent.id] || []) : []

  const loadAttendees = useCallback(async (eventId) => {
    try {
      const res = await fetchClubAdminEventAttendees(clubIdParam, eventId)
      const arr = clubAdminListItems(res)
      setAttendeesByEvent((prev) => ({
        ...prev,
        [eventId]: arr.map((a, index) => ({
          id: String(a.id ?? a.attendeeId ?? `${eventId}-att-${index}`),
          fullName: a.fullName ?? a.name ?? 'Attendee',
          studentId: a.studentId ?? '—',
          entered: Boolean(a.entered ?? a.checkedIn ?? false),
        })),
      }))
    } catch {
      setAttendeesByEvent((prev) => ({ ...prev, [eventId]: [] }))
    }
  }, [clubIdParam])

  useEffect(() => {
    if (attendeesEventId == null) return
    void loadAttendees(attendeesEventId)
  }, [attendeesEventId, loadAttendees])

  const toggleAttendeeEntered = async (eventId, attendeeId) => {
    const attendee = (attendeesByEvent[eventId] || []).find((a) => String(a.id) === String(attendeeId))
    if (!attendee) return
    try {
      await patchClubAdminEventAttendee(clubIdParam, eventId, attendeeId, { entered: !attendee.entered })
      await loadAttendees(eventId)
    } catch (e) {
      alert(e?.message || 'Could not update attendee status.')
    }
  }

  const removeAttendee = async (eventId, attendeeId) => {
    const ok = window.confirm('Remove this attendee from the event?')
    if (!ok) return
    try {
      await deleteClubAdminEventAttendee(clubIdParam, eventId, attendeeId)
      await loadAttendees(eventId)
    } catch (e) {
      alert(e?.message || 'Could not remove attendee.')
    }
  }

  if (editingEvent) {
    return (
      <>
        <header className="club-admin-header">
          <h1 className="club-admin-header-title">Edit Event</h1>
        </header>

        <div className="club-admin-content">
          <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, paddingLeft: 24 }}>
            <Link to={`/club-admin${clubQs}`} style={{ color: '#64748b' }}>Dashboard</Link>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <Link to={`/club-admin/events${clubQs}`} style={{ color: '#64748b' }}>Events</Link>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Edit Event</span>
          </nav>

          <form className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }} onSubmit={saveEdit}>
            <div className="club-admin-card-head">
              <h2 className="club-admin-card-title">Edit Event</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="club-admin-btn-secondary" onClick={cancelEdit}>
                  <IconX /> Cancel
                </button>
                <button type="submit" className="club-admin-btn-primary" disabled={isSubmitting}>
                  <IconCheck /> {isSubmitting ? 'Sending...' : 'Send request'}
                </button>
              </div>
            </div>

            <div className="club-admin-form-row">
              <div className="club-admin-field">
                <label>Event name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                />
              </div>
            </div>

            <div className="club-admin-form-row">
              <div className="club-admin-field">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="club-admin-field">
                <label>Start time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="club-admin-field">
                <label>Duration (hours)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>
            </div>

            <div className="club-admin-form-row">
              <div className="club-admin-field">
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 200"
                />
              </div>
              <div className="club-admin-field">
                <label>Location</label>
                <input
                  type="text"
                  value={locationField}
                  onChange={(e) => setLocationField(e.target.value)}
                  placeholder="Where will it take place?"
                />
              </div>
            </div>

            <div className="club-admin-field">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Short description of the event..."
              />
            </div>

            <div className="club-admin-field">
              <label>Poster / Cover image</label>
              <div
                className="club-admin-upload-zone"
                onClick={(e) => {
                  if (e.target instanceof HTMLElement && e.target.closest('button')) return
                  posterInputRef.current?.click()
                }}
              >
                <input
                  ref={posterInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
                />
                <IconUpload style={{ color: '#2563eb', marginBottom: 8 }} />
                <div>Click to upload or drag &amp; drop</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>PNG, JPG, or SVG up to 10MB</div>
                <button
                  type="button"
                  className="club-admin-btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={(e) => { e.preventDefault(); posterInputRef.current?.click() }}
                >
                  Select file
                </button>
                {posterFile && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb' }}>
                    {posterFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="club-admin-field">
              <label>Sub-events</label>
              <div className="club-admin-field">
                <label style={{ fontSize: 12 }}>Date (optional)</label>
                <input
                  type="date"
                  value={subEventDate}
                  onChange={(e) => {
                    setSubEventDate(e.target.value)
                    if (subEventError) setSubEventError('')
                  }}
                />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  If left empty, the sub-event will use the main event&apos;s date.
                </div>
              </div>
              <div className="club-admin-form-row" style={{ marginTop: 8 }}>
                <div className="club-admin-field">
                  <label style={{ fontSize: 12 }}>Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Opening ceremony"
                    value={subEventTitle}
                    onChange={(e) => {
                      setSubEventTitle(e.target.value)
                      if (subEventError) setSubEventError('')
                    }}
                  />
                </div>
                <div className="club-admin-field">
                  <label style={{ fontSize: 12 }}>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={subEventCapacity}
                    onChange={(e) => {
                      setSubEventCapacity(e.target.value)
                      if (subEventError) setSubEventError('')
                    }}
                  />
                </div>
              </div>
              <div className="club-admin-form-row" style={{ marginTop: 8 }}>
                <div className="club-admin-field">
                  <label style={{ fontSize: 12 }}>Start time</label>
                  <input
                    type="time"
                    value={subEventStart}
                    onChange={(e) => {
                      setSubEventStart(e.target.value)
                      if (subEventError) setSubEventError('')
                    }}
                  />
                </div>
                <div className="club-admin-field">
                  <label style={{ fontSize: 12 }}>End time</label>
                  <input
                    type="time"
                    value={subEventEnd}
                    onChange={(e) => {
                      setSubEventEnd(e.target.value)
                      if (subEventError) setSubEventError('')
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                className="club-admin-btn-primary"
                style={{ marginTop: 10 }}
                onClick={addSubEvent}
              >
                + Add sub-event
              </button>
              {subEventError && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>
                  {subEventError}
                </div>
              )}
              {subEvents.length > 0 && (
                <table className="club-admin-table" style={{ marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Capacity</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subEvents.map((se, index) => (
                      <tr key={`${se.title}-${index}`}>
                        <td>{se.date}</td>
                        <td>{se.title}</td>
                        <td>{se.capacity}</td>
                        <td>{se.start}</td>
                        <td>{se.end}</td>
                        <td>
                          <button
                            type="button"
                            className="club-admin-btn-icon"
                            onClick={() => removeSubEvent(index)}
                            aria-label="Remove sub-event"
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
          </form>
        </div>
      </>
    )
  }

  if (attendeesEvent) {
    const enteredCount = attendeesForSelectedEvent.filter((a) => a.entered).length
    const regCount = attendeesForSelectedEvent.length
    const seatLimit = getEventSeatLimit(attendeesEvent)
    const remainingSlots =
      seatLimit != null ? Math.max(0, seatLimit - regCount) : null
    return (
      <>
        <header className="club-admin-header">
          <h1 className="club-admin-header-title">Event Attendees</h1>
        </header>

        <div className="club-admin-content">
          <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, paddingLeft: 24 }}>
            <Link to={`/club-admin${clubQs}`} style={{ color: '#64748b' }}>Dashboard</Link>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <button
              type="button"
              style={{ color: '#64748b', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
              onClick={() => setAttendeesEventId(null)}
            >
              Events
            </button>
            <span style={{ margin: '0 8px' }}>&gt;</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Attendees</span>
          </nav>

          <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }}>
            <div className="club-admin-card-head">
              <h2 className="club-admin-card-title">{attendeesEvent.title}</h2>
              <button type="button" className="club-admin-btn-secondary" onClick={() => setAttendeesEventId(null)}>
                Back to events
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(130px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Max capacity</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{seatLimit != null ? seatLimit : '—'}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Registered</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{regCount}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Spots left</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                  {seatLimit == null ? '—' : `${remainingSlots} / ${seatLimit}`}
                </div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Entered</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{enteredCount}</div>
              </div>
            </div>
            <div className="club-admin-table-wrap">
              <table className="club-admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendeesForSelectedEvent.map((a) => (
                    <tr key={a.id}>
                      <td>{a.fullName}</td>
                      <td>{a.studentId}</td>
                      <td>
                        <span className="club-admin-pill" style={a.entered ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#b91c1c' }}>
                          {a.entered ? 'Entered' : 'Not entered'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="club-admin-btn-secondary"
                            onClick={() => toggleAttendeeEntered(attendeesEvent.id, a.id)}
                          >
                            {a.entered ? 'Mark not entered' : 'Mark entered'}
                          </button>
                          <button
                            type="button"
                            className="club-admin-btn-danger"
                            onClick={() => removeAttendee(attendeesEvent.id, a.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {attendeesForSelectedEvent.length === 0 && (
                    <tr>
                      <td colSpan={4} className="club-admin-table-empty">
                        No attendees registered.
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

  const today = todayIso()

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Club Events</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <div className="club-admin-header-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search events by title or club..."
              aria-label="Search events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link
            to={`/club-admin/events/propose${clubQs}`}
            className="club-admin-btn-primary"
            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <IconMegaphone /> Create Event
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
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Events</span>
        </nav>

        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24 }}>
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">All Club Events</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
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
                    onClick={() => setStatusFilter('upcoming')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      background: statusFilter === 'upcoming' ? '#16a34a' : 'transparent',
                      color: statusFilter === 'upcoming' ? '#f0fdf4' : '#64748b',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('past')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      background: statusFilter === 'past' ? '#e11d48' : 'transparent',
                      color: statusFilter === 'past' ? '#fef2f2' : '#64748b',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Past
                  </button>
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {filteredEvents.length} events
              </span>
            </div>
          </div>
          <div className="club-admin-table-wrap">
          <table className="club-admin-table">
            <thead>
              <tr>
                <th style={{ width: '26%' }}>Title</th>
                <th style={{ width: '22%' }}>Club</th>
                <th style={{ width: '14%' }}>Date</th>
                <th style={{ width: '14%' }}>Time</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '8%' }}>Attendees</th>
                <th style={{ width: '10%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="club-admin-table-empty">Loading events...</td>
                </tr>
              ) : null}
              {filteredEvents.map((e) => {
                const isUpcoming = !e.date || e.date >= today
                const eventAttendees = attendeesByEvent[e.id] || []
                return (
                  <tr key={e.id}>
                    <td>{e.title}</td>
                    <td>{e.clubName}</td>
                    <td>{formatDate(e.date)}</td>
                    <td>{e.time || '—'}</td>
                    <td>
                      <span className="club-admin-pill" style={isUpcoming ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#b91c1c' }}>
                        {isUpcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="club-admin-btn-secondary"
                        onClick={() => {
                          setAttendeesEventId(e.id)
                        }}
                        title="View attendees"
                      >
                        {eventAttendees.length}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="club-admin-btn-secondary"
                        onClick={() => startEdit(e)}
                      >
                        <IconEdit /> Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!loading && filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="club-admin-table-empty">
                    No events match your filters.
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

export default ClubAdminEvents

