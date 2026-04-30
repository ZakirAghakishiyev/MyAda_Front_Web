import React, { useEffect, useMemo, useRef, useState } from 'react'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isValidDate(d) {
  return d instanceof Date && !Number.isNaN(d.getTime())
}

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return null
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return null
  const parsed = new Date(y, m - 1, d)
  return isValidDate(parsed) ? parsed : null
}

function normalizeDateTimeForParsing(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  // If backend sends ISO without timezone (e.g. "2026-04-03T08:00:00"),
  // treat it as UTC so it converts correctly to local time in the UI.
  const looksIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)
  const hasZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(s)
  if (looksIso && !hasZone) return `${s}Z`
  return s
}

function parseSessionStart(session) {
  const parsed = new Date(normalizeDateTimeForParsing(session?.startTime))
  return isValidDate(parsed) ? parsed : null
}

function formatSessionTimeRange(session) {
  const start = parseSessionStart(session)
  const end = new Date(normalizeDateTimeForParsing(session?.endTime))
  const startText = isValidDate(start)
    ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Unknown'
  const endText = isValidDate(end)
    ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Unknown'
  return `${startText} - ${endText}`
}

function formatSessionAttendanceSummary(session) {
  const started = Boolean(session?.isActive) || Number(session?.roundNo || 0) > 0
  if (!started) return ''
  const total = Number(session?.totalCount ?? session?.totalStudents ?? session?.enrolledCount ?? NaN)
  const registered = Number(session?.registeredCount ?? session?.presentCount ?? session?.markedCount ?? NaN)
  if (!Number.isFinite(total) || total <= 0) return ''
  if (!Number.isFinite(registered) || registered < 0) return ''
  return `${registered}/${total}`
}

export default function SessionCalendarPicker({
  sessions,
  selectedSessionId,
  onSelectSessionId,
  loading = false,
  emptyMessage = 'No sessions available.',
}) {
  const sessionsByDate = useMemo(() => {
    const map = new Map()
    for (const session of sessions || []) {
      const start = parseSessionStart(session)
      if (!start) continue
      const key = toDateKey(start)
      const existing = map.get(key) || []
      existing.push(session)
      map.set(key, existing)
    }
    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort(
          (a, b) =>
            new Date(normalizeDateTimeForParsing(a?.startTime) || 0).getTime() -
            new Date(normalizeDateTimeForParsing(b?.startTime) || 0).getTime()
        )
      )
    }
    return map
  }, [sessions])

  const selectedSession = useMemo(
    () => (sessions || []).find((s) => String(s.sessionId) === String(selectedSessionId)) || null,
    [sessions, selectedSessionId]
  )
  const selectedDate = useMemo(() => parseSessionStart(selectedSession), [selectedSession])
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : ''

  const firstSessionDate = useMemo(() => {
    let minDate = null
    for (const session of sessions || []) {
      const d = parseSessionStart(session)
      if (!d) continue
      if (!minDate || d.getTime() < minDate.getTime()) minDate = d
    }
    return minDate
  }, [sessions])

  const [focusedDateKey, setFocusedDateKey] = useState(selectedDateKey || (firstSessionDate ? toDateKey(firstSessionDate) : ''))
  const [viewDate, setViewDate] = useState(selectedDate || firstSessionDate || new Date())
  const lastSyncedSessionIdRef = useRef(selectedSessionId)

  useEffect(() => {
    const selectedSessionChanged = String(lastSyncedSessionIdRef.current ?? '') !== String(selectedSessionId ?? '')
    if (selectedSessionChanged && selectedDateKey) {
      setFocusedDateKey(selectedDateKey)
      setViewDate(selectedDate)
      lastSyncedSessionIdRef.current = selectedSessionId
      return
    }
    if (!focusedDateKey && firstSessionDate) {
      setFocusedDateKey(toDateKey(firstSessionDate))
      setViewDate(firstSessionDate)
    }
    if (selectedSessionChanged) {
      lastSyncedSessionIdRef.current = selectedSessionId
    }
  }, [selectedSessionId, selectedDate, selectedDateKey, focusedDateKey, firstSessionDate])

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const monthLabel = monthStart.toLocaleDateString([], { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const firstWeekday = monthStart.getDay()

  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const focusedSessions = focusedDateKey ? sessionsByDate.get(focusedDateKey) || [] : []

  const pickFirstSessionDateKeyInMonth = (dateInMonth) => {
    const y = dateInMonth.getFullYear()
    const m = dateInMonth.getMonth()
    let firstMatch = null
    for (const [dateKey] of sessionsByDate.entries()) {
      const d = parseDateKey(dateKey)
      if (!d) continue
      if (d.getFullYear() === y && d.getMonth() === m) {
        if (!firstMatch || d.getTime() < firstMatch.getTime()) firstMatch = d
      }
    }
    return firstMatch ? toDateKey(firstMatch) : ''
  }

  const handleChangeMonth = (delta) => {
    const nextViewDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1)
    setViewDate(nextViewDate)

    const focusedDate = parseDateKey(focusedDateKey)
    const isFocusedInsideNextMonth = Boolean(
      focusedDate &&
      focusedDate.getFullYear() === nextViewDate.getFullYear() &&
      focusedDate.getMonth() === nextViewDate.getMonth()
    )
    if (isFocusedInsideNextMonth) return

    const firstSessionDateKey = pickFirstSessionDateKeyInMonth(nextViewDate)
    if (firstSessionDateKey) {
      setFocusedDateKey(firstSessionDateKey)
      return
    }
    setFocusedDateKey('')
  }

  return (
    <div className="ap-calendar">
      <div className="ap-calendar-header">
        <button
          type="button"
          className="ap-btn ap-btn--secondary ap-calendar-nav"
          onClick={() => handleChangeMonth(-1)}
        >
          Prev
        </button>
        <strong className="ap-calendar-month">{monthLabel}</strong>
        <button
          type="button"
          className="ap-btn ap-btn--secondary ap-calendar-nav"
          onClick={() => handleChangeMonth(1)}
        >
          Next
        </button>
      </div>

      <div className="ap-calendar-grid ap-calendar-grid--weekday">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="ap-calendar-weekday">{label}</div>
        ))}
      </div>

      <div className="ap-calendar-grid ap-calendar-grid--days">
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="ap-calendar-day ap-calendar-day--empty" />
          const key = toDateKey(date)
          const daySessions = sessionsByDate.get(key) || []
          const hasSessions = daySessions.length > 0
          const isFocused = key === focusedDateKey
          const isSelectedDate = key === selectedDateKey
          return (
            <button
              key={key}
              type="button"
              className={[
                'ap-calendar-day',
                hasSessions ? 'ap-calendar-day--has-session' : '',
                isFocused ? 'ap-calendar-day--focused' : '',
                isSelectedDate ? 'ap-calendar-day--selected' : '',
              ].filter(Boolean).join(' ')}
              disabled={!hasSessions}
              onClick={() => {
                setFocusedDateKey(key)
                if (daySessions.length === 1) onSelectSessionId(String(daySessions[0].sessionId))
              }}
              title={hasSessions ? `${daySessions.length} session${daySessions.length > 1 ? 's' : ''}` : 'No sessions'}
            >
              <span>{date.getDate()}</span>
              {hasSessions ? <small>{daySessions.length}</small> : null}
            </button>
          )
        })}
      </div>

      <div className="ap-calendar-sessions">
        {loading ? <p className="ap-calendar-empty">Loading sessions...</p> : null}
        {!loading && sessions.length === 0 ? <p className="ap-calendar-empty">{emptyMessage}</p> : null}
        {!loading && sessions.length > 0 && focusedSessions.length === 0 ? (
          <p className="ap-calendar-empty">Select a highlighted date to choose a session.</p>
        ) : null}
        {!loading && focusedSessions.length > 0 ? (
          <div className="ap-calendar-session-list">
            {focusedSessions.map((session) => {
              const isSelected = String(selectedSessionId) === String(session.sessionId)
              const summary = formatSessionAttendanceSummary(session)
              return (
                <button
                  type="button"
                  key={String(session.sessionId)}
                  className={`ap-calendar-session-item ${isSelected ? 'ap-calendar-session-item--selected' : ''}`}
                  onClick={() => onSelectSessionId(String(session.sessionId))}
                >
                  <span>Session #{session.sessionId}</span>
                  <span>
                    {formatSessionTimeRange(session)}
                    {summary ? ` · ${summary}` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
