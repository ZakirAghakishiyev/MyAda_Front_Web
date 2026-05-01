import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as attendanceApi from '../api/attendance'
import {
  displayNameFromAuthUserDto,
  fetchAuthAdminUserForClubRoster,
  fetchAuthUserForClubRoster,
  getOrganizationalIdFromAuthUser,
} from '../api/authUsersApi'
import adaLogo from '../assets/ada-logo.png'
import './AttendancePortal.css'
import './AttendanceStudents.css'

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

function looksLikeGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim())
}

function formatFirstLast(displayName) {
  const parts = String(displayName || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1]}`
}

export default function AttendanceStudents() {
  const { instructorId, lessonId } = useParams()
  const navigate = useNavigate()
  const lessonBase = `/attendance/${encodeURIComponent(instructorId || 'demo')}/lesson/${encodeURIComponent(lessonId || 'demo')}`
  const [sessions, setSessions] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [selectedStudentHistory, setSelectedStudentHistory] = useState([])
  const [lessonAttendanceByStudentId, setLessonAttendanceByStudentId] = useState({})
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [draftStatuses, setDraftStatuses] = useState({})
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.studentId) === String(selectedStudentId)) || null,
    [students, selectedStudentId]
  )

  const startedSessionIds = useMemo(() => {
    // Do not count sessions that have never started (no active round, no round history).
    const started = new Set()
    for (const s of sessions || []) {
      const sid = s?.sessionId
      if (sid == null) continue
      if (s?.isActive) started.add(String(sid))
      else if (Number(s?.roundNo || 0) > 0) started.add(String(sid))
    }
    return started
  }, [sessions])

  async function enrichStudentsWithAuthProfile(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return []

    // Try admin endpoint first (when available), otherwise fall back to non-admin profile lookup rules.
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const studentGuid = String(row?.studentId ?? '').trim()
        if (!studentGuid) return row

        let user = null
        try {
          user = await fetchAuthAdminUserForClubRoster(studentGuid)
        } catch {
          user = null
        }
        if (!user) {
          try {
            user = await fetchAuthUserForClubRoster(studentGuid)
          } catch {
            user = null
          }
        }

        const displayName = displayNameFromAuthUserDto(user)
        const orgId = getOrganizationalIdFromAuthUser(user)

        const bestName = formatFirstLast(displayName) || (looksLikeGuid(row?.name) ? '' : String(row?.name || '').trim())
        const bestStudentId =
          (orgId && String(orgId).trim()) ||
          (row?.studentCode && String(row.studentCode).trim()) ||
          (looksLikeGuid(row?.studentId) ? '' : String(row?.studentId || '').trim())

        return {
          ...row,
          name: bestName || '—',
          organizationalId: orgId || null,
          studentCode: bestStudentId || '',
        }
      })
    )

    return enriched
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      const isDemo = String(instructorId || '').toLowerCase() === 'demo' || String(lessonId || '').toLowerCase() === 'demo'
      if (isDemo) return
      setLoading(true)
      setError('')
      try {
        const list = await attendanceApi.getLessonSessions({ instructorId, lessonId })
        if (cancelled) return
        setSessions(list)

        // Prefer lesson enrollments endpoint (admin), fallback to a session roster.
        try {
          const enrollments = await attendanceApi.getLessonEnrollmentsAdmin({ lessonId })
          if (cancelled) return
          const baseRows = enrollments.map((r) => ({
              id: String(r.studentId),
              name: r.name || r.studentCode || '—',
              studentId: r.studentId,
              email: r.email || '',
              studentCode: r.studentCode || '',
            }))
          const enriched = await enrichStudentsWithAuthProfile(baseRows)
          if (cancelled) return
          setStudents(enriched)
          return
        } catch {
          // Fallback below.
        }

        const targetSessionId = list.find((s) => s.isActive)?.sessionId ?? list[0]?.sessionId
        if (!targetSessionId) {
          setStudents([])
          return
        }
        const roster = await attendanceApi.getSessionAttendance({ instructorId, sessionId: targetSessionId })
        if (cancelled) return

        const baseRows = roster.map((r) => ({
            id: String(r.studentId),
            name: r.name || r.studentCode || '—',
            studentId: r.studentId,
            email: '',
            studentCode: r.studentCode || '',
          }))
        const enriched = await enrichStudentsWithAuthProfile(baseRows)
        if (cancelled) return
        setStudents(enriched)
      } catch (e) {
        if (!cancelled) {
          setStudents([])
          setSessions([])
          setError(e?.message || 'Could not load students.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [instructorId, lessonId])

  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      const isDemo = String(instructorId || '').toLowerCase() === 'demo' || String(lessonId || '').toLowerCase() === 'demo'
      if (isDemo) return
      if (!selectedStudentId) {
        setSelectedStudentHistory([])
        setHistoryError('')
        return
      }
      const cached = lessonAttendanceByStudentId[String(selectedStudentId)]
      if (Array.isArray(cached)) {
        setSelectedStudentHistory(cached)
        setHistoryError('')
        setHistoryLoading(false)
        return
      }

      setHistoryLoading(true)
      setHistoryError('')
      try {
        const rows = await attendanceApi.getStudentLessonAttendance({
          studentId: selectedStudentId,
          lessonId,
        })
        if (cancelled) return
        setSelectedStudentHistory(rows)
        setLessonAttendanceByStudentId((prev) => ({ ...prev, [String(selectedStudentId)]: rows }))
      } catch (e) {
        if (!cancelled) {
          setSelectedStudentHistory([])
          setHistoryError(e?.message || 'Could not load this student attendance history.')
        }
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    loadHistory()
    return () => { cancelled = true }
  }, [instructorId, lessonId, selectedStudentId, lessonAttendanceByStudentId])

  useEffect(() => {
    let cancelled = false
    async function preloadAllLessonAttendance() {
      const isDemo = String(instructorId || '').toLowerCase() === 'demo' || String(lessonId || '').toLowerCase() === 'demo'
      if (isDemo) return
      if (!lessonId) return
      if (!Array.isArray(students) || students.length === 0) return

      // Only fetch missing students.
      const missing = students
        .map((s) => String(s.studentId))
        .filter((id) => id && !Array.isArray(lessonAttendanceByStudentId[id]))

      if (missing.length === 0) return

      try {
        const results = await Promise.all(
          missing.map(async (studentId) => {
            try {
              const rows = await attendanceApi.getStudentLessonAttendance({ studentId, lessonId })
              return { studentId, rows: Array.isArray(rows) ? rows : [] }
            } catch {
              return { studentId, rows: [] }
            }
          })
        )
        if (cancelled) return
        setLessonAttendanceByStudentId((prev) => {
          const next = { ...prev }
          for (const item of results) next[String(item.studentId)] = item.rows
          return next
        })
      } catch {
        // Ignore preload failures; the per-student click fetch still works.
      }
    }
    preloadAllLessonAttendance()
    return () => { cancelled = true }
  }, [instructorId, lessonId, students, lessonAttendanceByStudentId])

  const studentStats = useMemo(() => {
    const byId = new Map()
    for (const s of students) {
      const id = String(s.studentId)
      const rows = lessonAttendanceByStudentId[id]
      const attendedCount = Array.isArray(rows)
        ? rows.filter((r) => (r?.status === 'present' || r?.status === 'late') && startedSessionIds.has(String(r?.sessionId))).length
        : 0
      const totalSessions = startedSessionIds.size
      byId.set(id, { attendedCount, totalSessions })
    }
    return byId
  }, [students, lessonAttendanceByStudentId, startedSessionIds])

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
      // Refresh the student's lesson history and clear draft.
      const rows = await attendanceApi.getStudentLessonAttendance({ studentId, lessonId })
      setSelectedStudentHistory(rows)
      setLessonAttendanceByStudentId((prev) => ({ ...prev, [String(studentId)]: rows }))
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
            <button type="button" className="ap-nav-link" onClick={() => navigate(`${lessonBase}/history`)}>
              History
            </button>
            <span className="ap-nav-link ap-nav-link--active">Students</span>
          </nav>
        </div>
      </header>

      <div className="ap-content">
        <section className="ap-students-header">
          <h1 className="ap-students-title">Students — CRN {lessonId || '—'}</h1>
          <p className="ap-students-subtitle">Attendance rate across all sessions. Click a student to see their session-by-session history.</p>
        </section>

        <div className="ap-students-card">
          <div className="ap-students-toolbar">
            <span className="ap-students-count">
              {loading ? 'Loading…' : `${students.length} student${students.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {error ? <p className="ap-controls-error" role="alert" style={{ marginBottom: 10 }}>{error}</p> : null}
          <div className="ap-students-table-wrap">
            <table className="ap-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Attendance rate</th>
                </tr>
              </thead>
              <tbody>
                {!loading && students.map((s) => {
                  const stats = studentStats.get(String(s.studentId)) || { attendedCount: 0, totalSessions: sessions.length }
                  const total = stats.totalSessions || sessions.length || 0
                  const attended = stats.attendedCount || 0
                  const rate = total ? Math.round((attended / total) * 100) : 0
                  return (
                  <tr
                    key={s.studentId}
                    className={selectedStudentId === s.studentId ? 'ap-students-row--selected' : ''}
                    onClick={() => setSelectedStudentId(selectedStudentId === s.studentId ? null : s.studentId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedStudentId(selectedStudentId === s.studentId ? null : s.studentId)}
                  >
                    <td>{s.name}</td>
                    <td>{s.studentCode || s.organizationalId || '—'}</td>
                    <td>
                      <span className="ap-student-rate">
                        {attended}/{total} sessions · {rate}%
                      </span>
                    </td>
                  </tr>
                  )
                })}
                {!loading && students.length === 0 ? (
                  <tr><td colSpan={3}>No students found.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {selectedStudent && (
            <div className="ap-student-detail">
              <h2 className="ap-student-detail-title">Attendance history — {selectedStudent.name}</h2>
              <p className="ap-student-detail-subtitle">Status at each session for this CRN.</p>
              {saveMessage ? <p className="ap-status-save-message">{saveMessage}</p> : null}
              {historyError ? <p className="ap-controls-error" role="alert">{historyError}</p> : null}
              <ul className="ap-student-history-list">
                {historyLoading ? (
                  <li className="ap-student-history-empty">Loading attendance history…</li>
                ) : selectedStudentHistory.length === 0 ? (
                  <li className="ap-student-history-empty">No session records yet.</li>
                ) : (
                  selectedStudentHistory
                    .slice()
                    .sort((a, b) => new Date(b.sessionStartTime || 0) - new Date(a.sessionStartTime || 0))
                    .map((h, i) => {
                      const draftKey = `${h.sessionId}::${selectedStudent.studentId}`
                      const currentStatus = draftStatuses[draftKey] || h.status
                      const hasDraft = draftStatuses[draftKey] && draftStatuses[draftKey] !== h.status
                      const { text, className } = statusLabel(currentStatus)
                      return (
                        <li key={`${h.sessionId}-${i}`} className="ap-student-history-item">
                          <span className="ap-student-history-date">{formatAttendanceDateFromIso(h.sessionStartTime)}</span>
                          <span className="ap-student-history-time">
                            {h.sessionStartTime ? new Date(h.sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            {' – '}
                            {h.sessionEndTime ? new Date(h.sessionEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                          <div className="ap-status-editor">
                            <button
                              type="button"
                              className={`ap-student-status ap-student-status--button ${className}`}
                              onClick={() => cycleStatus(h.sessionId, selectedStudent.studentId, currentStatus)}
                            >
                              {text}
                            </button>
                            {hasDraft ? (
                              <button
                                type="button"
                                className="ap-status-submit"
                                onClick={() => handleSubmitStatus(h.sessionId, selectedStudent.studentId, h.status)}
                                disabled={saving}
                              >
                                {saving ? 'Saving…' : 'Submit'}
                              </button>
                            ) : null}
                          </div>
                        </li>
                      )
                    })
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
