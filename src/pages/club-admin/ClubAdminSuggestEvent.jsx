import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './ClubAdmin.css'

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

const VENUES = ['Main Auditorium', 'Student Center', 'Conference Room A', 'Outdoor Quad', 'Lecture Hall B']

const ClubAdminSuggestEvent = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(4)
  const [eventName, setEventName] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [duration, setDuration] = useState('3')
  const [attendance, setAttendance] = useState('250')
  const [venue, setVenue] = useState('Main Auditorium')
  const [posterFile, setPosterFile] = useState(null)
  const posterInputRef = useRef(null)
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [subEvents, setSubEvents] = useState('')
  const [avSetup, setAvSetup] = useState(false)
  const [security, setSecurity] = useState(true)
  const [catering, setCatering] = useState(false)
  const [cleaning, setCleaning] = useState(true)
  const [otherNeeds, setOtherNeeds] = useState('')

  const progressPct = (step / STEPS) * 100

  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Suggest New Event</h1>
      </header>

      <div className="club-admin-content">
        <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, paddingLeft: 24 }}>
          <Link to="/club-admin" style={{ color: '#64748b' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <Link to="/club-admin" style={{ color: '#64748b' }}>Events</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>New Proposal</span>
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
            <div className="club-admin-field">
              <label>Date &amp; Time</label>
              <input type="text" placeholder="mm/dd/yyyy, --:-- --" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
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
              <select value={venue} onChange={(e) => setVenue(e.target.value)}>
                {VENUES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconImage style={{ color: '#0284c7' }} /></div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Poster / Cover Image</h3>
            </div>
            <label className="club-admin-upload-zone" htmlFor="suggest-event-poster-upload">
              <input
                id="suggest-event-poster-upload"
                ref={posterInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
                style={{ display: 'none' }}
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
            </label>
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
              <textarea placeholder="List workshops, ceremonies, or breakout sessions..." value={subEvents} onChange={(e) => setSubEvents(e.target.value)} rows={3} />
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
              <p style={{ margin: 0, fontSize: 14 }}><strong>Reviewer:</strong> Admin Committee</p>
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '20px 24px 32px' }}>
          <button type="button" className="club-admin-btn-secondary" onClick={() => setStep((s) => Math.max(1, s - 1))}>← Previous Step</button>
          <button type="button" className="club-admin-btn-secondary">Save Draft</button>
          <button type="button" className="club-admin-btn-primary" onClick={() => navigate('/club-admin')}>Submit for Approval →</button>
        </div>
      </div>
    </>
  )
}

export default ClubAdminSuggestEvent
