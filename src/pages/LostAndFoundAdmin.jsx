import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLostAndFoundAdmin } from '../contexts/LostAndFoundAdminContext'
import AdminSidebar from '../components/AdminSidebar'
import './LostAndFoundAdmin.css'

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
)
const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconCamera = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
  </svg>
)

export default function LostAndFoundAdmin() {
  const navigate = useNavigate()
  const { items, setItemStatus, updateItem } = useLostAndFoundAdmin()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [locationFilter, setLocationFilter] = useState('Main Campus')
  const [tableFilter, setTableFilter] = useState('All') // All | Pending | Ready | Completed
  const [verifyModalItem, setVerifyModalItem] = useState(null)
  const [handoverItem, setHandoverItem] = useState(null)
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const manualEntryRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    if (!manualEntryOpen) return
    const handleClickOutside = (e) => {
      if (manualEntryRef.current && !manualEntryRef.current.contains(e.target)) {
        setManualEntryOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [manualEntryOpen])

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category))
    return ['All Categories', ...Array.from(set).sort()]
  }, [items])

  const filteredItems = useMemo(() => {
    let list = items
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase()
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.referenceNumber?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      )
    }
    if (categoryFilter !== 'All Categories') list = list.filter((i) => i.category === categoryFilter)
    if (tableFilter === 'Pending') list = list.filter((i) => i.adminStatus === 'Pending')
    if (tableFilter === 'Ready') list = list.filter((i) => i.adminStatus === 'Received')
    if (tableFilter === 'Completed') list = list.filter((i) => i.adminStatus === 'Delivered')
    return list
  }, [items, searchKeyword, categoryFilter, tableFilter])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage])

  const kpis = useMemo(() => {
    const pending = items.filter((i) => i.adminStatus === 'Pending').length
    const received = items.filter((i) => i.adminStatus === 'Received').length
    const delivered = items.filter((i) => i.adminStatus === 'Delivered').length
    return {
      newlyReported: pending,
      inOffice: received,
      awaitingPickup: received,
      claimedToday: delivered
    }
  }, [items])

  const handleApplyFilters = () => {
    setCurrentPage(1)
  }

  const handleConfirmReceipt = (item) => {
    setVerifyModalItem(item)
  }
  const handleVerifyApprove = () => {
    if (verifyModalItem) {
      setItemStatus(verifyModalItem.id, 'Received')
      setVerifyModalItem(null)
    }
  }

  const handleMarkDelivered = (item) => {
    setHandoverItem(item)
  }
  const handleFinalizeDelivery = () => {
    if (handoverItem) {
      setItemStatus(handoverItem.id, 'Delivered')
      setHandoverItem(null)
    }
  }

  const handleManualEntryLost = () => {
    setManualEntryOpen(false)
    navigate('/lost-and-found-2', { state: { from: 'admin', openReport: 'lost' } })
  }
  const handleManualEntryFound = () => {
    setManualEntryOpen(false)
    navigate('/lost-and-found-2', { state: { from: 'admin', openReport: 'found' } })
  }

  return (
    <div className="lf-admin">
      <AdminSidebar
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        onApplyFilters={handleApplyFilters}
        categories={categories}
      />

      <main className="lf-admin-main">
        <header className="lf-admin-header">
          <div>
            <h1 className="lf-admin-title">Lost &amp; Found: Admin Management Hub</h1>
            <p className="lf-admin-subtitle">University Portal Dashboard</p>
          </div>
          <div className="lf-admin-header-actions">
            <button type="button" className="lf-admin-icon-btn" aria-label="Notifications">
              <IconBell />
            </button>
            <div className="lf-admin-manual-entry-wrap" ref={manualEntryRef}>
              <button
                type="button"
                className="lf-admin-btn-primary"
                onClick={() => setManualEntryOpen((v) => !v)}
                aria-expanded={manualEntryOpen}
                aria-haspopup="true"
              >
                + Manual Entry
              </button>
              {manualEntryOpen && (
                <div className="lf-admin-manual-entry-dropdown" role="menu">
                  <button type="button" className="lf-admin-manual-entry-option" role="menuitem" onClick={handleManualEntryLost}>
                    Report Lost Item
                  </button>
                  <button type="button" className="lf-admin-manual-entry-option" role="menuitem" onClick={handleManualEntryFound}>
                    Report Found Item
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="lf-admin-kpis">
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--blue"><IconInfo /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.newlyReported}</span>
              <span className="lf-admin-kpi-label">Newly Reported</span>
              <span className="lf-admin-kpi-meta">12% from yesterday</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--purple"><IconBox /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.inOffice}</span>
              <span className="lf-admin-kpi-label">In Office (Received)</span>
              <span className="lf-admin-kpi-meta">Inventory stable</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--orange"><IconClock /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.awaitingPickup}</span>
              <span className="lf-admin-kpi-label">Awaiting Pickup</span>
              <span className="lf-admin-kpi-meta">4 pending over 48h</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--green"><IconCheck /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.claimedToday}</span>
              <span className="lf-admin-kpi-label">Claimed Today</span>
              <span className="lf-admin-kpi-meta">Daily record hit</span>
            </div>
          </div>
        </div>

        <section className="lf-admin-table-section">
          <div className="lf-admin-table-header">
            <h2>Active Inventory</h2>
            <div className="lf-admin-table-tabs">
              {['All', 'Pending', 'Ready', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`lf-admin-tab ${tableFilter === tab ? 'lf-admin-tab--active' : ''}`}
                  onClick={() => setTableFilter(tab)}
                >
                  {tab}
                </button>
              ))}
              <button type="button" className="lf-admin-icon-btn" aria-label="Download">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="lf-admin-table-wrap">
            <table className="lf-admin-table">
              <thead>
                <tr>
                  <th>ITEM DETAILS</th>
                  <th>CATEGORY</th>
                  <th>DATE REPORTED</th>
                  <th>STATUS</th>
                  <th>QUICK ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        type="button"
                        className="lf-admin-cell-item lf-admin-cell-item--link"
                        onClick={() => navigate(`/admin/lost-and-found/item/${item.id}`)}
                      >
                        <div className="lf-admin-cell-thumb">
                          {item.image ? <img src={item.image} alt="" /> : <span />}
                        </div>
                        <div>
                          <div className="lf-admin-cell-title">{item.title}</div>
                          <div className="lf-admin-cell-id">ID: {item.referenceNumber}</div>
                        </div>
                      </button>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.datePosted}</td>
                    <td>
                      <span className={`lf-admin-status lf-admin-status--${item.adminStatus.toLowerCase()}`}>
                        {item.adminStatus === 'Pending' && 'Newly Reported'}
                        {item.adminStatus === 'Received' && 'In Office'}
                        {item.adminStatus === 'Delivered' && 'Completed'}
                      </span>
                    </td>
                    <td>
                      <div className="lf-admin-actions">
                        {item.adminStatus === 'Pending' && (
                          <button
                            type="button"
                            className="lf-admin-action-btn lf-admin-action-btn--blue"
                            onClick={() => handleConfirmReceipt(item)}
                          >
                            Confirm Receipt
                          </button>
                        )}
                        {item.adminStatus === 'Received' && (
                          <>
                            <button type="button" className="lf-admin-action-btn lf-admin-action-btn--orange">
                              Notify Owner
                            </button>
                            <button
                              type="button"
                              className="lf-admin-action-btn lf-admin-action-btn--green"
                              onClick={() => handleMarkDelivered(item)}
                            >
                              Mark as Delivered
                            </button>
                          </>
                        )}
                        {item.adminStatus === 'Delivered' && (
                          <button type="button" className="lf-admin-action-btn lf-admin-action-btn--gray">
                            Archived
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="lf-admin-table-footer">
            <span>Showing {paginatedItems.length} of {filteredItems.length} active items</span>
            <div className="lf-admin-pagination">
              <button
                type="button"
                className="lf-admin-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`lf-admin-page-btn ${currentPage === p ? 'lf-admin-page-btn--active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="lf-admin-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </footer>
        </section>

        <footer className="lf-admin-footer">
          <span>© 2023 University Inventory Systems. All rights reserved.</span>
          <div>
            <a href="#privacy">Privacy Policy</a>
            <a href="#status">System Status</a>
            <a href="#help">Help Center</a>
          </div>
        </footer>
      </main>

      {/* Verify Item Receipt modal (Pending → Received) */}
      {verifyModalItem && (
        <div
          className="lf-admin-modal-overlay"
          onClick={() => setVerifyModalItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-receipt-title"
        >
          <div className="lf-admin-modal lf-admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="lf-admin-modal-header">
              <h2 id="verify-receipt-title">Verify Item Receipt</h2>
              <span className="lf-admin-modal-badge lf-admin-modal-badge--pending">PENDING VERIFICATION</span>
              <span className="lf-admin-modal-tracking">Tracking ID: #{verifyModalItem.referenceNumber?.replace('LF-', '') || verifyModalItem.id}</span>
              <button type="button" className="lf-admin-modal-close" onClick={() => setVerifyModalItem(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="lf-admin-verify-grid">
              <div className="lf-admin-verify-section">
                <h3>STUDENT-REPORTED INFO</h3>
                <div className="lf-admin-verify-photo">
                  {verifyModalItem.image ? <img src={verifyModalItem.image} alt="" /> : <div className="lf-admin-verify-photo-placeholder" />}
                </div>
                <dl className="lf-admin-verify-dl">
                  <dt>ITEM CATEGORY</dt>
                  <dd>{verifyModalItem.category}</dd>
                  <dt>REPORTED COLOR</dt>
                  <dd>—</dd>
                  <dt>BRAND/MODEL</dt>
                  <dd>{verifyModalItem.title}</dd>
                  <dt>DATE FOUND</dt>
                  <dd>{verifyModalItem.datePosted}</dd>
                </dl>
                <div className="lf-admin-verify-desc">
                  <strong>Student Description</strong>
                  <p>{verifyModalItem.description}</p>
                </div>
              </div>
              <div className="lf-admin-verify-section">
                <h3>STAFF INTAKE FORM</h3>
                <label className="lf-admin-upload-zone">
                  <input type="file" accept="image/*" className="lf-admin-upload-input" />
                  <IconCamera />
                  <span>Click to upload photo</span>
                  <span className="lf-admin-upload-hint">Clear shot of serial number or identifying marks. *</span>
                </label>
                <label className="lf-admin-field">
                  <span>Office Storage Bin / ID *</span>
                  <input type="text" placeholder="e.g. BIN-402-A" />
                </label>
                <label className="lf-admin-field">
                  <span>Verified Condition *</span>
                  <select>
                    <option value="">Select condition...</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </label>
                <label className="lf-admin-field">
                  <span>Internal Admin Notes</span>
                  <textarea placeholder="Add any specific identifying markers not mentioned by student..." rows={3} />
                </label>
                <label className="lf-admin-checkbox">
                  <input type="checkbox" />
                  <span>Confirm Data Accuracy — I have physically verified the item matches the student report and is now in secure storage.</span>
                </label>
              </div>
            </div>
            <div className="lf-admin-modal-footer">
              <p className="lf-admin-modal-info"><IconInfo /> Approving this item will automatically notify the student via the university mobile app and email.</p>
              <div>
                <button type="button" className="lf-admin-btn-secondary" onClick={() => setVerifyModalItem(null)}>Cancel</button>
                <button type="button" className="lf-admin-btn-primary" onClick={handleVerifyApprove}>Approve &amp; Notify Student</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handover / Finalize Delivery modal (Received → Delivered) */}
      {handoverItem && (
        <div
          className="lf-admin-modal-overlay"
          onClick={() => setHandoverItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="handover-title"
        >
          <div className="lf-admin-modal lf-admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="lf-admin-modal-header">
              <h2 id="handover-title">Handover: {handoverItem.title}</h2>
              <span className="lf-admin-modal-badge lf-admin-modal-badge--ready">Ready for Pickup</span>
              <span className="lf-admin-modal-tracking">Found {handoverItem.datePosted} · ID: {handoverItem.referenceNumber}</span>
              <button type="button" className="lf-admin-modal-close" onClick={() => setHandoverItem(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="lf-admin-verify-grid">
              <div className="lf-admin-verify-section">
                <h3>Item Details</h3>
                <div className="lf-admin-verify-photo">
                  {handoverItem.image ? <img src={handoverItem.image} alt="" /> : <div className="lf-admin-verify-photo-placeholder" />}
                </div>
                <p><strong>Category:</strong> {handoverItem.category}</p>
                <p><strong>Location Found:</strong> {handoverItem.location}</p>
                <p>{handoverItem.description}</p>
                <div className="lf-admin-protocol">
                  <IconInfo />
                  <p>Please ensure the student provides a valid University ID card and correctly describes a unique feature of the item before finalizing.</p>
                </div>
              </div>
              <div className="lf-admin-verify-section">
                <h3>Claimant Verification</h3>
                <label className="lf-admin-field">
                  <span>Student Name</span>
                  <input type="text" placeholder="e.g. Alex Johnson" />
                </label>
                <label className="lf-admin-field">
                  <span>Student ID Number</span>
                  <input type="text" placeholder="e.g. 202312345" />
                </label>
                <label className="lf-admin-checkbox">
                  <input type="checkbox" />
                  <span>Student ID Verified Manually — I confirm that I have inspected the physical ID card and the photo matches the claimant.</span>
                </label>
                <div className="lf-admin-signature-zone">
                  <span>Signature area (use mouse or touch)</span>
                  <div className="lf-admin-signature-box" />
                  <a href="#clear">Clear Canvas</a>
                </div>
                <label className="lf-admin-upload-zone">
                  <input type="file" accept="image/*" className="lf-admin-upload-input" />
                  <IconCamera />
                  <span>Click to upload or drag and drop</span>
                  <span className="lf-admin-upload-hint">Capture the handover moment or receipt.</span>
                </label>
              </div>
            </div>
            <div className="lf-admin-modal-footer">
              <button type="button" className="lf-admin-btn-secondary" onClick={() => setHandoverItem(null)}>Cancel</button>
              <button type="button" className="lf-admin-btn-primary" onClick={handleFinalizeDelivery}>
                <IconCheck /> Finalize Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
