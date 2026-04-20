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

const ICE_SERVERS_ENDPOINT = 'http://13.60.31.141:5000/call/webrtc/ice-servers'

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
  const hubEventsWiredRef = useRef(false)
  const iceConfigurationRef = useRef<IceConfigurationPayload | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const pcCreateInFlightRef = useRef<Promise<RTCPeerConnection> | null>(null)
  const statsTimerRef = useRef<number | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const queuedIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const activeRoomIdRef = useRef<string | null>(null)
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

  const setActiveRoomId = useCallback((nextRoomId: string | null) => {
    activeRoomIdRef.current = nextRoomId
    setRoomId(nextRoomId)
  }, [])

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

  const resolveIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    const token = getAccessToken()
    const endpoint = ICE_SERVERS_ENDPOINT
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
    if (pcRef.current) return pcRef.current
    if (pcCreateInFlightRef.current) return pcCreateInFlightRef.current

    pcCreateInFlightRef.current = (async () => {
      const iceServers = await resolveIceServers()
      if (!iceServers.length) {
        throw new Error(`ICE configuration is empty. Verify ${ICE_SERVERS_ENDPOINT} returns TURN/STUN servers.`)
      }

      const pc = new RTCPeerConnection({ iceServers })
      pcRef.current = pc
      dbg('PeerConnectionCreated', {
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
              to: targetConnectionId,
              message: String((err as Error)?.message || err),
            })
          }
        }
        pc.onconnectionstatechange = () =>
          dbg('ConnectionStateChanged', { connectionState: pc.connectionState })
        pc.oniceconnectionstatechange = () =>
          dbg('IceConnectionStateChanged', { iceConnectionState: pc.iceConnectionState })
        pc.onsignalingstatechange = () =>
          dbg('SignalingStateChanged', { signalingState: pc.signalingState })

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
  }, [resolveIceServers])

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
      setPhase('connected')
    })
    hub.on('IncomingCall', (payload: IncomingCallPayload) => {
      setIncomingCall(payload)
      setCallId(payload.callId)
      setActiveRoomId(payload.roomId)
      setPhase('incoming')
    })
    hub.on('CallRinging', (payload: CallRingingPayload) => {
      setRinging(payload)
      setCallId(payload.callId)
      setActiveRoomId(payload.roomId)
      setPhase('ringing')
    })
    hub.on('CallAccepted', (payload: CallAcceptedPayload) => {
      dbg('CallAccepted', payload)
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
      setError(payload.reason || 'Call rejected.')
      setIncomingCall(null)
      setRinging(null)
      setOtherParticipants([])
      setCallId(null)
      setActiveRoomId(null)
      setPhase('rejected')
    })
    hub.on('CallCancelled', (_payload: CallCancelledPayload) => {
      setIncomingCall(null)
      setRinging(null)
      setOtherParticipants([])
      setCallId(null)
      setActiveRoomId(null)
      setPhase('cancelled')
    })
    hub.on('CallTimedOut', (_payload: CallTimedOutPayload) => {
      setIncomingCall(null)
      setRinging(null)
      setOtherParticipants([])
      setCallId(null)
      setActiveRoomId(null)
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
      cleanupPeer()
      setIncomingCall(null)
      setRinging(null)
      setOtherParticipants([])
      setCallId(null)
      setActiveRoomId(null)
      setPhase('connected')
    })
    hub.on('ParticipantLeft', (_payload: ParticipantLeftPayload) => {
      cleanupPeer()
      setIncomingCall(null)
      setRinging(null)
      setOtherParticipants([])
      setCallId(null)
      setActiveRoomId(null)
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
      cleanupPeer()
      setIncomingCall(null)
      setRinging(null)
      setOtherParticipants([])
      setCallId(null)
      setActiveRoomId(null)
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
      setPhase((prev) => (prev === 'auth-expired' ? prev : 'connected'))
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
    setErrorFrom,
  ])

  const connect = useCallback(async () => {
    if (hubRef.current.state === signalR.HubConnectionState.Connected) {
      const id = hubRef.current.connectionId
      localConnectionIdRef.current = id || localConnectionIdRef.current
      if (!hubEventsWiredRef.current) {
        wireEvents()
        hubEventsWiredRef.current = true
      }
      return
    }

    setPhase('connecting')
    setError(null)
    try {
      await hubRef.current.connect(getAccessToken)
      const id = hubRef.current.connectionId
      localConnectionIdRef.current = id || null
      if (!hubEventsWiredRef.current) {
        wireEvents()
        hubEventsWiredRef.current = true
      }
      setPhase('connected')
    } catch (err) {
      hubEventsWiredRef.current = false
      setErrorFrom(err)
      if (String((err as Error)?.message || '').toLowerCase().includes('401')) {
        forceLogoutAndRedirectLogin()
      }
      throw err
    }
  }, [setErrorFrom, wireEvents])

  const disconnect = useCallback(async () => {
    cleanupPeer()
    hubEventsWiredRef.current = false
    await hubRef.current.stop()
    iceConfigurationRef.current = null
    setPhase('idle')
    setIncomingCall(null)
    setRinging(null)
    setCallId(null)
    setActiveRoomId(null)
    setOtherParticipants([])
  }, [cleanupPeer, setActiveRoomId])

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
        setOtherParticipants([])
        setCallId(null)
        setActiveRoomId(null)
        setPhase('connected')
      } catch (err) {
        setErrorFrom(err)
      }
    },
    [ensureCallHubConnected, setActiveRoomId, setErrorFrom]
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
    setOtherParticipants([])
    setCallId(null)
    setActiveRoomId(null)
    setPhase('connected')
  }, [cleanupPeer, setActiveRoomId, setErrorFrom])

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
    setOtherParticipants([])
    setCallId(null)
    setActiveRoomId(null)
    setPhase('ended')
  }, [cleanupPeer, setActiveRoomId, setErrorFrom])

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

