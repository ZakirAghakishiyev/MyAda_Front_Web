import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRequests, mapListItemToCard } from '../api/supportApi'
import './SupportDispatcher.css'
import adaLogo from '../assets/ada-logo.png'

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const HISTORY_FILTERS = [
  { value: 'all', label: 'All Closed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TIME_FILTERS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: 'custom', label: 'Custom range' },
]

const REFRESH_INTERVAL_MS = 10000

const parseDate = (str) => {
  if (!str) return new Date(0)
  const d = new Date(str)
  if (!Number.isNaN(d.getTime())) return d
  const [y, m, day] = String(str).split('-').map(Number)
  return new Date(y, (m || 1) - 1, day || 1)
}

const SupportDispatcherHistory = () => {
  const navigate = useNavigate()
  const [historyFilter, setHistoryFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [tickets, setTickets] = useState([])
  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    const loadHistory = () => {
      getAllRequests()
        .then((items) =>
          setTickets(
            items
              .map(mapListItemToCard)
              .filter((t) => {
                const status = String(t.status || '').toLowerCase()
                return status.includes('completed') || status.includes('cancelled') || status.includes('canceled')
              })
              .map((t) => ({
                ...t,
                completedAt: t.completed || t.completedAt || '',
                title: t.description,
                tag: t.urgency === 'Critical' ? 'EMERGENCY' : `${t.service || 'IT'} SUPPORT`,
                tagClass: t.urgency === 'Critical' ? 'emergency' : String(t.service || '').toLowerCase(),
              }))
          )
        )
        .catch(() => setTickets([]))
    }
    loadHistory()
    const intervalId = window.setInterval(loadHistory, REFRESH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadHistory()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const filteredTickets = useMemo(() => {
    let items = tickets
    if (historyFilter === 'completed') {
      items = items.filter((t) => String(t.status || '').toLowerCase().includes('completed'))
    }
    if (historyFilter === 'cancelled') {
      items = items.filter((t) => {
        const status = String(t.status || '').toLowerCase()
        return status.includes('cancelled') || status.includes('canceled')
      })
    }
    if (timeFilter === 'custom') {
      if (!customStart || !customEnd) return items
      const start = new Date(customStart)
      const end = new Date(customEnd)
      return items.filter((t) => {
        const d = parseDate(t.completedAt)
        return d >= start && d <= end
      })
    }
    const maxDays = parseInt(timeFilter, 10) || 30
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - maxDays)
    return items.filter((t) => parseDate(t.completedAt) >= cutoff)
  }, [historyFilter, timeFilter, customStart, customEnd, tickets, today])

  return (
    <div className="sd-page">
      <header className="sd-header">
        <div>
          <button type="button" className="ssd-logo-btn" onClick={() => navigate('/')} aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="ssd-logo-img" />
          </button>
          <h1 className="sd-title">Dispatcher History</h1>
          <p className="sd-subtitle">Completed and cancelled tickets across all support requests</p>
        </div>
        <div className="sd-header-actions">
          <button type="button" className="sd-header-link" onClick={() => navigate('/')}>Home</button>
          <button type="button" className="sd-header-link" onClick={() => navigate('/support-dispatcher')}>Back to Dispatcher</button>
        </div>
      </header>

      <section className="sd-table-card">
        <div className="sd-table-toolbar">
          <div className="sd-table-tabs">
            {HISTORY_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`sd-pill-tab ${historyFilter === value ? 'sd-pill-tab--active' : ''}`}
                onClick={() => setHistoryFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="sd-sort-label">Time period</span>
        </div>
        <div className="sd-table-toolbar" style={{ borderTop: '1px solid #e5e7eb' }}>
          <div className="sd-table-tabs">
            {TIME_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`sd-pill-tab ${timeFilter === value ? 'sd-pill-tab--active' : ''}`}
                onClick={() => setTimeFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {timeFilter === 'custom' && (
            <div className="sd-sort-wrap">
              <input type="date" className="sd-sort-select" value={customStart} onChange={(e) => setCustomStart(e.target.value)} aria-label="Start date" />
              <span className="sd-sort-label">to</span>
              <input type="date" className="sd-sort-select" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} aria-label="End date" />
            </div>
          )}
        </div>

        <div className="sd-table-header">
          <span className="sd-th sd-th--details">Request Details</span>
          <span className="sd-th sd-th--location">Location</span>
          <span className="sd-th sd-th--priority">Status</span>
          <span className="sd-th sd-th--action">Closed At</span>
        </div>

        <div className="sd-table-body">
          {filteredTickets.length === 0 ? (
            <div className="sd-table-footer"><span className="sd-footer-text">No tickets in this period.</span></div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="sd-row"
                onClick={() => navigate(`/support-dispatcher/${ticket.id}`, { state: { from: 'history', readOnly: true } })}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/support-dispatcher/${ticket.id}`, { state: { from: 'history', readOnly: true } })}
                role="button"
                tabIndex={0}
              >
                <div className="sd-cell sd-cell--details">
                  <div className="sd-request-meta">
                    <span className={`sd-service-tag sd-service-tag--${ticket.tagClass === 'fm' ? 'fm' : 'it'}`}>{ticket.tag}</span>
                  </div>
                  <div className="sd-request-title">{ticket.title}</div>
                </div>
                <div className="sd-cell sd-cell--location">
                  <div className="sd-location">
                    <IconLocation />
                    <span>{ticket.location}</span>
                  </div>
                </div>
                <div className="sd-cell sd-cell--priority">
                  <span className={`sd-priority-pill ${String(ticket.status || '').toLowerCase().includes('cancel') ? 'sd-priority-pill--high' : 'sd-priority-pill--low'}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="sd-cell sd-cell--action">
                  <div className="sd-location">
                    <IconClock />
                    <span>{ticket.completedAt}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default SupportDispatcherHistory
