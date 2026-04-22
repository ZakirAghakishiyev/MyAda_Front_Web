import React, { useEffect, useMemo, useState } from 'react'
import { getAccessToken } from '../auth'
import { SupportUpdatesService } from '../call/supportUpdatesService'
import type { SupportRequestChangedPayload } from '../call/types'

type ActivityItem = {
  id: string
  text: string
  at: string
}

const updates = new SupportUpdatesService()

const toActivity = (payload: SupportRequestChangedPayload): ActivityItem => {
  const id = String(payload.requestId || Math.random())
  const text = payload.summary || `Request ${payload.requestId} changed (${payload.status || 'update'})`
  const at = payload.changedAtUtc || new Date().toISOString()
  return { id, text, at }
}

const StaffActivityWidget: React.FC<{ title?: string }> = ({ title = 'Other Staff Activity' }) => {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [status, setStatus] = useState<'idle' | 'live' | 'unauthorized' | 'error'>('idle')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!getAccessToken()) {
          if (mounted) setStatus('unauthorized')
          return
        }
        await updates.connect(getAccessToken)
        if (!mounted) return
        updates.on('supportRequestChanged', (payload: SupportRequestChangedPayload) => {
          setItems((prev) => [toActivity(payload), ...prev].slice(0, 20))
        })
        setStatus('live')
      } catch (err: any) {
        if (!mounted) return
        if (String(err?.message || '').includes('SUPPORT_UPDATES_UNAUTHORIZED')) {
          setStatus('unauthorized')
        } else {
          setStatus('error')
        }
      }
    })()
    return () => {
      mounted = false
      updates.stop().catch(() => {})
    }
  }, [])

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      ),
    [items]
  )

  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>{title}</strong>
        <span style={{ fontSize: 12, color: status === 'live' ? '#16a34a' : status === 'error' ? '#dc2626' : status === 'unauthorized' ? '#b45309' : '#6b7280' }}>
          {status === 'live' ? 'Live' : status === 'unauthorized' ? 'Not authorized' : status === 'error' ? 'Connection error' : 'Connecting...'}
        </span>
      </div>
      {sorted.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {status === 'unauthorized' ? 'You are not authorized for staff activity updates.' : 'No updates yet.'}
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {sorted.map((item) => (
            <li key={`${item.id}-${item.at}`} style={{ marginBottom: 8, fontSize: 13 }}>
              <div>{item.text}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(item.at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default StaffActivityWidget

