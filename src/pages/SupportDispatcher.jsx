import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockRequests } from '../data/myRequestsItems'
import adaLogo from '../assets/ada-logo.png'
import './SupportDispatcher.css'

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

const SupportDispatcher = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all') // all | it | fm | high
  const [sortBy, setSortBy] = useState('newest')
  const [assignments, setAssignments] = useState({}) // id -> confirmed staff name
  const [pendingAssignments, setPendingAssignments] = useState({}) // id -> selected but not confirmed
  const [unseenTickets, setUnseenTickets] = useState(() =>
    mockRequests.reduce((acc, r) => {
      if (r.unseen) acc[r.id] = true
      return acc
    }, {})
  )

  const getServiceLabel = (request) => {
    const itCategories = [
      'Wi-Fi & Network',
      'Email & Office 365',
      'Password Reset',
      'Projector/Display',
      'Printer/Scanner',
      'Software Installation',
      'Computer Repair'
    ]
    return itCategories.includes(request.category) ? 'IT' : 'FM'
  }

  const enhancedRequests = useMemo(
    () =>
      mockRequests.map((r) => ({
        ...r,
        service: getServiceLabel(r),
      })),
    []
  )

  const stats = useMemo(() => {
    const total = enhancedRequests.length
    const unassigned = enhancedRequests.filter((r) => !r.assignedTo && r.status !== 'Completed' && r.status !== 'Cancelled').length
    const inProgress = enhancedRequests.filter((r) => ['In Progress', 'Assigned'].includes(r.status)).length
    const completedToday = enhancedRequests.filter((r) => r.status === 'Completed').length
    return { total, unassigned, inProgress, completedToday }
  }, [enhancedRequests])

  const filtered = useMemo(() => {
    let items = enhancedRequests
    if (tab === 'it') items = items.filter((r) => r.service === 'IT')
    if (tab === 'fm') items = items.filter((r) => r.service === 'FM')
    if (tab === 'high') items = items.filter((r) => (r.priority || '').toLowerCase() === 'high')

    if (sortBy === 'newest') {
      // mock sort by id desc for demo
      items = [...items].sort((a, b) => (a.id < b.id ? 1 : -1))
    }
    return items
  }, [enhancedRequests, tab, sortBy])

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
    const staffName = pendingAssignments[id]
    if (!staffName) return
    setAssignments(prev => ({ ...prev, [id]: staffName }))
    setPendingAssignments(prev => ({ ...prev, [id]: '' }))
  }

  return (
    <div className="sd-page">
      <div className="ssd-topbar">
        <button
          type="button"
          className="ssd-logo-btn"
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          <img src={adaLogo} alt="ADA University" className="ssd-logo-img" />
        </button>
        <nav className="ssd-topnav">
          <button
            type="button"
            className="ssd-topnav-link ssd-topnav-link--active"
            onClick={() => navigate('/support-dispatcher')}
          >
            Tickets
          </button>
          <button
            type="button"
            className="ssd-topnav-link"
            onClick={() => navigate('/support-dispatcher/staff')}
          >
            Workload
          </button>
        </nav>
      </div>
      <header className="sd-header">
        <div>
          <h1 className="sd-title">Request Dispatcher</h1>
          <p className="sd-subtitle">Central dashboard for IT and Facilities tickets across campus.</p>
        </div>
        <div className="sd-header-actions">
          {/* <button
            type="button"
            className="sd-header-link"
            onClick={() => navigate('/support-dispatcher/staff')}
          >
            Staff Directory
          </button> */}
          <button
            type="button"
            className="sd-new-request-btn"
            onClick={() => navigate('/it-support', { state: { from: 'dispatcher' } })}
          >
            + New Support Request
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
            <span className="sd-stat-meta">+12% vs last week</span>
          </div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon sd-stat-icon--orange">!</div>
          <div className="sd-stat-body">
            <span className="sd-stat-label">Unassigned</span>
            <span className="sd-stat-value">{stats.unassigned}</span>
            <span className="sd-stat-meta sd-stat-meta--alert">Critical attention needed</span>
          </div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon sd-stat-icon--indigo">
            <IconTimer />
          </div>
          <div className="sd-stat-body">
            <span className="sd-stat-label">In Progress</span>
            <span className="sd-stat-value">{stats.inProgress}</span>
            <span className="sd-stat-meta">Avg. TAT: 4.2h</span>
          </div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon sd-stat-icon--green">✓</div>
          <div className="sd-stat-body">
            <span className="sd-stat-label">Completed</span>
            <span className="sd-stat-value">{stats.completedToday}</span>
            <span className="sd-stat-meta sd-stat-meta--success">82% resolution rate</span>
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
          {filtered.map((r) => {
            const isHigh = (r.priority || '').toLowerCase() === 'high'
            const isMedium = (r.priority || '').toLowerCase() === 'medium'
            const priorityClass = isHigh ? 'sd-priority-pill--high' : isMedium ? 'sd-priority-pill--medium' : 'sd-priority-pill--low'

            const isUnseen = !!unseenTickets[r.id]

            const actionPlaceholder = r.service === 'IT' ? 'Select Technician' : 'Select Maintenance Staff'
            const assignedStaff = assignments[r.id]
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
                    <span className={`sd-service-tag sd-service-tag--${r.service === 'IT' ? 'it' : 'fm'}`}>
                      {r.service}
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
                        <option value="Jamie Chen">Jamie Chen</option>
                        <option value="Alex Rodriguez">Alex Rodriguez</option>
                        <option value="Maintenance Team">Maintenance Team</option>
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
              Showing {filtered.length} of {enhancedRequests.length} tickets
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SupportDispatcher

