import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AttendanceCourseList.css'

// Static list of CRNs for the instructor. Replace with backend data later.
const INSTRUCTOR_CRNS = [
  { crn: '10101', code: 'CSCI 101', title: 'Computer Science I', section: 'A' },
  { crn: '10102', code: 'CSCI 101', title: 'Computer Science I', section: 'B' },
  { crn: '18101', code: 'CSCI 181', title: 'Data Structures', section: 'A' },
  { crn: '20101', code: 'MATH 201', title: 'Calculus II', section: 'A' },
]

const AttendanceCourseList = () => {
  const navigate = useNavigate()
  const [selectedCrn, setSelectedCrn] = useState(null)

  const handleEnter = () => {
    if (!selectedCrn) return
    navigate(`/attendance/lesson/${selectedCrn}`)
  }

  return (
    <div className="attendance-course-list">
      <div className="acl-header">
        <h1 className="acl-title">QR Lesson Attendance</h1>
        <p className="acl-subtitle">Select a course (CRN) to open the attendance portal.</p>
      </div>

      <div className="acl-card">
        <h2 className="acl-card-title">My courses</h2>
        <p className="acl-card-hint">Choose a CRN to start QR-based attendance for that lesson.</p>

        <ul className="acl-crn-list" role="listbox" aria-label="Course list">
          {INSTRUCTOR_CRNS.map((course) => (
            <li key={course.crn}>
              <button
                type="button"
                className={`acl-crn-item ${selectedCrn === course.crn ? 'acl-crn-item--selected' : ''}`}
                onClick={() => setSelectedCrn(course.crn)}
                role="option"
                aria-selected={selectedCrn === course.crn}
              >
                <span className="acl-crn-crn">{course.crn}</span>
                <span className="acl-crn-code">{course.code}</span>
                <span className="acl-crn-section">Section {course.section}</span>
                <span className="acl-crn-title">{course.title}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="acl-actions">
          <button
            type="button"
            className="acl-btn acl-btn--primary"
            disabled={!selectedCrn}
            onClick={handleEnter}
          >
            Enter QR Attendance
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttendanceCourseList
