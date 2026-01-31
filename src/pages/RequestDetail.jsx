import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRequestById } from '../data/myRequestsItems'
import { useCancelledRequests } from '../contexts/CancelledRequestsContext'
import './RequestDetail.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconShare = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.82 3.98M15.41 6.51l-6.82 3.98" />
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
const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

const RequestDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { isCancelled, getCancelReason, cancelRequest } = useCancelledRequests()
  const baseRequest = getRequestById(id)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const request = baseRequest
    ? isCancelled(baseRequest.id)
      ? {
          ...baseRequest,
          status: 'Cancelled',
          cancelReason: getCancelReason(baseRequest.id),
          timeline: [
            ...baseRequest.timeline.filter((t) => ['Created', 'Assigned'].includes(t.step)),
            { step: 'Cancelled', detail: getCancelReason(baseRequest.id), done: true }
          ]
        }
      : baseRequest
    : null

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return
    cancelRequest(id, cancelReason.trim())
    setShowCancelModal(false)
    setCancelReason('')
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

  const isOpen = ['In Progress', 'Assigned'].includes(request.status)
  const isCompleted = request.status === 'Completed'
  const isCancelledStatus = request.status === 'Cancelled'

  const priorityLabel = request.priority || (request.urgency === 'Urgent' ? 'High' : 'Low')

  return (
    <>
      <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && navigate('/my-requests')} role="dialog" aria-modal="true">
        <div className="rd-popup" onClick={(e) => e.stopPropagation()}>
          <header className="rd-header">
            <button type="button" className="rd-back" onClick={() => navigate('/my-requests')} aria-label="Back">
              <IconBack />
            </button>
            <button type="button" className="rd-share" aria-label="Share"><IconShare /></button>
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

          {request.assignedTo && (
            <section className="rd-card rd-card--assigned">
              <h2 className="rd-card-title"><IconPerson /> Assigned To</h2>
              <p className="rd-assigned-name">{request.assignedTo}</p>
            </section>
          )}

          {isCompleted && request.rating != null && (
            <section className="rd-card rd-card--completed">
              <span className="rd-completed-icon">✓</span>
              <span className="rd-completed-label">Completed</span>
              <p className="rd-rating-label">Your Rating:</p>
              <div className="rd-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`rd-star ${i <= request.rating ? 'rd-star--filled' : ''}`}><IconStar /></span>
                ))}
              </div>
            </section>
          )}

          {isCancelledStatus && request.cancelReason && (
            <section className="rd-card rd-card--cancelled">
              <h2 className="rd-card-title"><span className="rd-cancel-icon"><IconX /></span> Cancelled</h2>
              <p className="rd-cancel-reason">Reason: {request.cancelReason}</p>
            </section>
          )}

          <section className="rd-card">
            <h2 className="rd-card-title"><IconTimeline /> Timeline</h2>
            <ul className="rd-timeline">
              {request.timeline.map((item, i) => (
                <li key={i} className={`rd-timeline-item ${item.done ? 'rd-timeline-item--done' : ''}`}>
                  <span className="rd-timeline-dot">{item.done ? <IconCheck /> : null}</span>
                  <div className="rd-timeline-content">
                    <span className="rd-timeline-step">{item.step}</span>
                    {item.detail && <span className="rd-timeline-detail">{item.detail}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {isOpen && !isCancelledStatus && (
            <div className="rd-actions">
              <button type="button" className="rd-btn rd-btn--contact" onClick={() => setShowContactModal(true)}>
                <IconChat /> Contact Staff
              </button>
              <button type="button" className="rd-btn rd-btn--cancel" onClick={() => setShowCancelModal(true)}>
                <IconX /> Cancel Ticket
              </button>
            </div>
          )}

          {isCompleted && (
            <div className="rd-actions">
              <button type="button" className="rd-btn rd-btn--rate">
                <IconStar /> Rate This Ticket
              </button>
            </div>
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

      {showContactModal && (
        <div className="rd-contact-overlay" onClick={() => setShowContactModal(false)}>
          <div className="rd-contact-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="rd-contact-title">Contact Support Staff</h3>
            {request.assignedTo && <p className="rd-contact-assigned">Assigned to: {request.assignedTo}</p>}
            <p className="rd-contact-intro">You can contact support via:</p>
            <ul className="rd-contact-list">
              <li>Email: support@ada.edu.az</li>
              <li>Phone: +994 12 437 32 35</li>
              <li>Chat: Available in app</li>
            </ul>
            <div className="rd-contact-btns">
              <button type="button" className="rd-contact-btn rd-contact-btn--close" onClick={() => setShowContactModal(false)}>Close</button>
              <a href="mailto:support@ada.edu.az" className="rd-contact-btn rd-contact-btn--email">Send Email</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default RequestDetail
