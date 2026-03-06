import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStudentAttendanceForCrn, formatAttendanceDate } from '../data/attendanceData'
import adaLogo from '../assets/ada-logo.png'
import './AttendancePortal.css'
import './AttendanceStudents.css'

const statusLabel = (status) => {
  switch (status) {
    case 'present': return { text: 'PRESENT', className: 'ap-student-status--present' }
    case 'late': return { text: 'LATE', className: 'ap-student-status--late' }
    case 'absent': return { text: 'ABSENT', className: 'ap-student-status--absent' }
    default: return { text: status?.toUpperCase() || '—', className: '' }
  }
}

export default function AttendanceStudents() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const students = getStudentAttendanceForCrn(lessonId)
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const selectedStudent = students.find((s) => s.studentId === selectedStudentId)

  return (
    <div className="attendance-portal">
      <header className="ap-navbar">
        <div className="ap-nav-left">
          <button type="button" className="ap-logo-btn" onClick={() => navigate('/')} aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="ap-logo-img" />
          </button>
          <nav className="ap-nav-links">
            <button type="button" className="ap-nav-link" onClick={() => navigate(`/attendance/lesson/${lessonId || 'demo'}`)}>
              Dashboard
            </button>
            <button type="button" className="ap-nav-link" onClick={() => navigate(`/attendance/lesson/${lessonId || 'demo'}/history`)}>
              History
            </button>
            <span className="ap-nav-link ap-nav-link--active">Students</span>
            <button type="button" className="ap-nav-link">Settings</button>
          </nav>
        </div>
        <div className="ap-nav-right">
          <button type="button" className="ap-icon-btn" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </button>
          <div className="ap-user">
            <div className="ap-user-avatar" />
            <span className="ap-user-arrow">▼</span>
          </div>
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
              <ul className="ap-student-history-list">
                {selectedStudent.sessionHistory.length === 0 ? (
                  <li className="ap-student-history-empty">No session records yet.</li>
                ) : (
                  selectedStudent.sessionHistory
                    .sort((a, b) => new Date(b.date + 'T' + b.startTime) - new Date(a.date + 'T' + a.startTime))
                    .map((h, i) => {
                      const { text, className } = statusLabel(h.status)
                      return (
                        <li key={`${h.sessionId}-${i}`} className="ap-student-history-item">
                          <span className="ap-student-history-date">{formatAttendanceDate(h.date)}</span>
                          <span className="ap-student-history-time">{h.startTime} – {h.endTime}</span>
                          <span className={`ap-student-status ${className}`}>{text}</span>
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
