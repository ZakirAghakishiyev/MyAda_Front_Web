import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCourse, fetchLessonsByCourseId, updateCourse } from '../../api/courses'
import { createLesson } from '../../api/lessons'
import { MOCK_INSTRUCTORS, instructorNameById } from '../../data/mockInstructors'
import '../SchedulingPage.css'
import './CoursePage.css'

const SEMESTERS = [
  { value: 'Fall', label: 'Fall' },
  { value: 'Spring', label: 'Spring' },
  { value: 'Summer', label: 'Summer' },
]

function formatSemester(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') return value
  if (value === 1) return 'Fall'
  if (value === 2) return 'Spring'
  if (value === 3) return 'Summer'
  return String(value)
}

function toInt(value) {
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : null
}

const emptyLessonForm = () => ({
  roomId: '1',
  academicYear: String(new Date().getFullYear()),
  semester: 'Fall',
  maxCapacity: '',
})

const CourseDetailPage = () => {
  const { courseId: courseIdParam } = useParams()
  const courseId = toInt(courseIdParam)

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [loadingLessons, setLoadingLessons] = useState(true)
  const [lessonsError, setLessonsError] = useState('')
  const [loadError, setLoadError] = useState('')

  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    code: '',
    credits: '',
    timesPerWeek: '',
  })
  const [submittingUpdate, setSubmittingUpdate] = useState(false)
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' })

  const [lessonForm, setLessonForm] = useState(emptyLessonForm)
  const [lessonInstructorId, setLessonInstructorId] = useState('')
  const [instructorInput, setInstructorInput] = useState('')
  const [instructorMenuOpen, setInstructorMenuOpen] = useState(false)
  const instructorComboboxRef = useRef(null)
  const [submittingLesson, setSubmittingLesson] = useState(false)
  const [lessonMessage, setLessonMessage] = useState({ type: '', text: '' })

  const loadCourse = useCallback(async () => {
    if (courseId == null) {
      setLoadError('Invalid course id.')
      setLoadingCourse(false)
      return
    }
    setLoadError('')
    setLoadingCourse(true)
    try {
      const c = await fetchCourse(courseId)
      setCourse(c)
      setEditForm({
        name: c.name ?? '',
        department: c.department ?? '',
        code: c.code ?? '',
        credits: String(c.credits ?? ''),
        timesPerWeek: String(c.timesPerWeek ?? ''),
      })
    } catch (e) {
      setLoadError(e.message || 'Could not load course.')
      setCourse(null)
    } finally {
      setLoadingCourse(false)
    }
  }, [courseId])

  const loadLessons = useCallback(async () => {
    if (courseId == null) {
      setLoadingLessons(false)
      return
    }
    setLessonsError('')
    setLoadingLessons(true)
    try {
      const list = await fetchLessonsByCourseId(courseId)
      setLessons(list)
    } catch (e) {
      setLessonsError(e.message || 'Could not load lessons for this course.')
      setLessons([])
    } finally {
      setLoadingLessons(false)
    }
  }, [courseId])

  useEffect(() => {
    loadCourse()
  }, [loadCourse])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  const sortedInstructors = useMemo(
    () => [...MOCK_INSTRUCTORS].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    []
  )

  const filteredInstructors = useMemo(() => {
    const q = instructorInput.trim().toLowerCase()
    if (!q) return sortedInstructors
    return sortedInstructors.filter((i) => i.fullName.toLowerCase().includes(q))
  }, [instructorInput, sortedInstructors])

  useEffect(() => {
    function onDocMouseDown(e) {
      const el = instructorComboboxRef.current
      if (!el || el.contains(e.target)) return
      setInstructorMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  function onChangeEdit(field) {
    return (e) => {
      const v = e.target.value
      setEditForm((prev) => ({ ...prev, [field]: v }))
    }
  }

  function onChangeLesson(field) {
    return (e) => {
      const v = e.target.value
      setLessonForm((prev) => ({ ...prev, [field]: v }))
    }
  }

  function selectInstructor(row) {
    setLessonInstructorId(String(row.id))
    setInstructorInput(row.fullName)
    setInstructorMenuOpen(false)
  }

  async function onSubmitUpdate(e) {
    e.preventDefault()
    setUpdateMessage({ type: '', text: '' })
    if (courseId == null) return

    const credits = toInt(editForm.credits)
    const timesPerWeek = toInt(editForm.timesPerWeek)
    if (credits == null || timesPerWeek == null) {
      setUpdateMessage({ type: 'error', text: 'Credits and times per week must be valid numbers.' })
      return
    }

    const body = {
      name: editForm.name.trim(),
      department: editForm.department.trim(),
      code: editForm.code.trim(),
      credits,
      timesPerWeek,
    }
    if (!body.name || !body.department || !body.code) {
      setUpdateMessage({ type: 'error', text: 'Name, department, and code are required.' })
      return
    }

    setSubmittingUpdate(true)
    try {
      const updated = await updateCourse(courseId, body)
      setCourse(updated)
      setUpdateMessage({ type: 'ok', text: 'Course updated.' })
    } catch (err) {
      setUpdateMessage({ type: 'error', text: err.message || 'Update failed.' })
    } finally {
      setSubmittingUpdate(false)
    }
  }

  async function onSubmitLesson(e) {
    e.preventDefault()
    setLessonMessage({ type: '', text: '' })
    if (courseId == null) return

    const instructorId = lessonInstructorId.trim()
    const roomId = toInt(lessonForm.roomId)
    const academicYear = toInt(lessonForm.academicYear)
    const maxCapacity = toInt(lessonForm.maxCapacity)

    if (!instructorId) {
      setLessonMessage({ type: 'error', text: 'Select an instructor from the list.' })
      return
    }
    if (roomId == null || roomId <= 0) {
      setLessonMessage({ type: 'error', text: 'roomId must be a positive integer.' })
      return
    }
    if (academicYear == null || academicYear < 2000 || academicYear > 2100) {
      setLessonMessage({ type: 'error', text: 'Academic year must be between 2000 and 2100.' })
      return
    }
    if (maxCapacity == null || maxCapacity < 0) {
      setLessonMessage({ type: 'error', text: 'Max capacity must be a valid number (≥ 0).' })
      return
    }

    const payload = {
      courseId,
      instructorId,
      roomId,
      academicYear,
      semester: lessonForm.semester,
      maxCapacity,
    }

    setSubmittingLesson(true)
    try {
      await createLesson(payload)
      setLessonMessage({ type: 'ok', text: 'Lesson created. CRN is assigned by the server.' })
      setLessonForm(emptyLessonForm())
      setLessonInstructorId('')
      setInstructorInput('')
      await loadLessons()
    } catch (err) {
      setLessonMessage({ type: 'error', text: err.message || 'Create failed.' })
    } finally {
      setSubmittingLesson(false)
    }
  }

  if (courseId == null) {
    return (
      <div className="scheduling-page">
        <div className="page-container scheduling-wide course-page-shell">
          <p className="course-form-error">Invalid course link.</p>
          <Link to="/scheduling/courses" className="course-detail-back-link">
            Back to courses
          </Link>
        </div>
      </div>
    )
  }

  if (loadingCourse && !course) {
    return (
      <div className="scheduling-page">
        <div className="page-container scheduling-wide course-page-shell">
          <p className="scheduling-muted">Loading course…</p>
        </div>
      </div>
    )
  }

  if (loadError || !course) {
    return (
      <div className="scheduling-page">
        <div className="page-container scheduling-wide course-page-shell">
          <p className="course-form-error">{loadError || 'Course not found.'}</p>
          <Link to="/scheduling/courses" className="course-detail-back-link">
            Back to courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="scheduling-page">
      <div className="page-container scheduling-wide course-page-shell">
        <nav className="scheduling-subnav" aria-label="Scheduling sections">
          <Link to="/scheduling/courses">Courses</Link>
          <Link to="/scheduling/preferences">Add preferences</Link>
          <Link to="/scheduling">Scheduling</Link>
        </nav>

        <header className="course-detail-header">
          <div>
            <Link to="/scheduling/courses" className="course-detail-back-link">
              ← All courses
            </Link>
            <h1 className="course-detail-title">{course.name}</h1>
            <p className="scheduling-muted course-detail-meta">
              Course id {course.id} · {course.department} {course.code}
            </p>
          </div>
        </header>

        <div className="course-detail-grid">
          <section className="course-panel" aria-labelledby="edit-course-heading">
            <h2 id="edit-course-heading">Course details</h2>
            <p className="course-panel-hint">PUT /api/admin/courses/{'{id}'}</p>
            <form className="course-form" onSubmit={onSubmitUpdate}>
              <label className="course-field">
                <span>Name</span>
                <input type="text" value={editForm.name} onChange={onChangeEdit('name')} required autoComplete="off" />
              </label>
              <div className="course-form-grid">
                <label className="course-field">
                  <span>Department</span>
                  <input type="text" value={editForm.department} onChange={onChangeEdit('department')} required autoComplete="off" />
                </label>
                <label className="course-field">
                  <span>Code</span>
                  <input type="text" value={editForm.code} onChange={onChangeEdit('code')} required autoComplete="off" />
                </label>
              </div>
              <div className="course-form-grid course-form-grid-metrics">
                <label className="course-field">
                  <span>Credits</span>
                  <input type="number" min={0} value={editForm.credits} onChange={onChangeEdit('credits')} required />
                </label>
                <label className="course-field">
                  <span>Times per week</span>
                  <input type="number" min={0} value={editForm.timesPerWeek} onChange={onChangeEdit('timesPerWeek')} required />
                </label>
              </div>
              {updateMessage.text ? (
                <p className={updateMessage.type === 'error' ? 'course-form-error' : 'course-form-success'} role="status">
                  {updateMessage.text}
                </p>
              ) : null}
              <button type="submit" className="back-button course-submit" disabled={submittingUpdate}>
                {submittingUpdate ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </section>

          <section className="course-panel" aria-labelledby="add-lesson-detail-heading">
            <h2 id="add-lesson-detail-heading">Add lesson</h2>
            <p className="course-panel-hint">POST /api/admin/lessons for this course (courseId {course.id})</p>
            <form className="course-form" onSubmit={onSubmitLesson}>
              <div className="course-field">
                <span>Course</span>
                <input type="text" value={`${course.code} · ${course.name}`} readOnly disabled className="course-readonly-input" />
              </div>

              <div className="course-field course-field-combobox" ref={instructorComboboxRef}>
                <span id="detail-instructor-label">Instructor id (GUID)</span>
                <div className="instructor-combobox">
                  <input
                    type="text"
                    className="instructor-combobox-input"
                    value={instructorInput}
                    onChange={(e) => {
                      setInstructorInput(e.target.value)
                      setLessonInstructorId('')
                      setInstructorMenuOpen(true)
                    }}
                    onFocus={() => setInstructorMenuOpen(true)}
                    onKeyDown={(e) => e.key === 'Escape' && setInstructorMenuOpen(false)}
                    placeholder="Search or pick an instructor…"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={instructorMenuOpen}
                    aria-controls="detail-instructor-listbox"
                    aria-labelledby="detail-instructor-label"
                  />
                  {instructorMenuOpen ? (
                    <ul id="detail-instructor-listbox" className="instructor-combobox-list" role="listbox">
                      {filteredInstructors.length === 0 ? (
                        <li className="instructor-combobox-empty">No matches</li>
                      ) : (
                        filteredInstructors.map((i) => (
                          <li key={i.id} role="presentation">
                            <button
                              type="button"
                              className="instructor-combobox-option"
                              onMouseDown={(ev) => ev.preventDefault()}
                              onClick={() => selectInstructor(i)}
                            >
                              {i.fullName}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="course-form-grid">
                <label className="course-field">
                  <span>Academic year</span>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={lessonForm.academicYear}
                    onChange={onChangeLesson('academicYear')}
                    required
                  />
                </label>
                <label className="course-field">
                  <span>Semester</span>
                  <select value={lessonForm.semester} onChange={onChangeLesson('semester')} required>
                    {SEMESTERS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="course-field">
                <span>Max capacity</span>
                <input type="number" min={0} value={lessonForm.maxCapacity} onChange={onChangeLesson('maxCapacity')} required />
              </label>
              <label className="course-field">
                <span>Room id</span>
                <input type="number" min={1} value={lessonForm.roomId} onChange={onChangeLesson('roomId')} required />
              </label>

              {lessonMessage.text ? (
                <p className={lessonMessage.type === 'error' ? 'course-form-error' : 'course-form-success'} role="status">
                  {lessonMessage.text}
                </p>
              ) : null}

              <button type="submit" className="back-button course-submit" disabled={submittingLesson}>
                {submittingLesson ? 'Creating…' : 'Create lesson'}
              </button>
            </form>
          </section>
        </div>

        <section className="course-panel course-detail-lessons-block" aria-labelledby="course-lessons-heading">
          <h2 id="course-lessons-heading">Lessons for this course</h2>
          <p className="course-panel-hint course-panel-hint-tight">GET /api/admin/courses/{course.id}/lessons</p>
          {loadingLessons ? <p className="scheduling-muted">Loading lessons…</p> : null}
          {!loadingLessons && lessonsError ? <p className="course-form-error">{lessonsError}</p> : null}
          {!loadingLessons && !lessonsError && lessons.length === 0 ? (
            <p className="scheduling-muted">No lessons for this course yet.</p>
          ) : null}
          {!loadingLessons && !lessonsError && lessons.length > 0 ? (
            <div className="course-table-wrap course-detail-lessons-scroll">
              <table className="course-table course-table-lessons">
                <thead>
                  <tr>
                    <th>id</th>
                    <th>name</th>
                    <th>code</th>
                    <th>crn</th>
                    <th>instructor</th>
                    <th>year</th>
                    <th>term</th>
                    <th>max</th>
                    <th>sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.name}</td>
                      <td>{row.code}</td>
                      <td>{row.crn ?? row.CRN ?? '—'}</td>
                      <td>{instructorNameById(row.instructorId)}</td>
                      <td>{row.academicYear ?? '—'}</td>
                      <td>{formatSemester(row.semester)}</td>
                      <td>{row.maxCapacity}</td>
                      <td>{row.sessions == null ? '—' : '…'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default CourseDetailPage
