import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { submitStudentServicesEventProposal } from '../api/clubApi'
import { getBuildings, getRoomsByBuildingId } from '../api/locationApi'
import './club-admin/ClubAdmin.css'

const STEPS = 4
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
)
const IconImage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
)
const IconDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
)
const IconClipboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
)
const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
)
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const SUGGEST_EVENT_DRAFT_COOKIE_KEY = 'student_services_suggest_event_draft'

const setDraftCookie = (key, value, days = 7) => {
  if (typeof document === 'undefined') return
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `${key}=${encoded}; expires=${expires}; path=/`
  } catch (err) {
    console.error('Failed to save draft cookie', err)
  }
}

const getDraftCookie = (key) => {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const prefix = `${key}=`
  const raw = cookies.find((c) => c.startsWith(prefix))
  if (!raw) return null
  const value = raw.substring(prefix.length)
  try {
    return JSON.parse(decodeURIComponent(value))
  } catch (err) {
    console.error('Failed to parse draft cookie', err)
    return null
  }
}

const clearDraftCookie = (key) => {
  if (typeof document === 'undefined') return
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

function composeProposalStartDateTime(eventDate, eventTime) {
  const d = String(eventDate ?? '').trim()
  if (!d) return ''
  const tRaw = String(eventTime ?? '').trim() || '09:00'
  const timePart = tRaw.length === 5 ? `${tRaw}:00` : tRaw.length === 8 ? tRaw : `${tRaw}:00`
  return `${d}T${timePart}`
}

function roomCapacityLabel(room) {
  if (!room || typeof room !== 'object') return ''
  const capRaw =
    room.capacity ??
    room.seatCapacity ??
    room.maxCapacity ??
    room.maxOccupancy ??
    room.Capacity ??
    room.SeatCapacity ??
    room.MaxCapacity ??
    room.MaxOccupancy ??
    room.seats ??
    room.Seats ??
    room.maxSeats ??
    room.maxStudents
  const cap = Number(capRaw)
  return Number.isFinite(cap) && cap > 0 ? ` (${cap})` : ''
}

function buildingNameFor(b) {
  if (!b || typeof b !== 'object') return ''
  return String(b.name ?? b.title ?? b.buildingName ?? '').trim()
}

function roomNameFor(r) {
  if (!r || typeof r !== 'object') return ''
  return String(r.name ?? r.number ?? r.roomNumber ?? r.title ?? r.code ?? '').trim()
}

const StudentServicesSuggestEvent = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(4)
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [duration, setDuration] = useState('3')
  const [attendance, setAttendance] = useState('250')
  const [venue, setVenue] = useState('')
  const [buildings, setBuildings] = useState([])
  const [buildingId, setBuildingId] = useState('')
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState('')
  const [locationLoadState, setLocationLoadState] = useState({ loading: true, error: '' })
  const [posterFile, setPosterFile] = useState(null)
  const [posterImageUrl, setPosterImageUrl] = useState('')
  const posterInputRef = useRef(null)
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [subEvents, setSubEvents] = useState([])
  const [subEventTitle, setSubEventTitle] = useState('')
  const [subEventCapacity, setSubEventCapacity] = useState('')
  const [subEventStart, setSubEventStart] = useState('')
  const [subEventEnd, setSubEventEnd] = useState('')
  const [subEventDate, setSubEventDate] = useState('')
  const [subEventError, setSubEventError] = useState('')
  const [avSetup, setAvSetup] = useState(false)
  const [security, setSecurity] = useState(true)
  const [catering, setCatering] = useState(false)
  const [cleaning, setCleaning] = useState(true)
  const [otherNeeds, setOtherNeeds] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLocationLoadState({ loading: true, error: '' })
      try {
        const b = await getBuildings()
        if (cancelled) return
        const list = Array.isArray(b) ? b : []
        setBuildings(list)
        const firstId = list[0]?.id != null ? String(list[0].id) : ''
        setBuildingId((prev) => prev || firstId)
        setLocationLoadState({ loading: false, error: '' })
      } catch (e) {
        if (!cancelled) {
          setBuildings([])
          setBuildingId('')
          setRooms([])
          setRoomId('')
          setVenue('')
          setLocationLoadState({ loading: false, error: e?.message || 'Could not load locations.' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!buildingId) {
        setRooms([])
        setRoomId('')
        return
      }
      try {
        const r = await getRoomsByBuildingId(buildingId)
        if (cancelled) return
        const list = Array.isArray(r) ? r : []
        setRooms(list)
        const firstRoomId = list[0]?.id != null ? String(list[0].id) : ''
        setRoomId((prev) => prev || firstRoomId)
      } catch {
        if (!cancelled) {
          setRooms([])
          setRoomId('')
        }
      }
    })()
    return () => { cancelled = true }
  }, [buildingId])

  useEffect(() => {
    const b = buildings.find((x) => String(x?.id) === String(buildingId))
    const r = rooms.find((x) => String(x?.id) === String(roomId))
    const bName = buildingNameFor(b)
    const rName = roomNameFor(r)
    const nextVenue = bName && rName ? `${bName} — ${rName}` : bName || rName || ''
    setVenue(nextVenue)
  }, [buildings, rooms, buildingId, roomId])

  useEffect(() => {
    const draft = getDraftCookie(SUGGEST_EVENT_DRAFT_COOKIE_KEY)
    if (!draft) return

    if (typeof draft.step === 'number' && draft.step >= 1 && draft.step <= STEPS) {
      setStep(draft.step)
    }
    setEventName(draft.eventName || '')
    if (draft.eventDate) {
      setEventDate(String(draft.eventDate))
      setEventTime(String(draft.eventTime || ''))
    } else if (draft.dateTime) {
      const parsed = new Date(String(draft.dateTime))
      if (!Number.isNaN(parsed.getTime())) {
        const iso = parsed.toISOString()
        setEventDate(iso.slice(0, 10))
        setEventTime(iso.slice(11, 16))
      }
    }
    setDuration(draft.duration || '3')
    setAttendance(draft.attendance || '250')
    if (draft.buildingId != null) setBuildingId(String(draft.buildingId))
    if (draft.roomId != null) setRoomId(String(draft.roomId))
    if (draft.venue) setVenue(String(draft.venue))
    setDescription(draft.description || '')
    setObjectives(draft.objectives || '')
    setSubEvents(Array.isArray(draft.subEvents) ? draft.subEvents : [])
    setAvSetup(Boolean(draft.avSetup))
    setSecurity(draft.security !== undefined ? Boolean(draft.security) : true)
    setCatering(Boolean(draft.catering))
    setCleaning(draft.cleaning !== undefined ? Boolean(draft.cleaning) : true)
    setOtherNeeds(draft.otherNeeds || '')
    if (draft.posterImageUrl != null) setPosterImageUrl(String(draft.posterImageUrl))
  }, [])

  const handleSaveDraft = () => {
    const payload = {
      step,
      eventName,
      eventDate,
      eventTime,
      duration,
      attendance,
      venue,
      buildingId,
      roomId,
      description,
      objectives,
      subEvents,
      avSetup,
      security,
      catering,
      cleaning,
      otherNeeds,
      posterImageUrl,
      savedAt: Date.now()
    }
    setDraftCookie(SUGGEST_EVENT_DRAFT_COOKIE_KEY, payload)
    alert('Draft saved for this event proposal. It will be restored next time you open this screen from this browser.')
  }

  const handleSubmit = async () => {
    try {
      const url = posterImageUrl.trim()
      await submitStudentServicesEventProposal(
        {
          name: eventName.trim() || 'Event proposal',
          dateTime: composeProposalStartDateTime(eventDate, eventTime),
          duration,
          attendance,
          venue: venue || 'TBD',
          ...(buildingId && roomId ? { buildingId, roomId } : {}),
          description,
          objectives,
          subEvents,
          logistics: {
            avSetup,
            security,
            catering,
            cleaning,
            otherNeeds,
          },
          submittedByOrganization: 'Student Services',
          ...(url ? { imageUrl: url } : {}),
        },
        posterFile
      )
    } catch (err) {
      alert(err?.message || 'Could not submit event proposal.')
      return
    }
    clearDraftCookie(SUGGEST_EVENT_DRAFT_COOKIE_KEY)
    navigate('/student-services', { state: { section: 'event-proposals' } })
  }

  const addSubEvent = () => {
    const title = subEventTitle.trim()
    const capacity = subEventCapacity.trim()
    const start = subEventStart.trim()
    const end = subEventEnd.trim()
    const date = (subEventDate || eventDate).trim()

    if (!title || !capacity || !start || !end) {
      setSubEventError('Please fill in title, capacity, start, and end time.')
      return
    }

    if (start && end && start >= end) {
      setSubEventError('End time must be later than start time.')
      return
    }

    setSubEvents((prev) => [...prev, { title, capacity, start, end, date }])
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

  const progressPct = (step / STEPS) * 100

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Propose campus event</h1>
      </header>

      <div className="club-admin-content">
        <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, paddingLeft: 24 }}>
          <Link to="/student-services" style={{ color: '#64748b' }}>Student Services</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>New event proposal</span>
        </nav>

        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Suggest New Event</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Step {step} of {STEPS}: Finalize your event proposal and logistical requirements.</p>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: '#2563eb', borderRadius: 999, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>Form Progress: Review &amp; Logistics — 100%</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingLeft: 24, paddingRight: 24 }}
             className="club-admin-card"
        >
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconInfo style={{ color: '#0284c7' }} /></div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Event Basics</h3>
            </div>
            <div className="club-admin-field">
              <label>Event Name</label>
              <input type="text" placeholder="e.g. Annual Tech Symposium 2024" value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </div>
            <div className="club-admin-form-row">
              <div className="club-admin-field">
                <label>Date</label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div className="club-admin-field">
                <label>Time</label>
                <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
            </div>
            <div className="club-admin-form-row">
              <div className="club-admin-field">
                <label>Duration (Hours)</label>
                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div className="club-admin-field">
                <label>Estimated Attendance</label>
                <input type="text" value={attendance} onChange={(e) => setAttendance(e.target.value)} />
              </div>
            </div>
            <div className="club-admin-field">
              <label>Venue Preference</label>
              {locationLoadState.error ? (
                <>
                  <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 8 }}>{locationLoadState.error}</div>
                  <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" />
                </>
              ) : (
                <>
                  <div className="club-admin-form-row">
                    <div className="club-admin-field" style={{ flex: 1 }}>
                      <label style={{ fontSize: 12 }}>Building</label>
                      <select
                        value={buildingId}
                        onChange={(e) => {
                          setBuildingId(e.target.value)
                          setRoomId('')
                        }}
                        disabled={locationLoadState.loading || buildings.length === 0}
                      >
                        {buildings.map((b) => (
                          <option key={String(b.id)} value={String(b.id)}>
                            {buildingNameFor(b) || `Building ${b.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="club-admin-field" style={{ flex: 1 }}>
                      <label style={{ fontSize: 12 }}>Room</label>
                      <select
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        disabled={locationLoadState.loading || !buildingId || rooms.length === 0}
                      >
                        {rooms.map((r) => (
                          <option key={String(r.id)} value={String(r.id)}>
                            {roomNameFor(r) || `Room ${r.id}`}{roomCapacityLabel(r)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                    Selected: <span style={{ fontWeight: 600 }}>{venue || '—'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconImage style={{ color: '#0284c7' }} /></div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Poster / Cover Image</h3>
            </div>
            <div
              className="club-admin-upload-zone"
              onClick={(e) => {
                // avoid triggering when clicking the inner button which already handles opening
                if ((e.target instanceof HTMLElement) && e.target.closest('button')) return
                posterInputRef.current?.click()
              }}
            >
              <input
                id="suggest-event-poster-upload"
                ref={posterInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
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
                Select File
              </button>
              {posterFile && <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb' }}>{posterFile.name}</div>}
              <div className="club-admin-field" style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12 }}>Or image URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://… (used if you do not upload a file; upload wins if both are set)"
                  value={posterImageUrl}
                  onChange={(e) => setPosterImageUrl(e.target.value)}
                />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                Per API: use an upload or a public image URL. If both are provided, the uploaded file is used.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingLeft: 24, paddingRight: 24, marginTop: 24 }}
             className="club-admin-card"
        >
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconDoc style={{ color: '#0284c7' }} /></div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Event Content</h3>
            </div>
            <div className="club-admin-field">
              <label>Event Description</label>
              <textarea placeholder="Briefly describe what happens during the event..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="club-admin-field">
              <label>Purpose &amp; Objectives</label>
              <textarea placeholder="What is the goal of this event?" value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={3} />
            </div>
            <div className="club-admin-field">
              <label>Sub-events Included</label>
              <div className="club-admin-field">
                <label style={{ fontSize: 12 }}>Date (optional)</label>
                <input
                  type="date"
                  value={subEventDate}
                  onChange={(e) => {
                    setSubEventDate(e.target.value)
                    if (subEventError) setSubEventError('')
                  }}
                  placeholder="Defaults to main event date"
                />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  If left empty, the sub-event will use the main event&apos;s date.
                </div>
              </div>
              <div className="club-admin-form-row">
                <div className="club-admin-field">
                  <label style={{ fontSize: 12 }}>Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Opening Ceremony"
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
                    placeholder="e.g. 150"
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
                  <label style={{ fontSize: 12 }}>Start Time</label>
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
                  <label style={{ fontSize: 12 }}>End Time</label>
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
                + Add Sub-event
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
          </div>

          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCheck style={{ color: '#0284c7' }} /></div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Final Review</h3>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Total Steps:</strong> 4/4</p>
              <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Mandatory Fields:</strong> <span style={{ color: '#10b981' }}>Complete</span></p>
              <p style={{ margin: 0, fontSize: 14 }}><strong>Reviewer:</strong> Student Services</p>
            </div>
          </div>
        </div>

        <div className="club-admin-card" style={{ marginLeft: 24, marginRight: 24, marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconClipboard style={{ color: '#0284c7' }} /></div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Logistical Requirements</h3>
          </div>
          <label className="club-admin-checkbox-item">
            <input type="checkbox" checked={avSetup} onChange={(e) => setAvSetup(e.target.checked)} />
            <div>
              <span>Audio/Visual Setup</span>
              <small>Mics, Speakers, Projectors</small>
            </div>
          </label>
          <label className="club-admin-checkbox-item">
            <input type="checkbox" checked={security} onChange={(e) => setSecurity(e.target.checked)} />
            <div>
              <span>Security Presence</span>
              <small>Crowd control and check-in</small>
            </div>
          </label>
          <label className="club-admin-checkbox-item">
            <input type="checkbox" checked={catering} onChange={(e) => setCatering(e.target.checked)} />
            <div>
              <span>Catering Services</span>
              <small>Refreshments and snacks</small>
            </div>
          </label>
          <label className="club-admin-checkbox-item">
            <input type="checkbox" checked={cleaning} onChange={(e) => setCleaning(e.target.checked)} />
            <div>
              <span>Cleaning Staff</span>
              <small>Pre and post-event cleanup</small>
            </div>
          </label>
          <div className="club-admin-field" style={{ marginTop: 16 }}>
            <label>Other Resource Requests</label>
            <textarea placeholder="Describe any other specific needs...." value={otherNeeds} onChange={(e) => setOtherNeeds(e.target.value)} rows={3} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '20px 24px 32px' }} className="club-admin-suggest-event-actions">
          <button type="button" className="club-admin-btn-secondary" onClick={handleSaveDraft}>Save Draft</button>
          <button type="button" className="club-admin-btn-primary" onClick={handleSubmit}>Submit for Approval →</button>
        </div>
      </div>
    </>
  )
}

export default StudentServicesSuggestEvent
