import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockItems } from '../data/lostAndFoundItems'
import './LostAndFound.css'

const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const LostAndFoundList = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('total') // 'total' | 'active' | 'pending'

  const filteredItems = useMemo(() => {
    let items = mockItems

    if (statusFilter === 'active') {
      items = items.filter(item => item.status === 'Active')
    } else if (statusFilter === 'pending') {
      items = items.filter(item => item.status.toLowerCase().includes('pending'))
    }

    if (!searchQuery.trim()) return items

    const q = searchQuery.trim().toLowerCase()
    return items.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [searchQuery, statusFilter])

  const totalCount = mockItems.length
  const activeCount = mockItems.filter(item => item.status === 'Active').length
  const pendingCount = mockItems.filter(item => item.status.toLowerCase().includes('pending')).length

  return (
    <div className="lf-page lf-list-page">
      <header className="lf-list-header">
        <button type="button" className="lf-icon-button" onClick={() => navigate('/')} aria-label="Back to Home">
          <span className="lf-back-arrow">‹</span>
        </button>
        <div className="lf-list-header-title">
          <h1>Lost &amp; Found</h1>
          <span className="lf-subtitle">ADA University Campus</span>
        </div>
      </header>

      <div className="lf-list-actions">
        <button
          type="button"
          className="lf-announce-btn"
          onClick={() => navigate('/lost-and-found/announce-lost', { state: { from: 'lost-and-found' } })}
        >
          Report Lost Item
        </button>
        <button
          type="button"
          className="lf-announce-btn lf-announce-btn--primary"
          onClick={() => navigate('/lost-and-found/announce-found', { state: { from: 'lost-and-found' } })}
        >
          Report Found Item
        </button>
      </div>

      <div className="lf-tabs">
        <button
          type="button"
          className={`lf-tab lf-tab--total ${statusFilter === 'total' ? 'lf-tab--selected' : ''}`}
          onClick={() => setStatusFilter('total')}
        >
          <span>Total</span>
          <span className="lf-tab-count">{totalCount}</span>
        </button>
        <button
          type="button"
          className={`lf-tab lf-tab--active ${statusFilter === 'active' ? 'lf-tab--selected' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <span>Active</span>
          <span className="lf-tab-count">{activeCount}</span>
        </button>
        <button
          type="button"
          className={`lf-tab lf-tab--pending ${statusFilter === 'pending' ? 'lf-tab--selected' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <span>Pending</span>
          <span className="lf-tab-count">{pendingCount}</span>
        </button>
      </div>

      <div className="lf-search-bar">
        <input
          type="text"
          placeholder="Search by item, location, or description"
          className="lf-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search items"
        />
      </div>

      <div className="lf-list">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <article
              key={item.id}
              className="lf-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/lost-and-found/item/${item.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/lost-and-found/item/${item.id}`)}
            >
              <div className="lf-card-image-placeholder" />
              <div className="lf-card-body">
                <div className="lf-card-header-row">
                  <h2 className="lf-card-title">{item.title}</h2>
                  <span className="lf-chevron">›</span>
                </div>
                <div className="lf-card-meta">
                  <div className="lf-meta-row">
                    <span className="lf-meta-icon lf-meta-icon--svg"><IconPin /></span>
                    <span className="lf-meta-text">{item.location}</span>
                  </div>
                  <div className="lf-meta-row">
                    <span className="lf-meta-icon lf-meta-icon--svg"><IconFolder /></span>
                    <span className="lf-meta-text">{item.category}</span>
                  </div>
                </div>
                <div className="lf-card-status-row">
                  <span className={`lf-status-badge lf-status-badge--${item.status === 'Active' ? 'active' : 'pending'}`}>
                    {item.status}
                  </span>
                  <span className="lf-days-ago">
                    <span className="lf-meta-icon lf-meta-icon--svg"><IconCalendar /></span>
                    {item.daysAgo} days ago
                  </span>
                </div>
                <p className="lf-description">{item.description}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="lf-list-empty">No items match your search.</p>
        )}
      </div>
    </div>
  )
}

export default LostAndFoundList
