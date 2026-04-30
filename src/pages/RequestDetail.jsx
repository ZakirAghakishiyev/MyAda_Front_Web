import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  cancelMemberRequest,
  getCurrentUserIds,
  getRequestDetail,
  getRequestTimeline,
  resolveSupportRequestAssignedStaffCallTarget,
} from '../api/supportApi'
import { useCallHub } from '../call/useCallHub'
import './RequestDetail.css'

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
const IconTimeline = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.33 1.76.62 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.28a2 2 0 0 1 2.11-.45c.84.29 1.71.5 2.6.62A2 2 0 0 1 22 16.92z" />
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const REFRESH_INTERVAL_MS = 10000

const RequestDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [resolvingStaffCall, setResolvingStaffCall] = useState(false)
  const [callingStaff, setCallingStaff] = useState(null)
  const [callStatusText, setCallStatusText] = useState('')
  const { phase, error: callError, requestCall, otherParticipants } = useCallHub()

  const loadData = useCallback((showLoader = false) => {
    if (showLoader) setLoading(true)
    Promise.all([getRequestDetail(id), getRequestTimeline(id)])
      .then(([detail, timelineItems]) => {
        setRequest(detail)
        setTimeline(timelineItems)
      })
      .catch(() => {
        setRequest(null)
        setTimeline([])
      })
      .finally(() => {
        if (showLoader) setLoading(false)
      })
  }, [id])

  useEffect(() => {
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

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return
    const { memberId } = getCurrentUserIds()
    cancelMemberRequest(id, memberId, cancelReason.trim())
      .then(() => loadData(false))
      .finally(() => {
        setShowCancelModal(false)
        setCancelReason('')
      })
  }

  useEffect(() => {
    if (!callingStaff) return

    if (callError) {
      setCallStatusText(callError)
      if (phase === 'error') setCallingStaff(null)
      return
    }

    if (phase === 'connecting') {
      setCallStatusText(`Connecting to ${callingStaff.staffName || 'assigned staff'}...`)
      return
    }

    if (phase === 'ringing') {
      setCallStatusText(`Calling ${callingStaff.staffName || 'assigned staff'}... waiting for answer.`)
      return
    }

    if (phase === 'accepted') {
      setCallStatusText(`${callingStaff.staffName || 'Assigned staff'} accepted. Joining the call...`)
      return
    }

    if (phase === 'in-call') {
      const peerName = otherParticipants?.[0]?.displayName || otherParticipants?.[0]?.userId || callingStaff.staffName || 'assigned staff'
      setCallStatusText(`Connected to ${peerName}. Use the floating call panel to manage the call.`)
      return
    }

    if (phase === 'timeout') {
      setCallStatusText(`${callingStaff.staffName || 'Assigned staff'} did not answer before the call timed out.`)
      setCallingStaff(null)
      return
    }

    if (phase === 'rejected') {
      setCallStatusText(`${callingStaff.staffName || 'Assigned staff'} declined the call request.`)
      setCallingStaff(null)
      return
    }

    if (phase === 'cancelled') {
      setCallStatusText('The pending call was cancelled.')
      setCallingStaff(null)
      return
    }

    if (phase === 'ended') {
      setCallingStaff(null)
    }
  }, [callError, callingStaff, otherParticipants, phase])

  const handleCallAssignedStaff = async () => {
    if (!request?.assignedTo || resolvingStaffCall) return

    setResolvingStaffCall(true)
    setCallStatusText('')

    try {
      const target = await resolveSupportRequestAssignedStaffCallTarget(request)
      const activeTarget = {
        userId: target.userId,
        staffName: target.staffName || request.assignedTo || 'Assigned staff',
      }
      setCallingStaff(activeTarget)
      setCallStatusText(`Calling ${activeTarget.staffName}...`)
      await requestCall(target.userId)
    } catch (err) {
      setCallingStaff(null)
      setCallStatusText(err?.message || 'Could not start the staff call.')
    } finally {
      setResolvingStaffCall(false)
    }
  }

  if (loading) {
    return <div className="rd-overlay"><div className="rd-popup">Loading request...</div></div>
  }

  if (!request) {
    return (
      <div className="rd-overlay" onClick={() => navigate('/my-requests')} role="dialog">
        <div className="rd-popup" onClick={(e) => e.stopPropagation()}>
          <p>Request not found.</p>
          <button type="button" className="rd-btn" onClick={() => navigate('/my-requests')}>Back</button>
        </div>
      </div>
    )
  }

  const isOpen = ['New', 'Assigned', 'InProgress'].includes(request.status)
  const isCompleted = request.status === 'Completed'
  const isCancelledStatus = request.status === 'Cancelled'
  const callRequestLocked = ['connecting', 'ringing', 'incoming', 'accepted', 'in-call'].includes(phase)
  const callButtonLabel = resolvingStaffCall
    ? 'Preparing...'
    : phase === 'connecting' && callingStaff
      ? 'Connecting...'
      : phase === 'ringing' && callingStaff
        ? 'Calling...'
        : phase === 'accepted' && callingStaff
          ? 'Joining...'
          : phase === 'in-call' && callingStaff
            ? 'In Call'
            : 'Call Staff'

  const priorityLabel = request.priority || request.urgency || 'Standard'

  return (
    <>
      <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && navigate('/my-requests')} role="dialog" aria-modal="true">
        <div className="rd-popup" onClick={(e) => e.stopPropagation()}>
          <header className="rd-header">
            <button type="button" className="rd-back" onClick={() => navigate('/my-requests')} aria-label="Back">
              <IconBack />
            </button>
          </header>

          <div className="rd-summary">
            <span className="rd-ticket-id">{request.ticketNo || `#${request.id}`}</span>
            <h1 className="rd-title">{request.description || request.descriptionFull}</h1>
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
                <span className="rd-detail-value">{request.created || request.createdAt}</span>
              </div>
              {isCompleted && (request.completedAt || request.completed) && (
                <div className="rd-detail-row">
                  <IconCheck />
                  <span className="rd-detail-label">Completed</span>
                  <span className="rd-detail-value">{request.completed || request.completedAt}</span>
                </div>
              )}
            </section>

            <section className="rd-card">
              <h2 className="rd-card-title">
                <IconDoc /> Description
              </h2>
              <p className="rd-description">{request.descriptionFull || request.description || ''}</p>
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

            {request.assignedTo && (
              <section className="rd-card rd-card--assigned">
                <h2 className="rd-card-title">
                  <IconPerson /> Assigned To
                </h2>
                <p className="rd-assigned-name">{request.assignedTo}</p>
              </section>
            )}

            {isCancelledStatus && request.cancelReason && (
              <section className="rd-card rd-card--cancelled">
                <h2 className="rd-card-title">
                  <span className="rd-cancel-icon">
                    <IconX />
                  </span>
                  Cancelled
                </h2>
                <p className="rd-cancel-reason">Reason: {request.cancelReason}</p>
              </section>
            )}

            <section className="rd-card">
              <h2 className="rd-card-title">
                <IconTimeline /> Timeline
              </h2>
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
                <button
                  type="button"
                  className="rd-btn rd-btn--contact"
                  onClick={() => void handleCallAssignedStaff()}
                  disabled={!request.assignedTo || resolvingStaffCall || callRequestLocked}
                >
                  <IconPhone /> {callButtonLabel}
                </button>
                <button type="button" className="rd-btn rd-btn--cancel" onClick={() => setShowCancelModal(true)}>
                  <IconX /> Cancel Ticket
                </button>
              </div>
            )}
            {callStatusText && (
              <p className="rd-call-status" role={callError ? 'alert' : 'status'}>
                {callStatusText}
              </p>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="rd-contact-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="rd-contact-modal rd-cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="rd-contact-title">Cancel Request</h3>
            <p className="rd-cancel-prompt">Please provide a reason for cancelling this request.</p>
            <textarea
              className="rd-cancel-reason-input"
              placeholder="Enter reason..."
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="rd-contact-btns">
              <button type="button" className="rd-contact-btn rd-contact-btn--close" onClick={() => { setShowCancelModal(false); setCancelReason(''); }}>Cancel</button>
              <button type="button" className="rd-contact-btn rd-contact-btn--confirm" onClick={handleConfirmCancel} disabled={!cancelReason.trim()}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default RequestDetail
