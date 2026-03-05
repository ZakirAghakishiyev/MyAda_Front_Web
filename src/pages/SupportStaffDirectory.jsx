import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import './SupportStaffDirectory.css'

const STAFF = [
  {
    id: 'alex',
    name: 'Alex Rivera',
    role: 'IT Support - Tier 2',
    specialization: 'Network Admin',
    area: 'IT',
    status: 'Online',
    activeTasks: 3,
    loadPercent: 60,
  },
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    role: 'FM - Maintenance',
    specialization: 'Electrician',
    area: 'FM',
    status: 'On Break',
    activeTasks: 1,
    loadPercent: 20,
  },
  {
    id: 'mark',
    name: 'Mark Thompson',
    role: 'IT Support - Tier 1',
    specialization: 'Desktop Support',
    area: 'IT',
    status: 'Online',
    activeTasks: 5,
    loadPercent: 100,
  },
  {
    id: 'david',
    name: 'David Wu',
    role: 'FM - Facilities',
    specialization: 'Plumber',
    area: 'FM',
    status: 'Offline',
    activeTasks: 0,
    loadPercent: 0,
  },
  {
    id: 'elena',
    name: 'Elena Rodriguez',
    role: 'IT Support - Cloud',
    specialization: 'System Admin',
    area: 'IT',
    status: 'Online',
    activeTasks: 2,
    loadPercent: 40,
  },
]

const STATUS_DOT_COLOR = {
  Online: '#22c55e',
  Offline: '#9ca3af',
  'On Break': '#f97316',
}

const STAFF_TASKS = {
  alex: [
    { time: '09:00 AM', title: 'Library Wi‑Fi Check', status: 'Completed' },
    { time: '11:00 AM', title: 'Network Switch Audit', status: 'Ongoing' },
    { time: '03:30 PM', title: 'Classroom Projector Setup', status: 'Scheduled' }
  ],
  sarah: [
    { time: '10:00 AM', title: 'Lab Lighting Repair', status: 'Ongoing' },
    { time: '01:00 PM', title: 'HVAC Filter Change', status: 'Scheduled' }
  ],
  mark: [
    { time: '08:30 AM', title: 'Password Reset Queue', status: 'Completed' },
    { time: '10:30 AM', title: 'Network Switch Replacement', status: 'Ongoing' },
    { time: '02:00 PM', title: 'Faculty Desk Side Support', status: 'Scheduled' }
  ],
  default: [
    { time: '09:30 AM', title: 'General Support Window', status: 'Ongoing' }
  ]
}

const SupportStaffDirectory = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all') // all | it | fm
  const [selectedId, setSelectedId] = useState(null)

  const filteredStaff = useMemo(() => {
    if (tab === 'it') return STAFF.filter((s) => s.area === 'IT')
    if (tab === 'fm') return STAFF.filter((s) => s.area === 'FM')
    return STAFF
  }, [tab])

  const selected = selectedId ? STAFF.find((s) => s.id === selectedId) : null
  const selectedTasks = selected
    ? STAFF_TASKS[selected.id] || STAFF_TASKS.default
    : []

  return (
    <div className="sd-page sd-page--staff">
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
            className="ssd-topnav-link"
            onClick={() => navigate('/support-dispatcher')}
          >
            Tickets
          </button>
          <button type="button" className="ssd-topnav-link ssd-topnav-link--active">
            Workload
          </button>
        </nav>
      </div>

      <header className="sd-header">
        <div>
          <h1 className="sd-title">Staff Workload Overview</h1>
          <p className="sd-subtitle">Real-time resource allocation and availability tracking.</p>
        </div>
        <div className="sd-header-actions">
          {/* <button
            type="button"
            className="sd-header-link"
            onClick={() => navigate('/support-dispatcher')}
          >
            Tickets
          </button> */}
          <button
            type="button"
            className="sd-new-request-btn"
            onClick={() => {
              const params = new URLSearchParams()
              if (selected) {
                params.set('staffId', selected.id)
                params.set('area', selected.area.toLowerCase())
              }
              const search = params.toString()
              navigate(
                `/support-dispatcher/assign-task${search ? `?${search}` : ''}`,
                { state: { from: 'staff' } }
              )
            }}
          >
            Assign New Task
          </button>
        </div>
      </header>

      <section className="sd-stats-row sd-stats-row--spacer" aria-hidden="true" />

      <div className="ssd-layout">
        <section className="ssd-left">
          <div className="ssd-tabs-row">
            <div className="ssd-tabs">
              <button
                type="button"
                className={`ssd-pill-tab ${tab === 'all' ? 'ssd-pill-tab--active' : ''}`}
                onClick={() => setTab('all')}
              >
                All Staff ({STAFF.length})
              </button>
              <button
                type="button"
                className={`ssd-pill-tab ${tab === 'it' ? 'ssd-pill-tab--active' : ''}`}
                onClick={() => setTab('it')}
              >
                IT Support
              </button>
              <button
                type="button"
                className={`ssd-pill-tab ${tab === 'fm' ? 'ssd-pill-tab--active' : ''}`}
                onClick={() => setTab('fm')}
              >
                Facilities Management
              </button>
            </div>
          </div>

          <div className="ssd-table">
            <div className="ssd-table-header">
              <span className="ssd-th ssd-th--member">Staff Member</span>
              <span className="ssd-th">Specialization</span>
              <span className="ssd-th">Status</span>
              <span className="ssd-th">Current Workload</span>
            </div>
            <div className="ssd-table-body">
              {filteredStaff.map((s) => {
                const isSelected = s.id === selectedId
                const statusColor = STATUS_DOT_COLOR[s.status] || '#9ca3af'
                const loadClass =
                  s.loadPercent >= 90 ? 'ssd-load-bar--critical' : s.loadPercent >= 60 ? 'ssd-load-bar--high' : ''

                return (
                  <div
                    key={s.id}
                    className={`ssd-row ${isSelected ? 'ssd-row--active' : ''}`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <div className="ssd-cell ssd-cell--member">
                      <div className="ssd-avatar">
                        {s.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="ssd-member-text">
                        <span className="ssd-member-name">{s.name}</span>
                        <span className="ssd-member-role">{s.role}</span>
                      </div>
                    </div>
                    <div className="ssd-cell">
                      <span className="ssd-specialization-pill">{s.specialization}</span>
                    </div>
                    <div className="ssd-cell">
                      <span className="ssd-status-pill">
                        <span className="ssd-status-dot" style={{ backgroundColor: statusColor }} />
                        {s.status}
                      </span>
                    </div>
                    <div className="ssd-cell">
                      <div className="ssd-workload">
                        <span className="ssd-workload-text">{s.activeTasks} Active Tasks</span>
                        <div className="ssd-load-track">
                          <div
                            className={`ssd-load-bar ${loadClass}`}
                            style={{ width: `${s.loadPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {selected && (
          <aside className="ssd-right">
            <div className="ssd-profile-card">
              <div className="ssd-profile-header">
                <div className="ssd-avatar ssd-avatar--large">
                  {selected.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="ssd-profile-text">
                  <h2 className="ssd-profile-name">{selected.name}</h2>
                  <p className="ssd-profile-role">{selected.role}</p>
                </div>
                <button
                  type="button"
                  className="ssd-close-profile"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>

              <div className="ssd-profile-metrics">
                <div>
                  <span className="ssd-metric-label">Weekly Load</span>
                  <span className="ssd-metric-value">28h / 40h</span>
                </div>
                <div>
                  <span className="ssd-metric-label">Task Completion</span>
                  <span className="ssd-metric-value">92%</span>
                </div>
              </div>

              <div className="ssd-schedule">
                <div className="ssd-schedule-header">
                  <span className="ssd-schedule-title">Today&apos;s Tasks</span>
                  <span className="ssd-schedule-date">May 24, 2024</span>
                </div>
                <ul className="ssd-schedule-list">
                  {selectedTasks.map((task, idx) => (
                    <li key={idx} className="ssd-schedule-item">
                      <span className="ssd-schedule-time">{task.time}</span>
                      <div className="ssd-schedule-card">
                        <span className="ssd-schedule-main">{task.title}</span>
                        <span
                          className={`ssd-task-status ssd-task-status--${task.status.toLowerCase()}`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </li>
                  ))}
                  {selectedTasks.length === 0 && (
                    <li className="ssd-schedule-item">
                      <span className="ssd-schedule-time" />
                      <div className="ssd-schedule-card">
                        <span className="ssd-schedule-main">No tasks for today.</span>
                      </div>
                    </li>
                  )}
                </ul>

                <div className="ssd-schedule-actions">
                  <button type="button" className="ssd-schedule-btn">
                    Rebalance Tasks
                  </button>
                  <button type="button" className="ssd-schedule-btn ssd-schedule-btn--primary">
                    View Full Profile
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default SupportStaffDirectory

