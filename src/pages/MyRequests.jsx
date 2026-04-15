import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUserIds, getMemberRequests, mapListItemToCard } from '../api/supportApi'
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

const REFRESH_INTERVAL_MS = 10000

const MyRequests = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('open') // 'open' | 'completed' | 'cancelled'
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { memberId } = getCurrentUserIds()

  const loadRequests = useCallback((showLoader = false) => {
    if (showLoader) setLoading(true)
    getMemberRequests(memberId)
      .then((items) => setRequests(items.map(mapListItemToCard)))
      .catch(() => setRequests([]))
      .finally(() => {
        if (showLoader) setLoading(false)
      })
  }, [memberId])

  useEffect(() => {
    loadRequests(true)
    const intervalId = window.setInterval(() => loadRequests(false), REFRESH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRequests(false)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadRequests])

  const allCategories = useMemo(() => {
    const set = new Set()
    requests.forEach((r) => set.add(r.category))
    return Array.from(set)
  }, [requests])

  const filteredRequests = useMemo(() => {
    const statusFiltered = requests.filter((r) => {
      if (tab === 'open') return ['New', 'Assigned', 'InProgress'].includes(r.status)
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
  }, [tab, requests, search, categoryFilter])

  const openCount = requests.filter((r) => ['New', 'Assigned', 'InProgress'].includes(r.status)).length
  const completedCount = requests.filter((r) => r.status === 'Completed').length
  const cancelledCount = requests.filter((r) => r.status === 'Cancelled').length

  const getServiceLabel = (request) => {
    return String(request.service || '').toUpperCase() === 'IT' ? 'IT Services' : 'Facilities'
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

      {loading ? (
        <p className="mr-empty">Loading requests...</p>
      ) : filteredRequests.length > 0 ? (
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
