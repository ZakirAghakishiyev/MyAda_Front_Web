export type CallPhase =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'ringing'
  | 'incoming'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'timeout'
  | 'in-call'
  | 'ended'
  | 'error'
  | 'auth-expired'

export type HubParticipant = {
  connectionId: string
  userId: string
  displayName?: string
}

export type IceConfigurationPayload = {
  generatedAtUtc?: string
  expiresAtUtc?: string
  iceServers?: RTCIceServer[]
}

export type ConnectedPayload = {
  connectionId: string
  userId: string
  displayName?: string
  isDispatcher?: boolean
  roles?: string[]
  dispatcherInboxGroup?: string
  iceConfiguration?: IceConfigurationPayload | null
}

export type IncomingCallPayload = {
  callId: string
  roomId: string
  fromUserId: string
  fromConnectionId: string
  fromDisplayName?: string
  requestedAtUtc?: string
  expiresAtUtc?: string
}

export type CallRingingPayload = {
  callId: string
  roomId: string
  dispatcherUserId?: string
  targetUserId?: string
  requestedAtUtc?: string
  expiresAtUtc?: string
}

export type CallAcceptedPayload = {
  callId: string
  roomId: string
  acceptedByUserId: string
  acceptedByConnectionId?: string
  acceptedAtUtc?: string
  participants?: HubParticipant[]
}

export type CallRejectedPayload = {
  callId: string
  roomId: string
  rejectedByUserId: string
  rejectedAtUtc?: string
  reason?: string
}

export type CallCancelledPayload = {
  callId: string
  roomId: string
  cancelledByUserId: string
  cancelledAtUtc?: string
  reason?: string
}

export type CallTimedOutPayload = {
  callId: string
  roomId: string
  timedOutAtUtc?: string
  reason?: string
}

export type JoinedRoomPayload = {
  roomId: string
  connectionId: string
  userId: string
  displayName?: string
  otherParticipants?: HubParticipant[]
}

export type ParticipantLeftPayload = {
  connectionId: string
  userId: string
  displayName?: string
}

export type LeftRoomPayload = {
  roomId: string
  connectionId: string
}

export type OfferPayload = {
  roomId: string
  fromConnectionId: string
  fromUserId: string
  sdp: string
}

export type AnswerPayload = {
  roomId: string
  fromConnectionId: string
  fromUserId: string
  sdp: string
}

export type IcePayload = {
  roomId: string
  fromConnectionId: string
  fromUserId: string
  candidate: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
}

export type CallEndedPayload = {
  roomId: string
  endedByConnectionId?: string
  endedByUserId?: string
  endedAtUtc?: string
}

export type SupportRequestChangedPayload = {
  requestId: string | number
  changedBy?: string
  changedAtUtc?: string
  status?: string
  summary?: string
}

/** Persisted call history (`GET /call/api/call-history`). */
export type CallHistoryStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'timed-out'

export type CallHistoryParticipant = {
  userId: string
  displayName?: string
}

export type CallHistoryItem = {
  callId: string
  roomId: string
  status: CallHistoryStatus
  caller: CallHistoryParticipant
  dispatcher: CallHistoryParticipant
  requestedAtUtc: string
  acceptedAtUtc: string | null
  endedAtUtc: string | null
  durationSeconds: number | null
  resolvedAtUtc: string | null
  resolveReason: string | null
  endReason: string | null
}

export type CallHistoryFilter = 'all' | CallHistoryStatus

