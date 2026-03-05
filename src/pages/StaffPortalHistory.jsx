import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './StaffPortal.css'

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const TIME_FILTERS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: 'custom', label: 'Custom range' }
]

// Mock history tickets (completed/resolved) with dates for filtering
const mockHistoryTickets = [
  { id: 'REQ-8805', tag: 'IT SUPPORT', tagClass: 'it', completedAt: '2026-03-05', title: 'Email access issue in Lab 3', location: 'Lab 3, North Wing', status: 'Completed' },
  { id: 'REQ-8798', tag: 'FACILITIES', tagClass: 'fm', completedAt: '2026-03-04', title: 'HVAC adjustment Room 201', location: 'Main Building, Room 201', status: 'Completed' },
  { id: 'REQ-8782', tag: 'IT SUPPORT', tagClass: 'it', completedAt: '2026-03-03', title: 'Printer setup Admin floor', location: 'Admin Building', status: 'Completed' },
  { id: 'REQ-8761', tag: 'EMERGENCY', tagClass: 'emergency', completedAt: '2026-03-02', title: 'Power outlet repair', location: 'Library, Study Area', status: 'Completed' },
  { id: 'REQ-8744', tag: 'FACILITIES', tagClass: 'fm', completedAt: '2026-02-28', title: 'Door hinge replacement B Block', location: 'B Block, 2nd Floor', status: 'Completed' },
  { id: 'REQ-8720', tag: 'IT SUPPORT', tagClass: 'it', completedAt: '2026-02-25', title: 'Wi-Fi extender install', location: 'Dormitory East', status: 'Completed' }
]

const parseDate = (str) => {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const StaffPortalHistory = () => {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const today = useMemo(() => new Date(), [])

  const filteredTickets = useMemo(() => {
    let maxDays = 30
    if (timeFilter === 'custom') {
      if (!customStart || !customEnd) return mockHistoryTickets
      const start = new Date(customStart)
      const end = new Date(customEnd)
      return mockHistoryTickets.filter((t) => {
        const d = parseDate(t.completedAt)
        return d >= start && d <= end
      })
    }
    maxDays = parseInt(timeFilter, 10) || 30
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - maxDays)
    return mockHistoryTickets.filter((t) => parseDate(t.completedAt) >= cutoff)
  }, [timeFilter, customStart, customEnd, today])

  return (
    <>
      <div className="sp-main-header">
        <div>
          <h1 className="sp-main-title">Ticket History</h1>
          <p className="sp-main-subtitle">Past tickets you’ve completed</p>
        </div>
      </div>

      <div className="sp-history-toolbar">
        <span className="sp-history-filter-label">Time period:</span>
        <div className="sp-history-filters">
          {TIME_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`sp-filter-btn sp-filter-btn--transition ${timeFilter === value ? 'sp-filter-btn--active' : ''}`}
              onClick={() => setTimeFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {timeFilter === 'custom' && (
          <div className="sp-history-custom">
            <input
              type="date"
              className="sp-date-input"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              aria-label="Start date"
            />
            <span className="sp-date-sep">to</span>
            <input
              type="date"
              className="sp-date-input"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              aria-label="End date"
            />
          </div>
        )}
      </div>

      <div className="sp-history-list">
        {filteredTickets.length === 0 ? (
          <div className="sp-history-empty">
            <p>No tickets in this period.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="sp-history-card sp-history-card--transition sp-history-card--clickable"
              onClick={() => navigate(`/staff-portal/ticket/${ticket.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/staff-portal/ticket/${ticket.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="sp-history-card-top">
                <span className={`sp-job-tag sp-job-tag--${ticket.tagClass}`}>{ticket.tag}</span>
                <span className="sp-history-date">{ticket.completedAt}</span>
              </div>
              <h3 className="sp-history-title">{ticket.title}</h3>
              <div className="sp-history-location">
                <IconLocation />
                <span>{ticket.location}</span>
              </div>
              <span className="sp-history-status sp-history-status--done">{ticket.status}</span>
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default StaffPortalHistory
