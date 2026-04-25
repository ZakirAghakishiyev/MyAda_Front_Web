import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveDispatchers } from '../../api/supportApi'
import CallDispatcherButton from '../../call/CallDispatcherButton'
import { useCallHub } from '../../call/useCallHub'
import type { HubParticipant } from '../../call/types'

type DispatcherOption = HubParticipant & {
  memberId: string
}

export default function CallerCallPage() {
  const {
    phase,
    error,
    callId,
    roomId,
    ringing,
    requestCall,
    cancelCall,
    leaveCall,
    endCall,
    otherParticipants,
  } = useCallHub()
  const [dispatchers, setDispatchers] = useState<DispatcherOption[]>([])

  useEffect(() => {
    getActiveDispatchers()
      .then((rows) =>
        setDispatchers(
          rows.map((d: any) => ({
            connectionId: '',
            // Contract: call routing uses dispatcher JWT `sub` only.
            userId: String(d.sub ?? d.id ?? d.userId ?? d.memberId),
            displayName: d.name || d.userName || d.username || String(d.sub ?? d.id ?? d.userId ?? d.memberId),
            memberId: String(d.sub ?? d.id ?? d.userId ?? d.memberId),
          }))
        )
      )
      .catch(() => setDispatchers([]))
  }, [])

  const dispatcherOptions = useMemo(
    () => dispatchers.map((d) => ({ sub: d.userId, displayName: d.displayName || d.userId })),
    [dispatchers]
  )

  return (
    <div style={{ maxWidth: 760, margin: '24px auto', padding: 16 }}>
      <h1>Caller Panel</h1>
      <p style={{ marginTop: -6, marginBottom: 12 }}>
        <Link to="/calls/history" style={{ fontSize: 14, color: '#2563eb' }}>
          View call history
        </Link>
      </p>
      <p style={{ color: '#64748b', fontSize: 14, marginTop: -8 }}>
        Flow: ring the dispatcher over SignalR → they accept on their dashboard → both join the call room for audio.
      </p>
      <p>Status: <strong>{phase}</strong></p>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <CallDispatcherButton
          dispatchers={dispatcherOptions}
          callPhase={phase}
          onRequestCall={(dispatcherSub) => requestCall(dispatcherSub)}
        />
        <button disabled={!callId || (phase !== 'ringing' && phase !== 'incoming')} onClick={() => cancelCall(callId || '', 'Caller cancelled')}>
          Cancel Pending
        </button>
        <button disabled={phase !== 'in-call'} onClick={() => leaveCall()}>
          Leave
        </button>
        <button disabled={phase !== 'in-call'} onClick={() => endCall()}>
          End Call
        </button>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
        <p>Call ID: {callId || '-'}</p>
        <p>Room ID: {roomId || ringing?.roomId || '-'}</p>
        <p>Participants: {(otherParticipants || []).map((x) => x.displayName || x.userId).join(', ') || '-'}</p>
      </div>
    </div>
  )
}

