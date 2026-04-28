import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './RequestDetail.css'
import {
  getRequestDetail,
  getCurrentUserIds,
  getRequestTimeline,
  markRequestInProgress,
  markRequestCompleted,
  resolveSupportRequestTeacherCallTarget,
  staffMayViewSupportRequest,
} from '../api/supportApi'
import { useCallHub } from '../call/useCallHub'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const IconPerson = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const IconTimeline = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const REFRESH_INTERVAL_MS = 10000

const StaffTicketDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [request, setRequest] = React.useState(null)
  const [timeline, setTimeline] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [resolvingCreatorCall, setResolvingCreatorCall] = React.useState(false)
  const [callingCreatorId, setCallingCreatorId] = React.useState('')
  const [requestingCreatorId, setRequestingCreatorId] = React.useState('')
  const { staffId } = getCurrentUserIds()
  const { phase, ringing, requestCall } = useCallHub()

  const loadData = React.useCallback((showLoader = false) => {
    if (showLoader) setLoading(true)
    Promise.all([getRequestDetail(id), getRequestTimeline(id)])
      .then(([detail, timelineItems]) => {
        if (detail && !staffMayViewSupportRequest(detail, staffId)) {
          setRequest(null)
          setTimeline([])
        } else {
          setRequest(detail)
          setTimeline(timelineItems)
        }
      })
      .catch(() => {
        setRequest(null)
        setTimeline([])
      })
      .finally(() => {
        if (showLoader) setLoading(false)
      })
  }, [id, staffId])

  React.useEffect(() => {
    let isMounted = true
    const safeLoad = (showLoader = false) => {
      if (!isMounted) return
      loadData(showLoader)
    }
    safeLoad(true)
    const intervalId = window.setInterval(() => safeLoad(false), REFRESH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') safeLoad(false)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadData])

  React.useEffect(() => {
    if (['idle', 'ended', 'rejected', 'cancelled', 'timeout', 'error', 'auth-expired'].includes(phase)) {
      setCallingCreatorId('')
      setRequestingCreatorId('')
    }
  }, [phase])

  const goBack = () => navigate('/staff-portal')

  const handleCallCreator = React.useCallback(async () => {
    setResolvingCreatorCall(true)
    try {
      const resolved = await resolveSupportRequestTeacherCallTarget(request)
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              creatorName: resolved.creatorName || prev.creatorName,
              creatorEmail: resolved.creatorEmail || prev.creatorEmail,
              creatorRoleLabel: 'teacher',
              teacherCallTargetId: resolved.userId,
            }
          : prev
      )
      setCallingCreatorId(resolved.userId)
      setRequestingCreatorId(resolved.userId)
      await requestCall(resolved.userId)
    } catch (err) {
      window.alert(err?.message || 'Could not start a call to the ticket creator.')
    } finally {
      setResolvingCreatorCall(false)
      setRequestingCreatorId('')
    }
  }, [request, requestCall])

  if (loading) {
    return <div className="rd-overlay"><div className="rd-popup">Loading ticket...</div></div>
  }

  if (!request) {
    return (
      <div className="rd-overlay" onClick={goBack} role="dialog">
        <div className="rd-popup" onClick={(e) => e.stopPropagation()}>
          <p>{staffId ? 'This ticket is not assigned to you, or it could not be loaded.' : 'Request not found.'}</p>
          <button type="button" className="rd-btn" onClick={goBack}>Back</button>
        </div>
      </div>
    )
  }

  const isOpen = ['New', 'Assigned', 'InProgress'].includes(request.status)
  const isCompleted = request.status === 'Completed'
  const isCancelledStatus = request.status === 'Cancelled'
  const priorityLabel = request.priority || request.urgency || 'Standard'
  const creatorRoleText =
    request.teacherCallTargetId || request.creatorRoleLabel === 'teacher'
      ? 'Teacher'
      : 'Creator'
  const isCallLocked = ['connecting', 'ringing', 'incoming', 'accepted', 'in-call'].includes(phase)
  const callTargetUserId = String(request.teacherCallTargetId || '').trim()
  const ringingTargetId = String(ringing?.targetUserId || ringing?.dispatcherUserId || '').trim()
  let callButtonLabel = `Call ${creatorRoleText}`
  if (resolvingCreatorCall) callButtonLabel = 'Preparing...'
  else if (requestingCreatorId && requestingCreatorId === callTargetUserId) callButtonLabel = 'Calling...'
  else if (ringingTargetId && ringingTargetId === callTargetUserId) callButtonLabel = 'Calling...'
  else if (callingCreatorId && callingCreatorId === callTargetUserId && phase === 'accepted') callButtonLabel = 'Joining...'
  else if (callingCreatorId && callingCreatorId === callTargetUserId && phase === 'in-call') callButtonLabel = 'In Call'

  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && goBack()} role="dialog" aria-modal="true">
      <div className="rd-popup" onClick={(e) => e.stopPropagation()}>
        <header className="rd-header">
          <button type="button" className="rd-back" onClick={goBack} aria-label="Back">
            <IconBack />
          </button>
        </header>

        <div className="rd-summary">
          <span className="rd-ticket-id">#{request.id}</span>
          <h1 className="rd-title">{request.description}</h1>
          <span className="rd-category-tag">{request.category}</span>
        </div>

        <div className="rd-popup-scroll">
          <div className="rd-status-row">
            <div className="rd-status-card">
              <span className="rd-status-label">Status</span>
              <span className={`rd-status-value rd-status-value--${request.status.toLowerCase().replace(' ', '-')}`}>
                {request.status}
              </span>
            </div>
            <div className="rd-status-card">
              <span className="rd-status-label">Priority</span>
              <span className={`rd-priority-value rd-priority-value--${priorityLabel.toLowerCase()}`}>
                {priorityLabel}
              </span>
            </div>
          </div>

          <section className="rd-card rd-card--details">
            <h2 className="rd-card-title">Ticket Details</h2>
            <div className="rd-detail-row">
              <IconPin />
              <span className="rd-detail-label">Location</span>
              <span className="rd-detail-value">{request.location}</span>
            </div>
            <div className="rd-detail-row">
              <IconClock />
              <span className="rd-detail-label">Created</span>
              <span className="rd-detail-value">{request.created}</span>
            </div>
            {isCompleted && request.completed && (
              <div className="rd-detail-row">
                <IconCheck />
                <span className="rd-detail-label">Completed</span>
                <span className="rd-detail-value">{request.completed}</span>
              </div>
            )}
          </section>

          <section className="rd-card">
            <h2 className="rd-card-title"><IconDoc /> Description</h2>
            <p className="rd-description">{request.descriptionFull || request.description}</p>
          </section>

          {Array.isArray(request.imageUrls) && request.imageUrls.length > 0 && (
            <section className="rd-card">
              <h2 className="rd-card-title">Images</h2>
              <div className="rd-images-grid">
                {request.imageUrls.map((url, idx) => (
                  <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="rd-image-link">
                    <img src={url} alt={`Attachment ${idx + 1}`} className="rd-image" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {(request.assignedTo || request.createdById) && (
            <section className="rd-card rd-card--assigned">
              <h2 className="rd-card-title"><IconPerson /> Assigned To</h2>
              {request.assignedTo && <p className="rd-assigned-name">{request.assignedTo}</p>}
              {request.createdById && (
                <div className="rd-assigned-row">
                  <div>
                    <p className="rd-assigned-meta">
                      Created by {request.creatorName || `ticket ${creatorRoleText.toLowerCase()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rd-btn rd-btn--contact rd-btn--inline"
                    onClick={handleCallCreator}
                    disabled={isCallLocked || resolvingCreatorCall || requestingCreatorId === callTargetUserId}
                    title={request.creatorName ? `Call ${request.creatorName}` : 'Call ticket teacher'}
                  >
                    <IconPhone />
                    {callButtonLabel}
                  </button>
                </div>
              )}
            </section>
          )}

          {isCompleted && request.rating != null && (
            <section className="rd-card rd-card--completed">
              <span className="rd-completed-icon">✓</span>
              <span className="rd-completed-label">Completed</span>
              <p className="rd-rating-label">Your Rating:</p>
              <div className="rd-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`rd-star ${i <= request.rating ? 'rd-star--filled' : ''}`}>
                    <IconStar />
                  </span>
                ))}
              </div>
            </section>
          )}

          {isCancelledStatus && request.cancelReason && (
            <section className="rd-card rd-card--cancelled">
              <h2 className="rd-card-title">
                <span className="rd-cancel-icon"><IconX /></span>
                Cancelled
              </h2>
              <p className="rd-cancel-reason">Reason: {request.cancelReason}</p>
            </section>
          )}

          <section className="rd-card">
            <h2 className="rd-card-title"><IconTimeline /> Timeline</h2>
            <ul className="rd-timeline">
              {timeline.map((item, i) => (
                <li key={i} className={`rd-timeline-item ${item.done ? 'rd-timeline-item--done' : ''}`}>
                  <span className="rd-timeline-dot">{item.done ? <IconCheck /> : null}</span>
                  <div className="rd-timeline-content">
                    <span className="rd-timeline-step">{item.step}</span>
                    {item.detail && <span className="rd-timeline-detail">{item.detail}</span>}
                    {item.created && <span className="rd-timeline-detail">{item.created}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {isOpen && !isCancelledStatus && (
            <div className="rd-actions">
              <button type="button" className="rd-btn rd-btn--contact" onClick={() => markRequestInProgress(id, staffId).then(goBack)}>
                Mark as Started
              </button>
              <button type="button" className="rd-btn rd-btn--rate" onClick={() => markRequestCompleted(id, staffId).then(goBack)}>
                Complete
              </button>
            </div>
          )}

          {isCompleted && (
            <div className="rd-actions">
              <button type="button" className="rd-btn rd-btn--rate" onClick={goBack}>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffTicketDetail
