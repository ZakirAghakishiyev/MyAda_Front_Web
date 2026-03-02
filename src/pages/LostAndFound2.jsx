import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { mockItems } from '../data/lostAndFoundItems'
import './LostAndFound2.css'

const STEPS = ['Info', 'Location', 'Time', 'Details', 'Photos', 'Contact']
const CATEGORIES = ['All Items', 'Electronics', 'Documents', 'Personal Items', 'Accessories']
const ITEMS_PER_PAGE = 8
const MAX_DESCRIPTION_LENGTH = 500

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
)
const IconFound = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
)
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)
const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
)
const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
)
const IconCloud = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)
const IconBulb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
)

const LostAndFound2 = ({ initialReport, fromAdmin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState('dashboard') // 'dashboard' | 'report-lost' | 'report-found'

  useEffect(() => {
    const openReport = initialReport || location.state?.openReport
    if (openReport === 'lost') setView('report-lost')
    else if (openReport === 'found') setView('report-found')
  }, [initialReport, location.state?.openReport])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Items')
  const [currentPage, setCurrentPage] = useState(1)

  // Report form state (shared structure for lost/found)
  const [reportStep, setReportStep] = useState(0)
  const [reportForm, setReportForm] = useState({
    itemName: '',
    category: 'Electronics',
    building: '',
    floor: '',
    roomArea: '',
    description: '',
    photos: []
  })

  const totalCount = mockItems.length
  const activeCount = mockItems.filter(i => i.status === 'Active').length
  const pendingCount = mockItems.filter(i => i.status.toLowerCase().includes('pending')).length

  const categoryMap = {
    'Documents': 'Documents',
    'Electronics': 'Electronics',
    'Clothing': 'Personal Items',
    'Other': 'Accessories'
  }

  const filteredItems = useMemo(() => {
    let items = mockItems.map(item => ({
      ...item,
      displayCategory: categoryMap[item.category] || item.category
    }))
    if (categoryFilter !== 'All Items') {
      items = items.filter(item => item.displayCategory === categoryFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      items = items.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.displayCategory && item.displayCategory.toLowerCase().includes(q))
      )
    }
    return items
  }, [searchQuery, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredItems, currentPage])

  const openReportLost = () => setView('report-lost')
  const openReportFound = () => setView('report-found')
  const backToDashboard = () => {
    if (fromAdmin || location.state?.from === 'admin') {
      navigate('/admin/lost-and-found')
      return
    }
    setView('dashboard')
    setReportStep(0)
    setReportForm({
      itemName: '',
      category: 'Electronics',
      building: '',
      floor: '',
      roomArea: '',
      description: '',
      photos: []
    })
  }

  const handleReportSubmit = (e) => {
    e.preventDefault()
    if (view === 'report-lost') {
      alert('Lost item report submitted for review (mock).')
    } else {
      alert('Found item report submitted for review (mock).')
    }
    if (fromAdmin || location.state?.from === 'admin') {
      navigate('/admin/lost-and-found')
      return
    }
    backToDashboard()
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setReportForm(prev => ({ ...prev, photos: [...prev.photos, ...files] }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
    setReportForm(prev => ({ ...prev, photos: [...prev.photos, ...files] }))
  }
  const handleDragOver = (e) => e.preventDefault()

  const isReportOpen = view === 'report-lost' || view === 'report-found'
  const reportTitle = view === 'report-lost' ? 'Report a Lost Item' : 'Report a Found Item'
  const reportSubtitle = view === 'report-lost'
    ? 'Provide details about your lost item to help the community return it to you.'
    : 'Provide details about the item you found to help reunite it with its owner.'

  const reportPopup = isReportOpen && (
    <div
      className="lf2-report-overlay"
      onClick={(e) => e.target === e.currentTarget && backToDashboard()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lf2-report-popup-title"
    >
      <div className="lf2-report-popup" onClick={(e) => e.stopPropagation()}>
        <header className="lf2-report-header">
          <button type="button" className="lf2-back-btn" onClick={backToDashboard} aria-label="Back">
            <span>‹</span>
          </button>
          <div className="lf2-report-header-center">
            <h1 id="lf2-report-popup-title">{reportTitle}</h1>
            <p className="lf2-report-subtitle">{reportSubtitle}</p>
          </div>
          <div className="lf2-report-header-spacer" />
        </header>

        <div className="lf2-stepper">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`lf2-step ${i === reportStep ? 'lf2-step--active' : ''} ${i < reportStep ? 'lf2-step--done' : ''}`}>
                <span className="lf2-step-num">{i + 1}</span>
                <span className="lf2-step-label">{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="lf2-step-line" />}
            </React.Fragment>
          ))}
        </div>

        <form className="lf2-form" onSubmit={handleReportSubmit}>
          <div className="lf2-form-card">
            {reportStep === 0 && (
              <>
                <section className="lf2-section">
                  <h2 className="lf2-section-title">
                    <span className="lf2-section-icon lf2-section-icon--info"><IconInfo /></span>
                    Basic Information
                  </h2>
                  <p className="lf2-section-desc">General details to help categorize your item.</p>
                  <div className="lf2-fields">
                    <label className="lf2-field">
                      <span className="lf2-label">Item Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Silver MacBook Pro"
                        value={reportForm.itemName}
                        onChange={e => setReportForm(f => ({ ...f, itemName: e.target.value }))}
                      />
                    </label>
                    <label className="lf2-field">
                      <span className="lf2-label">Category *</span>
                      <select
                        value={reportForm.category}
                        onChange={e => setReportForm(f => ({ ...f, category: e.target.value }))}
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Documents">Documents</option>
                        <option value="Personal Items">Personal Items</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className="lf2-section">
                  <h2 className="lf2-section-title">
                    <span className="lf2-section-icon"><IconPin /></span>
                    Location
                    {view === 'report-found' && <span className="lf2-required-hint"> *</span>}
                    {view === 'report-lost' && <span className="lf2-optional-hint"> (optional)</span>}
                  </h2>
                  <div className="lf2-fields">
                    <label className="lf2-field">
                      <span className="lf2-label">Building{view === 'report-found' ? ' *' : ''}</span>
                      <input
                        type="text"
                        required={view === 'report-found'}
                        placeholder={view === 'report-found' ? 'Select building...' : 'Select building... (optional)'}
                        value={reportForm.building}
                        onChange={e => setReportForm(f => ({ ...f, building: e.target.value }))}
                      />
                    </label>
                    <label className="lf2-field">
                      <span className="lf2-label">Floor{view === 'report-found' ? ' *' : ''}</span>
                      <input
                        type="text"
                        required={view === 'report-found'}
                        placeholder={view === 'report-found' ? 'e.g. 2nd Floor' : 'e.g. 2nd Floor (optional)'}
                        value={reportForm.floor}
                        onChange={e => setReportForm(f => ({ ...f, floor: e.target.value }))}
                      />
                    </label>
                    <label className="lf2-field">
                      <span className="lf2-label">Room/Area{view === 'report-found' ? ' *' : ''}</span>
                      <input
                        type="text"
                        required={view === 'report-found'}
                        placeholder={view === 'report-found' ? 'Room 302' : 'Room 302 (optional)'}
                        value={reportForm.roomArea}
                        onChange={e => setReportForm(f => ({ ...f, roomArea: e.target.value }))}
                      />
                    </label>
                  </div>
                </section>

                <section className="lf2-section">
                  <h2 className="lf2-section-title">
                    <span className="lf2-section-icon lf2-section-icon--info"><IconInfo /></span>
                    Description
                  </h2>
                  <p className="lf2-section-desc">Describe the item to help identify it.</p>
                  <div className="lf2-fields">
                    <label className="lf2-field">
                      <span className="lf2-label">Description</span>
                      <textarea
                        rows={4}
                        placeholder="Describe the item..."
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        value={reportForm.description}
                        onChange={e => setReportForm(f => ({ ...f, description: e.target.value.slice(0, MAX_DESCRIPTION_LENGTH) }))}
                      />
                      <span className="lf2-char-count">{reportForm.description.length}/{MAX_DESCRIPTION_LENGTH}</span>
                    </label>
                  </div>
                </section>

                <section className="lf2-section">
                  <h2 className="lf2-section-title">
                    <span className="lf2-section-icon"><IconCamera /></span>
                    Photos
                    {view === 'report-found' && <span className="lf2-required-hint"> *</span>}
                    {view === 'report-lost' && <span className="lf2-optional-hint"> (optional)</span>}
                  </h2>
                  <label
                    className="lf2-dropzone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      multiple
                      required={view === 'report-found'}
                      onChange={handlePhotoChange}
                      className="lf2-dropzone-input"
                    />
                    <IconCloud />
                    <span>Drag and drop images here</span>
                    <span className="lf2-dropzone-hint">PNG, JPG up to 10MB</span>
                    {reportForm.photos.length > 0 && (
                      <span className="lf2-dropzone-count">{reportForm.photos.length} file(s) selected</span>
                    )}
                  </label>
                </section>
              </>
            )}

            {reportStep > 0 && (
              <section className="lf2-section">
                <p className="lf2-placeholder-step">Step {reportStep + 1} – More fields can be added here (Time, Details, Contact).</p>
              </section>
            )}

            <div className="lf2-form-actions">
              <button type="button" className="lf2-btn lf2-btn--back" onClick={reportStep === 0 ? backToDashboard : () => setReportStep(s => s - 1)}>
                <span>‹</span> Back
              </button>
              <button type="button" className="lf2-btn lf2-btn--draft">
                Save as Draft
              </button>
              {reportStep < STEPS.length - 1 ? (
                <button type="button" className="lf2-btn lf2-btn--primary" onClick={() => setReportStep(s => s + 1)}>
                  Next Step <span>→</span>
                </button>
              ) : (
                <button type="submit" className="lf2-btn lf2-btn--primary">
                  Submit
                </button>
              )}
            </div>
          </div>

          <div className="lf2-protip">
            <IconBulb />
            <div>
              <strong>Pro Tip</strong>
              <p>Be as specific as possible. Mention unique stickers, scratches, or accessories to help us verify ownership more quickly.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  if ((fromAdmin || location.state?.from === 'admin') && isReportOpen) {
    return reportPopup
  }

  return (
    <div className="lf2-page">
      {reportPopup}
      <header className="lf2-header">
        <button type="button" className="lf2-icon-btn" onClick={() => navigate('/')} aria-label="Back to Home">
          <span>‹</span>
        </button>
        <div className="lf2-logo-wrap">
          <div className="lf2-logo" aria-hidden="true" />
          <div className="lf2-header-titles">
            <h1>Lost &amp; Found - ADA University Campus</h1>
            <span className="lf2-subtitle">Manage and track items within the campus</span>
          </div>
        </div>
        <div className="lf2-header-actions">
          <button type="button" className="lf2-report-btn lf2-report-btn--lost" onClick={openReportLost}>
            <IconSearch />
            Report Lost Item
          </button>
          <button type="button" className="lf2-report-btn lf2-report-btn--found" onClick={openReportFound}>
            <IconFound />
            Report Found Item
          </button>
        </div>
      </header>

      <div className="lf2-stats">
        <div className="lf2-stat-card">
          <div className="lf2-stat-icon lf2-stat-icon--stack">📄</div>
          <div className="lf2-stat-content">
            <span className="lf2-stat-label">TOTAL ITEMS</span>
            <span className="lf2-stat-value">{totalCount.toLocaleString()}</span>
          </div>
        </div>
        <div className="lf2-stat-card">
          <div className="lf2-stat-icon lf2-stat-icon--active"><IconFound /></div>
          <div className="lf2-stat-content">
            <span className="lf2-stat-label">ACTIVE ITEMS</span>
            <span className="lf2-stat-value">{activeCount.toLocaleString()}</span>
          </div>
        </div>
        <div className="lf2-stat-card">
          <div className="lf2-stat-icon lf2-stat-icon--pending"><IconSearch /></div>
          <div className="lf2-stat-content">
            <span className="lf2-stat-label">PENDING VERIFICATION</span>
            <span className="lf2-stat-value">{pendingCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="lf2-search-wrap">
        <span className="lf2-search-icon"><IconSearch /></span>
        <input
          type="text"
          className="lf2-search-input"
          placeholder="Search by item name, location, or description..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search items"
        />
      </div>

      <div className="lf2-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            className={`lf2-cat-pill ${categoryFilter === cat ? 'lf2-cat-pill--active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="lf2-grid">
        {paginatedItems.map(item => (
          <article
            key={item.id}
            className="lf2-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/lost-and-found/item/${item.id}`)}
            onKeyDown={e => e.key === 'Enter' && navigate(`/lost-and-found/item/${item.id}`)}
          >
            <span className={`lf2-card-status lf2-card-status--${item.status === 'Active' ? 'active' : 'pending'}`}>
              {item.status === 'Active' ? 'ACTIVE' : 'PENDING'}
            </span>
            <div className="lf2-card-image">
              {item.image ? (
                <img src={item.image} alt="" />
              ) : null}
            </div>
            <div className="lf2-card-body">
              <div className="lf2-card-title-row">
                <h2 className="lf2-card-title">{item.title}</h2>
                <span className="lf2-card-time">{item.daysAgo} {item.daysAgo === 1 ? 'day' : 'days'} ago</span>
              </div>
              <div className="lf2-card-location">
                <IconPin />
                <span>{item.location}</span>
              </div>
              <span className="lf2-card-category">{item.displayCategory || item.category}</span>
              <p className="lf2-card-desc">{item.description}</p>
            </div>
          </article>
        ))}
      </div>

      <footer className="lf2-footer">
        <span className="lf2-footer-count">
          Showing {paginatedItems.length} of {filteredItems.length} active items
        </span>
        <div className="lf2-pagination">
          <button
            type="button"
            className="lf2-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : currentPage - 2 + i)
            if (page > totalPages) return null
            return (
              <button
                key={page}
                type="button"
                className={`lf2-page-btn lf2-page-num ${currentPage === page ? 'lf2-page-num--active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          })}
          {totalPages > 5 && <span className="lf2-page-ellipsis">…</span>}
          {totalPages > 5 && (
            <button
              type="button"
              className={`lf2-page-btn lf2-page-num ${currentPage === totalPages ? 'lf2-page-num--active' : ''}`}
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </button>
          )}
          <button
            type="button"
            className="lf2-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </footer>
    </div>
  )
}

export default LostAndFound2
