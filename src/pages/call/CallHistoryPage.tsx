import React from 'react'
import { Link } from 'react-router-dom'
import { useCallHistory } from '../../call/useCallHistory'
import type { CallHistoryFilter, CallHistoryItem, CallHistoryStatus } from '../../call/types'
import './CallHistoryPage.css'

const FILTER_TABS: { id: CallHistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'timed-out', label: 'Timed out' },
]

function formatUtc(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return '-'
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function badgeClass(status: CallHistoryStatus) {
  switch (status) {
    case 'accepted':
      return 'ch-badge ch-badge--accepted'
    case 'rejected':
      return 'ch-badge ch-badge--rejected'
    case 'cancelled':
      return 'ch-badge ch-badge--cancelled'
    case 'timed-out':
      return 'ch-badge ch-badge--timed-out'
    default:
      return 'ch-badge ch-badge--pending'
  }
}

function statusHeadline(row: CallHistoryItem) {
  if (row.status === 'accepted' && row.endedAtUtc) return 'Accepted (finished)'
  if (row.status === 'accepted') return 'Accepted'
  return row.status.replace(/-/g, ' ')
}

function CallHistoryCard({ row }: { row: CallHistoryItem }) {
  const callerName = row.caller.displayName || row.caller.userId || 'Caller'
  const dispatcherName = row.dispatcher.displayName || row.dispatcher.userId || 'Dispatcher'

  return (
    <article className="ch-card">
      <div className="ch-card-top">
        <div>
          <div className="ch-parties">
            <span className="ch-party-label">Caller</span> {callerName}{' '}
            <span className="ch-party-sep">to</span>{' '}
            <span className="ch-party-label">Dispatcher</span> {dispatcherName}
          </div>
          <p className="ch-meta" style={{ marginTop: 6 }}>
            <strong>Call</strong> {row.callId} · <strong>Room</strong> {row.roomId || '-'}
          </p>
        </div>
        <div className="ch-badges">
          <span className={badgeClass(row.status)}>{statusHeadline(row)}</span>
        </div>
      </div>

      <div className="ch-meta">
        <div>
          <strong>Requested</strong> {formatUtc(row.requestedAtUtc)}
        </div>
        {row.acceptedAtUtc ? (
          <div>
            <strong>Accepted</strong> {formatUtc(row.acceptedAtUtc)}
          </div>
        ) : null}
        {row.endedAtUtc ? (
          <div>
            <strong>Ended</strong> {formatUtc(row.endedAtUtc)}
          </div>
        ) : null}
        {row.status === 'accepted' && row.durationSeconds != null ? (
          <div>
            <strong>Duration</strong> {formatDuration(row.durationSeconds)}
          </div>
        ) : null}
        {row.resolvedAtUtc ? (
          <div>
            <strong>Resolved</strong> {formatUtc(row.resolvedAtUtc)}
          </div>
        ) : null}
      </div>

      {(row.resolveReason || row.endReason) && (
        <div className="ch-reason">
          {row.resolveReason ? (
            <div>
              <strong>Resolve reason</strong> {row.resolveReason}
            </div>
          ) : null}
          {row.endReason ? (
            <div style={{ marginTop: row.resolveReason ? 6 : 0 }}>
              <strong>End reason</strong> {row.endReason}
            </div>
          ) : null}
        </div>
      )}
    </article>
  )
}

const CallHistoryPage: React.FC = () => {
  const { filter, setFilter, items, loading, error, reload } = useCallHistory('all')
  const acceptedCount = items.filter((row) => row.status === 'accepted').length
  const missedCount = items.filter((row) => row.status === 'timed-out' || row.status === 'rejected').length
  const latestCall = items[0] || null

  return (
    <div className="ch-page">
      <section className="ch-hero">
        <div>
          <p className="ch-kicker">Communication</p>
          <h1>Call History</h1>
          <p className="ch-sub">
            Calls where you were the caller or dispatcher. This page keeps the full timeline, while the home card only shows the latest call.
          </p>
        </div>
        <div className="ch-hero-actions">
          <button type="button" className="ch-primary-btn" onClick={() => void reload()}>
            Refresh history
          </button>
        </div>
      </section>

      <div className="ch-nav">
        <Link to="/calls/caller">Caller panel</Link>
        {' · '}
        <Link to="/calls/dispatcher">Dispatcher panel</Link>
      </div>

      <section className="ch-stats">
        <article className="ch-stat-card">
          <span className="ch-stat-label">Total calls</span>
          <strong className="ch-stat-value">{items.length}</strong>
        </article>
        <article className="ch-stat-card">
          <span className="ch-stat-label">Accepted</span>
          <strong className="ch-stat-value">{acceptedCount}</strong>
        </article>
        <article className="ch-stat-card">
          <span className="ch-stat-label">Missed / rejected</span>
          <strong className="ch-stat-value">{missedCount}</strong>
        </article>
        <article className="ch-stat-card">
          <span className="ch-stat-label">Latest call</span>
          <strong className="ch-stat-value ch-stat-value--small">
            {latestCall ? formatUtc(latestCall.requestedAtUtc) : 'No calls yet'}
          </strong>
        </article>
      </section>

      <div className="ch-filters" role="tablist" aria-label="Filter by outcome">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            className={`ch-filter-btn ${filter === tab.id ? 'is-active' : ''}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="ch-banner ch-banner--error" role="alert">
          {error}
          <div>
            <button type="button" className="ch-retry" onClick={() => void reload()}>
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <p className="ch-loading">Loading history...</p> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="ch-banner ch-banner--empty">No calls match this filter.</div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="ch-list">
          {items.map((row) => (
            <CallHistoryCard key={row.callId} row={row} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default CallHistoryPage
