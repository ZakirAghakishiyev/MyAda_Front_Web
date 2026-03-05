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

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
)

const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16l-6 6v6l-4 2v-8z" />
  </svg>
)

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)

const MyRequests = () => {
  const navigate = useNavigate()
  const { isCancelled, getCancelReason } = useCancelledRequests()
  const [tab, setTab] = useState('open') // 'open' | 'completed' | 'cancelled'
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const requestsWithCancellation = useMemo(() => {
    return mockRequests.map(r => {
      if (isCancelled(r.id)) {
        return { ...r, status: 'Cancelled', cancelReason: getCancelReason(r.id) }
      }
      return r
    })
  }, [isCancelled, getCancelReason])

  const allCategories = useMemo(() => {
    const set = new Set()
    requestsWithCancellation.forEach(r => set.add(r.category))
    return Array.from(set)
  }, [requestsWithCancellation])

  const filteredRequests = useMemo(() => {
    const statusFiltered = requestsWithCancellation.filter(r => {
      if (tab === 'open') return ['In Progress', 'Assigned'].includes(r.status)
      if (tab === 'completed') return r.status === 'Completed'
      if (tab === 'cancelled') return r.status === 'Cancelled'
      return true
    })

    const text = search.trim().toLowerCase()

    return statusFiltered.filter(r => {
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false
      if (!text) return true
      return (
        r.id.toLowerCase().includes(text) ||
        r.description.toLowerCase().includes(text) ||
        r.category.toLowerCase().includes(text)
      )
    })
  }, [tab, requestsWithCancellation, search, categoryFilter])

  const openCount = requestsWithCancellation.filter(r => ['In Progress', 'Assigned'].includes(r.status)).length
  const completedCount = requestsWithCancellation.filter(r => r.status === 'Completed').length
  const cancelledCount = requestsWithCancellation.filter(r => r.status === 'Cancelled').length

  const getServiceLabel = (request) => {
    const itCategories = [
      'Wi-Fi & Network',
      'Email & Office 365',
      'Password Reset',
      'Projector/Display',
      'Printer/Scanner',
      'Software Installation',
      'Computer Repair'
    ]
    return itCategories.includes(request.category) ? 'IT Services' : 'Facilities'
  }

  return (
    <div className="mr-page">
      <header className="mr-header">
        <div className="mr-header-left">
          <button type="button" className="mr-back" onClick={() => navigate('/')} aria-label="Back to Home">
            <IconBack />
          </button>
          <div className="mr-header-title">
            <h1>My Requests</h1>
            <span className="mr-subtitle">Track your university IT and Facilities support tickets in real-time.</span>
          </div>
        </div>
        <button
          type="button"
          className="mr-new-request-btn"
          onClick={() => navigate('/it-support', { state: { from: 'my-requests' } })}
        >
          New Request
        </button>
      </header>

      <div className="mr-toolbar">
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

        <div className="mr-toolbar-right">
          <div className="mr-search-wrap">
            <span className="mr-search-icon">
              <IconSearch />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Ticket ID or title..."
              className="mr-search-input"
            />
          </div>
          <div className="mr-filter-wrap">
            <button type="button" className="mr-filter-prefix">
              <IconFilter />
              <span>Filter</span>
            </button>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="mr-filter-select"
            >
              <option value="All">By Category</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="mr-view-toggle">
            <button
              type="button"
              className={`mr-view-btn ${viewMode === 'grid' ? 'mr-view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              type="button"
              className={`mr-view-btn ${viewMode === 'list' ? 'mr-view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {filteredRequests.length > 0 ? (
        <>
          <div className={`mr-grid ${viewMode === 'list' ? 'mr-grid--list' : ''}`}>
            {filteredRequests.map(request => {
              const serviceLabel = getServiceLabel(request)
              const isUrgent = request.urgency.toLowerCase().includes('urgent')
              return (
                <article
                  key={request.id}
                  className="mr-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/my-requests/${request.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/my-requests/${request.id}`)}
                >
                  <div className="mr-card-header-row">
                    <div className="mr-ticket-id-block">
                      <span className="mr-ticket-id">#{request.id}</span>
                    </div>
                    {isUrgent && <span className="mr-pill mr-pill--urgent">Urgent</span>}
                  </div>
                  <div className="mr-service-row">
                    <span className={`mr-service-pill mr-service-pill--${serviceLabel === 'IT Services' ? 'it' : 'fm'}`}>
                      {serviceLabel}
                    </span>
                    {request.status && (
                      <span
                        className={`mr-status-pill mr-status-pill--${request.status
                          .toLowerCase()
                          .replace(' ', '-')}`}
                      >
                        {request.status}
                      </span>
                    )}
                  </div>
                  <h2 className="mr-card-description">{request.description}</h2>
                  <p className="mr-location-text">
                    <IconPin />
                    <span>{request.location}</span>
                  </p>
                  <p className="mr-opened-text">
                    <IconClock />
                    <span>Opened {request.timeAgo}</span>
                  </p>
                  <div className="mr-card-footer">
                    {request.assignedTo ? (
                      <span className="mr-assigned">
                        <IconPerson />
                        <span>Assigned to {request.assignedTo}</span>
                      </span>
                    ) : (
                      <span className="mr-assigned mr-assigned--unassigned">
                        <IconPerson />
                        <span>Pending assignment</span>
                      </span>
                    )}
                  </div>
                </article>
              )
            })}

            <button
              type="button"
              className="mr-card mr-card--create"
              onClick={() => navigate('/it-support', { state: { from: 'my-requests' } })}
            >
              <div className="mr-create-inner">
                <span className="mr-create-icon">
                  <IconPlus />
                </span>
                <span className="mr-create-text">Create Another Request</span>
              </div>
            </button>
          </div>

          <div className="mr-show-more-wrap">
            <button type="button" className="mr-show-more-btn">
              Show More Requests
            </button>
          </div>
        </>
      ) : (
        <p className="mr-empty">No requests found for this view.</p>
      )}
    </div>
  )
}

export default MyRequests
