import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockRequests } from '../data/myRequestsItems'
import { useCancelledRequests } from '../contexts/CancelledRequestsContext'
import './MyRequests.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const IconPerson = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const MyRequests = () => {
  const navigate = useNavigate()
  const { isCancelled, getCancelReason } = useCancelledRequests()
  const [tab, setTab] = useState('open') // 'open' | 'completed' | 'cancelled'

  const requestsWithCancellation = useMemo(() => {
    return mockRequests.map(r => {
      if (isCancelled(r.id)) {
        return { ...r, status: 'Cancelled', cancelReason: getCancelReason(r.id) }
      }
      return r
    })
  }, [isCancelled, getCancelReason])

  const filteredRequests = useMemo(() => {
    return requestsWithCancellation.filter(r => {
      if (tab === 'open') return ['In Progress', 'Assigned'].includes(r.status)
      if (tab === 'completed') return r.status === 'Completed'
      if (tab === 'cancelled') return r.status === 'Cancelled'
      return true
    })
  }, [tab, requestsWithCancellation])

  const openCount = requestsWithCancellation.filter(r => ['In Progress', 'Assigned'].includes(r.status)).length
  const completedCount = requestsWithCancellation.filter(r => r.status === 'Completed').length
  const cancelledCount = requestsWithCancellation.filter(r => r.status === 'Cancelled').length

  return (
    <div className="mr-page">
      <header className="mr-header">
        <button type="button" className="mr-back" onClick={() => navigate('/')} aria-label="Back to Home">
          <IconBack />
        </button>
        <div className="mr-header-title">
          <h1>My Requests</h1>
          <span className="mr-subtitle">Track your support tickets</span>
        </div>
      </header>

      <div className="mr-tabs">
        <button
          type="button"
          className={`mr-tab ${tab === 'open' ? 'mr-tab--active' : ''}`}
          onClick={() => setTab('open')}
        >
          Open <span className="mr-tab-badge">{openCount}</span>
        </button>
        <button
          type="button"
          className={`mr-tab ${tab === 'completed' ? 'mr-tab--active' : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed <span className="mr-tab-badge">{completedCount}</span>
        </button>
        <button
          type="button"
          className={`mr-tab ${tab === 'cancelled' ? 'mr-tab--active' : ''}`}
          onClick={() => setTab('cancelled')}
        >
          Cancelled <span className="mr-tab-badge">{cancelledCount}</span>
        </button>
      </div>

      <div className="mr-list">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <article
              key={request.id}
              className="mr-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/my-requests/${request.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/my-requests/${request.id}`)}
            >
              <div className="mr-card-top">
                <span className="mr-ticket-id">#{request.id}</span>
                <div className="mr-tags">
                  <span className={`mr-tag mr-tag--status mr-tag--${request.status.toLowerCase().replace(' ', '-')}`}>
                    {request.status}
                  </span>
                  <span className={`mr-tag mr-tag--urgency mr-tag--${request.urgency.toLowerCase().replace(' ', '-')}`}>
                    {request.urgency}
                  </span>
                </div>
              </div>
              <h2 className="mr-card-description">{request.description}</h2>
              <span className="mr-category-tag">{request.category}</span>
              <div className="mr-card-meta">
                <span className="mr-meta-row">
                  <IconPin />
                  {request.location}
                </span>
                {request.assignedTo && (
                  <span className="mr-meta-row">
                    <IconPerson />
                    Assigned to {request.assignedTo}
                  </span>
                )}
                <span className="mr-meta-row mr-meta-row--time">
                  <IconClock />
                  {request.timeAgo}
                </span>
              </div>
            </article>
          ))
        ) : (
          <p className="mr-empty">No requests in this category.</p>
        )}
      </div>
    </div>
  )
}

export default MyRequests
