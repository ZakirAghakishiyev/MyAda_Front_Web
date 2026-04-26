import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLostFoundAdminWorkflowPhase, itemHasEligibleClaimForOwnerNotify } from '../api/lostFoundApi'
import { useLostAndFoundAdmin } from '../contexts/LostAndFoundAdminContext'
import './LostAndFound.css'
import './LostAndFoundAdmin.css'

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
const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
)
const IconCamera = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
  </svg>
)

export default function LostAndFoundAdminItemDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { items, isLoading, notifyOwner, confirmReceipt, confirmHandover } = useLostAndFoundAdmin()
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [handoverModalOpen, setHandoverModalOpen] = useState(false)
  const [receiptStorageBin, setReceiptStorageBin] = useState('')
  const [receiptCondition, setReceiptCondition] = useState('')
  const [receiptVerified, setReceiptVerified] = useState(false)
  const [receiptIntakeFile, setReceiptIntakeFile] = useState(null)
  const [handoverStudentName, setHandoverStudentName] = useState('')
  const [handoverStudentId, setHandoverStudentId] = useState('')
  const [handoverVerified, setHandoverVerified] = useState(false)
  const [handoverProofFile, setHandoverProofFile] = useState(null)
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const item = items.find((i) => String(i.id) === String(id))
  const displayImage = useMemo(() => item?.image || item?.images?.[0] || null, [item])

  if (isLoading && !item) {
    return (
      <div className="lf-admin-detail-overlay" onClick={() => navigate('/admin/lost-and-found')} role="dialog" aria-modal="true">
        <div className="lf-detail-popup lf-detail-popup--admin" onClick={(e) => e.stopPropagation()}>
          <p>Loading item...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="lf-admin-detail-overlay" onClick={() => navigate('/admin/lost-and-found')} role="dialog" aria-modal="true">
        <div className="lf-detail-popup lf-detail-popup--admin" onClick={(e) => e.stopPropagation()}>
          <p>Item not found.</p>
          <button type="button" className="lf-detail-btn lf-detail-btn--admin-archived" onClick={() => navigate('/admin/lost-and-found')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const workflow = getLostFoundAdminWorkflowPhase(item)
  const statusLabel =
    workflow === 'pending' ? 'Newly Reported' : workflow === 'received' ? 'In Office' : 'Completed'

  const handleVerifyApprove = async () => {
    if (isSubmitting) return
    if (!receiptStorageBin.trim() || !receiptCondition || !receiptVerified) {
      setActionError('Please fill required receipt fields and confirm data accuracy.')
      return
    }
    setActionError('')
    setIsSubmitting(true)
    try {
      await confirmReceipt(item.id, {
        storageBinId: receiptStorageBin.trim(),
        condition: receiptCondition,
        confirmAccuracy: receiptVerified,
        intakePhotoFile: receiptIntakeFile || undefined,
      })
      await notifyOwner(item.id, `Your ${item.title || 'item'} has been verified and is ready for pickup.`)
      setVerifyModalOpen(false)
    } catch (err) {
      setActionError(err?.message || 'Failed to confirm receipt.')
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleFinalizeDelivery = async () => {
    if (isSubmitting) return
    if (!handoverStudentName.trim() || !handoverStudentId.trim() || !handoverVerified) {
      setActionError('Please complete claimant verification before finalizing.')
      return
    }
    setActionError('')
    setIsSubmitting(true)
    try {
      await confirmHandover(item.id, {
        claimantName: handoverStudentName.trim(),
        claimantStudentId: handoverStudentId.trim(),
        studentIdVerified: handoverVerified,
        handoverProofFile: handoverProofFile || undefined,
      })
      setHandoverModalOpen(false)
    } catch (err) {
      setActionError(err?.message || 'Failed to finalize delivery.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNotifyOwner = async () => {
    if (isSubmitting) return
    setActionError('')
    setIsSubmitting(true)
    try {
      await notifyOwner(item.id, `An update is available for your ${item.title || 'item'} report.`)
    } catch (err) {
      setActionError(err?.message || 'Failed to notify owner.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (daysAgo) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div
      className="lf-admin-detail-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate('/admin/lost-and-found')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lf-detail-title"
    >
      <div className="lf-detail-popup lf-detail-popup--admin" onClick={(e) => e.stopPropagation()}>
        <header className="lf-detail-header">
              <button
                type="button"
                className="lf-detail-icon-btn"
                onClick={() => navigate('/admin/lost-and-found')}
                aria-label="Back to dashboard"
              >
                <IconBack />
              </button>
              <div className="lf-detail-header-actions" />
            </header>

            <div className="lf-detail-main">
              <div className="lf-detail-image-wrap lf-detail-image-wrap--scroll">
                {displayImage ? (
                  <img src={displayImage} alt="" className="lf-detail-image" />
                ) : (
                  <div className="lf-detail-image lf-detail-image-placeholder" />
                )}
              </div>
              <span className="lf-detail-category">
                {item.category.toUpperCase()} · {item.type === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
              </span>
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
                    <dt>Type</dt>
                    <dd>{item.type === 'lost' ? 'Lost item' : 'Found item'}</dd>
                  </div>
                  <div className="lf-detail-dl-row">
                    <dt>Status</dt>
                    <dd>{statusLabel}</dd>
                  </div>
                  <div className="lf-detail-dl-row">
                    <dt>Reference #</dt>
                    <dd>{item.referenceNumber}</dd>
                  </div>
                  <div className="lf-detail-dl-row">
                    <dt>Date Posted</dt>
                    <dd>{item.datePosted || (item.postedAt ? new Date(item.postedAt).toLocaleDateString() : '-')}</dd>
                  </div>
                </dl>
              </section>

              <section className="lf-detail-card">
                <h2 className="lf-detail-card-title">Timeline</h2>
                <ul className="lf-detail-timeline">
                  <li className={`lf-detail-timeline-item ${workflow === 'pending' || workflow === 'received' || workflow === 'delivered' ? 'lf-detail-timeline-item--done' : ''}`}>
                    <span className="lf-detail-timeline-dot" aria-hidden="true"><IconCheck /></span>
                    <span>Report submitted</span>
                  </li>
                  <li className={`lf-detail-timeline-item ${workflow === 'received' || workflow === 'delivered' ? 'lf-detail-timeline-item--done' : ''}`}>
                    <span className="lf-detail-timeline-dot" aria-hidden="true"><IconCheck /></span>
                    <span>Received at Lost &amp; Found office</span>
                  </li>
                  <li className={`lf-detail-timeline-item ${workflow === 'delivered' ? 'lf-detail-timeline-item--done' : ''}`}>
                    <span className="lf-detail-timeline-dot" aria-hidden="true"><IconCheck /></span>
                    <span>Item {workflow === 'delivered' ? 'delivered to claimant' : '— handover pending'}</span>
                  </li>
                </ul>
              </section>

              <section className="lf-detail-actions">
                <h2 className="lf-detail-actions-title">Actions</h2>
                <div className="lf-detail-actions-btns">
                  {workflow === 'pending' && (
                    <button
                      type="button"
                      className="lf-detail-btn lf-detail-btn--admin-confirm"
                      onClick={() => setVerifyModalOpen(true)}
                    >
                      Confirm Receipt
                    </button>
                  )}
                  {workflow === 'received' && (
                    <>
                      {itemHasEligibleClaimForOwnerNotify(item) ? (
                        <button type="button" className="lf-detail-btn lf-detail-btn--admin-notify" onClick={handleNotifyOwner} disabled={isSubmitting}>
                          Notify Owner
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="lf-detail-btn lf-detail-btn--admin-delivered"
                        onClick={() => setHandoverModalOpen(true)}
                      >
                        Mark as Delivered
                      </button>
                    </>
                  )}
                  {workflow === 'delivered' && (
                    <button type="button" className="lf-detail-btn lf-detail-btn--admin-archived" disabled>
                      Archived
                    </button>
                  )}
                </div>
              </section>
            </div>
      </div>

      {/* Verify Receipt modal */}
      {verifyModalOpen && (
        <div
          className="lf-admin-modal-overlay"
          onClick={() => setVerifyModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lf-admin-modal lf-admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="lf-admin-modal-header">
              <h2>Verify Item Receipt</h2>
              <span className="lf-admin-modal-badge lf-admin-modal-badge--pending">PENDING VERIFICATION</span>
              <span className="lf-admin-modal-tracking">Tracking ID: #{item.referenceNumber?.replace('LF-', '') || item.id}</span>
              <button type="button" className="lf-admin-modal-close" onClick={() => setVerifyModalOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="lf-admin-verify-grid">
              <div className="lf-admin-verify-section">
                <h3>STUDENT-REPORTED INFO</h3>
                <div className="lf-admin-verify-photo">
                  {displayImage ? <img src={displayImage} alt="" /> : <div className="lf-admin-verify-photo-placeholder" />}
                </div>
                <dl className="lf-admin-verify-dl">
                  <dt>ITEM CATEGORY</dt>
                  <dd>{item.category}</dd>
                  <dt>BRAND/MODEL</dt>
                  <dd>{item.title}</dd>
                  <dt>DATE FOUND</dt>
                  <dd>{item.datePosted || (item.postedAt ? new Date(item.postedAt).toLocaleDateString() : '-')}</dd>
                </dl>
                <div className="lf-admin-verify-desc">
                  <strong>Student Description</strong>
                  <p>{item.description}</p>
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
                <label className="lf-admin-checkbox">
                  <input type="checkbox" checked={receiptVerified} onChange={(e) => setReceiptVerified(e.target.checked)} />
                  <span>Confirm Data Accuracy — I have physically verified the item matches the student report and is now in secure storage.</span>
                </label>
              </div>
            </div>
            <div className="lf-admin-modal-footer">
              {actionError ? <p className="lf-admin-modal-info">{actionError}</p> : null}
              <p className="lf-admin-modal-info"><IconInfo /> Approving will notify the student via app and email.</p>
              <div>
                <button type="button" className="lf-admin-btn-secondary" onClick={() => setVerifyModalOpen(false)}>Cancel</button>
                <button type="button" className="lf-admin-btn-primary" onClick={handleVerifyApprove} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Approve & Notify Student'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handover modal */}
      {handoverModalOpen && (
        <div
          className="lf-admin-modal-overlay"
          onClick={() => setHandoverModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lf-admin-modal lf-admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="lf-admin-modal-header">
              <h2>Handover: {item.title}</h2>
              <span className="lf-admin-modal-badge lf-admin-modal-badge--ready">Ready for Pickup</span>
              <span className="lf-admin-modal-tracking">ID: {item.referenceNumber}</span>
              <button type="button" className="lf-admin-modal-close" onClick={() => setHandoverModalOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="lf-admin-verify-grid">
              <div className="lf-admin-verify-section">
                <h3>Item Details</h3>
                <div className="lf-admin-verify-photo">
                  {displayImage ? <img src={displayImage} alt="" /> : <div className="lf-admin-verify-photo-placeholder" />}
                </div>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Location Found:</strong> {item.location}</p>
                <p>{item.description}</p>
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
                  <span>Student ID Verified Manually</span>
                </label>
                <label className="lf-admin-upload-zone">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="lf-admin-upload-input"
                    onChange={(e) => setHandoverProofFile(e.target.files?.[0] || null)}
                  />
                  <IconCamera />
                  <span>Handover proof (photo)</span>
                  <span className="lf-admin-upload-hint">PNG or JPG — optional</span>
                </label>
              </div>
            </div>
            <div className="lf-admin-modal-footer">
              {actionError ? <p className="lf-admin-modal-info">{actionError}</p> : null}
              <button type="button" className="lf-admin-btn-secondary" onClick={() => setHandoverModalOpen(false)}>Cancel</button>
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
