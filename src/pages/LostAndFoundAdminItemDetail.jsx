import React, { useEffect, useMemo, useState } from 'react'
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

function formatDetailDate(item) {
  const raw = item?.postedAt ?? item?.datePosted
  if (raw) {
    const parsed = new Date(String(raw))
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    return String(raw)
  }
  if (typeof item?.daysAgo === 'number') {
    const date = new Date()
    date.setDate(date.getDate() - item.daysAgo)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return '-'
}

function hasClaimToNotify(item, claims) {
  if (itemHasEligibleClaimForOwnerNotify(item)) return true
  if (!Array.isArray(claims) || !item) return false
  const ownerClaims = claims.some((claim) => String(claim?.claimType || '').toLowerCase() === 'owner')
  const finderClaims = claims.some((claim) => String(claim?.claimType || '').toLowerCase() === 'finder')
  const type = String(item?.type || '').toLowerCase()
  if (type === 'found') return ownerClaims
  if (type === 'lost') return finderClaims
  return ownerClaims || finderClaims
}

export default function LostAndFoundAdminItemDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { fetchItemDetail, notifyOwner, confirmReceipt, confirmHandover } = useLostAndFoundAdmin()
  const [item, setItem] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [claims, setClaims] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [handoverModalOpen, setHandoverModalOpen] = useState(false)
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

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError('')
    fetchItemDetail(id)
      .then((result) => {
        if (!isMounted) return
        setItem(result?.item || null)
        setTimeline(Array.isArray(result?.timeline) ? result.timeline : [])
        setClaims(Array.isArray(result?.claims) ? result.claims : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setItem(null)
        setTimeline([])
        setClaims([])
        setError(err?.message || 'Failed to load item.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [fetchItemDetail, id, reloadToken])

  const displayImage = useMemo(() => item?.image || item?.images?.[0] || null, [item])
  const workflow = getLostFoundAdminWorkflowPhase(item)
  const statusLabel =
    workflow === 'pending' ? 'Newly Reported' : workflow === 'received' ? 'In Office' : 'Completed'
  const eligibleForNotify = useMemo(() => hasClaimToNotify(item, claims), [claims, item])

  const reloadDetail = () => {
    setReloadToken((value) => value + 1)
  }

  const resetReceiptModalState = () => {
    setActionError('')
    setReceiptStorageBin('')
    setReceiptCondition('')
    setReceiptNotes('')
    setReceiptVerified(false)
    setReceiptIntakeFile(null)
  }

  const receiptWasPersisted = async (itemId) => {
    try {
      const detail = await fetchItemDetail(itemId)
      return getLostFoundAdminWorkflowPhase(detail?.item) === 'received'
    } catch {
      return false
    }
  }

  if (isLoading && !item) {
    return (
      <div className="lf-admin-detail-overlay" onClick={() => navigate('/admin/lost-and-found')} role="dialog" aria-modal="true">
        <div className="lf-detail-popup lf-detail-popup--admin" onClick={(e) => e.stopPropagation()}>
          <p>Loading item...</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="lf-admin-detail-overlay" onClick={() => navigate('/admin/lost-and-found')} role="dialog" aria-modal="true">
        <div className="lf-detail-popup lf-detail-popup--admin" onClick={(e) => e.stopPropagation()}>
          <p>{error || 'Item not found.'}</p>
          <button type="button" className="lf-detail-btn lf-detail-btn--admin-archived" onClick={() => navigate('/admin/lost-and-found')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleVerifyApprove = async () => {
    if (isSubmitting) return
    if (!receiptCondition) {
      setActionError('Verified condition is required.')
      return
    }
    setActionError('')
    setIsSubmitting(true)
    const trimmedStorageBinId = receiptStorageBin.trim()
    const trimmedAdminNotes = receiptNotes.trim()
    const receiptPayload = {
      storageBinId: trimmedStorageBinId,
      condition: receiptCondition,
      confirmAccuracy: receiptVerified,
      adminNotes: trimmedAdminNotes,
      intakePhotoFile: receiptIntakeFile || undefined,
    }
    try {
      await confirmReceipt(item.id, receiptPayload)
      setVerifyModalOpen(false)
      reloadDetail()
    } catch (err) {
      if (err?.status === 500) {
        if (await receiptWasPersisted(item.id)) {
          resetReceiptModalState()
          setVerifyModalOpen(false)
          reloadDetail()
          return
        }

        const hasOptionalReceiptFields = Boolean(
          trimmedStorageBinId ||
          trimmedAdminNotes ||
          receiptVerified,
        )

        if (hasOptionalReceiptFields) {
          try {
            await confirmReceipt(item.id, {
              condition: receiptCondition,
              intakePhotoFile: receiptIntakeFile || undefined,
            })
            resetReceiptModalState()
            setVerifyModalOpen(false)
            reloadDetail()
            return
          } catch (retryErr) {
            if (await receiptWasPersisted(item.id)) {
              resetReceiptModalState()
              setVerifyModalOpen(false)
              reloadDetail()
              return
            }
            setActionError(retryErr?.message || err?.message || 'Failed to confirm receipt.')
            return
          }
        }
      }
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
      reloadDetail()
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
      reloadDetail()
    } catch (err) {
      setActionError(err?.message || 'Failed to notify owner.')
    } finally {
      setIsSubmitting(false)
    }
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
            {String(item.category || 'Other').toUpperCase()} - {item.type === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
          </span>
          <h1 id="lf-detail-title" className="lf-detail-title">{item.title}</h1>
          <div className="lf-detail-meta">
            <span className="lf-detail-meta-row">
              <IconPin />
              <span>{item.location}</span>
            </span>
            <span className="lf-detail-meta-row">
              <IconCalendar />
              <span>{formatDetailDate(item)}</span>
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
                <dd>{formatDetailDate(item)}</dd>
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

          <section className="lf-detail-card">
            <h2 className="lf-detail-card-title">Claim Requests</h2>
            {claims.length > 0 ? (
              <ul className="lf-detail-timeline">
                {claims.map((claim, index) => (
                  <li key={`${claim?.id || claim?.createdAt || 'claim'}-${index}`} className="lf-detail-timeline-item lf-detail-timeline-item--done">
                    <span className="lf-detail-timeline-dot" aria-hidden="true"><IconCheck /></span>
                    <span>
                      {String(claim?.claimType || 'claim').toUpperCase()}
                      {claim?.message ? `: ${claim.message}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lf-detail-card-text">No claims submitted for this item yet.</p>
            )}
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
                  {eligibleForNotify ? (
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

      {verifyModalOpen && (
        <div
          className="lf-admin-modal-overlay"
          onClick={() => {
            resetReceiptModalState()
            setVerifyModalOpen(false)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="lf-admin-modal lf-admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="lf-admin-modal-header">
              <h2>Verify Item Receipt</h2>
              <span className="lf-admin-modal-badge lf-admin-modal-badge--pending">PENDING VERIFICATION</span>
              <span className="lf-admin-modal-tracking">Tracking ID: #{item.referenceNumber?.replace('LF-', '') || item.id}</span>
              <button
                type="button"
                className="lf-admin-modal-close"
                onClick={() => {
                  resetReceiptModalState()
                  setVerifyModalOpen(false)
                }}
                aria-label="Close"
              >
                x
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
                  <dd>{formatDetailDate(item)}</dd>
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
                  <span className="lf-admin-upload-hint">PNG or JPG - optional intake photo</span>
                </label>
                <label className="lf-admin-field">
                  <span>Office Storage Bin / ID</span>
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
                  <textarea
                    placeholder="Add any specific identifying markers not mentioned by student..."
                    rows={3}
                    value={receiptNotes}
                    onChange={(e) => setReceiptNotes(e.target.value)}
                  />
                </label>
                <label className="lf-admin-checkbox">
                  <input type="checkbox" checked={receiptVerified} onChange={(e) => setReceiptVerified(e.target.checked)} />
                  <span>Confirm Data Accuracy - Optional. Leave unchecked if you are recording intake without this confirmation.</span>
                </label>
              </div>
            </div>
            <div className="lf-admin-modal-footer">
              {actionError ? <p className="lf-admin-modal-info">{actionError}</p> : null}
              <p className="lf-admin-modal-info"><IconInfo /> Confirming receipt records intake with the backend. Lost-item reports may trigger an automatic poster notification; use Notify Owner separately when you want to contact a claimant from the admin flow.</p>
              <div>
                <button
                  type="button"
                  className="lf-admin-btn-secondary"
                  onClick={() => {
                    resetReceiptModalState()
                    setVerifyModalOpen(false)
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="lf-admin-btn-primary" onClick={handleVerifyApprove} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Confirm Receipt'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                x
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
                  <span className="lf-admin-upload-hint">PNG or JPG - optional</span>
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
