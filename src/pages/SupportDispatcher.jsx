import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import './SupportDispatcher.css'
import {
  assignRequest,
  fetchStaffOptionsByArea,
  getAllRequests,
  getCurrentUserIds,
  mapListItemToCard,
  resolveStaffPickerModule,
} from '../api/supportApi'

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m13 18 6-6-6-6" />
  </svg>
)

const IconTicket = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9V5a2 2 0 0 1 2-2h4" />
    <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
    <path d="M3 15v4a2 2 0 0 0 2 2h4" />
    <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
    <path d="M7 9h10v6H7z" />
  </svg>
)

const IconTimer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="8" />
    <path d="M12 10v4l2 2" />
    <path d="M9 3h6" />
  </svg>
)

const IconPerson = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const REFRESH_INTERVAL_MS = 10000
const isOpenStatus = (status) => {
  const s = String(status || '').toLowerCase()
  return s === 'new' || s === 'assigned' || s === 'inprogress'
}
const isClosedStatus = (status) => {
  const s = String(status || '').toLowerCase()
  return s.includes('completed') || s.includes('cancelled') || s.includes('canceled')
}

const SupportDispatcher = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('all') // all | it | fm | high
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState({}) // id -> confirmed staff name
  const [pendingAssignments, setPendingAssignments] = useState({}) // id -> selected but not confirmed
  const [unseenTickets, setUnseenTickets] = useState(() =>
    requests.reduce((acc, r) => {
      if (r.unseen) acc[r.id] = true
      return acc
    }, {})
  )
  const [staffByArea, setStaffByArea] = useState({ IT: [], FM: [] })
  const enhancedRequests = useMemo(() => requests, [requests])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchStaffOptionsByArea('IT'), fetchStaffOptionsByArea('FM')]).then(([it, fm]) => {
      if (cancelled) return
      setStaffByArea({ IT: it, FM: fm })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const loadRequests = useCallback((showLoader = false) => {
    if (showLoader) setLoading(true)
    getAllRequests({ sortBy })
      .then((items) => setRequests(items.map(mapListItemToCard)))
      .catch(() => setRequests([]))
      .finally(() => {
        if (showLoader) setLoading(false)
      })
  }, [sortBy])

  useEffect(() => {
    loadRequests(true)
    const intervalId = window.setInterval(() => loadRequests(false), REFRESH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRequests(false)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadRequests])

  const filtered = useMemo(() => {
    let items = enhancedRequests.filter((r) => isOpenStatus(r.status))
    if (statusFilter !== 'all') items = items.filter((r) => r.status === statusFilter)
    if (tab === 'it') items = items.filter((r) => resolveStaffPickerModule(r.service, r.category) === 'IT')
    if (tab === 'fm') items = items.filter((r) => resolveStaffPickerModule(r.service, r.category) === 'FM')
    if (tab === 'high') items = items.filter((r) => (r.priority || '').toLowerCase() === 'high')

    if (sortBy === 'newest') {
      // mock sort by id desc for demo
      items = [...items].sort((a, b) => (a.id < b.id ? 1 : -1))
    }
    return items
  }, [enhancedRequests, statusFilter, tab, sortBy])

  const stats = useMemo(() => {
    const openRequests = enhancedRequests.filter((r) => isOpenStatus(r.status))
    const total = filtered.length
    const unassigned = filtered.filter(
      (r) => !r.assignedTo && !assignments[r.id]
    ).length
    const inProgress = openRequests.filter((r) => ['InProgress', 'Assigned'].includes(r.status)).length
    const historyCount = enhancedRequests.filter((r) => isClosedStatus(r.status)).length
    return { total, unassigned, inProgress, historyCount }
  }, [assignments, enhancedRequests, filtered])

  useEffect(() => {
    const incoming = location.state?.newAssignment
    if (!incoming?.id || !incoming?.staffName) return

    setAssignments((prev) => ({ ...prev, [incoming.id]: incoming.staffName }))
    setPendingAssignments((prev) => ({ ...prev, [incoming.id]: '' }))
    navigate('/support-dispatcher', { replace: true, state: null })
  }, [location.state, navigate])

  const handleRowClick = (id) => {
    setUnseenTickets((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    navigate(`/support-dispatcher/${id}`)
  }

  const handleConfirmAssignment = (id) => {
    const rawStaffId = pendingAssignments[id]
    if (!rawStaffId) return
    const { dispatcherId } = getCurrentUserIds()
    if (!dispatcherId) {
      alert('Missing dispatcher id (sign in, or set support_dispatcher_id in localStorage for dev).')
      return
    }
    assignRequest(id, dispatcherId, String(rawStaffId), '')
      .then(() => {
        const option = Object.values(
          (staffByArea.IT || []).concat(staffByArea.FM || [])
        ).find((x) => String(x.id) === String(rawStaffId))
        setAssignments((prev) => ({ ...prev, [id]: option?.name || rawStaffId }))
        setPendingAssignments((prev) => ({ ...prev, [id]: '' }))
        loadRequests(false)
      })
      .catch((err) => alert(err.message || 'Assignment failed'))
  }

  return (
    <div className="sd-page">
      <header className="sd-header">
        <div>
          <button
            type="button"
            className="ssd-logo-btn"
            onClick={() => navigate('/')}
            aria-label="Go to home"
          >
            <img src={adaLogo} alt="ADA University" className="ssd-logo-img" />
          </button>
          <h1 className="sd-title">Request Dispatcher</h1>
          <p className="sd-subtitle">Central dashboard for IT and Facilities tickets across campus.</p>
        </div>
        <div className="sd-header-actions">
          <button
            type="button"
            className="sd-header-link"
            onClick={() => navigate('/support-dispatcher/history')}
          >
            History
          </button>
          <button
            type="button"
            className="sd-new-request-btn"
            onClick={() => navigate('/support-dispatcher/assign-task')}
          >
            Assign New Task 
          </button>
        </div>
      </header>

      <section className="sd-stats-row">
        <div className="sd-stat-card">
          <div className="sd-stat-icon sd-stat-icon--blue">
            <IconTicket />
          </div>
          <div className="sd-stat-body">
            <span className="sd-stat-label">Total Requests</span>
            <span className="sd-stat-value">{stats.total}</span>
            <span className="sd-stat-meta">Shown in current view</span>
          </div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon sd-stat-icon--orange">!</div>
          <div className="sd-stat-body">
            <span className="sd-stat-label">Unassigned</span>
            <span className="sd-stat-value">{stats.unassigned}</span>
            <span className="sd-stat-meta sd-stat-meta--alert">Needs assignment</span>
          </div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon sd-stat-icon--indigo">
            <IconTimer />
          </div>
          <div className="sd-stat-body">
            <span className="sd-stat-label">In Progress</span>
            <span className="sd-stat-value">{stats.inProgress}</span>
            <span className="sd-stat-meta">Currently active</span>
          </div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon sd-stat-icon--green">✓</div>
          <div className="sd-stat-body">
            <span className="sd-stat-label">Completed</span>
            <span className="sd-stat-value">{stats.historyCount}</span>
            <span className="sd-stat-meta sd-stat-meta--success">Closed in history</span>
          </div>
        </div>
      </section>

      <section className="sd-table-card">
        <div className="sd-table-toolbar">
          <div className="sd-table-tabs">
            <button
              type="button"
              className={`sd-pill-tab ${tab === 'all' ? 'sd-pill-tab--active' : ''}`}
              onClick={() => setTab('all')}
            >
              All Tickets
            </button>
            <button
              type="button"
              className={`sd-pill-tab ${tab === 'it' ? 'sd-pill-tab--active' : ''}`}
              onClick={() => setTab('it')}
            >
              IT Only
            </button>
            <button
              type="button"
              className={`sd-pill-tab ${tab === 'fm' ? 'sd-pill-tab--active' : ''}`}
              onClick={() => setTab('fm')}
            >
              FM Only
            </button>
            <button
              type="button"
              className={`sd-pill-tab ${tab === 'high' ? 'sd-pill-tab--active' : ''}`}
              onClick={() => setTab('high')}
            >
              High Priority
            </button>
          </div>

          <div className="sd-sort-wrap">
            <span className="sd-sort-label">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sd-sort-select"
            >
              <option value="all">All Open</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="InProgress">In Progress</option>
            </select>
            <span className="sd-sort-label">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sd-sort-select"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        <div className="sd-table-header">
          <span className="sd-th sd-th--details">Request Details</span>
          <span className="sd-th sd-th--location">Location</span>
          <span className="sd-th sd-th--priority">Priority</span>
          <span className="sd-th sd-th--action">Dispatcher Action</span>
        </div>

        <div className="sd-table-body">
          {loading ? <div className="sd-table-footer"><span className="sd-footer-text">Loading tickets...</span></div> : filtered.map((r) => {
            const isHigh = (r.priority || '').toLowerCase() === 'high'
            const isMedium = (r.priority || '').toLowerCase() === 'medium'
            const priorityClass = isHigh ? 'sd-priority-pill--high' : isMedium ? 'sd-priority-pill--medium' : 'sd-priority-pill--low'

            const isUnseen = !!unseenTickets[r.id]

            const area = resolveStaffPickerModule(r.service, r.category)
            const actionPlaceholder = area === 'IT' ? 'Select Technician' : 'Select Maintenance Staff'
            const assignedStaff = assignments[r.id] || r.assignedTo
            const pendingStaff = pendingAssignments[r.id] || ''

            return (
                <div
                  key={r.id}
                  className={`sd-row ${isUnseen ? 'sd-row--unseen' : ''}`}
                  onClick={() => handleRowClick(r.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRowClick(r.id)}
                >
                <div className="sd-cell sd-cell--details">
                  <div className="sd-request-meta">
                    <span className={`sd-service-tag sd-service-tag--${area === 'IT' ? 'it' : 'fm'}`}>
                      {area}
                    </span>
                    <span className="sd-time-ago">{r.timeAgo}</span>
                    {isUnseen && <span className="sd-unseen-pill">New</span>}
                  </div>
                  <div className="sd-request-title">{r.description}</div>
                  <div className="sd-request-sub">
                    <IconPerson />
                    <span>Reported via portal</span>
                  </div>
                </div>
                <div className="sd-cell sd-cell--location">
                  <div className="sd-location">
                    <IconLocation />
                    <span>{r.location}</span>
                  </div>
                </div>
                <div className="sd-cell sd-cell--priority">
                  <span className={`sd-priority-pill ${priorityClass}`}>{r.priority || 'Low'}</span>
                </div>
                <div className="sd-cell sd-cell--action" onClick={(e) => e.stopPropagation()}>
                  {assignedStaff ? (
                    <div className="sd-assigned-pill">
                      <span className="sd-assigned-avatar">
                        {assignedStaff
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div className="sd-assigned-text">
                        <span className="sd-assigned-name">{assignedStaff}</span>
                        <span className="sd-assigned-meta">Assigned just now</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <select
                        className="sd-action-select"
                        value={pendingStaff}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setPendingAssignments(prev => ({
                            ...prev,
                            [r.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">{actionPlaceholder}</option>
                        {(area === 'FM' ? staffByArea.FM : staffByArea.IT).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="sd-action-btn sd-action-btn--ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConfirmAssignment(r.id)
                        }}
                        disabled={!pendingStaff}
                      >
                        Confirm
                        <IconArrowRight />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          <div className="sd-table-footer">
            <span className="sd-footer-text">
              Showing {filtered.length} of {enhancedRequests.filter((r) => isOpenStatus(r.status)).length} open tickets
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SupportDispatcher

