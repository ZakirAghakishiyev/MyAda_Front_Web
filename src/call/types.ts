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

export type ConnectedPayload = {
  connectionId: string
  userId: string
  displayName?: string
  isDispatcher?: boolean
  roles?: string[]
  dispatcherInboxGroup?: string
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
  dispatcherUserId: string
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

