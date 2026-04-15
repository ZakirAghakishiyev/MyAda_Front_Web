import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { getAccessToken, forceLogoutAndRedirectLogin } from '../auth'
import { callHubClient } from './callHubClient'
import type {
  CallAcceptedPayload,
  CallCancelledPayload,
  CallEndedPayload,
  CallPhase,
  CallRejectedPayload,
  CallRingingPayload,
  CallTimedOutPayload,
  ConnectedPayload,
  IcePayload,
  IncomingCallPayload,
  JoinedRoomPayload,
  LeftRoomPayload,
  OfferPayload,
  ParticipantLeftPayload,
} from './types'

type CallContextValue = {
  phase: CallPhase
  error: string | null
  callId: string | null
  roomId: string | null
  incomingCall: IncomingCallPayload | null
  ringing: CallRingingPayload | null
  connected: ConnectedPayload | null
  otherParticipants: JoinedRoomPayload['otherParticipants']
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  requestCall: (dispatcherUserId: string) => Promise<void>
  acceptCall: (callId: string) => Promise<void>
  rejectCall: (callId: string, reason?: string) => Promise<void>
  cancelCall: (callId: string, reason?: string) => Promise<void>
  leaveCall: () => Promise<void>
  endCall: () => Promise<void>
}

const CallContext = createContext<CallContextValue | null>(null)

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
}

const CALL_DEBUG =
  import.meta.env.DEV || String(import.meta.env.VITE_CALL_DEBUG || '').toLowerCase() === 'true'
const dbg = (...args: any[]) => {
  if (CALL_DEBUG) console.info('[CALL-DBG]', ...args)
}

function formatCallHubError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown call error.')
  if (/dispatcher is offline/i.test(raw)) {
    return "Dispatcher is offline or unavailable for call routing. Ensure the target dispatcher id equals their JWT 'sub' and that dispatcher session is connected."
  }
  const hubMatch = raw.match(/HubException:\s*(.+)/i)
  if (hubMatch?.[1]) {
    return hubMatch[1].split(/\n/)[0].replace(/\.$/, '').trim()
  }
  return raw
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hubRef = useRef(callHubClient)
  const hubEventsForConnectionId = useRef<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const statsTimerRef = useRef<number | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionIdRef = useRef<string | null>(null)
  const localConnectionIdRef = useRef<string | null>(null)
  const [phase, setPhase] = useState<CallPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [callId, setCallId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null)
  const [ringing, setRinging] = useState<CallRingingPayload | null>(null)
  const [connected, setConnected] = useState<ConnectedPayload | null>(null)
  const [otherParticipants, setOtherParticipants] = useState<JoinedRoomPayload['otherParticipants']>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  const setErrorFrom = useCallback((err: unknown) => {
    const msg = formatCallHubError(err)
    setError(msg)
    setPhase(msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized') ? 'auth-expired' : 'error')
  }, [])

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current

    const pc = new RTCPeerConnection(rtcConfig)
    pcRef.current = pc
    dbg('PeerConnection created')
    const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    setLocalStream(local)
    dbg('Local media acquired', local.getAudioTracks().map((t) => ({ id: t.id, enabled: t.enabled, muted: t.muted, readyState: t.readyState })))
    local.getTracks().forEach((track) => pc.addTrack(track, local))

    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream()
    }
    setRemoteStream(remoteStreamRef.current)
    pc.ontrack = (e) => {
      dbg('ontrack', {
        streams: e.streams.length,
        track: { id: e.track?.id, kind: e.track?.kind, enabled: e.track?.enabled, muted: e.track?.muted, readyState: e.track?.readyState },
      })
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream()
      }
      const target = remoteStreamRef.current
      const tracks = e.streams[0]?.getTracks() || [e.track]
      tracks.forEach((track) => {
        const exists = target.getTracks().some((t) => t.id === track.id)
        if (!exists) target.addTrack(track)
      })
      setRemoteStream(target)
    }
    pc.onicecandidate = async (e) => {
      if (!e.candidate || !peerConnectionIdRef.current) return
      const targetConnectionId = peerConnectionIdRef.current
      if (targetConnectionId === localConnectionIdRef.current) {
        dbg('SkipIceCandidateToSelf', { to: targetConnectionId })
        return
      }
      dbg('SendIceCandidate', { to: targetConnectionId, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex })
      await hubRef.current.invoke('SendIceCandidate', targetConnectionId, e.candidate.candidate, e.candidate.sdpMid ?? null, e.candidate.sdpMLineIndex ?? null)
    }
    pc.onconnectionstatechange = () => dbg('pc.connectionState', pc.connectionState)
    pc.oniceconnectionstatechange = () => dbg('pc.iceConnectionState', pc.iceConnectionState)
    pc.onsignalingstatechange = () => dbg('pc.signalingState', pc.signalingState)

    if (statsTimerRef.current) {
      window.clearInterval(statsTimerRef.current)
      statsTimerRef.current = null
    }
    if (CALL_DEBUG) {
      statsTimerRef.current = window.setInterval(async () => {
        try {
          const reports = await pc.getStats()
          reports.forEach((r) => {
            if (r.type === 'outbound-rtp' && (r as any).kind === 'audio') {
              dbg('stats.outboundAudio', {
                bytesSent: (r as any).bytesSent ?? null,
                packetsSent: (r as any).packetsSent ?? null,
              })
            }
            if (r.type === 'inbound-rtp' && (r as any).kind === 'audio') {
              dbg('stats.inboundAudio', {
                bytesReceived: (r as any).bytesReceived ?? null,
                packetsReceived: (r as any).packetsReceived ?? null,
                packetsLost: (r as any).packetsLost ?? null,
                jitter: (r as any).jitter ?? null,
              })
            }
          })
        } catch (err) {
          dbg('stats.error', String((err as Error)?.message || err))
        }
      }, 2000)
    }

    return pc
  }, [])

  const cleanupPeer = useCallback(() => {
    if (statsTimerRef.current) {
      window.clearInterval(statsTimerRef.current)
      statsTimerRef.current = null
    }
    pcRef.current?.close()
    pcRef.current = null
    peerConnectionIdRef.current = null
    remoteStreamRef.current = null
    localStream?.getTracks().forEach((t) => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
  }, [localStream])

  const wireEvents = useCallback(() => {
    const hub = hubRef.current
    hub.on('Connected', (payload: ConnectedPayload) => {
      console.info('[CALL] Connected', {
        connectionId: payload.connectionId ?? null,
        userId: payload.userId ?? null,
        isDispatcher: payload.isDispatcher ?? null,
        roles: payload.roles ?? [],
        dispatcherInboxGroup: payload.dispatcherInboxGroup ?? null,
      })
      localConnectionIdRef.current = payload.connectionId || null
      setConnected(payload)
      setPhase('connected')
    })
    hub.on('IncomingCall', (payload: IncomingCallPayload) => {
      setIncomingCall(payload)
      setCallId(payload.callId)
      setRoomId(payload.roomId)
      setPhase('incoming')
    })
    hub.on('CallRinging', (payload: CallRingingPayload) => {
      setRinging(payload)
      setCallId(payload.callId)
      setRoomId(payload.roomId)
      setPhase('ringing')
    })
    hub.on('CallAccepted', (payload: CallAcceptedPayload) => {
      dbg('CallAccepted', payload)
      setCallId(payload.callId)
      setRoomId(payload.roomId)
      const localConnectionId = localConnectionIdRef.current
      const acceptedBy = payload.acceptedByConnectionId || null
      const otherFromParticipants =
        payload.participants?.find((p) => p.connectionId && p.connectionId !== localConnectionId)
          ?.connectionId || null
      const resolvedPeerConnectionId =
        acceptedBy && acceptedBy !== localConnectionId ? acceptedBy : otherFromParticipants

      // Never target self for SDP/ICE relay.
      if (resolvedPeerConnectionId) {
        peerConnectionIdRef.current = resolvedPeerConnectionId
      }
      setPhase('accepted')
    })
    hub.on('CallRejected', (payload: CallRejectedPayload) => {
      setError(payload.reason || 'Call rejected.')
      setPhase('rejected')
    })
    hub.on('CallCancelled', (_payload: CallCancelledPayload) => {
      setPhase('cancelled')
    })
    hub.on('CallTimedOut', (_payload: CallTimedOutPayload) => {
      setPhase('timeout')
    })
    hub.on('JoinedRoom', async (payload: JoinedRoomPayload) => {
      dbg('JoinedRoom', payload)
      setRoomId(payload.roomId)
      setOtherParticipants(payload.otherParticipants || [])
      const peer = (payload.otherParticipants || [])[0]
      if (peer?.connectionId) {
        peerConnectionIdRef.current = peer.connectionId
      }
      setPhase('in-call')

      // Deterministic offerer selection avoids both peers creating simultaneous offers (glare).
      if (peer?.connectionId) {
        const shouldCreateOffer =
          !localConnectionIdRef.current || localConnectionIdRef.current < peer.connectionId
        if (shouldCreateOffer) {
          try {
            const pc = await ensurePeerConnection()
            const offer = await pc.createOffer()
            dbg('createOffer', { to: peer.connectionId, sdpLength: (offer.sdp || '').length })
            await pc.setLocalDescription(offer)
            await hub.invoke('SendOffer', peer.connectionId, offer.sdp || '')
          } catch (err) {
            setErrorFrom(err)
          }
        }
      }
    })
    hub.on('LeftRoom', (_payload: LeftRoomPayload) => {
      cleanupPeer()
      setOtherParticipants([])
      setPhase('connected')
    })
    hub.on('ParticipantLeft', (_payload: ParticipantLeftPayload) => {
      cleanupPeer()
      setPhase('ended')
    })
    hub.on('ReceiveOffer', async (payload: OfferPayload) => {
      dbg('ReceiveOffer', { from: payload.fromConnectionId, sdpLength: (payload.sdp || '').length })
      peerConnectionIdRef.current = payload.fromConnectionId
      const pc = await ensurePeerConnection()
      await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
      const answer = await pc.createAnswer()
      dbg('createAnswer', { to: payload.fromConnectionId, sdpLength: (answer.sdp || '').length })
      await pc.setLocalDescription(answer)
      await hub.invoke('SendAnswer', payload.fromConnectionId, answer.sdp || '')
    })
    hub.on('ReceiveAnswer', async (payload: { fromConnectionId: string; sdp: string }) => {
      dbg('ReceiveAnswer', { from: payload.fromConnectionId, sdpLength: (payload.sdp || '').length })
      peerConnectionIdRef.current = payload.fromConnectionId
      const pc = await ensurePeerConnection()
      await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp })
    })
    hub.on('ReceiveIceCandidate', async (payload: IcePayload) => {
      dbg('ReceiveIceCandidate', { from: payload.fromConnectionId, sdpMid: payload.sdpMid, sdpMLineIndex: payload.sdpMLineIndex })
      const pc = await ensurePeerConnection()
      await pc.addIceCandidate({
        candidate: payload.candidate,
        sdpMid: payload.sdpMid ?? undefined,
        sdpMLineIndex: payload.sdpMLineIndex ?? undefined,
      })
    })
    hub.on('CallEnded', (_payload: CallEndedPayload) => {
      cleanupPeer()
      setIncomingCall(null)
      setRinging(null)
      setPhase('ended')
    })
    hub.onClose((err) => {
      if (err?.message?.toLowerCase().includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
        setPhase('auth-expired')
        forceLogoutAndRedirectLogin()
      }
    })
    hub.onReconnected(() => {
      setPhase((prev) => (prev === 'auth-expired' ? prev : 'connected'))
    })
  }, [cleanupPeer, ensurePeerConnection])

  const connect = useCallback(async () => {
    setPhase('connecting')
    setError(null)
    try {
      await hubRef.current.connect(getAccessToken)
      const id = hubRef.current.connectionId
      localConnectionIdRef.current = id || null
      if (id && hubEventsForConnectionId.current !== id) {
        wireEvents()
        hubEventsForConnectionId.current = id
      }
      setPhase('connected')
    } catch (err) {
      hubEventsForConnectionId.current = null
      setErrorFrom(err)
      if (String((err as Error)?.message || '').toLowerCase().includes('401')) {
        forceLogoutAndRedirectLogin()
      }
      throw err
    }
  }, [setErrorFrom, wireEvents])

  const disconnect = useCallback(async () => {
    cleanupPeer()
    hubEventsForConnectionId.current = null
    await hubRef.current.stop()
    setPhase('idle')
    setIncomingCall(null)
    setRinging(null)
    setCallId(null)
    setRoomId(null)
    setOtherParticipants([])
  }, [cleanupPeer])

  const ensureCallHubConnected = useCallback(async () => {
    if (hubRef.current.state === signalR.HubConnectionState.Connected) return
    await connect()
    if (hubRef.current.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Call hub is not connected.')
    }
  }, [connect])

  const requestCall = useCallback(
    async (dispatcherUserId: string) => {
      setError(null)
      try {
        await ensureCallHubConnected()
        await hubRef.current.invoke('RequestCall', dispatcherUserId)
      } catch (err) {
        setErrorFrom(err)
      }
    },
    [ensureCallHubConnected, setErrorFrom]
  )

  const acceptCall = useCallback(
    async (targetCallId: string) => {
      setError(null)
      try {
        await ensureCallHubConnected()
        // Activate microphone immediately on dispatcher accept.
        await ensurePeerConnection()
        await hubRef.current.invoke('AcceptCall', targetCallId)
        // Close incoming modal immediately; room events will drive next states.
        setIncomingCall(null)
        setRinging(null)
        setPhase('accepted')
      } catch (err) {
        setErrorFrom(err)
      }
    },
    [ensureCallHubConnected, ensurePeerConnection, setErrorFrom]
  )

  const rejectCall = useCallback(
    async (targetCallId: string, reason?: string) => {
      setError(null)
      try {
        await ensureCallHubConnected()
        await hubRef.current.invoke('RejectCall', targetCallId, reason || null)
        setIncomingCall(null)
        setRinging(null)
        setPhase('connected')
      } catch (err) {
        setErrorFrom(err)
      }
    },
    [ensureCallHubConnected, setErrorFrom]
  )

  const cancelCall = useCallback(
    async (targetCallId: string, reason?: string) => {
      setError(null)
      try {
        await ensureCallHubConnected()
        await hubRef.current.invoke('CancelCall', targetCallId, reason || null)
      } catch (err) {
        setErrorFrom(err)
      }
    },
    [ensureCallHubConnected, setErrorFrom]
  )

  const leaveCall = useCallback(async () => {
    try {
      if (hubRef.current.state === signalR.HubConnectionState.Connected) {
        await hubRef.current.invoke('LeaveCall')
      }
    } catch (err) {
      setErrorFrom(err)
    }
    cleanupPeer()
    setIncomingCall(null)
    setRinging(null)
    setPhase('connected')
  }, [cleanupPeer, setErrorFrom])

  const endCall = useCallback(async () => {
    try {
      if (hubRef.current.state === signalR.HubConnectionState.Connected) {
        await hubRef.current.invoke('EndCall')
      }
    } catch (err) {
      setErrorFrom(err)
    }
    cleanupPeer()
    setIncomingCall(null)
    setRinging(null)
    setPhase('ended')
  }, [cleanupPeer, setErrorFrom])

  const value = useMemo<CallContextValue>(
    () => ({
      phase,
      error,
      callId,
      roomId,
      incomingCall,
      ringing,
      connected,
      otherParticipants,
      localStream,
      remoteStream,
      connect,
      disconnect,
      requestCall,
      acceptCall,
      rejectCall,
      cancelCall,
      leaveCall,
      endCall,
    }),
    [
      phase,
      error,
      callId,
      roomId,
      incomingCall,
      ringing,
      connected,
      otherParticipants,
      localStream,
      remoteStream,
      connect,
      disconnect,
      requestCall,
      acceptCall,
      rejectCall,
      cancelCall,
      leaveCall,
      endCall,
    ]
  )

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}

export const useCallHub = () => {
  const ctx = useContext(CallContext)
  if (!ctx) {
    throw new Error('useCallHub must be used inside CallProvider.')
  }
  return ctx
}

