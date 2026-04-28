import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './StaffPortal.css'
import {
  getCurrentUserIds,
  getStaffRequests,
  mapListItemToCard,
  markRequestCompleted,
  markRequestInProgress,
  resolveSupportRequestTeacherCallTarget,
} from '../api/supportApi'
import { useCallHub } from '../call/useCallHub'

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconPerson = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m13 18 6-6-6-6" />
  </svg>
)

const REFRESH_INTERVAL_MS = 10000
const OPEN_STATUSES = new Set(['New', 'Assigned', 'InProgress'])

const StaffPortal = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [updatedId, setUpdatedId] = useState(null)
  const [resolvingCallJobId, setResolvingCallJobId] = useState(null)
  const [callingCreatorId, setCallingCreatorId] = useState('')
  const [requestingCreatorId, setRequestingCreatorId] = useState('')
  const { staffId } = getCurrentUserIds()
  const { phase, ringing, requestCall } = useCallHub()

  const loadJobs = useCallback(() => {
    getStaffRequests(staffId)
      .then((items) =>
        setJobs(
          items
            .map(mapListItemToCard)
            .filter((j) => OPEN_STATUSES.has(j.status))
            .map((j) => ({
              ...j,
              title: j.description,
              tag: j.urgency === 'Critical' ? 'EMERGENCY' : `${j.service || 'IT'} SUPPORT`,
              tagClass: j.urgency === 'Critical' ? 'emergency' : String(j.service || '').toLowerCase(),
              sub: j.assignedTo || 'Assigned by dispatcher',
              subIcon: j.assignedTo ? 'person' : null,
              status: j.status === 'InProgress' ? 'in_progress' : 'pending',
              service: String(j.service || '').toLowerCase(),
            }))
        )
      )
      .catch(() => setJobs([]))
  }, [staffId])

  useEffect(() => {
    loadJobs()
    const intervalId = window.setInterval(loadJobs, REFRESH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadJobs()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadJobs])

  useEffect(() => {
    if (['idle', 'ended', 'rejected', 'cancelled', 'timeout', 'error', 'auth-expired'].includes(phase)) {
      setCallingCreatorId('')
      setRequestingCreatorId('')
      setResolvingCallJobId(null)
    }
  }, [phase])

  const openTicket = (id) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, unseen: false } : j))
    )
    navigate(`/staff-portal/ticket/${id}`)
  }

  const handleMarkStarted = useCallback((id) => {
    markRequestInProgress(id, staffId).then(() => {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: 'in_progress', unseen: false } : j)))
      setUpdatedId(id)
      setTimeout(() => setUpdatedId(null), 600)
      loadJobs()
    })
  }, [loadJobs, staffId])

  const handleComplete = useCallback((id) => {
    markRequestCompleted(id, staffId).then(() => {
      setJobs((prev) => prev.filter((j) => j.id !== id))
      setUpdatedId(null)
      loadJobs()
    })
  }, [loadJobs, staffId])

  const resolveCreatorForJob = useCallback(async (job) => {
    const directUserId = String(job?.teacherCallTargetId || '').trim()
    if (directUserId) {
      return {
        userId: directUserId,
        creatorName: job?.creatorName || null,
      }
    }

    setResolvingCallJobId(job?.id || null)
    try {
      const resolved = await resolveSupportRequestTeacherCallTarget(job)

      setJobs((prev) =>
        prev.map((item) =>
          item.id === job.id
            ? {
                ...item,
                creatorName: resolved.creatorName || item.creatorName,
                creatorEmail: resolved.creatorEmail || item.creatorEmail,
                creatorRoleLabel: 'teacher',
                teacherCallTargetId: resolved.userId,
              }
            : item
        )
      )

      return {
        userId: resolved.userId,
        creatorName: resolved.creatorName,
      }
    } finally {
      setResolvingCallJobId(null)
    }
  }, [])

  const handleCallCreator = useCallback(async (job) => {
    try {
      const { userId } = await resolveCreatorForJob(job)
      if (!userId) return
      setCallingCreatorId(userId)
      setRequestingCreatorId(userId)
      await requestCall(userId)
    } catch (err) {
      window.alert(err?.message || 'Could not start a call to the ticket creator.')
    } finally {
      setRequestingCreatorId('')
    }
  }, [requestCall, resolveCreatorForJob])

  const isCallLocked = ['connecting', 'ringing', 'incoming', 'accepted', 'in-call'].includes(phase)

  const getCallButtonLabel = useCallback((job) => {
    const targetUserId = String(job?.teacherCallTargetId || '').trim()
    if (resolvingCallJobId === job?.id) return 'Preparing...'
    if (!targetUserId) return 'Call Teacher'
    if (requestingCreatorId === targetUserId) return 'Calling...'
    if (String(ringing?.targetUserId || ringing?.dispatcherUserId || '').trim() === targetUserId) return 'Calling...'
    if (callingCreatorId === targetUserId && phase === 'accepted') return 'Joining...'
    if (callingCreatorId === targetUserId && phase === 'in-call') return 'In Call'
    return 'Call Teacher'
  }, [callingCreatorId, phase, requestingCreatorId, resolvingCallJobId, ringing?.dispatcherUserId, ringing?.targetUserId])

  return (
    <>
      <div className="sp-main-header">
        <div>
          <h1 className="sp-main-title">My Assigned Jobs</h1>
          <p className="sp-main-subtitle">Priority queue for campus maintenance</p>
        </div>
      </div>

      <div className="sp-job-list">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`sp-job-card sp-job-card--transition ${updatedId === job.id ? 'sp-job-card--updated' : ''} sp-job-card--clickable ${job.unseen ? 'sp-job-card--unseen' : ''}`}
            onClick={() => openTicket(job.id)}
            onKeyDown={(e) => e.key === 'Enter' && openTicket(job.id)}
            role="button"
            tabIndex={0}
          >
            <div className="sp-job-card-top">
              <span className={`sp-job-tag sp-job-tag--${job.tagClass}`}>{job.tag}</span>
              <span className="sp-job-time">{job.timeAgo}</span>
              {job.unseen && <span className="sp-job-unseen-pill">New</span>}
            </div>
            <h3 className="sp-job-title">{job.title}</h3>
            <div className="sp-job-location">
              <IconLocation />
              <span>{job.location}</span>
            </div>
            <div className="sp-job-assignee-row">
              <div className="sp-job-sub">
                {job.subIcon === 'person' ? <IconPerson /> : null}
                <span>{job.sub}</span>
              </div>
            </div>
            <div className="sp-job-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="sp-btn sp-btn--call sp-btn--transition"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCallCreator(job)
                }}
                disabled={isCallLocked || resolvingCallJobId === job.id || requestingCreatorId === String(job.teacherCallTargetId || '')}
                title={job.creatorName ? `Call ${job.creatorName}` : 'Call ticket teacher'}
              >
                <IconPhone />
                {getCallButtonLabel(job)}
              </button>
              {job.status === 'pending' && (
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--transition"
                  onClick={() => handleMarkStarted(job.id)}
                >
                  Mark as Started
                </button>
              )}
              {job.status === 'in_progress' && (
                <>
                  <span className="sp-status-inline">
                    <span className="sp-dot sp-dot--orange" />
                    In Progress
                  </span>
                  <button
                    type="button"
                    className="sp-btn sp-btn--success sp-btn--transition"
                    onClick={() => handleComplete(job.id)}
                  >
                    Complete
                  </button>
                </>
              )}
            </div>
            <button type="button" className="sp-job-more" aria-label="More options" onClick={(e) => e.stopPropagation()}>⋯</button>
          </div>
        ))}

        <div className="sp-end-of-queue">
          <IconCheck />
          <h3 className="sp-end-title">End of Queue</h3>
          <p className="sp-end-text">You&apos;ve reached the end of your assigned tasks. New requests will appear here as they are dispatched.</p>
        </div>
      </div>

      <div className="sp-offline-wrap">
        <button type="button" className="sp-offline-btn">
          Go Offline
          <IconArrowRight />
        </button>
      </div>
    </>
  )
}

export default StaffPortal
