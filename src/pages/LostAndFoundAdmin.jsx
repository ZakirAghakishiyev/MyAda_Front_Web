import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { itemHasEligibleClaimForOwnerNotify } from '../api/lostFoundApi'
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
  const { items, isLoading, error, notifyOwner, confirmReceipt, confirmHandover } = useLostAndFoundAdmin()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [locationFilter, setLocationFilter] = useState('Main Campus')
  const [tableFilter, setTableFilter] = useState('All') // All | Pending | Ready | Completed
  const [verifyModalItem, setVerifyModalItem] = useState(null)
  const [handoverItem, setHandoverItem] = useState(null)
  const [receiptStorageBin, setReceiptStorageBin] = useState('')
  const [receiptCondition, setReceiptCondition] = useState('')
  const [receiptNotes, setReceiptNotes] = useState('')
  const [receiptVerified, setReceiptVerified] = useState(false)
  const [receiptIntakeFile, setReceiptIntakeFile] = useState(null)
  const [handoverStudentName, setHandoverStudentName] = useState('')
  const [handoverStudentId, setHandoverStudentId] = useState('')
  const [handoverVerified, setHandoverVerified] = useState(false)
  const [handoverProofFile, setHandoverProofFile] = useState(null)
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const manualEntryRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const getStatus = (item) => String(item?.adminStatus || 'Pending')

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
    setActionError('')
    setReceiptStorageBin('')
    setReceiptCondition('')
    setReceiptNotes('')
    setReceiptVerified(false)
    setReceiptIntakeFile(null)
    setVerifyModalItem(item)
  }
  const handleVerifyApprove = async () => {
    if (!verifyModalItem || isSubmitting) return
    if (!receiptStorageBin.trim()) {
      setActionError('Office Storage Bin / ID is required.')
      return
    }
    if (!receiptCondition) {
      setActionError('Verified condition is required.')
      return
    }
    if (!receiptVerified) {
      setActionError('Please confirm data accuracy before approval.')
      return
    }
    setActionError('')
    setIsSubmitting(true)
    try {
      await confirmReceipt(verifyModalItem.id, {
        storageBinId: receiptStorageBin.trim(),
        condition: receiptCondition,
        confirmAccuracy: receiptVerified,
        adminNotes: receiptNotes.trim(),
        intakePhotoFile: receiptIntakeFile || undefined,
      })
      await notifyOwner(
        verifyModalItem.id,
        `Your ${verifyModalItem.title || 'item'} has been verified and is ready for pickup at the Lost & Found office.`
      )
      setVerifyModalItem(null)
    } catch (err) {
      setActionError(err?.message || 'Failed to confirm receipt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkDelivered = (item) => {
    setActionError('')
    setHandoverStudentName('')
    setHandoverStudentId('')
    setHandoverVerified(false)
    setHandoverProofFile(null)
    setHandoverItem(item)
  }
  const handleFinalizeDelivery = async () => {
    if (!handoverItem || isSubmitting) return
    if (!handoverStudentName.trim()) {
      setActionError('Student name is required.')
      return
    }
    if (!handoverStudentId.trim()) {
      setActionError('Student ID number is required.')
      return
    }
    if (!handoverVerified) {
      setActionError('Please confirm student ID verification.')
      return
    }
    setActionError('')
    setIsSubmitting(true)
    try {
      await confirmHandover(handoverItem.id, {
        claimantName: handoverStudentName.trim(),
        claimantStudentId: handoverStudentId.trim(),
        studentIdVerified: handoverVerified,
        handoverProofFile: handoverProofFile || undefined,
      })
      setHandoverItem(null)
    } catch (err) {
      setActionError(err?.message || 'Failed to finalize delivery.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNotifyOwner = async (item) => {
    if (!item || isSubmitting) return
    setActionError('')
    setIsSubmitting(true)
    try {
      await notifyOwner(
        item.id,
        `An update is available for your ${item.title || 'item'} report. Please check your Lost & Found dashboard.`
      )
    } catch (err) {
      setActionError(err?.message || 'Failed to notify owner.')
    } finally {
      setIsSubmitting(false)
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
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--purple"><IconBox /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.inOffice}</span>
              <span className="lf-admin-kpi-label">In Office (Received)</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--orange"><IconClock /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.awaitingPickup}</span>
              <span className="lf-admin-kpi-label">Awaiting Pickup</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--green"><IconCheck /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.claimedToday}</span>
              <span className="lf-admin-kpi-label">Claimed Today</span>
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
                    <td>{item.datePosted || (item.postedAt ? new Date(item.postedAt).toLocaleDateString() : '-')}</td>
                    <td>
                      <span className={`lf-admin-status lf-admin-status--${getStatus(item).toLowerCase()}`}>
                        {getStatus(item) === 'Pending' && 'Newly Reported'}
                        {getStatus(item) === 'Received' && 'In Office'}
                        {getStatus(item) === 'Delivered' && 'Completed'}
                      </span>
                    </td>
                    <td>
                      <div className="lf-admin-actions">
                        {getStatus(item) === 'Pending' && (
                          <button
                            type="button"
                            className="lf-admin-action-btn lf-admin-action-btn--blue"
                            onClick={() => handleConfirmReceipt(item)}
                          >
                            Confirm Receipt
                          </button>
                        )}
                        {getStatus(item) === 'Received' && (
                          <>
                            {itemHasEligibleClaimForOwnerNotify(item) ? (
                              <button type="button" className="lf-admin-action-btn lf-admin-action-btn--orange" onClick={() => handleNotifyOwner(item)} disabled={isSubmitting}>
                                Notify Owner
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="lf-admin-action-btn lf-admin-action-btn--green"
                              onClick={() => handleMarkDelivered(item)}
                            >
                              Mark as Delivered
                            </button>
                          </>
                        )}
                        {getStatus(item) === 'Delivered' && (
                          <button type="button" className="lf-admin-action-btn lf-admin-action-btn--gray">
                            Archived
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {isLoading && (
                  <tr>
                    <td colSpan="5">Loading...</td>
                  </tr>
                )}
                {!isLoading && !paginatedItems.length && (
                  <tr>
                    <td colSpan="5">{error || 'No items found.'}</td>
                  </tr>
                )}
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
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="lf-admin-upload-input"
                    onChange={(e) => setReceiptIntakeFile(e.target.files?.[0] || null)}
                  />
                  <IconCamera />
                  <span>Click to upload photo</span>
                  <span className="lf-admin-upload-hint">PNG or JPG — optional intake photo</span>
                </label>
                <label className="lf-admin-field">
                  <span>Office Storage Bin / ID *</span>
                  <input type="text" placeholder="e.g. BIN-402-A" value={receiptStorageBin} onChange={(e) => setReceiptStorageBin(e.target.value)} />
                </label>
                <label className="lf-admin-field">
                  <span>Verified Condition *</span>
                  <select value={receiptCondition} onChange={(e) => setReceiptCondition(e.target.value)}>
                    <option value="">Select condition...</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </label>
                <label className="lf-admin-field">
                  <span>Internal Admin Notes</span>
                  <textarea placeholder="Add any specific identifying markers not mentioned by student..." rows={3} value={receiptNotes} onChange={(e) => setReceiptNotes(e.target.value)} />
                </label>
                <label className="lf-admin-checkbox">
                  <input type="checkbox" checked={receiptVerified} onChange={(e) => setReceiptVerified(e.target.checked)} />
                  <span>Confirm Data Accuracy — I have physically verified the item matches the student report and is now in secure storage.</span>
                </label>
              </div>
            </div>
            <div className="lf-admin-modal-footer">
              {actionError ? <p className="lf-admin-modal-info">{actionError}</p> : null}
              <p className="lf-admin-modal-info"><IconInfo /> Approving this item will automatically notify the student via the university mobile app and email.</p>
              <div>
                <button type="button" className="lf-admin-btn-secondary" onClick={() => setVerifyModalItem(null)}>Cancel</button>
                <button type="button" className="lf-admin-btn-primary" onClick={handleVerifyApprove} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Approve & Notify Student'}</button>
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
                  <input type="text" placeholder="e.g. Alex Johnson" value={handoverStudentName} onChange={(e) => setHandoverStudentName(e.target.value)} />
                </label>
                <label className="lf-admin-field">
                  <span>Student ID Number</span>
                  <input type="text" placeholder="e.g. 202312345" value={handoverStudentId} onChange={(e) => setHandoverStudentId(e.target.value)} />
                </label>
                <label className="lf-admin-checkbox">
                  <input type="checkbox" checked={handoverVerified} onChange={(e) => setHandoverVerified(e.target.checked)} />
                  <span>Student ID Verified Manually — I confirm that I have inspected the physical ID card and the photo matches the claimant.</span>
                </label>
                <div className="lf-admin-signature-zone">
                  <span>Signature area (use mouse or touch)</span>
                  <div className="lf-admin-signature-box" />
                  <a href="#clear">Clear Canvas</a>
                </div>
                <label className="lf-admin-upload-zone">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="lf-admin-upload-input"
                    onChange={(e) => setHandoverProofFile(e.target.files?.[0] || null)}
                  />
                  <IconCamera />
                  <span>Click to upload or drag and drop</span>
                  <span className="lf-admin-upload-hint">PNG or JPG — optional handover proof</span>
                </label>
              </div>
            </div>
            <div className="lf-admin-modal-footer">
              {actionError ? <p className="lf-admin-modal-info">{actionError}</p> : null}
              <button type="button" className="lf-admin-btn-secondary" onClick={() => setHandoverItem(null)}>Cancel</button>
              <button type="button" className="lf-admin-btn-primary" onClick={handleFinalizeDelivery} disabled={isSubmitting}>
                <IconCheck /> {isSubmitting ? 'Submitting...' : 'Finalize Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
