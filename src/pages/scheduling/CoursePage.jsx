import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createCourse, fetchCourses } from '../../api/courses'
import { createLesson, fetchLessons } from '../../api/lessons'
import { fetchUsersByRole, indexById } from '../../api/instructors'
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

const initialCatalogForm = () => ({
  name: '',
  department: '',
  code: '',
  credits: '',
  timesPerWeek: '',
})

const initialLessonForm = () => ({
  courseId: '',
  roomId: '1',
  academicYear: String(new Date().getFullYear()),
  semester: 'Fall',
  maxCapacity: '',
})

function toInt(value) {
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : null
}

const CoursePage = () => {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])

  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingLessons, setLoadingLessons] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [lessonsError, setLessonsError] = useState('')

  const [catalogForm, setCatalogForm] = useState(initialCatalogForm)
  const [lessonForm, setLessonForm] = useState(initialLessonForm)
  const [lessonInstructorId, setLessonInstructorId] = useState('')
  const [instructorInput, setInstructorInput] = useState('')
  const [instructorMenuOpen, setInstructorMenuOpen] = useState(false)
  const instructorComboboxRef = useRef(null)
  const [instructors, setInstructors] = useState([])
  const [loadingInstructors, setLoadingInstructors] = useState(true)
  const [instructorsError, setInstructorsError] = useState('')
  const addCoursePanelRef = useRef(null)
  const [existingCoursesMaxHeight, setExistingCoursesMaxHeight] = useState(null)

  const [submittingCourse, setSubmittingCourse] = useState(false)
  const [submittingLesson, setSubmittingLesson] = useState(false)
  const [courseMessage, setCourseMessage] = useState({ type: '', text: '' })
  const [lessonMessage, setLessonMessage] = useState({ type: '', text: '' })

  const loadCourses = useCallback(async () => {
    setCoursesError('')
    setLoadingCourses(true)
    try {
      const c = await fetchCourses()
      setCourses(c)
    } catch (e) {
      setCoursesError(e.message || 'Could not load courses.')
      setCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }, [])

  const loadLessons = useCallback(async () => {
    setLessonsError('')
    setLoadingLessons(true)
    try {
      const l = await fetchLessons()
      setLessons(l)
    } catch (e) {
      setLessonsError(e.message || 'Could not load lessons.')
      setLessons([])
    } finally {
      setLoadingLessons(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
    loadLessons()
  }, [loadCourses, loadLessons])

  const loadInstructors = useCallback(async () => {
    setInstructorsError('')
    setLoadingInstructors(true)
    try {
      const list = await fetchUsersByRole('Instructor')
      setInstructors(list)
    } catch (e) {
      setInstructorsError(e.message || 'Could not load instructors.')
      setInstructors([])
    } finally {
      setLoadingInstructors(false)
    }
  }, [])

  useEffect(() => {
    loadInstructors()
  }, [loadInstructors])

  useLayoutEffect(() => {
    const el = addCoursePanelRef.current
    if (!el) return

    const sync = () => {
      setExistingCoursesMaxHeight(Math.round(el.getBoundingClientRect().height))
    }
    sync()

    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sortedInstructors = useMemo(
    () => [...instructors].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [instructors]
  )

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      const d = (a.department || '').localeCompare(b.department || '')
      if (d !== 0) return d
      return String(a.code || '').localeCompare(String(b.code || ''))
    })
  }, [courses])

  const filteredInstructors = useMemo(() => {
    const q = instructorInput.trim().toLowerCase()
    if (!q) return sortedInstructors
    return sortedInstructors.filter((i) => i.fullName.toLowerCase().includes(q))
  }, [instructorInput, sortedInstructors])

  const instructorsById = useMemo(() => indexById(instructors), [instructors])

  const instructorNameById = useCallback(
    (id) => {
      const key = String(id ?? '').trim()
      if (!key) return '—'
      const row = instructorsById.get(key)
      return row?.fullName || `Instructor #${key}`
    },
    [instructorsById]
  )

  useEffect(() => {
    function onDocMouseDown(e) {
      const el = instructorComboboxRef.current
      if (!el || el.contains(e.target)) return
      setInstructorMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  function selectInstructor(row) {
    setLessonInstructorId(String(row.id))
    setInstructorInput(row.fullName)
    setInstructorMenuOpen(false)
  }

  function onInstructorInputChange(e) {
    const value = e.target.value
    setInstructorInput(value)
    setLessonInstructorId('')
    setInstructorMenuOpen(true)
  }

  function onInstructorInputFocus() {
    setInstructorMenuOpen(true)
  }

  function onInstructorInputKeyDown(e) {
    if (e.key === 'Escape') {
      setInstructorMenuOpen(false)
    }
  }

  function onChangeCatalog(field) {
    return (e) => {
      const v = e.target.value
      setCatalogForm((prev) => ({ ...prev, [field]: v }))
    }
  }

  function onChangeLesson(field) {
    return (e) => {
      const v = e.target.value
      setLessonForm((prev) => ({ ...prev, [field]: v }))
    }
  }

  async function onSubmitCatalog(e) {
    e.preventDefault()
    setCourseMessage({ type: '', text: '' })

    const credits = toInt(catalogForm.credits)
    const timesPerWeek = toInt(catalogForm.timesPerWeek)
    if (credits == null || timesPerWeek == null) {
      setCourseMessage({ type: 'error', text: 'Credits and times per week must be valid numbers.' })
      return
    }

    const body = {
      name: catalogForm.name.trim(),
      department: catalogForm.department.trim(),
      code: catalogForm.code.trim(),
      credits,
      timesPerWeek,
    }
    if (!body.name || !body.department || !body.code) {
      setCourseMessage({ type: 'error', text: 'Name, department, and code are required.' })
      return
    }

    setSubmittingCourse(true)
    try {
      await createCourse(body)
      setCourseMessage({ type: 'ok', text: 'Course created.' })
      setCatalogForm(initialCatalogForm())
      await loadCourses()
    } catch (err) {
      setCourseMessage({ type: 'error', text: err.message || 'Create failed.' })
    } finally {
      setSubmittingCourse(false)
    }
  }

  async function onSubmitLesson(e) {
    e.preventDefault()
    setLessonMessage({ type: '', text: '' })

    const courseId = toInt(lessonForm.courseId)
    const instructorId = lessonInstructorId.trim()
    const roomId = toInt(lessonForm.roomId)
    const academicYear = toInt(lessonForm.academicYear)
    const maxCapacity = toInt(lessonForm.maxCapacity)

    if (courseId == null) {
      setLessonMessage({ type: 'error', text: 'Select a catalog course.' })
      return
    }
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
      setLessonForm(initialLessonForm())
      setLessonInstructorId('')
      setInstructorInput('')
      await loadLessons()
    } catch (err) {
      setLessonMessage({ type: 'error', text: err.message || 'Create failed.' })
    } finally {
      setSubmittingLesson(false)
    }
  }

  return (
    <div className="scheduling-page">
      <div className="page-container scheduling-wide course-page-shell">
        <nav className="scheduling-subnav" aria-label="Scheduling sections">
          <Link to="/scheduling/courses" className="scheduling-subnav-active">
            Courses
          </Link>
          <Link to="/scheduling/preferences">Add preferences</Link>
          <Link to="/scheduling">Scheduling</Link>
        </nav>

        <header className="course-page-header">
          <div>
            <h1>Courses</h1>
          </div>
          <button type="button" className="back-button scheduling-back-secondary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </header>

        <div className="course-catalog-row">
          <section ref={addCoursePanelRef} className="course-panel course-panel-add" aria-labelledby="add-course-heading">
            <h2 id="add-course-heading">Add course</h2>
            <form className="course-form" onSubmit={onSubmitCatalog}>
              <label className="course-field">
                <span>Name</span>
                <input
                  type="text"
                  value={catalogForm.name}
                  onChange={onChangeCatalog('name')}
                  required
                  autoComplete="off"
                  placeholder="Catalog title"
                />
              </label>
              <div className="course-form-grid">
                <label className="course-field">
                  <span>Department</span>
                  <input type="text" value={catalogForm.department} onChange={onChangeCatalog('department')} required autoComplete="off" />
                </label>
                <label className="course-field">
                  <span>Code</span>
                  <input type="text" value={catalogForm.code} onChange={onChangeCatalog('code')} required placeholder="e.g. 1101" autoComplete="off" />
                </label>
              </div>
              <div className="course-form-grid course-form-grid-metrics">
                <label className="course-field">
                  <span>Credits</span>
                  <input type="number" min={0} value={catalogForm.credits} onChange={onChangeCatalog('credits')} required />
                </label>
                <label className="course-field">
                  <span>Times per week</span>
                  <input type="number" min={0} value={catalogForm.timesPerWeek} onChange={onChangeCatalog('timesPerWeek')} required />
                </label>
              </div>

              {courseMessage.text ? (
                <p className={courseMessage.type === 'error' ? 'course-form-error' : 'course-form-success'} role="status">
                  {courseMessage.text}
                </p>
              ) : null}

              <button type="submit" className="back-button course-submit" disabled={submittingCourse}>
                {submittingCourse ? 'Saving…' : 'Create course'}
              </button>
            </form>
          </section>

          <section
            className="course-panel course-panel-existing"
            style={existingCoursesMaxHeight != null ? { height: existingCoursesMaxHeight } : undefined}
            aria-labelledby="existing-courses-heading"
          >
            <h2 id="existing-courses-heading">Existing courses</h2>
            <div className="course-existing-body">
              {loadingCourses ? <p className="scheduling-muted course-existing-placeholder">Loading…</p> : null}
              {!loadingCourses && coursesError ? <p className="course-form-error course-existing-placeholder">{coursesError}</p> : null}
              {!loadingCourses && !coursesError && courses.length === 0 ? (
                <p className="scheduling-muted course-existing-placeholder">No courses yet.</p>
              ) : null}
              {!loadingCourses && !coursesError && courses.length > 0 ? (
                <div className="course-existing-scroll">
                  <table className="course-table course-table-existing">
                    <thead>
                      <tr>
                        <th>id</th>
                        <th>name</th>
                        <th>department</th>
                        <th>code</th>
                        <th>credits</th>
                        <th>timesPerWeek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCourses.map((row) => (
                        <tr
                          key={row.id}
                          className="course-table-row-clickable"
                          onClick={() => navigate(`/scheduling/courses/${row.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              navigate(`/scheduling/courses/${row.id}`)
                            }
                          }}
                          tabIndex={0}
                          role="link"
                          aria-label={`Open course ${row.name}`}
                        >
                          <td>{row.id}</td>
                          <td>{row.name}</td>
                          <td>{row.department}</td>
                          <td>{row.code}</td>
                          <td>{row.credits}</td>
                          <td>{row.timesPerWeek}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="course-lessons-row">
          <section className="course-panel" aria-labelledby="lesson-heading">
            <h2 id="lesson-heading">Add lesson</h2>
            <form className="course-form" onSubmit={onSubmitLesson}>
              <label className="course-field">
                <span>courseId</span>
                <select value={lessonForm.courseId} onChange={onChangeLesson('courseId')} required>
                  <option value="">Select course…</option>
                  {sortedCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.name} ({c.department})
                    </option>
                  ))}
                </select>
              </label>
              {sortedCourses.length === 0 ? (
                <p className="course-form-error course-inline-note">Create a course above first.</p>
              ) : null}

              <div className="course-field course-field-combobox" ref={instructorComboboxRef}>
                <span id="instructor-combobox-label">Instructor</span>
                <div className="instructor-combobox">
                  <input
                    type="text"
                    className="instructor-combobox-input"
                    value={instructorInput}
                    onChange={onInstructorInputChange}
                    onFocus={onInstructorInputFocus}
                    onKeyDown={onInstructorInputKeyDown}
                    placeholder={loadingInstructors ? 'Loading instructors…' : 'Search or pick an instructor…'}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={instructorMenuOpen}
                    aria-controls="instructor-listbox"
                    aria-labelledby="instructor-combobox-label"
                    aria-autocomplete="list"
                    disabled={loadingInstructors}
                  />
                  {instructorMenuOpen ? (
                    <ul id="instructor-listbox" className="instructor-combobox-list" role="listbox">
                      {instructorsError ? (
                        <li className="instructor-combobox-empty">{instructorsError}</li>
                      ) : filteredInstructors.length === 0 ? (
                        <li className="instructor-combobox-empty">{loadingInstructors ? 'Loading…' : 'No matches'}</li>
                      ) : (
                        filteredInstructors.map((i) => (
                          <li key={i.id} role="presentation">
                            <button
                              type="button"
                              role="option"
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
                  <span>academicYear</span>
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
                  <span>semester</span>
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
                <span>maxCapacity</span>
                <input type="number" min={0} value={lessonForm.maxCapacity} onChange={onChangeLesson('maxCapacity')} required />
              </label>
              <label className="course-field">
                <span>roomId</span>
                <input type="number" min={1} value={lessonForm.roomId} onChange={onChangeLesson('roomId')} required />
              </label>

              {lessonMessage.text ? (
                <p className={lessonMessage.type === 'error' ? 'course-form-error' : 'course-form-success'} role="status">
                  {lessonMessage.text}
                </p>
              ) : null}

              <button type="submit" className="back-button course-submit" disabled={submittingLesson || sortedCourses.length === 0}>
                {submittingLesson ? 'Creating…' : 'Create lesson'}
              </button>
            </form>
          </section>

          <section className="course-panel" aria-labelledby="lessons-list-heading">
            <h2 id="lessons-list-heading">Lessons</h2>
            {loadingLessons ? <p className="scheduling-muted">Loading…</p> : null}
            {!loadingLessons && lessonsError ? <p className="course-form-error">{lessonsError}</p> : null}
            {!loadingLessons && !lessonsError && lessons.length === 0 ? (
              <p className="scheduling-muted">No lessons yet.</p>
            ) : null}
            {!loadingLessons && !lessonsError && lessons.length > 0 ? (
              <div className="course-table-wrap course-lessons-scroll">
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
    </div>
  )
}

export default CoursePage
