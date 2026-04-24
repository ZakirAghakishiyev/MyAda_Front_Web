import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createLostFoundClaim, getLostFoundItemById, getLostFoundTimeline } from '../api/lostFoundApi'
import './LostAndFound.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
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

const LostAndFoundItemDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [itemRes, timelineRes] = await Promise.all([
          getLostFoundItemById(id),
          getLostFoundTimeline(id),
        ])
        if (!isMounted) return
        setItem(itemRes || null)
        setTimeline(Array.isArray(timelineRes) ? timelineRes : [])
      } catch (err) {
        if (!isMounted) return
        setError(err?.message || 'Failed to load item details.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [id])

  const normalizedItem = useMemo(() => {
    if (!item) return null
    return {
      ...item,
      title: item?.title || 'Untitled item',
      description: item?.description || 'No description',
      category: item?.category || 'Other',
      type: item?.type || 'found',
      status:
        (item?.status != null && String(item.status).trim() !== '' && String(item.status).trim()) ||
        (item?.adminStatus != null && String(item.adminStatus).trim() !== '' && String(item.adminStatus).trim()) ||
        'Pending Verification',
      location: item?.location || 'Location not specified',
      image: item?.image || item?.images?.[0] || null,
      referenceNumber: item?.referenceNumber || '-',
      datePosted: item?.datePosted || item?.postedAt || '-',
    }
  }, [item])

  if (isLoading) {
    return (
      <div className="lf-detail-overlay" onClick={() => navigate(-1)} role="dialog" aria-modal="true">
        <div className="lf-detail-popup" onClick={(e) => e.stopPropagation()}>
          <p>Loading item details...</p>
        </div>
      </div>
    )
  }

  if (error || !normalizedItem) {
    return (
      <div className="lf-detail-overlay" onClick={() => navigate(-1)} role="dialog" aria-modal="true">
        <div className="lf-detail-popup" onClick={(e) => e.stopPropagation()}>
          <p>{error || 'Item not found.'}</p>
          <button type="button" className="lf-detail-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    )
  }

  const formatDate = (value) => {
    if (!value) return '-'
    if (typeof value === 'string') {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      return value
    }
    return '-'
  }

  const handleClaim = async () => {
    if (isClaiming || !normalizedItem) return
    const claimType = normalizedItem.type === 'lost' ? 'finder' : 'owner'
    setIsClaiming(true)
    try {
      await createLostFoundClaim(normalizedItem.id, {
        claimType,
        message: '',
      })
      alert('Claim submitted successfully.')
    } catch (err) {
      if (err?.status === 409) {
        alert('You already submitted this claim for this item.')
      } else {
        alert(err?.message || 'Failed to submit claim.')
      }
    } finally {
      setIsClaiming(false)
    }
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
        </header>

        <div className="lf-detail-main">
          <div className="lf-detail-image-wrap lf-detail-image-wrap--scroll">
            {normalizedItem.image ? (
              <img src={normalizedItem.image} alt="" className="lf-detail-image" />
            ) : (
              <div className="lf-detail-image lf-detail-image-placeholder" />
            )}
          </div>
          <span className="lf-detail-category">
            {normalizedItem.category.toUpperCase()} · {normalizedItem.type === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
          </span>
          <h1 id="lf-detail-title" className="lf-detail-title">{normalizedItem.title}</h1>
          <div className="lf-detail-meta">
            <span className="lf-detail-meta-row">
              <IconPin />
              <span>{normalizedItem.location}</span>
            </span>
            <span className="lf-detail-meta-row">
              <IconCalendar />
              <span>{formatDate(normalizedItem.postedAt || normalizedItem.datePosted)}</span>
            </span>
          </div>

          <section className="lf-detail-card">
            <h2 className="lf-detail-card-title">Description</h2>
            <p className="lf-detail-card-text">{normalizedItem.description}</p>
          </section>

          <section className="lf-detail-card">
            <h2 className="lf-detail-card-title">Item Details</h2>
            <dl className="lf-detail-dl">
              <div className="lf-detail-dl-row">
                <dt>Category</dt>
                <dd>{normalizedItem.category}</dd>
              </div>
              <div className="lf-detail-dl-row">
                <dt>Type</dt>
                <dd>{normalizedItem.type === 'lost' ? 'Lost item' : 'Found item'}</dd>
              </div>
              <div className="lf-detail-dl-row">
                <dt>Status</dt>
                <dd>{normalizedItem.status}</dd>
              </div>
              <div className="lf-detail-dl-row">
                <dt>Reference #</dt>
                <dd>{normalizedItem.referenceNumber}</dd>
              </div>
              <div className="lf-detail-dl-row">
                <dt>Date Posted</dt>
                <dd>{formatDate(normalizedItem.postedAt || normalizedItem.datePosted)}</dd>
              </div>
            </dl>
          </section>

          <section className="lf-detail-card">
            <h2 className="lf-detail-card-title">Timeline</h2>
            <ul className="lf-detail-timeline">
              {timeline.length > 0 ? (
                timeline.map((event, index) => (
                  <li key={`${event?.label || 'event'}-${index}`} className={`lf-detail-timeline-item ${event?.done ? 'lf-detail-timeline-item--done' : ''}`}>
                    <span className={`lf-detail-timeline-dot ${event?.done ? '' : 'lf-detail-timeline-dot--outline'}`} aria-hidden="true">
                      {event?.done ? <IconCheck /> : null}
                    </span>
                    <span>{event?.label || 'Update'}</span>
                  </li>
                ))
              ) : (
                <li className="lf-detail-timeline-item">
                  <span className="lf-detail-timeline-dot lf-detail-timeline-dot--outline" aria-hidden="true" />
                  <span>No timeline events yet.</span>
                </li>
              )}
            </ul>
          </section>

          <section className="lf-detail-actions">
            <div className="lf-detail-actions-btns">
              <button type="button" className="lf-detail-btn lf-detail-btn--mine" onClick={handleClaim} disabled={isClaiming}>
                {isClaiming ? 'Submitting...' : normalizedItem.type === 'lost' ? 'Item Found' : 'This Is Mine'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default LostAndFoundItemDetail
