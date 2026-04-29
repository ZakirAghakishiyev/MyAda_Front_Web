import React from 'react'
import { Link } from 'react-router-dom'
import StaffActivityWidget from '../../components/StaffActivityWidget'
import { useCallHub } from '../../call/useCallHub'

const DispatcherCallPage: React.FC = () => {
  const { phase, error, callId, roomId, otherParticipants } = useCallHub()

  return (
    <div style={{ maxWidth: 960, margin: '24px auto', padding: 16, display: 'grid', gap: 16 }}>
      <h1>Dispatcher Call Panel</h1>
      <p style={{ marginBottom: 8 }}>
        <Link to="/calls/history" style={{ fontSize: 14, color: '#2563eb' }}>
          View call history
        </Link>
      </p>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        Incoming calls and the in-call modal are shown on every page while you are logged in. Use this screen for status and staff activity.
      </p>
      <p>
        Status: <strong>{phase}</strong>
      </p>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
        <p>Call ID: {callId || '-'}</p>
        <p>Room ID: {roomId || '-'}</p>
        <p>Participants: {(otherParticipants || []).map((x) => x.displayName || x.userId).join(', ') || '-'}</p>
      </section>
      <StaffActivityWidget />
    </div>
  )
}

export default DispatcherCallPage
