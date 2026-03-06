import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionsForCrn, getStudentsForSession, formatAttendanceDate } from '../data/attendanceData'
import adaLogo from '../assets/ada-logo.png'
import './AttendancePortal.css'
import './AttendanceStudents.css'
import './AttendanceHistory.css'

function getAttendanceRate(sessionId) {
  const students = getStudentsForSession(sessionId)
  const total = students.length
  const attended = students.filter((s) => s.status === 'present' || s.status === 'late').length
  const rate = total ? Math.round((attended / total) * 100) : 0
  return { attended, total, rate }
}

const statusLabel = (status) => {
  switch (status) {
    case 'present': return { text: 'PRESENT', className: 'ap-student-status--present' }
    case 'late': return { text: 'LATE', className: 'ap-student-status--late' }
    case 'absent': return { text: 'ABSENT', className: 'ap-student-status--absent' }
    default: return { text: status?.toUpperCase() || '—', className: '' }
  }
}

export default function AttendanceHistory() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const sessions = getSessionsForCrn(lessonId)
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)
  const sessionStudents = selectedSessionId ? getStudentsForSession(selectedSessionId) : []

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
            <span className="ap-nav-link ap-nav-link--active">History</span>
            <button type="button" className="ap-nav-link" onClick={() => navigate(`/attendance/lesson/${lessonId || 'demo'}/students`)}>
              Students
            </button>
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
        <section className="ap-history-header">
          <h1 className="ap-history-title">Session history — CRN {lessonId || '—'}</h1>
          <p className="ap-history-subtitle">Past attendance sessions. Click a session to see students and their status.</p>
        </section>

        <div className="ap-history-card">
          <ul className="ap-history-session-list">
            {sessions.map((session) => {
              const { attended, total, rate } = getAttendanceRate(session.id)
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className={`ap-history-session-item ${selectedSessionId === session.id ? 'ap-history-session-item--selected' : ''}`}
                    onClick={() => setSelectedSessionId(selectedSessionId === session.id ? null : session.id)}
                  >
                    <span className="ap-history-session-date">{formatAttendanceDate(session.date)}</span>
                    <span className="ap-history-session-meta">
                      <span className="ap-history-session-time">
                        {session.startTime} – {session.endTime}
                      </span>
                      <span className="ap-history-session-rate">{attended}/{total} · {rate}%</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {selectedSession && (
            <div className="ap-history-detail">
              <h2 className="ap-history-detail-title">
                {formatAttendanceDate(selectedSession.date)} · {selectedSession.startTime} – {selectedSession.endTime}
              </h2>
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
                    {sessionStudents.map((s) => {
                      const { text, className } = statusLabel(s.status)
                      return (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.studentId}</td>
                          <td>
                            <span className={`ap-student-status ${className}`}>{text}</span>
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
