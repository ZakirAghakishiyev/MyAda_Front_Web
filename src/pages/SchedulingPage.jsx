import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchedulingUserIdBar from '../components/scheduling/SchedulingUserIdBar'
import {
  schedulingGenerate,
  schedulingGetRun,
  schedulingGetSessions,
  schedulingGetSessionOptions,
  schedulingGetUnscheduled,
  schedulingPatchSession,
  schedulingPublish,
} from '../api/schedulingMsApi'
import { instructorNameById } from '../data/mockInstructors'
import { getSchedulingUserId } from '../utils/schedulingUserId'
import './SchedulingPage.css'
import './scheduling/schedulingMs.css'

const DAY_FILTER = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function parseEnrollment(session) {
  const n = Number(session?.enrollment)
  return Number.isFinite(n) ? n : 0
}

/** Prefer per-option capacity; fall back to session room when same room as current assignment. */
function capacityForOptionRoom(option, session) {
  if (option?.room_capacity != null) return Number(option.room_capacity)
  if (option?.capacity != null) return Number(option.capacity)
  if (session && Number(option?.room_id) === Number(session.room_id)) {
    const c = Number(session.room_capacity)
    return Number.isFinite(c) ? c : null
  }
  return null
}

/**
 * Distinct rooms from options that fit enrollment (capacity ≥ enrollment when capacity is known).
 * If none qualify but options exist, returns all distinct rooms so the UI is not empty.
 */
function roomsEligibleFromOptions(options, session) {
  const need = parseEnrollment(session)
  const map = new Map()
  for (const o of options) {
    const rid = o.room_id
    if (rid == null) continue
    const cap = capacityForOptionRoom(o, session)
    if (!map.has(rid)) {
      map.set(rid, { room_id: rid, room_name: o.room_name || String(rid), capacity: cap })
    } else {
      const cur = map.get(rid)
      if (cap != null && (cur.capacity == null || cap > cur.capacity)) cur.capacity = cap
    }
  }
  const all = Array.from(map.values())
  const fits = all.filter((r) => r.capacity == null || r.capacity >= need)
  return fits.length > 0 ? fits : all
}

function timeslotsForRoom(options, roomId) {
  if (roomId === '' || roomId == null) return []
  const rid = Number(roomId)
  return options.filter((o) => Number(o.room_id) === rid)
}

function instructorDisplayName(instructorUserId) {
  const id = Number(instructorUserId)
  if (!Number.isFinite(id)) return '—'
  return instructorNameById(id)
}

function statusPillClass(status) {
  if (!status) return 'sched-ms-status-draft'
  const s = String(status).toLowerCase()
  if (s === 'completed') return 'sched-ms-status-completed'
  if (s === 'failed') return 'sched-ms-status-failed'
  if (s === 'running') return 'sched-ms-status-running'
  if (s === 'published') return 'sched-ms-status-published'
  return 'sched-ms-status-draft'
}

/** @returns {string} Empty if valid, else error message. */
function validatePublishDateRange(fromDateStr, toDateStr) {
  if (!fromDateStr?.trim() || !toDateStr?.trim()) {
    return 'from_date and to_date are required (ISO dates).'
  }
  const from = new Date(`${fromDateStr.trim()}T12:00:00`)
  const to = new Date(`${toDateStr.trim()}T12:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return 'Enter valid from_date and to_date.'
  }
  if (from > to) return 'from_date must be on or before to_date.'
  const spanDays = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1
  if (spanDays > 731) return 'Inclusive date span must be at most 731 days.'
  return ''
}

function defaultPublishFromTo() {
  const y = new Date().getFullYear()
  return { from: `${y}-01-15`, to: `${y}-05-01` }
}

const SchedulingPage = () => {
  const navigate = useNavigate()

  const [genYear, setGenYear] = useState(String(new Date().getFullYear()))
  const [genSemester, setGenSemester] = useState('Fall')
  const [generating, setGenerating] = useState(false)

  const [manualRunId, setManualRunId] = useState('')
  const [activeRunId, setActiveRunId] = useState(null)

  const [runDetail, setRunDetail] = useState(null)
  const [sessions, setSessions] = useState([])
  const [unscheduled, setUnscheduled] = useState([])

  const [dayFilter, setDayFilter] = useState('')
  const [instructorFilter, setInstructorFilter] = useState('')

  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState('')

  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')
  const [publishMsgTone, setPublishMsgTone] = useState(null)
  const [publishFromDate, setPublishFromDate] = useState(() => defaultPublishFromTo().from)
  const [publishToDate, setPublishToDate] = useState(() => defaultPublishFromTo().to)
  const [publishTopic, setPublishTopic] = useState('Scheduled class')
  const [publishResult, setPublishResult] = useState(null)

  const [editSession, setEditSession] = useState(null)
  const [sessionOptions, setSessionOptions] = useState([])
  const [modalSelectedRoomId, setModalSelectedRoomId] = useState('')
  const [modalTimeslotPick, setModalTimeslotPick] = useState('')
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [patchLoading, setPatchLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')

  const refreshRunOnly = useCallback(async (runId) => {
    const rid = Number(runId)
    const run = await schedulingGetRun(rid)
    setRunDetail(run)
  }, [])

  const refreshSessions = useCallback(
    async (runId) => {
      const rid = Number(runId)
      const instRaw = instructorFilter.trim()
      const inst = instRaw === '' ? undefined : Number.parseInt(instRaw, 10)
      const q = { day: dayFilter || undefined }
      if (inst !== undefined && Number.isFinite(inst)) q.instructor_user_id = inst
      const sess = await schedulingGetSessions(rid, q)
      setSessions(sess)
    },
    [dayFilter, instructorFilter]
  )

  const refreshUnscheduled = useCallback(async (runId) => {
    const rid = Number(runId)
    const uns = await schedulingGetUnscheduled(rid)
    setUnscheduled(uns)
  }, [])

  const refreshAll = useCallback(
    async (runId) => {
      setPageError('')
      setLoading(true)
      try {
        await refreshRunOnly(runId)
        await refreshSessions(runId)
        await refreshUnscheduled(runId)
      } catch (e) {
        setPageError(e.message || 'Failed to load schedule data.')
      } finally {
        setLoading(false)
      }
    },
    [refreshRunOnly, refreshSessions, refreshUnscheduled]
  )

  useEffect(() => {
    if (activeRunId == null) return
    refreshSessions(activeRunId).catch((e) => setPageError(e.message))
  }, [activeRunId, dayFilter, instructorFilter, refreshSessions])

  useEffect(() => {
    setPublishMsg('')
    setPublishMsgTone(null)
    setPublishResult(null)
  }, [activeRunId])

  async function handleGenerate() {
    setPageError('')
    setGenerating(true)
    try {
      const d = await schedulingGenerate({
        academic_year: genYear.trim(),
        semester: genSemester.trim(),
      })
      const rid = d.schedule_run_id
      setActiveRunId(rid)
      setManualRunId(String(rid))
      await refreshAll(rid)
    } catch (e) {
      setPageError(e.message || 'Generate failed.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleLoadRun() {
    const rid = Number.parseInt(manualRunId.trim(), 10)
    if (!Number.isFinite(rid)) {
      setPageError('Enter a valid schedule run id.')
      return
    }
    setActiveRunId(rid)
    await refreshAll(rid)
  }

  async function handleRefresh() {
    if (activeRunId == null) return
    await refreshAll(activeRunId)
  }

  async function handlePublish() {
    setPublishMsg('')
    setPublishMsgTone(null)
    setPublishResult(null)
    const uid = getSchedulingUserId()
    if (!uid) {
      setPublishMsg('Set Instructor user ID in the bar above.')
      setPublishMsgTone('error')
      return
    }
    if (activeRunId == null) return
    const rangeErr = validatePublishDateRange(publishFromDate, publishToDate)
    if (rangeErr) {
      setPublishMsg(rangeErr)
      setPublishMsgTone('error')
      return
    }
    setPublishing(true)
    try {
      const data = await schedulingPublish(activeRunId, {
        from_date: publishFromDate.trim(),
        to_date: publishToDate.trim(),
        topic: publishTopic.trim() || undefined,
      })
      setPublishMsg('Published. Attendance session generation completed for all lessons.')
      setPublishMsgTone('success')
      setPublishResult(data)
      await refreshRunOnly(activeRunId)
    } catch (e) {
      setPublishMsg(e.message || 'Publish failed.')
      setPublishMsgTone('error')
    } finally {
      setPublishing(false)
    }
  }

  const modalEligibleRooms = useMemo(
    () => (editSession && sessionOptions.length ? roomsEligibleFromOptions(sessionOptions, editSession) : []),
    [editSession, sessionOptions]
  )

  const modalTimeslots = useMemo(
    () => timeslotsForRoom(sessionOptions, modalSelectedRoomId),
    [sessionOptions, modalSelectedRoomId]
  )

  async function openEditModal(session) {
    setEditSession(session)
    setSessionOptions([])
    setModalSelectedRoomId('')
    setModalTimeslotPick('')
    setModalError('')
    setModalSuccess('')
    if (activeRunId == null) return
    setOptionsLoading(true)
    try {
      const opts = await schedulingGetSessionOptions(activeRunId, session.id)
      setSessionOptions(Array.isArray(opts) ? opts : [])
      if (opts.length === 0) {
        setModalError('No alternative slots returned for this session.')
      }
    } catch (e) {
      setModalError(e.message || 'Could not load options.')
    } finally {
      setOptionsLoading(false)
    }
  }

  function closeModal() {
    setEditSession(null)
    setSessionOptions([])
    setModalSelectedRoomId('')
    setModalTimeslotPick('')
    setModalError('')
    setModalSuccess('')
  }

  async function applyPatch() {
    if (!editSession || activeRunId == null || !modalTimeslotPick) {
      setModalError('Select a room, then a timeslot.')
      return
    }
    let parsed
    try {
      parsed = JSON.parse(modalTimeslotPick)
    } catch {
      setModalError('Invalid option.')
      return
    }
    setPatchLoading(true)
    setModalError('')
    setModalSuccess('')
    try {
      await schedulingPatchSession(activeRunId, editSession.id, {
        room_id: parsed.room_id,
        timeslot_id: parsed.timeslot_id,
      })
      setModalSuccess('Session updated.')
      await refreshSessions(activeRunId)
      await refreshRunOnly(activeRunId)
      closeModal()
    } catch (e) {
      setModalError(e.message || 'Update failed.')
    } finally {
      setPatchLoading(false)
    }
  }

  const canEditSessions =
    runDetail && (runDetail.status === 'completed' || runDetail.status === 'published')
  const canPublish = runDetail && runDetail.status === 'completed'

  return (
    <div className="scheduling-page">
      <div className="page-container scheduling-wide">
        <nav className="scheduling-subnav" aria-label="Scheduling sections">
          <Link to="/scheduling/courses">Courses</Link>
          <Link to="/scheduling/preferences">Add preferences</Link>
          <Link to="/scheduling" className="scheduling-subnav-active">
            Scheduling
          </Link>
        </nav>

        <h1>Scheduling</h1>
        <p className="scheduling-muted">
          Scheduling microservice at <span className="sched-ms-code">http://51.20.193.29:5000/api/v1</span>. Generate a
          run, inspect sessions, patch placements, then publish when ready. Publish sends{' '}
          <span className="sched-ms-code">from_date</span> / <span className="sched-ms-code">to_date</span> (and optional{' '}
          <span className="sched-ms-code">topic</span>) to bulk-generate Attendance sessions per lesson.
        </p>

        <SchedulingUserIdBar />

        {pageError ? <p className="sched-ms-error">{pageError}</p> : null}

        <section className="sched-ms-section">
          <h2>Generate schedule</h2>
          <p className="scheduling-muted" style={{ marginTop: 0 }}>
            POST <span className="sched-ms-code">/schedules/generate</span> — no <span className="sched-ms-code">X-User-Id</span>{' '}
            required.
          </p>
          <div className="sched-ms-form-grid">
            <label className="sched-ms-field">
              <span>academic_year</span>
              <input value={genYear} onChange={(e) => setGenYear(e.target.value)} />
            </label>
            <label className="sched-ms-field">
              <span>semester</span>
              <input value={genSemester} onChange={(e) => setGenSemester(e.target.value)} placeholder="Fall" />
            </label>
          </div>
          <div className="sched-ms-actions">
            <button type="button" className="back-button" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Running…' : 'Generate'}
            </button>
          </div>
        </section>

        <section className="sched-ms-section">
          <h2>Load schedule run</h2>
          <div className="sched-ms-form-grid">
            <label className="sched-ms-field">
              <span>schedule_run_id</span>
              <input
                type="number"
                value={manualRunId}
                onChange={(e) => setManualRunId(e.target.value)}
                placeholder="From generate response"
              />
            </label>
          </div>
          <div className="sched-ms-actions">
            <button type="button" className="sched-ms-btn-secondary" onClick={handleLoadRun} disabled={loading}>
              Load run
            </button>
            <button type="button" className="sched-ms-btn-secondary" onClick={handleRefresh} disabled={loading || activeRunId == null}>
              Refresh data
            </button>
          </div>
        </section>

        {runDetail ? (
          <section className="sched-ms-section">
            <h2>Run detail</h2>
            <p>
              <span className={`sched-ms-status-pill ${statusPillClass(runDetail.status)}`}>{runDetail.status}</span>{' '}
              <span className="sched-ms-code">id={runDetail.id}</span>{' '}
              <span className="scheduling-muted">
                {runDetail.academic_year} · {runDetail.semester}
              </span>
            </p>
            {runDetail.error_message ? <p className="sched-ms-error">{runDetail.error_message}</p> : null}
            {runDetail.summary ? (
              <div className="sched-ms-summary-grid">
                {Object.entries(runDetail.summary).map(([k, v]) => (
                  <div key={k} className="sched-ms-summary-item">
                    <strong>{k}</strong>
                    {String(v)}
                  </div>
                ))}
              </div>
            ) : null}

            <h3 className="sched-ms-subsection-title">Publish to Attendance</h3>
            <p className="scheduling-muted" style={{ marginTop: 0 }}>
              POST <span className="sched-ms-code">/schedules/{'{id}'}/publish</span> with JSON body (snake_case). Run must be{' '}
              <code>completed</code> with at least one scheduled session. Inclusive span ≤ 731 days.
            </p>
            <div className="sched-ms-form-grid">
              <label className="sched-ms-field">
                <span>from_date</span>
                <input
                  type="date"
                  value={publishFromDate}
                  onChange={(e) => setPublishFromDate(e.target.value)}
                  disabled={!canPublish || publishing}
                />
              </label>
              <label className="sched-ms-field">
                <span>to_date</span>
                <input
                  type="date"
                  value={publishToDate}
                  onChange={(e) => setPublishToDate(e.target.value)}
                  disabled={!canPublish || publishing}
                />
              </label>
              <label className="sched-ms-field" style={{ gridColumn: '1 / -1' }}>
                <span>topic (optional)</span>
                <input
                  value={publishTopic}
                  onChange={(e) => setPublishTopic(e.target.value)}
                  placeholder="Sent to Attendance for generated sessions"
                  disabled={!canPublish || publishing}
                />
              </label>
            </div>
            <div className="sched-ms-actions">
              <button
                type="button"
                className="back-button"
                onClick={handlePublish}
                disabled={publishing || !canPublish}
              >
                {publishing ? 'Publishing…' : 'Publish schedule'}
              </button>
              {publishMsg ? (
                <span className={publishMsgTone === 'error' ? 'sched-ms-error' : 'sched-ms-success'}>{publishMsg}</span>
              ) : null}
            </div>
            {(publishResult?.attendance_generations ?? publishResult?.attendanceGenerations)?.length ? (
              <div className="sched-ms-publish-result">
                <p className="scheduling-muted" style={{ marginBottom: 8 }}>
                  <span className="sched-ms-code">status</span>: {publishResult.status ?? 'published'} ·{' '}
                  <span className="sched-ms-code">schedule_run_id</span>:{' '}
                  {publishResult.schedule_run_id ?? publishResult.scheduleRunId ?? activeRunId}
                </p>
                <div className="sched-ms-table-wrap">
                  <table className="sched-ms-table sched-ms-table--compact">
                    <thead>
                      <tr>
                        <th>lesson_id</th>
                        <th>created_count</th>
                        <th>skipped_duplicate_count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(publishResult.attendance_generations ?? publishResult.attendanceGenerations).map((row) => {
                        const lid = row.lesson_id ?? row.lessonId
                        const created = row.created_count ?? row.createdCount
                        const skipped = row.skipped_duplicate_count ?? row.skippedDuplicateCount
                        return (
                          <tr key={lid}>
                            <td>{lid}</td>
                            <td>{created ?? '—'}</td>
                            <td>{skipped ?? '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {!canPublish && runDetail.status !== 'published' ? (
              <p className="scheduling-muted" style={{ fontSize: 13 }}>
                Publish is only allowed when status is <code>completed</code> and <code>X-User-Id</code> is set.
              </p>
            ) : null}
          </section>
        ) : null}

        {activeRunId != null ? (
          <>
            <section className="sched-ms-section">
              <h2>Scheduled sessions</h2>
              <p className="scheduling-muted" style={{ marginTop: 0 }}>
                GET <span className="sched-ms-code">/schedules/{'{id}'}/sessions</span>
              </p>
              <div className="sched-ms-form-grid" style={{ marginBottom: 12 }}>
                <label className="sched-ms-field">
                  <span>day filter</span>
                  <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                    {DAY_FILTER.map((d) => (
                      <option key={d || 'all'} value={d}>
                        {d === '' ? 'All days' : d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sched-ms-field">
                  <span>instructor_user_id</span>
                  <input
                    type="number"
                    value={instructorFilter}
                    onChange={(e) => setInstructorFilter(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>
              {loading ? <p className="scheduling-muted">Loading…</p> : null}
              <div className="sched-ms-table-wrap">
                <table className="sched-ms-table">
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>course</th>
                      <th>instructor</th>
                      <th>room</th>
                      <th>day</th>
                      <th>time</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>
                          {s.course_code} {s.course_title ? `— ${s.course_title}` : ''}
                        </td>
                        <td>{instructorDisplayName(s.instructor_user_id)}</td>
                        <td>{s.room_name || '—'}</td>
                        <td>{s.day}</td>
                        <td>
                          {s.start_time}–{s.end_time}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="sched-ms-btn-secondary"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => openEditModal(s)}
                            disabled={!canEditSessions}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && sessions.length === 0 ? <p className="scheduling-muted">No sessions match filters.</p> : null}
            </section>

            <section className="sched-ms-section">
              <h2>Unscheduled lessons</h2>
              <p className="scheduling-muted" style={{ marginTop: 0 }}>
                GET <span className="sched-ms-code">/schedules/{'{id}'}/unscheduled</span>
              </p>
              <div className="sched-ms-table-wrap">
                <table className="sched-ms-table">
                  <thead>
                    <tr>
                      <th>lesson_id</th>
                      <th>instructor</th>
                      <th>times/week</th>
                      <th>assigned</th>
                      <th>needed</th>
                      <th>enrollment</th>
                      <th>reason</th>
                      <th>course</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unscheduled.map((u) => (
                      <tr key={u.id}>
                        <td>{u.lesson_id}</td>
                        <td>{instructorDisplayName(u.instructor_user_id)}</td>
                        <td>{u.times_per_week}</td>
                        <td>{u.sessions_assigned}</td>
                        <td>{u.sessions_needed}</td>
                        <td>{u.enrollment}</td>
                        <td>{u.reason}</td>
                        <td>
                          {[u.course_code, u.course_title].filter(Boolean).join(' — ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && unscheduled.length === 0 ? <p className="scheduling-muted">None.</p> : null}
            </section>
          </>
        ) : null}

        {editSession ? (
          <div className="sched-ms-modal-backdrop" role="presentation" onClick={closeModal}>
            <div className="sched-ms-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h3>Edit session {editSession.id}</h3>
              <p className="scheduling-muted">
                {[editSession.course_code, editSession.course_title].filter(Boolean).join(' — ') || 'Session'} · enrollment{' '}
                {parseEnrollment(editSession)}
              </p>
              {optionsLoading ? <p>Loading options…</p> : null}
              {modalError ? <p className="sched-ms-error">{modalError}</p> : null}
              {modalSuccess ? <p className="sched-ms-success">{modalSuccess}</p> : null}
              {!optionsLoading && sessionOptions.length > 0 ? (
                <>
                  <label className="sched-ms-field" style={{ marginTop: 12 }}>
                    <span>1. Room (capacity ≥ enrollment)</span>
                    <select
                      value={modalSelectedRoomId}
                      onChange={(e) => {
                        setModalSelectedRoomId(e.target.value)
                        setModalTimeslotPick('')
                      }}
                    >
                      <option value="">Choose a room…</option>
                      {modalEligibleRooms.map((r) => (
                        <option key={r.room_id} value={String(r.room_id)}>
                          {r.room_name}
                          {r.capacity != null ? ` (capacity ${r.capacity})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sched-ms-field" style={{ marginTop: 12 }}>
                    <span>2. Timeslot</span>
                    <select
                      value={modalTimeslotPick}
                      onChange={(e) => setModalTimeslotPick(e.target.value)}
                      disabled={!modalSelectedRoomId}
                    >
                      <option value="">{modalSelectedRoomId ? 'Choose a timeslot…' : 'Pick a room first'}</option>
                      {modalTimeslots.map((o, idx) => (
                        <option
                          key={`${o.timeslot_id}-${idx}`}
                          value={JSON.stringify({ room_id: o.room_id, timeslot_id: o.timeslot_id })}
                        >
                          {o.day} · {o.start}–{o.end}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sched-ms-actions" style={{ marginTop: 16 }}>
                    <button type="button" className="back-button" onClick={applyPatch} disabled={patchLoading}>
                      {patchLoading ? 'Saving…' : 'Apply'}
                    </button>
                    <button type="button" className="sched-ms-btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="scheduling-actions">
          <button type="button" className="back-button scheduling-back-secondary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default SchedulingPage
