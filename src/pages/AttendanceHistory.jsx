import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as attendanceApi from '../api/attendance'
import SessionCalendarPicker from '../components/SessionCalendarPicker'
import adaLogo from '../assets/ada-logo.png'
import './AttendancePortal.css'
import './AttendanceStudents.css'
import './AttendanceHistory.css'

const STATUS_ORDER = ['late', 'absent', 'present', 'excused']

const statusLabel = (status) => {
  switch (status) {
    case 'present': return { text: 'PRESENT', className: 'ap-student-status--present' }
    case 'late': return { text: 'LATE', className: 'ap-student-status--late' }
    case 'absent': return { text: 'ABSENT', className: 'ap-student-status--absent' }
    case 'excused': return { text: 'EXCUSED', className: 'ap-student-status--excused' }
    default: return { text: status?.toUpperCase() || '—', className: '' }
  }
}

function formatAttendanceDateFromIso(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AttendanceHistory() {
  const { instructorId, lessonId } = useParams()
  const navigate = useNavigate()
  const lessonBase = `/attendance/${encodeURIComponent(instructorId || 'demo')}/lesson/${encodeURIComponent(lessonId || 'demo')}`
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [sessionStudents, setSessionStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [draftStatuses, setDraftStatuses] = useState({})
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedSession = useMemo(
    () => sessions.find((s) => String(s.sessionId) === String(selectedSessionId)) || null,
    [sessions, selectedSessionId]
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      const isDemo = String(instructorId || '').toLowerCase() === 'demo' || String(lessonId || '').toLowerCase() === 'demo'
      if (isDemo) return
      setSessionsLoading(true)
      setSessionsError('')
      try {
        const list = await attendanceApi.getLessonSessions({ instructorId, lessonId })
        if (cancelled) return
        setSessions(list)
        if (!selectedSessionId && list.length) {
          setSelectedSessionId(String(list[0].sessionId))
        }
      } catch (e) {
        if (!cancelled) {
          setSessions([])
          setSessionsError(e?.message || 'Could not load session history.')
        }
      } finally {
        if (!cancelled) setSessionsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [instructorId, lessonId, selectedSessionId])

  useEffect(() => {
    let cancelled = false
    async function loadStudents() {
      const isDemo = String(instructorId || '').toLowerCase() === 'demo' || String(lessonId || '').toLowerCase() === 'demo'
      if (isDemo) return
      if (!selectedSessionId) {
        setSessionStudents([])
        setStudentsError('')
        return
      }
      setStudentsLoading(true)
      setStudentsError('')
      try {
        const roster = await attendanceApi.getSessionAttendance({
          instructorId,
          sessionId: Number(selectedSessionId),
        })
        if (cancelled) return
        setSessionStudents(roster)
      } catch (e) {
        if (!cancelled) {
          setSessionStudents([])
          setStudentsError(e?.message || 'Could not load students for this session.')
        }
      } finally {
        if (!cancelled) setStudentsLoading(false)
      }
    }
    loadStudents()
    return () => { cancelled = true }
  }, [instructorId, lessonId, selectedSessionId])

  const cycleStatus = (sessionId, studentId, currentStatus) => {
    const nextIndex = (STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length
    const nextStatus = STATUS_ORDER[nextIndex >= 0 ? nextIndex : 0]
    setDraftStatuses((prev) => ({
      ...prev,
      [`${sessionId}::${studentId}`]: nextStatus,
    }))
    setSaveMessage('')
  }

  const handleSubmitStatus = async (sessionId, studentId, fallbackStatus) => {
    if (saving) return
    const key = `${sessionId}::${studentId}`
    const status = draftStatuses[key] || fallbackStatus
    setSaving(true)
    setSaveMessage('')
    try {
      await attendanceApi.patchSessionAttendance({
        instructorId,
        sessionId,
        studentId,
        status,
      })
      // Refresh roster so UI reflects backend truth.
      const roster = await attendanceApi.getSessionAttendance({ instructorId, sessionId })
      setSessionStudents(roster)
      setDraftStatuses((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setSaveMessage('Attendance status updated.')
    } catch (e) {
      setSaveMessage(e?.message || 'Could not update attendance status.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="attendance-portal">
      <header className="ap-navbar">
        <div className="ap-nav-left">
          <button type="button" className="ap-logo-btn" onClick={() => navigate('/')} aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="ap-logo-img" />
          </button>
          <nav className="ap-nav-links">
            <button type="button" className="ap-nav-link" onClick={() => navigate(lessonBase)}>
              Dashboard
            </button>
            <button
              type="button"
              className="ap-nav-link"
              onClick={() => navigate(`/attendance/${encodeURIComponent(instructorId || 'demo')}`)}
            >
              Lessons
            </button>
            <span className="ap-nav-link ap-nav-link--active">History</span>
            <button type="button" className="ap-nav-link" onClick={() => navigate(`${lessonBase}/students`)}>
              Students
            </button>
          </nav>
        </div>
      </header>

      <div className="ap-content">
        <section className="ap-history-header">
          <h1 className="ap-history-title">Session history — CRN {lessonId || '—'}</h1>
          <p className="ap-history-subtitle">Past attendance sessions. Click a session to see students and their status.</p>
        </section>

        <div className="ap-history-card">
          <div className="ap-history-calendar-wrap">
            <SessionCalendarPicker
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              loading={sessionsLoading}
              onSelectSessionId={setSelectedSessionId}
              emptyMessage="No sessions yet."
            />
            {sessionsError ? <p className="ap-controls-error" role="alert">{sessionsError}</p> : null}
          </div>

          {selectedSession && (
            <div className="ap-history-detail">
              <h2 className="ap-history-detail-title">
                {formatAttendanceDateFromIso(selectedSession.startTime)} · {new Date(selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(selectedSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h2>
              {saveMessage ? <p className="ap-status-save-message">{saveMessage}</p> : null}
              {studentsError ? <p className="ap-controls-error" role="alert">{studentsError}</p> : null}
              <div className="ap-history-table-wrap">
                <table className="ap-students-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Student ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsLoading ? (
                      <tr><td colSpan={3}>Loading students…</td></tr>
                    ) : sessionStudents.length === 0 ? (
                      <tr><td colSpan={3}>No roster rows found.</td></tr>
                    ) : sessionStudents.map((s) => {
                      const draftKey = `${selectedSession.sessionId}::${s.studentId}`
                      const currentStatus = draftStatuses[draftKey] || s.status
                      const hasDraft = draftStatuses[draftKey] && draftStatuses[draftKey] !== s.status
                      const { text, className } = statusLabel(currentStatus)
                      return (
                        <tr key={String(s.studentId)}>
                          <td>{s.name || s.studentCode || '—'}</td>
                          <td>{s.studentId}</td>
                          <td>
                            <div className="ap-status-editor">
                              <button
                                type="button"
                                className={`ap-student-status ap-student-status--button ${className}`}
                                onClick={() => cycleStatus(selectedSession.sessionId, s.studentId, currentStatus)}
                              >
                                {text}
                              </button>
                              {hasDraft ? (
                                <button
                                  type="button"
                                  className="ap-status-submit"
                                  onClick={() => handleSubmitStatus(selectedSession.sessionId, s.studentId, s.status)}
                                  disabled={saving}
                                >
                                  {saving ? 'Saving…' : 'Submit'}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="ap-footer">
        © 2024 ADA University - Educational Technologies Department. For internal use only.
      </footer>
    </div>
  )
}
