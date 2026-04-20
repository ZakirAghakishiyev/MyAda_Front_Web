import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getStudentAttendanceForCrn,
  formatAttendanceDate,
  saveManualAttendanceStatus,
} from '../data/attendanceData'
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

export default function AttendanceStudents() {
  const { instructorId, lessonId } = useParams()
  const navigate = useNavigate()
  const lessonBase = `/attendance/${encodeURIComponent(instructorId || 'demo')}/lesson/${encodeURIComponent(lessonId || 'demo')}`
  const students = getStudentAttendanceForCrn(lessonId)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [draftStatuses, setDraftStatuses] = useState({})
  const [saveMessage, setSaveMessage] = useState('')

  const selectedStudent = students.find((s) => s.studentId === selectedStudentId)

  const cycleStatus = (sessionId, studentId, currentStatus) => {
    const nextIndex = (STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length
    const nextStatus = STATUS_ORDER[nextIndex >= 0 ? nextIndex : 0]
    setDraftStatuses((prev) => ({
      ...prev,
      [`${sessionId}::${studentId}`]: nextStatus,
    }))
    setSaveMessage('')
  }

  const handleSubmitStatus = (sessionId, studentId, fallbackStatus) => {
    const key = `${sessionId}::${studentId}`
    const status = draftStatuses[key] || fallbackStatus
    saveManualAttendanceStatus({ sessionId, studentId, status })
    setDraftStatuses((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setSaveMessage('Attendance status updated locally.')
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
            <span className="ap-students-count">{students.length} student{students.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="ap-students-table-wrap">
            <table className="ap-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Attendance rate</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.studentId}
                    className={selectedStudentId === s.studentId ? 'ap-students-row--selected' : ''}
                    onClick={() => setSelectedStudentId(selectedStudentId === s.studentId ? null : s.studentId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedStudentId(selectedStudentId === s.studentId ? null : s.studentId)}
                  >
                    <td>{s.name}</td>
                    <td>{s.studentId}</td>
                    <td>{s.email}</td>
                    <td>
                      <span className="ap-student-rate">
                        {s.attendedCount}/{s.totalSessions} sessions · {s.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedStudent && (
            <div className="ap-student-detail">
              <h2 className="ap-student-detail-title">Attendance history — {selectedStudent.name}</h2>
              <p className="ap-student-detail-subtitle">Status at each session for this CRN.</p>
              {saveMessage ? <p className="ap-status-save-message">{saveMessage}</p> : null}
              <ul className="ap-student-history-list">
                {selectedStudent.sessionHistory.length === 0 ? (
                  <li className="ap-student-history-empty">No session records yet.</li>
                ) : (
                  selectedStudent.sessionHistory
                    .sort((a, b) => new Date(b.date + 'T' + b.startTime) - new Date(a.date + 'T' + a.startTime))
                    .map((h, i) => {
                      const draftKey = `${h.sessionId}::${selectedStudent.studentId}`
                      const currentStatus = draftStatuses[draftKey] || h.status
                      const hasDraft = draftStatuses[draftKey] && draftStatuses[draftKey] !== h.status
                      const { text, className } = statusLabel(currentStatus)
                      return (
                        <li key={`${h.sessionId}-${i}`} className="ap-student-history-item">
                          <span className="ap-student-history-date">{formatAttendanceDate(h.date)}</span>
                          <span className="ap-student-history-time">{h.startTime} – {h.endTime}</span>
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
                              >
                                Submit
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

      <footer className="ap-footer">
        © 2024 ADA University - Educational Technologies Department. For internal use only.
      </footer>
    </div>
  )
}
