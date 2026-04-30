import React from 'react'
import { useCallHistory } from './useCallHistory'
import type { CallHistoryItem, CallHistoryStatus } from './types'
import './CallCard.css'

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
      return 'cc-history-badge cc-history-badge--accepted'
    case 'rejected':
      return 'cc-history-badge cc-history-badge--rejected'
    case 'cancelled':
      return 'cc-history-badge cc-history-badge--cancelled'
    case 'timed-out':
      return 'cc-history-badge cc-history-badge--timedout'
    default:
      return 'cc-history-badge cc-history-badge--pending'
  }
}

function LastCallRow({ row }: { row: CallHistoryItem }) {
  const callerName = row.caller.displayName || row.caller.userId || 'Caller'
  const dispatcherName = row.dispatcher.displayName || row.dispatcher.userId || 'Dispatcher'

  return (
    <article className="cc-history-row">
      <div className="cc-history-top">
        <div className="cc-history-party-line">
          <strong>{callerName}</strong>
          <span className="cc-history-arrow">to</span>
          <strong>{dispatcherName}</strong>
        </div>
        <span className={badgeClass(row.status)}>{row.status.replace(/-/g, ' ')}</span>
      </div>
      <div className="cc-history-meta">
        <span>Requested: {formatUtc(row.requestedAtUtc)}</span>
        {row.status === 'accepted' && row.durationSeconds != null ? (
          <span>Duration: {formatDuration(row.durationSeconds)}</span>
        ) : null}
      </div>
      {(row.resolveReason || row.endReason) && (
        <p className="cc-history-reason">{row.resolveReason || row.endReason}</p>
      )}
    </article>
  )
}

const CallCard: React.FC = () => {
  const { items, loading, error: historyError, reload } = useCallHistory('all')

  const latestItem = items[0] || null

  return (
    <section className="cc-card-content">
      <div className="cc-history">
        <div className="cc-history-header">
          <div>
            <div className="cc-section-kicker">Call History</div>
            <h4 className="cc-history-title">Latest Call</h4>
          </div>
          <button type="button" className="cc-refresh" onClick={() => void reload()}>
            Refresh
          </button>
        </div>

        {historyError ? <p className="cc-error">{historyError}</p> : null}
        {loading ? <p className="cc-empty">Loading call history...</p> : null}
        {!loading && !historyError && !latestItem ? <div className="cc-empty" /> : null}
        {!loading && latestItem ? <LastCallRow row={latestItem} /> : null}
      </div>
    </section>
  )
}

export default CallCard
