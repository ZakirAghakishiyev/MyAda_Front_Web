import React from 'react'
import type { IncomingCallPayload } from './types'

type Props = {
  incomingCall: IncomingCallPayload
  rejectReason: string
  onRejectReasonChange: (value: string) => void
  onAccept: () => void
  onReject: () => void
}

const IncomingCallModal: React.FC<Props> = ({
  incomingCall,
  rejectReason,
  onRejectReasonChange,
  onAccept,
  onReject,
}) => {
  return (
    <div className="gc-incoming-overlay" role="dialog" aria-modal="true" aria-labelledby="gc-incoming-title">
      <div className="gc-incoming-card">
        <h2 id="gc-incoming-title" className="gc-incoming-title">
          Incoming voice call
        </h2>
        <p className="gc-incoming-sub">
          {incomingCall.fromDisplayName || incomingCall.fromUserId || 'Caller'} is calling.
        </p>
        <p className="gc-incoming-hint">Accept to join the call room; you can stay on any page while connected.</p>
        <div className="gc-incoming-actions">
          <button type="button" className="gc-incoming-accept" onClick={onAccept}>
            Accept
          </button>
          <input
            type="text"
            className="gc-incoming-reason"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="Decline reason (optional)"
          />
          <button type="button" className="gc-incoming-decline" onClick={onReject}>
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal

