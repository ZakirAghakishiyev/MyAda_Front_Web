import React, { useMemo, useState } from 'react'

type DispatcherLike = {
  sub: string
  displayName?: string
}

type Props = {
  dispatchers: DispatcherLike[]
  callPhase: string
  onRequestCall: (targetUserId: string) => Promise<void> | void
}

const CallDispatcherButton: React.FC<Props> = ({ dispatchers, callPhase, onRequestCall }) => {
  const [selectedSub, setSelectedSub] = useState('')
  const [statusText, setStatusText] = useState('')
  const [checking, setChecking] = useState(false)

  const selected = useMemo(
    () => dispatchers.find((d) => d.sub === selectedSub) || null,
    [dispatchers, selectedSub]
  )

  const handleClick = async () => {
    if (!selected || checking || callPhase !== 'connected') return
    setChecking(true)
    setStatusText('')
    try {
      setStatusText('Sending call request...')
      await onRequestCall(selected.sub)
    } catch (err: any) {
      setStatusText(err?.message || 'Could not start dispatcher call.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <select value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>
        <option value="">Select dispatcher</option>
        {dispatchers.map((d) => (
          <option key={d.sub} value={d.sub}>
            {d.displayName || d.sub} ({d.sub})
          </option>
        ))}
      </select>
      <button type="button" disabled={!selected || checking || callPhase !== 'connected'} onClick={handleClick}>
        {checking ? 'Calling...' : 'Call Dispatcher'}
      </button>
      {statusText && <span style={{ color: '#0f766e', fontSize: 13 }}>{statusText}</span>}
    </div>
  )
}

export default CallDispatcherButton

