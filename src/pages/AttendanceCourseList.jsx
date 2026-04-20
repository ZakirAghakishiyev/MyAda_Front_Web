import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as attendanceApi from '../api/attendance'
import { AUTH_API_BASE, authFetch, getAccessToken } from '../auth'
import adaLogo from '../assets/ada-logo.png'
import './AttendanceCourseList.css'

const DEMO_LESSONS = [
  { lessonId: '10101', crn: '10101', code: 'CSCI 101', title: 'Computer Science I', section: 'A', academicYear: 2025, semester: 'Fall' },
  { lessonId: '10102', crn: '10102', code: 'CSCI 101', title: 'Computer Science I', section: 'B', academicYear: 2025, semester: 'Spring' },
  { lessonId: '18101', crn: '18101', code: 'CSCI 181', title: 'Data Structures', section: 'A', academicYear: 2026, semester: 'Fall' },
  { lessonId: '20101', crn: '20101', code: 'MATH 201', title: 'Calculus II', section: 'A', academicYear: 2026, semester: 'Spring' },
]

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function readClaim(payload, keys) {
  for (const k of keys) {
    const v = payload?.[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function readNameFromClaims(payload) {
  if (!payload || typeof payload !== 'object') return ''
  const direct = readClaim(payload, [
    'name',
    'fullName',
    'preferred_username',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  ])
  if (direct) return direct
  const first = readClaim(payload, ['given_name', 'firstName'])
  const last = readClaim(payload, ['family_name', 'lastName'])
  return [first, last].filter(Boolean).join(' ').trim()
}

function readUserIdFromClaims(payload) {
  return readClaim(payload, [
    'userId',
    'user_id',
    'sub',
    'uid',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  ])
}

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

function displayNameFromAuthResponse(data) {
  const raw = data?.result !== undefined ? data.result : data
  if (!raw || typeof raw !== 'object') return ''
  if (typeof raw.fullName === 'string' && raw.fullName.trim()) return raw.fullName.trim()
  const first = typeof raw.firstName === 'string' ? raw.firstName.trim() : ''
  const last = typeof raw.lastName === 'string' ? raw.lastName.trim() : ''
  const combined = [first, last].filter(Boolean).join(' ').trim()
  if (combined) return combined
  if (typeof raw.name === 'string' && raw.name.trim()) return raw.name.trim()
  if (typeof raw.userName === 'string' && raw.userName.trim()) return raw.userName.trim()
  return ''
}

const AttendanceCourseList = () => {
  const { instructorId } = useParams()
  const navigate = useNavigate()
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [instructorDisplayName, setInstructorDisplayName] = useState('')

  useEffect(() => {
    async function load() {
      if (!instructorId) return
      if (String(instructorId).trim().toLowerCase() === 'demo') {
        setLessons(DEMO_LESSONS)
        setLoadError('')
        setLoading(false)
        return
      }
      setLoading(true)
      setLoadError('')
      try {
        const list = await attendanceApi.getInstructorLessons({ instructorId })
        setLessons(list)
      } catch (e) {
        setLoadError(e.message || 'Could not load lessons for this instructor.')
        setLessons([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [instructorId])

  useEffect(() => {
    async function resolveInstructorName() {
      const normalizedId = String(instructorId ?? '').trim()
      if (!normalizedId) {
        setInstructorDisplayName('')
        return
      }
      if (normalizedId.toLowerCase() === 'demo') {
        setInstructorDisplayName('Demo Instructor')
        return
      }

      const token = getAccessToken()
      const payload = decodeJwtPayload(token)
      const claimId = readUserIdFromClaims(payload)
      const claimName = readNameFromClaims(payload)
      if (claimId && claimName && claimId === normalizedId) {
        setInstructorDisplayName(claimName)
        return
      }

      // Try common auth profile endpoints by id; tolerate missing endpoint.
      const candidates = [
        `${AUTH_API_BASE}/api/users/${encodeURIComponent(normalizedId)}`,
        `${AUTH_API_BASE}/api/auth/users/${encodeURIComponent(normalizedId)}`,
        `${AUTH_API_BASE}/api/auth/profile/${encodeURIComponent(normalizedId)}`,
      ]
      for (const endpoint of candidates) {
        try {
          const res = await authFetch(endpoint, { method: 'GET' })
          if (!res.ok) continue
          const data = await parseJsonSafe(res)
          const name = displayNameFromAuthResponse(data)
          if (name) {
            setInstructorDisplayName(name)
            return
          }
        } catch {
          // ignore and try next candidate
        }
      }
      setInstructorDisplayName(normalizedId)
    }

    void resolveInstructorName()
  }, [instructorId])

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(lessons.map((l) => String(l.academicYear ?? '').trim()).filter(Boolean)))
    return years.sort((a, b) => Number(b) - Number(a))
  }, [lessons])

  const semesterOptions = useMemo(() => {
    const order = ['Fall', 'Spring', 'Summer']
    const all = Array.from(new Set(lessons.map((l) => String(l.semester ?? '').trim()).filter(Boolean)))
    return all.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }, [lessons])

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const yearOk = !yearFilter || String(l.academicYear ?? '') === yearFilter
      const semOk = !semesterFilter || String(l.semester ?? '') === semesterFilter
      return yearOk && semOk
    })
  }, [lessons, yearFilter, semesterFilter])

  const handleEnter = () => {
    if (!selectedLessonId || !instructorId) return
    navigate(`/attendance/${encodeURIComponent(instructorId)}/lesson/${encodeURIComponent(selectedLessonId)}`)
  }

  return (
    <div className="attendance-course-list">
      <header className="acl-topbar">
        <button
          type="button"
          className="acl-logo-btn"
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          <img src={adaLogo} alt="ADA University" className="acl-logo-img" />
        </button>
      </header>
      <div className="acl-header">
        <h1 className="acl-title">QR Lesson Attendance</h1>
        <p className="acl-subtitle">
          Instructor <span className="acl-instructor-id">{instructorDisplayName || instructorId || '—'}</span>
          {' · '}Select a course (CRN) to open the attendance portal.
        </p>
      </div>

      <div className="acl-card">
        <h2 className="acl-card-title">My courses</h2>
        <p className="acl-card-hint">Choose a lesson to start QR-based attendance.</p>

        <div className="acl-filter-grid">
          <label className="acl-filter-field">
            <span>Academic year</span>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">All years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="acl-filter-field">
            <span>Semester</span>
            <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
              <option value="">All semesters</option>
              {semesterOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ul className="acl-crn-list" role="listbox" aria-label="Course list">
          {filteredLessons.map((course) => (
            <li key={course.lessonId}>
              <button
                type="button"
                className={`acl-crn-item ${selectedLessonId === course.lessonId ? 'acl-crn-item--selected' : ''}`}
                onClick={() => setSelectedLessonId(course.lessonId)}
                role="option"
                aria-selected={selectedLessonId === course.lessonId}
              >
                <span className="acl-crn-crn">{course.crn || `Lesson #${course.lessonId}`}</span>
                <span className="acl-crn-code">{course.code || '—'}</span>
                <span className="acl-crn-section">{course.section ? `Section ${course.section}` : 'Section —'}</span>
                <span className="acl-crn-title">{course.title || 'Untitled lesson'}</span>
                <span className="acl-crn-term">
                  {course.academicYear || '—'} · {course.semester || '—'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {loading ? <p className="acl-card-hint">Loading lessons…</p> : null}
        {!loading && loadError ? <p className="acl-card-hint">{loadError}</p> : null}
        {!loading && !loadError && lessons.length === 0 ? (
          <p className="acl-card-hint">No lessons found for this instructor id.</p>
        ) : null}
        {!loading && !loadError && lessons.length > 0 && filteredLessons.length === 0 ? (
          <p className="acl-card-hint">No lessons match the selected year/semester.</p>
        ) : null}

        <div className="acl-actions">
          <button
            type="button"
            className="acl-btn acl-btn--primary"
            disabled={!selectedLessonId}
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
