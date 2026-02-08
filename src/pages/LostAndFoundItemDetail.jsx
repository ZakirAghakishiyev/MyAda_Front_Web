import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getItemById } from '../data/lostAndFoundItems'
import './LostAndFound.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconBookmark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const IconShare = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.82 3.98M15.41 6.51l-6.82 3.98" />
  </svg>
)
const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconReport = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const LostAndFoundItemDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const item = getItemById(id)

  if (!item) {
    return (
      <div className="lf-detail-overlay" onClick={() => navigate(-1)} role="dialog" aria-modal="true">
        <div className="lf-detail-popup" onClick={(e) => e.stopPropagation()}>
          <p>Item not found.</p>
          <button type="button" className="lf-detail-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    )
  }

  const formatDate = (daysAgo) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div
      className="lf-detail-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lf-detail-title"
    >
      <div className="lf-detail-popup" onClick={(e) => e.stopPropagation()}>
        <header className="lf-detail-header">
          <button type="button" className="lf-detail-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <IconBack />
          </button>
          <div className="lf-detail-header-actions">
            <button type="button" className="lf-detail-icon-btn" aria-label="Bookmark">
              <IconBookmark />
            </button>
            <button type="button" className="lf-detail-icon-btn" aria-label="Share">
              <IconShare />
            </button>
          </div>
        </header>

        <div className="lf-detail-image-wrap">
          <div className="lf-detail-image" />
        </div>

        <div className="lf-detail-main">
          <span className="lf-detail-category">{item.category.toUpperCase()}</span>
          <h1 id="lf-detail-title" className="lf-detail-title">{item.title}</h1>
          <div className="lf-detail-meta">
            <span className="lf-detail-meta-row">
              <IconPin />
              <span>{item.location}</span>
            </span>
            <span className="lf-detail-meta-row">
              <IconCalendar />
              <span>{formatDate(item.daysAgo)}</span>
            </span>
          </div>

          <section className="lf-detail-card">
            <h2 className="lf-detail-card-title">Description</h2>
            <p className="lf-detail-card-text">{item.description}</p>
          </section>

          <section className="lf-detail-card">
            <h2 className="lf-detail-card-title">Item Details</h2>
            <dl className="lf-detail-dl">
              <div className="lf-detail-dl-row">
                <dt>Category</dt>
                <dd>{item.category}</dd>
              </div>
              <div className="lf-detail-dl-row">
                <dt>Status</dt>
                <dd>{item.status}</dd>
              </div>
              <div className="lf-detail-dl-row">
                <dt>Reference #</dt>
                <dd>{item.referenceNumber}</dd>
              </div>
              <div className="lf-detail-dl-row">
                <dt>Date Posted</dt>
                <dd>{item.datePosted}</dd>
              </div>
            </dl>
          </section>

          <section className="lf-detail-card">
            <h2 className="lf-detail-card-title">Timeline</h2>
            <ul className="lf-detail-timeline">
              <li className="lf-detail-timeline-item lf-detail-timeline-item--done">
                <span className="lf-detail-timeline-dot" aria-hidden="true"><IconCheck /></span>
                <span>Item verified by staff</span>
              </li>
              <li className="lf-detail-timeline-item">
                <span className="lf-detail-timeline-dot lf-detail-timeline-dot--outline" aria-hidden="true" />
                <span>Item reported and submitted</span>
              </li>
              <li className="lf-detail-timeline-item">
                <span className="lf-detail-timeline-dot lf-detail-timeline-dot--outline" aria-hidden="true" />
                <span>Item found at {item.location}</span>
              </li>
            </ul>
          </section>

          <section className="lf-detail-actions">
            <h2 className="lf-detail-actions-title">Actions</h2>
            <div className="lf-detail-actions-btns">
              <button type="button" className="lf-detail-btn lf-detail-btn--contact">
                Contact Office
              </button>
              <button type="button" className="lf-detail-btn lf-detail-btn--mine">
                This is Mine
              </button>
            </div>
            <button type="button" className="lf-detail-report">
              <IconReport />
              <span>Report Issue</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

export default LostAndFoundItemDetail
