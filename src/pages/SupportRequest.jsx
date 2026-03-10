import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './ITSupport.css'

const IT_CATEGORY_OPTIONS = [
  'Wi-Fi & Network',
  'Email & Office 365',
  'Password Reset',
  'Projector/Display',
  'Printer/Scanner',
  'Software Installation',
  'Computer Repair',
  'Other',
]

const FM_CATEGORY_OPTIONS = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Maintenance',
  'Security',
  'Keys/Access',
  'Other',
]

const BUILDINGS = [
  { value: 'main', label: 'Main Building' },
  { value: 'library', label: 'Library' },
  { value: 'sports', label: 'Sports Complex' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'other', label: 'Other / External' },
]

const ROOMS_BY_BUILDING = {
  main: ['101', '102', '201', '202', '301', '302'],
  library: ['Reading Hall', 'Computer Room', 'Silent Zone'],
  sports: ['Court 1', 'Court 2', 'Gym'],
  cafeteria: ['Main Hall'],
  other: ['Room 1', 'Room 2'],
}

const SUPPORT_REQUEST_DRAFT_COOKIE_KEY = 'support_request_draft'

const setDraftCookie = (key, value, days = 7) => {
  if (typeof document === 'undefined') return
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `${key}=${encoded}; expires=${expires}; path=/`
  } catch (err) {
    console.error('Failed to save support draft', err)
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
    console.error('Failed to parse support draft', err)
    return null
  }
}

const clearDraftCookie = (key) => {
  if (typeof document === 'undefined') return
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const IconLocation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const IconAttach = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const SupportRequest = ({ initialArea = 'it' }) => {
  const navigate = useNavigate()
  const locationRouter = useLocation()
  const queryParams = new URLSearchParams(locationRouter.search)
  const areaFromQuery = queryParams.get('area')

  const [area, setArea] = useState(areaFromQuery === 'fm' || initialArea === 'fm' ? 'fm' : 'it')
  const [issueCategory, setIssueCategory] = useState('')
  const [locationType, setLocationType] = useState('')
  const [building, setBuilding] = useState('')
  const [isRoomOrNonRoom, setIsRoomOrNonRoom] = useState('') // '' | 'room' | 'nonRoom' – only after building chosen
  const [room, setRoom] = useState('')
  const [nonRoomLocation, setNonRoomLocation] = useState('')
  const [campusLocation, setCampusLocation] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('standard')
  const [attachments, setAttachments] = useState([])
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    const draft = getDraftCookie(SUPPORT_REQUEST_DRAFT_COOKIE_KEY)
    if (!draft) return

    setArea(draft.area === 'fm' ? 'fm' : 'it')
    setIssueCategory(draft.issueCategory || '')
    setLocationType(draft.locationType || '')
    setBuilding(draft.building || '')
    setIsRoomOrNonRoom(draft.isRoomOrNonRoom || '')
    setRoom(draft.room || '')
    setNonRoomLocation(draft.nonRoomLocation || '')
    setCampusLocation(draft.campusLocation || '')
    setDescription(draft.description || '')
    setUrgency(draft.urgency === 'critical' ? 'critical' : 'standard')
  }, [])

  const categoryOptions = area === 'it' ? IT_CATEGORY_OPTIONS : FM_CATEGORY_OPTIONS

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const handleSaveDraft = () => {
    const payload = {
      area,
      issueCategory,
      locationType,
      building,
      isRoomOrNonRoom,
      room,
      nonRoomLocation,
      campusLocation,
      description,
      urgency,
      savedAt: Date.now(),
    }
    setDraftCookie(SUPPORT_REQUEST_DRAFT_COOKIE_KEY, payload)
    alert('Support request draft saved. It will be restored next time you open this form on this browser.')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const hasLocation =
      (locationType === 'building' && building && ((isRoomOrNonRoom === 'room' && room) || (isRoomOrNonRoom === 'nonRoom' && nonRoomLocation.trim()))) ||
      (locationType === 'campus' && campusLocation.trim())
    if (!issueCategory.trim() || !hasLocation || !description.trim()) {
      setShowError(true)
      return
    }
    setShowError(false)
    // TODO: send to unified support API
    clearDraftCookie(SUPPORT_REQUEST_DRAFT_COOKIE_KEY)
    navigate('/my-requests')
  }

  return (
    <div
      className="it-support-overlay"
      onClick={(e) => e.target === e.currentTarget && goBack()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-request-title"
    >
      <div className="it-support-popup">
        <header className="it-support-header">
          <button type="button" className="it-support-back" onClick={goBack} aria-label="Back">
            <IconBack />
          </button>
          <div className="it-support-header-title">
            <h1 id="support-request-title">Create New Support Request</h1>
            <span className="it-support-subtitle">Submit a ticket for IT or Facilities issues</span>
          </div>
          <div className="it-support-header-spacer" aria-hidden="true" />
        </header>

        <div className="it-support-two-column">
          <form className="it-support-form it-support-form--wide" onSubmit={handleSubmit}>
            {/* 1. Issue Category */}
            <section className="it-support-section">
              <h2 className="it-support-section-title">
                <span className="it-support-section-num">1</span>
                Issue Category *
              </h2>
              <div className="it-support-category-toggle">
                <button
                  type="button"
                  className={`it-support-category-pill ${area === 'it' ? 'it-support-category-pill--active' : ''}`}
                  onClick={() => {
                    setArea('it')
                    setIssueCategory('')
                  }}
                >
                  IT &amp; Network
                </button>
                <button
                  type="button"
                  className={`it-support-category-pill ${area === 'fm' ? 'it-support-category-pill--active' : ''}`}
                  onClick={() => {
                    setArea('fm')
                    setIssueCategory('')
                  }}
                >
                  Facilities (FM)
                </button>
              </div>
              <div className="it-support-fields">
                <select
                  required
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="it-support-select"
                >
                  <option value="">Select issue type</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* 2. Location */}
            <section className="it-support-section">
              <h2 className="it-support-section-title">
                <span className="it-support-section-num">2</span>
                Location *
              </h2>
              <div className="it-support-fields">
                <p className="it-support-hint" style={{ marginBottom: 8 }}>
                  First choose if this is in a specific building/room or elsewhere on campus.
                </p>
                <div className="it-support-location-type">
                  <label>
                    <input
                      type="radio"
                      name="locationType"
                      value="building"
                      checked={locationType === 'building'}
                      onChange={(e) => {
                        setLocationType(e.target.value)
                        setBuilding('')
                        setIsRoomOrNonRoom('')
                        setRoom('')
                        setNonRoomLocation('')
                        setCampusLocation('')
                      }}
                      required
                    />{' '}
                    Building / Room
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="locationType"
                      value="campus"
                      checked={locationType === 'campus'}
                      onChange={(e) => {
                        setLocationType(e.target.value)
                        setBuilding('')
                        setIsRoomOrNonRoom('')
                        setRoom('')
                        setNonRoomLocation('')
                      }}
                      required
                    />{' '}
                    Campus Area
                  </label>
                </div>

                {locationType === 'building' && (
                  <div className="it-support-location-grid">
                    <div className="it-support-field-group">
                      <label className="it-support-label">Building</label>
                      <div className="it-support-input-wrap it-support-input-wrap--icon">
                        <span className="it-support-input-icon">
                          <IconLocation />
                        </span>
                        <select
                          className="it-support-input"
                          value={building}
                          onChange={(e) => {
                            setBuilding(e.target.value)
                            setIsRoomOrNonRoom('')
                            setRoom('')
                            setNonRoomLocation('')
                          }}
                          required
                        >
                          <option value="">Select building...</option>
                          {BUILDINGS.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {building && (
                      <>
                        <div className="it-support-field-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="it-support-label">Is the location a room?</label>
                          <div className="it-support-location-type" style={{ marginTop: 6 }}>
                            <label>
                              <input
                                type="radio"
                                name="isRoomOrNonRoom"
                                value="room"
                                checked={isRoomOrNonRoom === 'room'}
                                onChange={() => { setIsRoomOrNonRoom('room'); setRoom(''); setNonRoomLocation('') }}
                              />
                              {' '}Room
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="isRoomOrNonRoom"
                                value="nonRoom"
                                checked={isRoomOrNonRoom === 'nonRoom'}
                                onChange={() => { setIsRoomOrNonRoom('nonRoom'); setRoom(''); setNonRoomLocation('') }}
                              />
                              {' '}Non-room (e.g. corridor, lobby)
                            </label>
                          </div>
                        </div>
                        {isRoomOrNonRoom === 'room' && (
                          <div className="it-support-field-group">
                            <label className="it-support-label">Room / Lab</label>
                            <div className="it-support-input-wrap it-support-input-wrap--icon">
                              <span className="it-support-input-icon">
                                <IconLocation />
                              </span>
                              <select
                                className="it-support-input"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                required
                              >
                                <option value="">Select room...</option>
                                {(ROOMS_BY_BUILDING[building] || []).map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        {isRoomOrNonRoom === 'nonRoom' && (
                          <div className="it-support-field-group">
                            <label className="it-support-label">Specify location</label>
                            <div className="it-support-input-wrap it-support-input-wrap--icon">
                              <span className="it-support-input-icon">
                                <IconLocation />
                              </span>
                              <input
                                type="text"
                                className="it-support-input"
                                value={nonRoomLocation}
                                onChange={(e) => setNonRoomLocation(e.target.value)}
                                placeholder="e.g. main corridor, 2nd floor lobby, entrance"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {locationType === 'campus' && (
                  <div className="it-support-input-wrap it-support-input-wrap--icon">
                    <span className="it-support-input-icon">
                      <IconLocation />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Describe where on campus (e.g. main yard, parking area)"
                      value={campusLocation}
                      onChange={(e) => setCampusLocation(e.target.value)}
                      className="it-support-input"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* 3. Detailed Description */}
            <section className="it-support-section">
              <h2 className="it-support-section-title">
                <span className="it-support-section-num">3</span>
                Detailed Description *
              </h2>
              <div className="it-support-fields">
                <textarea
                  required
                  rows={5}
                  placeholder="Provide as much detail as possible about the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="it-support-textarea"
                />
                <p className="it-support-hint">
                  Include error messages, what you were doing when the issue occurred, and any steps you&apos;ve already
                  tried.
                </p>
              </div>
            </section>

            {/* 4. Attachments (Optional) */}
            <section className="it-support-section">
              <h2 className="it-support-section-title">
                <span className="it-support-section-num">4</span>
                Attachments <span className="it-support-optional">(Optional)</span>
              </h2>
              <div className="it-support-fields">
                <label className="it-support-add-photo">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="it-support-add-photo-input"
                    onChange={handleFileChange}
                  />
                  <span className="it-support-add-photo-icon">
                    <IconAttach />
                  </span>
                  <span className="it-support-add-photo-text">Add Photo or Video</span>
                </label>
                {attachments.length > 0 && (
                  <div className="it-support-attachments-list">
                    {attachments.map((f, i) => (
                      <span key={i} className="it-support-attachment-name">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 5. Urgency Level */}
            <section className="it-support-section">
              <h2 className="it-support-section-title">
                <span className="it-support-section-num">5</span>
                Urgency Level *
              </h2>
              <div className="it-support-fields it-support-urgency-grid">
                <button
                  type="button"
                  className={`it-support-urgency-card ${urgency === 'standard' ? 'it-support-urgency-card--active' : ''}`}
                  onClick={() => setUrgency('standard')}
                >
                  <span className="it-support-urgency-title">Standard / Not Urgent</span>
                  <span className="it-support-urgency-text">
                    Routine issues that do not affect safety or critical operations.
                  </span>
                </button>
                <button
                  type="button"
                  className={`it-support-urgency-card ${urgency === 'critical' ? 'it-support-urgency-card--active' : ''}`}
                  onClick={() => setUrgency('critical')}
                >
                  <span className="it-support-urgency-title">Urgent / Critical</span>
                  <span className="it-support-urgency-text">
                    Safety hazards, facility-wide outages, or issues preventing essential work.
                  </span>
                </button>
              </div>
            </section>

            {showError && (
              <p className="it-support-error" role="alert">
                Please fill in all required fields.
              </p>
            )}

            <div className="it-support-actions-row">
              <button type="button" className="it-support-cancel" onClick={goBack}>
                Cancel Request
              </button>
              <button type="button" className="it-support-draft" onClick={handleSaveDraft}>
                Save Draft
              </button>
              <button type="submit" className="it-support-submit">
                Submit Request
              </button>
            </div>
          </form>

          {/* Right side – What happens next */}
          <aside className="it-support-side-panel">
            <div className="it-support-info-box">
              <p className="it-support-info-title">
                <IconInfo />
                What happens next?
              </p>
              <ul className="it-support-info-list">
                <li>A support ticket is created and routed to the appropriate team.</li>
                <li>You receive a confirmation email with your ticket ID.</li>
                <li>Technician reviews the details and may contact you for clarification.</li>
                <li>You&apos;ll be notified when the issue is resolved or an update is available.</li>
              </ul>
            </div>

            <div className="it-support-info-box it-support-info-box--accent">
              <p className="it-support-info-title">Need immediate help?</p>
              <p className="it-support-info-text">
                For emergencies or campus‑wide outages, please contact the Student Services desk directly.
              </p>
              <a href="tel:+994501234567" className="it-support-hotline">
                +994 (50) 123‑45‑67
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default SupportRequest

