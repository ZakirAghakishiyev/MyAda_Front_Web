import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createCourse, fetchCourses } from '../../api/courses'
import { createLesson, fetchLessons, updateLesson } from '../../api/lessons'
import { fetchUsersByRole, indexById } from '../../api/instructors'
import { getBuildings, getRoomsByBuildingId } from '../../api/locationApi'
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
  roomId: '',
  buildingId: '',
  roomAssignment: 'default', // 'default' | 'assign'
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
  const [editingLessonId, setEditingLessonId] = useState(null)

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
  const [buildings, setBuildings] = useState([])
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [buildingsError, setBuildingsError] = useState('')
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [roomsError, setRoomsError] = useState('')
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

  const loadBuildings = useCallback(async () => {
    setBuildingsError('')
    setLoadingBuildings(true)
    try {
      const list = await getBuildings()
      setBuildings(list)
    } catch (e) {
      setBuildingsError(e.message || 'Could not load buildings.')
      setBuildings([])
    } finally {
      setLoadingBuildings(false)
    }
  }, [])

  useEffect(() => {
    loadBuildings()
  }, [loadBuildings])

  const roomLabel = useCallback((room) => {
    if (!room) return '—'
    const name = String(room.name || '').trim()
    const num = String(room.number || '').trim()
    const cap = room.capacity == null || Number.isNaN(Number(room.capacity)) ? null : Number(room.capacity)
    const base = name && num && name !== num ? `${name} (${num})` : name || num || `Room #${room.id}`
    return cap != null ? `${base} — cap ${cap}` : base
  }, [])

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const an = String(a.number || '').trim()
      const bn = String(b.number || '').trim()
      if (an && bn && an !== bn) return an.localeCompare(bn, undefined, { numeric: true })
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true })
    })
  }, [rooms])

  const sortedBuildings = useMemo(() => {
    return [...buildings].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [buildings])

  const loadRoomsForBuilding = useCallback(async (buildingId) => {
    const bid = toInt(buildingId)
    if (bid == null || bid <= 0) {
      setRooms([])
      setRoomsError('')
      setLoadingRooms(false)
      return
    }
    setRoomsError('')
    setLoadingRooms(true)
    try {
      const list = await getRoomsByBuildingId(bid)
      setRooms(list)
    } catch (e) {
      setRoomsError(e.message || 'Could not load rooms.')
      setRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }, [])

  useEffect(() => {
    if (lessonForm.roomAssignment !== 'assign') return
    void loadRoomsForBuilding(lessonForm.buildingId)
  }, [lessonForm.roomAssignment, lessonForm.buildingId, loadRoomsForBuilding])

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
      return row?.fullName || ''
    },
    [instructorsById]
  )

  const instructorDisplayName = useCallback(
    (lessonRow) => {
      const direct =
        lessonRow?.instructorDisplayName ??
        lessonRow?.instructor_display_name ??
        lessonRow?.instructorName ??
        lessonRow?.instructorFullName ??
        lessonRow?.instructor_name ??
        lessonRow?.instructor_full_name ??
        lessonRow?.instructor?.fullName ??
        lessonRow?.instructor?.name
      const directStr = String(direct ?? '').trim()
      if (directStr) return directStr
      const byId = instructorNameById(lessonRow?.instructorId ?? lessonRow?.instructor_id)
      if (byId) return byId
      const rawId = String(lessonRow?.instructorId ?? lessonRow?.instructor_id ?? '').trim()
      return rawId ? `Instructor ${rawId}` : '—'
    },
    [instructorNameById]
  )

  const resolveCourseIdForLesson = useCallback(
    (lessonRow) => {
      const direct = lessonRow?.courseId ?? lessonRow?.course_id ?? lessonRow?.course?.id ?? lessonRow?.course?.courseId
      if (direct != null && String(direct).trim() !== '') return String(direct)

      const lessonCode = String(lessonRow?.code ?? lessonRow?.courseCode ?? lessonRow?.course_code ?? '').trim()
      const lessonDept = String(lessonRow?.department ?? lessonRow?.courseDepartment ?? lessonRow?.course_department ?? '').trim()
      if (!lessonCode) return ''

      const candidates = courses.filter((c) => {
        if (String(c.code ?? '').trim() !== lessonCode) return false
        if (!lessonDept) return true
        return String(c.department ?? '').trim() === lessonDept
      })
      if (candidates.length === 1) return String(candidates[0].id)
      if (candidates.length > 1) {
        // If there are duplicates by code, pick the first stable-sorted by id.
        const sorted = [...candidates].sort((a, b) => Number(a.id) - Number(b.id))
        return sorted[0]?.id != null ? String(sorted[0].id) : ''
      }
      return ''
    },
    [courses]
  )

  function resetLessonEditor() {
    setEditingLessonId(null)
    setLessonForm(initialLessonForm())
    setLessonInstructorId('')
    setInstructorInput('')
    setInstructorMenuOpen(false)
  }

  function onLessonRowClick(row) {
    setLessonMessage({ type: '', text: '' })
    setEditingLessonId(row.id)

    const courseId = resolveCourseIdForLesson(row)
    const instructorId = row.instructorId ?? row.instructor_id ?? ''
    const academicYear = row.academicYear ?? row.academic_year ?? ''
    const semester = formatSemester(row.semester)
    const maxCapacity = row.maxCapacity ?? row.max_capacity ?? ''
    const roomId = row.roomId ?? row.room_id ?? ''
    const buildingId = row.buildingId ?? row.building_id ?? ''

    setLessonForm((prev) => ({
      ...prev,
      courseId: courseId ? String(courseId) : prev.courseId,
      academicYear: academicYear ? String(academicYear) : prev.academicYear,
      semester: semester && semester !== '—' ? semester : prev.semester,
      maxCapacity: maxCapacity !== '' && maxCapacity != null ? String(maxCapacity) : prev.maxCapacity,
      roomAssignment: buildingId || roomId ? 'assign' : 'default',
      buildingId: buildingId ? String(buildingId) : '',
      roomId: roomId ? String(roomId) : '',
    }))

    if (instructorId) {
      const id = String(instructorId)
      setLessonInstructorId(id)
      setInstructorInput(instructorDisplayName(row))
      setInstructorMenuOpen(false)
    } else {
      setLessonInstructorId('')
      setInstructorInput('')
    }

    if (buildingId) {
      void loadRoomsForBuilding(buildingId)
    } else {
      setRooms([])
      setRoomsError('')
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    if (editingLessonId == null) return
    if (!lessonInstructorId) return
    // If the directory loads after a click, replace any fallback id-based label with the real name.
    const resolved = instructorNameById(lessonInstructorId)
    if (resolved && resolved.trim() && instructorInput !== resolved) {
      setInstructorInput(resolved)
    }
  }, [editingLessonId, lessonInstructorId, instructorNameById, instructorInput])

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
      setLessonForm((prev) => {
        const next = { ...prev, [field]: v }
        if (field === 'roomAssignment' && v !== 'assign') {
          next.buildingId = ''
          next.roomId = ''
          setRooms([])
          setRoomsError('')
          setLoadingRooms(false)
        }
        if (field === 'buildingId') {
          next.roomId = ''
        }
        return next
      })
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
    const roomAssignment = String(lessonForm.roomAssignment || 'default')
    const roomId = roomAssignment === 'assign' ? toInt(lessonForm.roomId) : null
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
    if (roomAssignment === 'assign' && (roomId == null || roomId <= 0)) {
      setLessonMessage({ type: 'error', text: 'Select a building and room, or choose Default.' })
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
      academicYear,
      semester: lessonForm.semester,
      maxCapacity,
    }
    if (roomAssignment === 'assign' && roomId != null && roomId > 0) {
      payload.roomId = roomId
    }

    setSubmittingLesson(true)
    try {
      if (editingLessonId != null) {
        await updateLesson(editingLessonId, payload)
        setLessonMessage({ type: 'ok', text: 'Lesson updated.' })
      } else {
        await createLesson(payload)
        setLessonMessage({ type: 'ok', text: 'Lesson created. CRN is assigned by the server.' })
      }
      resetLessonEditor()
      await loadLessons()
    } catch (err) {
      setLessonMessage({ type: 'error', text: err.message || (editingLessonId != null ? 'Update failed.' : 'Create failed.') })
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
            <h2 id="lesson-heading">{editingLessonId != null ? `Update lesson #${editingLessonId}` : 'Add lesson'}</h2>
            <form className="course-form" onSubmit={onSubmitLesson}>
              <label className="course-field">
                <span>Course</span>
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
                <span>Room</span>
                <select value={lessonForm.roomAssignment} onChange={onChangeLesson('roomAssignment')} required>
                  <option value="default">Default (unassigned)</option>
                  <option value="assign">Assign room</option>
                </select>
              </label>

              {lessonForm.roomAssignment === 'assign' ? (
                <div className="course-form-grid">
                  <label className="course-field">
                    <span>Building</span>
                    <select
                      value={lessonForm.buildingId}
                      onChange={onChangeLesson('buildingId')}
                      required
                      disabled={loadingBuildings || Boolean(buildingsError)}
                    >
                      <option value="">
                        {loadingBuildings ? 'Loading buildings…' : buildingsError ? 'Failed to load buildings' : 'Select building…'}
                      </option>
                      {sortedBuildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {!loadingBuildings && buildingsError ? (
                      <p className="course-inline-note course-form-error">{buildingsError}</p>
                    ) : null}
                  </label>
                  <label className="course-field">
                    <span>Room</span>
                    <select
                      value={lessonForm.roomId}
                      onChange={onChangeLesson('roomId')}
                      required
                      disabled={!lessonForm.buildingId || loadingRooms || Boolean(roomsError)}
                    >
                      <option value="">
                        {!lessonForm.buildingId
                          ? 'Select building first…'
                          : loadingRooms
                            ? 'Loading rooms…'
                            : roomsError
                              ? 'Failed to load rooms'
                              : 'Select room…'}
                      </option>
                      {sortedRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {roomLabel(r)}
                        </option>
                      ))}
                    </select>
                    {!loadingRooms && roomsError ? <p className="course-inline-note course-form-error">{roomsError}</p> : null}
                  </label>
                </div>
              ) : null}

              {lessonMessage.text ? (
                <p className={lessonMessage.type === 'error' ? 'course-form-error' : 'course-form-success'} role="status">
                  {lessonMessage.text}
                </p>
              ) : null}

              <div className="course-form-grid">
                <button type="submit" className="back-button course-submit" disabled={submittingLesson || sortedCourses.length === 0}>
                  {submittingLesson ? (editingLessonId != null ? 'Updating…' : 'Creating…') : editingLessonId != null ? 'Update lesson' : 'Create lesson'}
                </button>
                {editingLessonId != null ? (
                  <button type="button" className="back-button scheduling-back-secondary" onClick={resetLessonEditor} disabled={submittingLesson}>
                    Cancel
                  </button>
                ) : null}
              </div>
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
                      <tr
                        key={row.id}
                        className="course-table-row-clickable"
                        onClick={() => onLessonRowClick(row)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onLessonRowClick(row)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Edit lesson ${row.id}`}
                      >
                        <td>{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.code}</td>
                        <td>{row.crn ?? row.CRN ?? '—'}</td>
                        <td>{instructorDisplayName(row)}</td>
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
