import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { preferencesGet, preferencesPut } from '../../api/schedulingMsApi'
import { SCHEDULING_API_BASE, SCHEDULING_DEV_USER_ID_HEADER } from '../../api/schedulingConfig'
import SchedulingUserIdBar from '../../components/scheduling/SchedulingUserIdBar'
import { getEffectiveSchedulingInstructorId } from '../../utils/schedulingInstructorId'
import '../SchedulingPage.css'
import './schedulingMs.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const TIME_CATS = [
  { value: 'morning', label: 'Morning (< 12:00)' },
  { value: 'afternoon', label: 'Afternoon (12:00–17:00)' },
  { value: 'evening', label: 'Evening (≥ 17:00)' },
]
const SEMESTERS = ['Fall', 'Spring', 'Summer']

const SchedulingPreferencesPage = () => {
  const navigate = useNavigate()
  const resolvedInstructorId = getEffectiveSchedulingInstructorId()

  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()))
  const [semester, setSemester] = useState('Fall')

  const [strict, setStrict] = useState(false)
  const [notes, setNotes] = useState('')
  const [preferredDays, setPreferredDays] = useState(() => new Set())
  const [preferredTimeCategories, setPreferredTimeCategories] = useState(() => new Set())

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadMessage, setLoadMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })
  const [profileId, setProfileId] = useState(null)

  function toggleDay(day) {
    setPreferredDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  function toggleTime(cat) {
    setPreferredTimeCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  async function handleLoad() {
    setLoadMessage('')
    setSaveMessage({ type: '', text: '' })
    if (!getEffectiveSchedulingInstructorId()) {
      setLoadMessage(
        `No instructor id for ${SCHEDULING_DEV_USER_ID_HEADER}. Sign in, or set Instructor user ID below (Auth UUID or numeric string).`
      )
      return
    }

    setLoading(true)
    try {
      const p = await preferencesGet(academicYear.trim(), semester)
      setProfileId(p.id ?? null)
      setStrict(Boolean(p.strict))
      setNotes(p.notes ?? '')
      setPreferredDays(new Set(p.preferred_days ?? []))
      setPreferredTimeCategories(new Set(p.preferred_time_categories ?? []))
      setLoadMessage('Loaded your preferences for this term.')
    } catch (e) {
      if (e?.status === 404) {
        setProfileId(null)
        setStrict(false)
        setNotes('')
        setPreferredDays(new Set())
        setPreferredTimeCategories(new Set())
        setLoadMessage('No profile for this term yet — fill the form and save to create one.')
      } else {
        setLoadMessage(e.message || 'Could not load preferences.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveMessage({ type: '', text: '' })
    if (!getEffectiveSchedulingInstructorId()) {
      setSaveMessage({
        type: 'error',
        text: `No valid id for ${SCHEDULING_DEV_USER_ID_HEADER}. Set Instructor user ID below or use a JWT with sub / instructor claim (UUID or numeric).`,
      })
      return
    }

    const body = {
      academic_year: academicYear.trim(),
      semester: semester.trim(),
      strict,
      notes: notes.trim() === '' ? null : notes.trim(),
      preferred_days: Array.from(preferredDays),
      preferred_time_categories: Array.from(preferredTimeCategories),
    }

    setSaving(true)
    try {
      const p = await preferencesPut(body)
      setProfileId(p.id ?? null)
      setSaveMessage({ type: 'ok', text: 'Preferences saved.' })
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message || 'Save failed.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="scheduling-page">
      <div className="page-container scheduling-wide">
        <nav className="scheduling-subnav" aria-label="Scheduling sections">
          <Link to="/scheduling/courses">Courses</Link>
          <Link to="/scheduling/preferences" className="scheduling-subnav-active">
            Add preferences
          </Link>
          <Link to="/scheduling">Scheduling</Link>
        </nav>

        <h1>Instructor preferences</h1>
        <p className="scheduling-muted">
          Uses <span className="sched-ms-code">GET /api/v1/instructors/preferences</span> (query{' '}
          <span className="sched-ms-code">academic_year</span>, <span className="sched-ms-code">semester</span>) and{' '}
          <span className="sched-ms-code">PUT /api/v1/instructors/preferences</span> on{' '}
          <span className="sched-ms-code">{SCHEDULING_API_BASE}</span>. The instructor is identified only via the{' '}
          <span className="sched-ms-code">{SCHEDULING_DEV_USER_ID_HEADER}</span> header (Auth user UUID or legacy numeric
          string). Preferences are per term.
        </p>

        <SchedulingUserIdBar />

        {resolvedInstructorId ? (
          <p className="scheduling-muted" style={{ marginTop: 8 }}>
            Requests use <span className="sched-ms-code">{SCHEDULING_DEV_USER_ID_HEADER}</span> ={' '}
            <span className="sched-ms-code">{resolvedInstructorId}</span>
          </p>
        ) : (
          <p className="sched-ms-error" style={{ marginTop: 8 }}>
            Set <strong>Instructor user ID</strong> above, or sign in so your JWT supplies a valid instructor user id
            for <span className="sched-ms-code">{SCHEDULING_DEV_USER_ID_HEADER}</span>.
          </p>
        )}

        <div className="sched-ms-section">
          <h2>Term</h2>
          <div className="sched-ms-form-grid">
            <label className="sched-ms-field">
              <span>academic_year</span>
              <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2026" />
            </label>
            <label className="sched-ms-field">
              <span>semester</span>
              <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="sched-ms-actions">
            <button
              type="button"
              className="sched-ms-btn-secondary"
              onClick={handleLoad}
              disabled={loading || !resolvedInstructorId}
            >
              {loading ? 'Loading…' : 'Load my preferences'}
            </button>
          </div>
          {loadMessage ? <p className="scheduling-muted" style={{ marginTop: 10 }}>{loadMessage}</p> : null}
          {profileId != null ? (
            <p className="scheduling-muted" style={{ marginTop: 8 }}>
              Profile id: <span className="sched-ms-code">{profileId}</span>
            </p>
          ) : null}
        </div>

        <form className="sched-ms-section" onSubmit={handleSave}>
          <h2>Preference profile</h2>
          <label className="sched-ms-check" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
            <span>
              <strong>strict</strong> — only assign slots that match preferred days and time categories (when those
              lists are non-empty)
            </span>
          </label>

          <p className="sched-ms-field">
            <span>preferred_days</span>
          </p>
          <div className="sched-ms-check-grid">
            {DAYS.map((d) => (
              <label key={d} className="sched-ms-check">
                <input type="checkbox" checked={preferredDays.has(d)} onChange={() => toggleDay(d)} />
                {d}
              </label>
            ))}
          </div>

          <p className="sched-ms-field">
            <span>preferred_time_categories</span>
          </p>
          <div className="sched-ms-check-grid">
            {TIME_CATS.map(({ value, label }) => (
              <label key={value} className="sched-ms-check">
                <input
                  type="checkbox"
                  checked={preferredTimeCategories.has(value)}
                  onChange={() => toggleTime(value)}
                />
                {label}
              </label>
            ))}
          </div>

          <label className="sched-ms-field" style={{ maxWidth: '100%' }}>
            <span>notes</span>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>

          {saveMessage.text ? (
            <p className={saveMessage.type === 'error' ? 'sched-ms-error' : 'sched-ms-success'}>{saveMessage.text}</p>
          ) : null}

          <div className="sched-ms-actions">
            <button type="submit" className="back-button" disabled={saving || !resolvedInstructorId}>
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        </form>

        <div className="scheduling-actions">
          <button type="button" className="back-button scheduling-back-secondary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default SchedulingPreferencesPage
