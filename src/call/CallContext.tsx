import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { getAccessToken, getAccessTokenExpirationMs, forceLogoutAndRedirectLogin } from '../auth'
import { getJwtUserId } from '../auth/jwtRoles'
import { buildIceServersEndpoint, callHubClient } from './callHubClient'
import { fetchCallHistory } from './callHistoryApi'
import { invalidateCallHistory } from './callHistoryInvalidate'
import type {
  CallAcceptedPayload,
  CallCancelledPayload,
  CallEndedPayload,
  CallPhase,
  CallRejectedPayload,
  CallRingingPayload,
  CallTimedOutPayload,
  ConnectedPayload,
  IceConfigurationPayload,
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
  clearError: () => void
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
  requestCall: (targetUserId: string) => Promise<void>
  acceptCall: (callId: string) => Promise<void>
  rejectCall: (callId: string, reason?: string) => Promise<void>
  cancelCall: (callId: string, reason?: string) => Promise<void>
  leaveCall: () => Promise<void>
  endCall: () => Promise<void>
  /** User-facing summary when a call stops (disconnect, explicit end, etc.) */
  sessionEndReason: string | null
  clearSessionEndReason: () => void
}

const CallContext = createContext<CallContextValue | null>(null)

const CALL_DEBUG =
  import.meta.env.DEV || String(import.meta.env.VITE_CALL_DEBUG || '').toLowerCase() === 'true'
const dbg = (...args: any[]) => {
  if (CALL_DEBUG) console.info('[CALL-DBG]', ...args)
}

function getIceCandidateType(candidate: string | null | undefined) {
  const match = String(candidate || '').match(/\btyp\s+([a-z0-9]+)/i)
  return match?.[1] || null
}

function normalizeIceServers(iceServers: unknown): RTCIceServer[] {
  if (!Array.isArray(iceServers)) return []
  return iceServers
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as { urls?: unknown; username?: unknown; credential?: unknown }
      const hasValidUrls =
        typeof raw.urls === 'string' ||
        (Array.isArray(raw.urls) && raw.urls.length > 0 && raw.urls.every((x) => typeof x === 'string'))
      if (!hasValidUrls) return null
      const normalized: RTCIceServer = { urls: raw.urls as string | string[] }
      if (typeof raw.username === 'string') normalized.username = raw.username
      if (typeof raw.credential === 'string') normalized.credential = raw.credential
      return normalized
    })
    .filter((entry): entry is RTCIceServer => Boolean(entry))
}

function hasFreshIceConfiguration(config: IceConfigurationPayload | null) {
  if (!config) return false
  if (!normalizeIceServers(config.iceServers).length) return false
  if (!config.expiresAtUtc) return true
  const expiresMs = Date.parse(config.expiresAtUtc)
  if (!Number.isFinite(expiresMs)) return true
  // Refresh if credentials are about to expire.
  return expiresMs - Date.now() > 30_000
}

function formatCallHubError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown call error.')
  if (/dispatcher is offline/i.test(raw)) {
    return "Target user is offline or unavailable for call routing. Ensure the target user id equals their JWT 'sub' and that their session is connected."
  }
  if (/only dispatchers can call non-dispatcher users/i.test(raw)) {
    return 'This call is allowed only when support/staff is calling a connected instructor account. Verify the ticket creator was matched to the instructor user and that both sessions expose their role claims to CallService.'
  }
  const hubMatch = raw.match(/HubException:\s*(.+)/i)
  if (hubMatch?.[1]) {
    return hubMatch[1].split(/\n/)[0].replace(/\.$/, '').trim()
  }
  return raw
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hubRef = useRef(callHubClient)
  const hubEventsWiredRef = useRef(false)
  const iceConfigurationRef = useRef<IceConfigurationPayload | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const pcCreateInFlightRef = useRef<Promise<RTCPeerConnection> | null>(null)
  const pcInstanceCounterRef = useRef(0)
  const statsTimerRef = useRef<number | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const queuedIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const activeRoomIdRef = useRef<string | null>(null)
  const peerConnectionIdRef = useRef<string | null>(null)
  const localConnectionIdRef = useRef<string | null>(null)
  const pendingIncomingPollRef = useRef(false)
  const synthesizedIncomingCallIdRef = useRef<string | null>(null)
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
  const [sessionEndReason, setSessionEndReason] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])
  const clearSessionEndReason = useCallback(() => setSessionEndReason(null), [])

  const setPhaseSafely = useCallback((next: CallPhase) => {
    setPhase((prev) => {
      if (
        next === 'connected' &&
        (prev === 'incoming' || prev === 'ringing' || prev === 'accepted' || prev === 'in-call')
      ) {
        return prev
      }
      return next
    })
  }, [])

  const setErrorFrom = useCallback((err: unknown) => {
    const msg = formatCallHubError(err)
    setError(msg)
    setPhase(msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized') ? 'auth-expired' : 'error')
  }, [])

  const setActiveRoomId = useCallback((nextRoomId: string | null) => {
    activeRoomIdRef.current = nextRoomId
    setRoomId(nextRoomId)
  }, [])

  const clearTransientCallState = useCallback(() => {
    setIncomingCall(null)
    setRinging(null)
    setOtherParticipants([])
    setCallId(null)
    setActiveRoomId(null)
  }, [setActiveRoomId])

  const setActivePeerConnectionId = useCallback((nextPeerConnectionId: string | null, reason: string) => {
    if (peerConnectionIdRef.current && nextPeerConnectionId && peerConnectionIdRef.current !== nextPeerConnectionId) {
      dbg('PeerConnectionTargetChanged', {
        reason,
        from: peerConnectionIdRef.current,
        to: nextPeerConnectionId,
        droppedQueuedCandidates: queuedIceCandidatesRef.current.length,
      })
      queuedIceCandidatesRef.current = []
    }
    peerConnectionIdRef.current = nextPeerConnectionId
  }, [])

  const flushQueuedIceCandidates = useCallback(async (pc: RTCPeerConnection, reason: string) => {
    if (!pc.remoteDescription) return
    if (!queuedIceCandidatesRef.current.length) return
    const queued = [...queuedIceCandidatesRef.current]
    queuedIceCandidatesRef.current = []
    dbg('FlushQueuedIceCandidates', {
      reason,
      count: queued.length,
      remoteDescriptionType: pc.remoteDescription.type,
    })
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate)
      } catch (err) {
        dbg('FlushQueuedIceCandidatesFailed', {
          reason,
          message: String((err as Error)?.message || err),
        })
      }
    }
  }, [])

  const addRemoteIceCandidateSafely = useCallback(
    async (pc: RTCPeerConnection, payload: IcePayload) => {
      const candidateInit: RTCIceCandidateInit = {
        candidate: payload.candidate,
        sdpMid: payload.sdpMid ?? undefined,
        sdpMLineIndex: payload.sdpMLineIndex ?? undefined,
      }

      if (!pc.remoteDescription) {
        queuedIceCandidatesRef.current.push(candidateInit)
        dbg('QueueRemoteIceCandidate', {
          from: payload.fromConnectionId,
          roomId: payload.roomId,
          sdpMid: payload.sdpMid,
          sdpMLineIndex: payload.sdpMLineIndex,
          candidateType: getIceCandidateType(payload.candidate),
          queueLength: queuedIceCandidatesRef.current.length,
        })
        return
      }

      await pc.addIceCandidate(candidateInit)
      dbg('ApplyRemoteIceCandidate', {
        from: payload.fromConnectionId,
        roomId: payload.roomId,
        sdpMid: payload.sdpMid,
        sdpMLineIndex: payload.sdpMLineIndex,
        candidateType: getIceCandidateType(payload.candidate),
      })
    },
    []
  )

  const logSenderDiagnostics = useCallback((pc: RTCPeerConnection, reason: string, pcInstanceId: number) => {
    const senders = pc.getSenders()
    const simplifiedSenders = senders.map((s) => ({
      kind: s.track?.kind ?? null,
      enabled: s.track?.enabled ?? null,
      muted: s.track?.muted ?? null,
      readyState: s.track?.readyState ?? null,
      id: s.track?.id ?? null,
    }))
    dbg('SENDERS', { reason, pcInstanceId, senders: simplifiedSenders, senderCount: senders.length })
    const audioSender = senders.find((s) => s.track?.kind === 'audio')
    dbg('SENDER TRACK', {
      reason,
      pcInstanceId,
      enabled: audioSender?.track?.enabled ?? null,
      muted: audioSender?.track?.muted ?? null,
      readyState: audioSender?.track?.readyState ?? null,
      id: audioSender?.track?.id ?? null,
    })
  }, [])

  const resolveIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    const token = getAccessToken()
    const endpoint = buildIceServersEndpoint(hubRef.current.resolvedHubUrl)
    try {
      dbg('FetchIceConfiguration', { endpoint, withBearerToken: Boolean(token) })
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        dbg('FetchIceConfigurationFailed', { endpoint, status: res.status })
      } else {
        const payload = (await res.json()) as IceConfigurationPayload
        const normalized = normalizeIceServers(payload?.iceServers)
        if (normalized.length) {
          iceConfigurationRef.current = payload
          dbg('FetchIceConfigurationSuccess', { endpoint, serverCount: normalized.length })
          return normalized
        }
        dbg('FetchIceConfigurationEmpty', { endpoint })
      }
    } catch (err) {
      dbg('FetchIceConfigurationError', { endpoint, message: String((err as Error)?.message || err) })
    }

    if (hasFreshIceConfiguration(iceConfigurationRef.current)) {
      const cached = normalizeIceServers(iceConfigurationRef.current?.iceServers)
      if (cached.length) {
        dbg('UseCachedIceConfiguration', { serverCount: cached.length })
        return cached
      }
    }

    if (hubRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        const hubConfig = await hubRef.current.invoke<IceConfigurationPayload>('GetIceConfiguration')
        if (hubConfig) {
          iceConfigurationRef.current = hubConfig
          const fromHub = normalizeIceServers(hubConfig.iceServers)
          if (fromHub.length) {
            dbg('UseHubIceConfigurationFallback', { serverCount: fromHub.length })
            return fromHub
          }
        }
      } catch (err) {
        dbg('GetIceConfiguration failed', String((err as Error)?.message || err))
      }
    }

    return []
  }, [])

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) {
      dbg('PC INSTANCE', { reuse: true, status: 'existing', pc: pcRef.current })
      return pcRef.current
    }
    if (pcCreateInFlightRef.current) {
      dbg('PC INSTANCE', { reuse: true, status: 'create-in-flight' })
      return pcCreateInFlightRef.current
    }

    pcCreateInFlightRef.current = (async () => {
      const iceServers = await resolveIceServers()
      if (!iceServers.length) {
        const iceUrl = buildIceServersEndpoint(hubRef.current.resolvedHubUrl)
        throw new Error(`ICE configuration is empty. Verify ${iceUrl} returns TURN/STUN servers.`)
      }

      const pcInstanceId = ++pcInstanceCounterRef.current
      const pc = new RTCPeerConnection({ iceServers })
      pcRef.current = pc
      dbg('PC INSTANCE', { reuse: false, status: 'created', pcInstanceId, pc })
      dbg('PeerConnectionCreated', {
        pcInstanceId,
        iceServers: iceServers.map((s) => s.urls),
      })

      try {
        const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        localStreamRef.current = local
        setLocalStream(local)
        dbg(
          'LocalMediaAcquired',
          local.getAudioTracks().map((t) => ({
            id: t.id,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          }))
        )
        local.getTracks().forEach((track) => pc.addTrack(track, local))
        dbg('AddedLocalTracks', {
          pcInstanceId,
          tracks: local.getTracks().map((t) => ({
            id: t.id,
            kind: t.kind,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          })),
        })
        logSenderDiagnostics(pc, 'after-addTrack', pcInstanceId)

        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream()
        }
        setRemoteStream(remoteStreamRef.current)
        pc.ontrack = (e) => {
          dbg('ontrack', {
            streams: e.streams.length,
            track: {
              id: e.track?.id,
              kind: e.track?.kind,
              enabled: e.track?.enabled,
              muted: e.track?.muted,
              readyState: e.track?.readyState,
            },
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
          dbg('SendIceCandidate', {
            pcInstanceId,
            to: targetConnectionId,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
            candidateType: getIceCandidateType(e.candidate.candidate),
          })
          try {
            await hubRef.current.invoke(
              'SendIceCandidate',
              targetConnectionId,
              e.candidate.candidate,
              e.candidate.sdpMid ?? null,
              e.candidate.sdpMLineIndex ?? null
            )
          } catch (err) {
            dbg('SendIceCandidateFailed', {
              pcInstanceId,
              to: targetConnectionId,
              message: String((err as Error)?.message || err),
            })
          }
        }
        pc.onconnectionstatechange = () => {
          dbg('ConnectionStateChanged', { pcInstanceId, connectionState: pc.connectionState })
          logSenderDiagnostics(pc, 'onconnectionstatechange', pcInstanceId)
        }
        pc.oniceconnectionstatechange = () =>
          dbg('IceConnectionStateChanged', { pcInstanceId, iceConnectionState: pc.iceConnectionState })
        pc.onsignalingstatechange = () =>
          dbg('SignalingStateChanged', { pcInstanceId, signalingState: pc.signalingState })

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
                    pcInstanceId,
                    bytesSent: (r as any).bytesSent ?? null,
                    packetsSent: (r as any).packetsSent ?? null,
                  })
                }
                if (r.type === 'inbound-rtp' && (r as any).kind === 'audio') {
                  dbg('stats.inboundAudio', {
                    pcInstanceId,
                    bytesReceived: (r as any).bytesReceived ?? null,
                    packetsReceived: (r as any).packetsReceived ?? null,
                    packetsLost: (r as any).packetsLost ?? null,
                    jitter: (r as any).jitter ?? null,
                  })
                }
              })
            } catch (err) {
              dbg('stats.error', { pcInstanceId, message: String((err as Error)?.message || err) })
            }
          }, 2000)
        }

        return pc
      } catch (err) {
        try {
          pc.close()
        } catch {
          // ignore close errors
        }
        if (pcRef.current === pc) pcRef.current = null
        throw err
      }
    })()

    try {
      return await pcCreateInFlightRef.current
    } finally {
      pcCreateInFlightRef.current = null
    }
  }, [logSenderDiagnostics, resolveIceServers])

  const cleanupPeer = useCallback(() => {
    if (statsTimerRef.current) {
      window.clearInterval(statsTimerRef.current)
      statsTimerRef.current = null
    }
    pcCreateInFlightRef.current = null
    pcRef.current?.close()
    pcRef.current = null
    setActivePeerConnectionId(null, 'cleanupPeer')
    queuedIceCandidatesRef.current = []
    remoteStreamRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
  }, [setActivePeerConnectionId])

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
      if (payload.iceConfiguration) {
        iceConfigurationRef.current = payload.iceConfiguration
      }
      setConnected(payload)
      setPhaseSafely('connected')
    })
    hub.on('IncomingCall', (payload: IncomingCallPayload) => {
      dbg('IncomingCall', payload)
      synthesizedIncomingCallIdRef.current = payload.callId
      invalidateCallHistory()
      setIncomingCall(payload)
      setCallId(payload.callId)
      setActiveRoomId(payload.roomId)
      setPhase('incoming')
    })
    hub.on('CallRinging', (payload: CallRingingPayload) => {
      invalidateCallHistory()
      const normalizedPayload: CallRingingPayload = {
        ...payload,
        targetUserId: payload.targetUserId || payload.dispatcherUserId,
        dispatcherUserId: payload.dispatcherUserId || payload.targetUserId,
      }
      setRinging(normalizedPayload)
      setCallId(normalizedPayload.callId)
      setActiveRoomId(normalizedPayload.roomId)
      setPhase('ringing')
    })
    hub.on('CallAccepted', (payload: CallAcceptedPayload) => {
      dbg('CallAccepted', payload)
      synthesizedIncomingCallIdRef.current = payload.callId
      invalidateCallHistory()
      setCallId(payload.callId)
      setActiveRoomId(payload.roomId)
      const localConnectionId = localConnectionIdRef.current
      const acceptedBy = payload.acceptedByConnectionId || null
      const otherFromParticipants =
        payload.participants?.find((p) => p.connectionId && p.connectionId !== localConnectionId)
          ?.connectionId || null
      const resolvedPeerConnectionId =
        acceptedBy && acceptedBy !== localConnectionId ? acceptedBy : otherFromParticipants

      // Never target self for SDP/ICE relay.
      if (resolvedPeerConnectionId) {
        setActivePeerConnectionId(resolvedPeerConnectionId, 'CallAccepted')
      }
      setPhase('accepted')
    })
    hub.on('CallRejected', (payload: CallRejectedPayload) => {
      invalidateCallHistory()
      setSessionEndReason(payload.reason ? `Call declined: ${payload.reason}` : 'Call was declined.')
      setError(payload.reason || 'Call rejected.')
      clearTransientCallState()
      setPhase('rejected')
    })
    hub.on('CallCancelled', (payload: CallCancelledPayload) => {
      invalidateCallHistory()
      setSessionEndReason(payload.reason || 'The call was cancelled.')
      clearTransientCallState()
      setPhase('cancelled')
    })
    hub.on('CallTimedOut', (payload: CallTimedOutPayload) => {
      invalidateCallHistory()
      setSessionEndReason(payload.reason || 'The call request timed out before a dispatcher answered.')
      clearTransientCallState()
      setPhase('timeout')
    })
    hub.on('JoinedRoom', async (payload: JoinedRoomPayload) => {
      dbg('JoinedRoom', payload)
      setActiveRoomId(payload.roomId)
      setOtherParticipants(payload.otherParticipants || [])
      const peer = (payload.otherParticipants || [])[0]
      if (peer?.connectionId) {
        setActivePeerConnectionId(peer.connectionId, 'JoinedRoom')
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
            dbg('SendOffer', { to: peer.connectionId, sdpLength: (offer.sdp || '').length })
            await hub.invoke('SendOffer', peer.connectionId, offer.sdp || '')
          } catch (err) {
            setErrorFrom(err)
          }
        }
      }
    })
    hub.on('LeftRoom', (_payload: LeftRoomPayload) => {
      invalidateCallHistory()
      cleanupPeer()
      clearTransientCallState()
      setPhase('connected')
    })
    hub.on('ParticipantLeft', (payload: ParticipantLeftPayload) => {
      const who = String(payload.displayName || payload.userId || 'The other participant').trim()
      setSessionEndReason(`${who} left the call. Your audio session has stopped.`)
      invalidateCallHistory()
      cleanupPeer()
      clearTransientCallState()
      setPhase('ended')
    })
    hub.on('ReceiveOffer', async (payload: OfferPayload) => {
      dbg('ReceiveOffer', {
        from: payload.fromConnectionId,
        roomId: payload.roomId,
        sdpLength: (payload.sdp || '').length,
      })
      if (activeRoomIdRef.current && payload.roomId !== activeRoomIdRef.current) {
        dbg('IgnoreOfferFromStaleRoom', {
          expectedRoomId: activeRoomIdRef.current,
          incomingRoomId: payload.roomId,
          from: payload.fromConnectionId,
        })
        return
      }
      const expectedPeer = peerConnectionIdRef.current
      if (expectedPeer && payload.fromConnectionId !== expectedPeer) {
        dbg('IgnoreOfferFromUnexpectedPeer', { expectedPeer, from: payload.fromConnectionId })
        return
      }
      setActivePeerConnectionId(payload.fromConnectionId, 'ReceiveOffer')
      try {
        const pc = await ensurePeerConnection()
        await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
        dbg('SetRemoteDescription', { type: 'offer', from: payload.fromConnectionId })
        await flushQueuedIceCandidates(pc, 'after-set-remote-offer')
        const answer = await pc.createAnswer()
        dbg('createAnswer', { to: payload.fromConnectionId, sdpLength: (answer.sdp || '').length })
        await pc.setLocalDescription(answer)
        dbg('SendAnswer', { to: payload.fromConnectionId, sdpLength: (answer.sdp || '').length })
        await hub.invoke('SendAnswer', payload.fromConnectionId, answer.sdp || '')
      } catch (err) {
        setErrorFrom(err)
      }
    })
    hub.on('ReceiveAnswer', async (payload: { fromConnectionId: string; sdp: string }) => {
      dbg('ReceiveAnswer', { from: payload.fromConnectionId, sdpLength: (payload.sdp || '').length })
      const expectedPeer = peerConnectionIdRef.current
      if (!expectedPeer) {
        dbg('IgnoreAnswerWithoutPeerTarget', { from: payload.fromConnectionId })
        return
      }
      if (expectedPeer && payload.fromConnectionId !== expectedPeer) {
        dbg('IgnoreAnswerFromUnexpectedPeer', { expectedPeer, from: payload.fromConnectionId })
        return
      }
      try {
        const pc = await ensurePeerConnection()
        await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp })
        dbg('SetRemoteDescription', { type: 'answer', from: payload.fromConnectionId })
        await flushQueuedIceCandidates(pc, 'after-set-remote-answer')
      } catch (err) {
        setErrorFrom(err)
      }
    })
    hub.on('ReceiveIceCandidate', async (payload: IcePayload) => {
      dbg('ReceiveIceCandidate', {
        from: payload.fromConnectionId,
        roomId: payload.roomId,
        sdpMid: payload.sdpMid,
        sdpMLineIndex: payload.sdpMLineIndex,
        candidateType: getIceCandidateType(payload.candidate),
      })
      if (!activeRoomIdRef.current) {
        dbg('IgnoreIceCandidateWithoutActiveRoom', { from: payload.fromConnectionId, roomId: payload.roomId })
        return
      }
      if (payload.roomId && activeRoomIdRef.current && payload.roomId !== activeRoomIdRef.current) {
        dbg('IgnoreIceCandidateFromStaleRoom', {
          expectedRoomId: activeRoomIdRef.current,
          incomingRoomId: payload.roomId,
          from: payload.fromConnectionId,
        })
        return
      }
      const expectedPeer = peerConnectionIdRef.current
      if (expectedPeer && payload.fromConnectionId !== expectedPeer) {
        dbg('IgnoreIceCandidateFromUnexpectedPeer', { expectedPeer, from: payload.fromConnectionId })
        return
      }
      if (!expectedPeer) {
        setActivePeerConnectionId(payload.fromConnectionId, 'ReceiveIceCandidate')
      }
      try {
        const pc = await ensurePeerConnection()
        await addRemoteIceCandidateSafely(pc, payload)
      } catch (err) {
        setErrorFrom(err)
      }
    })
    hub.on('CallEnded', (_payload: CallEndedPayload) => {
      setSessionEndReason('The call has ended.')
      invalidateCallHistory()
      cleanupPeer()
      clearTransientCallState()
      setPhase('ended')
    })
    hub.onClose((err) => {
      if (err?.message?.toLowerCase().includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
        setPhase('auth-expired')
        forceLogoutAndRedirectLogin()
      }
    })
    hub.onReconnected((connectionId) => {
      localConnectionIdRef.current = connectionId || localConnectionIdRef.current
      setPhase((prev) => {
        if (prev === 'auth-expired') return prev
        if (prev === 'incoming' || prev === 'ringing' || prev === 'accepted' || prev === 'in-call') {
          return prev
        }
        return 'connected'
      })
      void hub
        .invoke<IceConfigurationPayload>('GetIceConfiguration')
        .then((payload) => {
          if (payload) iceConfigurationRef.current = payload
        })
        .catch((err) => {
          dbg('GetIceConfiguration after reconnect failed', String((err as Error)?.message || err))
        })
    })
  }, [
    addRemoteIceCandidateSafely,
    cleanupPeer,
    ensurePeerConnection,
    flushQueuedIceCandidates,
    setActivePeerConnectionId,
    setActiveRoomId,
    clearTransientCallState,
    setErrorFrom,
    setPhaseSafely,
  ])

  useEffect(() => {
    const token = getAccessToken()?.trim() || null
    const currentUserId = String(getJwtUserId() || '').trim().toLowerCase()
    const shouldPollPendingIncoming =
      Boolean(token) &&
      Boolean(currentUserId) &&
      phase !== 'idle' &&
      phase !== 'auth-expired' &&
      phase !== 'in-call' &&
      phase !== 'accepted' &&
      phase !== 'ended'

    if (!shouldPollPendingIncoming) return

    let cancelled = false

    const hydratePendingIncoming = async () => {
      if (pendingIncomingPollRef.current || cancelled) return
      pendingIncomingPollRef.current = true
      try {
        const pending = await fetchCallHistory({ status: 'pending', limit: 20 })
        if (cancelled) return

        const target = pending
          .filter((row) => {
            const calledUserId = String(row?.dispatcher?.userId || '').trim().toLowerCase()
            const callerUserId = String(row?.caller?.userId || '').trim().toLowerCase()
            return Boolean(calledUserId) && calledUserId === currentUserId && callerUserId !== currentUserId
          })
          .sort((a, b) => Date.parse(String(b.requestedAtUtc || 0)) - Date.parse(String(a.requestedAtUtc || 0)))[0]

        if (!target) return
        if (incomingCall?.callId === target.callId || callId === target.callId) {
          synthesizedIncomingCallIdRef.current = target.callId
          return
        }

        synthesizedIncomingCallIdRef.current = target.callId
        dbg('HydrateIncomingCallFromHistory', {
          callId: target.callId,
          roomId: target.roomId,
          callerUserId: target.caller.userId,
          callerDisplayName: target.caller.displayName,
        })
        setIncomingCall({
          callId: target.callId,
          roomId: target.roomId,
          fromUserId: target.caller.userId,
          fromConnectionId: '',
          fromDisplayName: target.caller.displayName || undefined,
          requestedAtUtc: target.requestedAtUtc || undefined,
          expiresAtUtc: undefined,
        })
        setCallId(target.callId)
        setActiveRoomId(target.roomId || null)
        setPhase('incoming')
      } catch (err) {
        dbg('HydrateIncomingCallFromHistoryFailed', String((err as Error)?.message || err))
      } finally {
        pendingIncomingPollRef.current = false
      }
    }

    void hydratePendingIncoming()
    const timer = window.setInterval(() => {
      void hydratePendingIncoming()
    }, 2500)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [callId, incomingCall, phase, setActiveRoomId])

  const connect = useCallback(async () => {
    const accessToken = getAccessToken()?.trim() || null
    const expiresAtMs = getAccessTokenExpirationMs(accessToken)
    const tokenIsValid = Boolean(accessToken) && (expiresAtMs == null || Date.now() < expiresAtMs - 5000)

    if (!tokenIsValid) {
      const message = accessToken ? 'expired or invalid' : 'missing'
      console.warn('[CALL-DBG] connect skipped because access token is', message)
      throw new Error(`Call hub connection skipped: access token ${message}.`)
    }

    if (hubRef.current.state === signalR.HubConnectionState.Connected) {
      const id = hubRef.current.connectionId
      localConnectionIdRef.current = id || localConnectionIdRef.current
      if (!hubEventsWiredRef.current) {
        wireEvents()
        hubEventsWiredRef.current = true
      }
      return
    }

    if (!hubEventsWiredRef.current) {
      wireEvents()
      hubEventsWiredRef.current = true
    }

    setPhase('connecting')
    setError(null)
    try {
      await hubRef.current.connect(getAccessToken)
      const id = hubRef.current.connectionId
      localConnectionIdRef.current = id || null
      setSessionEndReason(null)
      setPhaseSafely('connected')
    } catch (err) {
      setErrorFrom(err)
      if (String((err as Error)?.message || '').toLowerCase().includes('401')) {
        forceLogoutAndRedirectLogin()
      }
      throw err
    }
  }, [setErrorFrom, wireEvents])

  const disconnect = useCallback(async () => {
    cleanupPeer()
    await hubRef.current.stop()
    iceConfigurationRef.current = null
    synthesizedIncomingCallIdRef.current = null
    setSessionEndReason(null)
    setPhase('idle')
    clearTransientCallState()
  }, [cleanupPeer, setActiveRoomId])

  const ensureCallHubConnected = useCallback(async () => {
    if (hubRef.current.state === signalR.HubConnectionState.Connected) return
    await connect()
    if (hubRef.current.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Call hub is not connected.')
    }
  }, [connect])

  const requestCall = useCallback(
    async (targetUserId: string) => {
      setError(null)
      setSessionEndReason(null)
      try {
        await ensureCallHubConnected()
        await hubRef.current.invoke('RequestCall', targetUserId)
      } catch (err) {
        setErrorFrom(err)
        throw err
      }
    },
    [ensureCallHubConnected, setErrorFrom]
  )

  const acceptCall = useCallback(
    async (targetCallId: string) => {
      setError(null)
      setSessionEndReason(null)
      try {
        await ensureCallHubConnected()
        await hubRef.current.invoke('AcceptCall', targetCallId)
        synthesizedIncomingCallIdRef.current = targetCallId
        // Close incoming modal immediately; room/signaling events will drive the next states.
        setIncomingCall(null)
        setRinging(null)
        setPhase('accepted')
      } catch (err) {
        setErrorFrom(err)
      }
    },
    [ensureCallHubConnected, setErrorFrom]
  )

  const rejectCall = useCallback(
    async (targetCallId: string, reason?: string) => {
      setError(null)
      try {
        await ensureCallHubConnected()
        await hubRef.current.invoke('RejectCall', targetCallId, reason || null)
        clearTransientCallState()
        setPhase('connected')
      } catch (err) {
        setErrorFrom(err)
      }
    },
    [clearTransientCallState, ensureCallHubConnected, setErrorFrom]
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
    clearTransientCallState()
    setPhase('connected')
  }, [cleanupPeer, clearTransientCallState, setErrorFrom])

  const endCall = useCallback(async () => {
    try {
      if (hubRef.current.state === signalR.HubConnectionState.Connected) {
        await hubRef.current.invoke('EndCall')
      }
    } catch (err) {
      setErrorFrom(err)
    }
    cleanupPeer()
    clearTransientCallState()
    setPhase('ended')
  }, [cleanupPeer, clearTransientCallState, setErrorFrom])

  const value = useMemo<CallContextValue>(
    () => ({
      phase,
      error,
      clearError,
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
      sessionEndReason,
      clearSessionEndReason,
    }),
    [
      phase,
      error,
      clearError,
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
      sessionEndReason,
      clearSessionEndReason,
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

