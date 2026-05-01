import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLostFoundCategories, itemHasEligibleClaimForOwnerNotify, getLostFoundAdminWorkflowPhase } from '../api/lostFoundApi'
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

const ITEMS_PER_PAGE = 5
const ALL_TAB_FETCH_FLOOR = 50
const DEFAULT_FILTERS = {
  searchKeyword: '',
  categoryFilter: 'All Categories',
  locationFilter: 'Main Campus',
}

function getAdminStatusFilter(tab) {
  if (tab === 'Pending') return 'pending'
  if (tab === 'In office' || tab === 'Ready') return 'received'
  if (tab === 'Completed') return 'delivered'
  return null
}

function withKnownAdminStatus(items, adminStatus) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    adminStatus,
  }))
}

function getSortableAdminTimestamp(item) {
  const raw = item?.postedAt ?? item?.datePosted ?? item?.updatedAt ?? item?.createdAt
  const parsed = new Date(String(raw || ''))
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function sortAdminItemsByRecent(a, b) {
  return getSortableAdminTimestamp(b) - getSortableAdminTimestamp(a)
}

export default function LostAndFoundAdmin() {
  const navigate = useNavigate()
  const { fetchItems, fetchStatusTotals, fetchItemDetail, notifyOwner, confirmReceipt, confirmHandover } = useLostAndFoundAdmin()

  const [searchKeyword, setSearchKeyword] = useState(DEFAULT_FILTERS.searchKeyword)
  const [categoryFilter, setCategoryFilter] = useState(DEFAULT_FILTERS.categoryFilter)
  const [locationFilter, setLocationFilter] = useState(DEFAULT_FILTERS.locationFilter)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [tableFilter, setTableFilter] = useState('All')
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [categoryOptions, setCategoryOptions] = useState([{ id: '', name: 'All Categories' }])
  const [kpis, setKpis] = useState({ pending: 0, received: 0, delivered: 0 })
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
  const [currentPage, setCurrentPage] = useState(1)
  const [reloadToken, setReloadToken] = useState(0)
  const manualEntryRef = useRef(null)

  const categoryNames = useMemo(
    () => categoryOptions.map((option) => option.name),
    [categoryOptions],
  )

  const categoryNameToId = useMemo(() => {
    return Object.fromEntries(
      categoryOptions
        .filter((option) => option.id)
        .map((option) => [option.name, option.id]),
    )
  }, [categoryOptions])

  const pageNumbers = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2))
    const end = Math.min(totalPages, start + 2)
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [currentPage, totalItems])

  useEffect(() => {
    if (!manualEntryOpen) return
    const handleClickOutside = (event) => {
      if (manualEntryRef.current && !manualEntryRef.current.contains(event.target)) {
        setManualEntryOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [manualEntryOpen])

  useEffect(() => {
    let isMounted = true
    getLostFoundCategories()
      .then((result) => {
        if (!isMounted) return
        const nextOptions = [{ id: '', name: 'All Categories' }]
        for (const category of Array.isArray(result) ? result : []) {
          const name = String(category?.name || '').trim()
          if (!name) continue
          const id = category?.id == null ? '' : String(category.id)
          if (nextOptions.some((option) => option.name === name)) continue
          nextOptions.push({ id, name })
        }
        setCategoryOptions(nextOptions)
      })
      .catch(() => {
        if (isMounted) setCategoryOptions([{ id: '', name: 'All Categories' }])
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    setError('')
    fetchStatusTotals()
      .then((totals) => {
        if (!isMounted) return
        setKpis({
          pending: Number(totals?.pending || 0),
          received: Number(totals?.received || 0),
          delivered: Number(totals?.delivered || 0),
        })
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err?.message || 'Failed to load admin dashboard counts.')
      })
    return () => {
      isMounted = false
    }
  }, [fetchStatusTotals, reloadToken])

  useEffect(() => {
    let isMounted = true
    const baseParams = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }
    const q = appliedFilters.searchKeyword.trim()
    if (q) baseParams.q = q
    const categoryId = categoryNameToId[appliedFilters.categoryFilter]
    if (categoryId) baseParams.categoryId = categoryId
    const adminStatus = getAdminStatusFilter(tableFilter)

    setIsLoading(true)
    setError('')
    const loadItems = async () => {
      if (tableFilter === 'All') {
        const perStatusLimit = Math.max(currentPage * ITEMS_PER_PAGE, ALL_TAB_FETCH_FLOOR)
        const mergedParams = {
          ...baseParams,
          page: 1,
          limit: perStatusLimit,
        }
        const [pendingResult, receivedResult, deliveredResult] = await Promise.all([
          fetchItems({ ...mergedParams, adminStatus: 'pending' }),
          fetchItems({ ...mergedParams, adminStatus: 'received' }),
          fetchItems({ ...mergedParams, adminStatus: 'delivered' }),
        ])
        const mergedItems = [
          ...withKnownAdminStatus(pendingResult.items, 'pending'),
          ...withKnownAdminStatus(receivedResult.items, 'received'),
          ...withKnownAdminStatus(deliveredResult.items, 'delivered'),
        ].sort(sortAdminItemsByRecent)
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return {
          items: mergedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE),
          total:
            Number(pendingResult.total || 0) +
            Number(receivedResult.total || 0) +
            Number(deliveredResult.total || 0),
        }
      }

      const result = await fetchItems({
        ...baseParams,
        adminStatus,
      })
      return {
        items: withKnownAdminStatus(result.items, adminStatus),
        total: Number(result.total || 0),
      }
    }

    loadItems()
      .then((result) => {
        if (!isMounted) return
        setItems(Array.isArray(result.items) ? result.items : [])
        setTotalItems(Number(result.total || 0))
      })
      .catch((err) => {
        if (!isMounted) return
        setItems([])
        setTotalItems(0)
        setError(err?.message || 'Failed to load admin items.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [appliedFilters, categoryNameToId, currentPage, fetchItems, reloadToken, tableFilter])

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const adminPhase = (item) => getLostFoundAdminWorkflowPhase(item)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleApplyFilters = () => {
    setCurrentPage(1)
    setAppliedFilters({
      searchKeyword,
      categoryFilter,
      locationFilter,
    })
  }

  const handleTableFilterChange = (nextFilter) => {
    setCurrentPage(1)
    setTableFilter(nextFilter)
  }

  const triggerReload = () => {
    setReloadToken((current) => current + 1)
  }

  const receiptWasPersisted = async (itemId) => {
    try {
      const detail = await fetchItemDetail(itemId)
      return getLostFoundAdminWorkflowPhase(detail?.item) === 'received'
    } catch {
      return false
    }
  }

  const resetReceiptModalState = () => {
    setActionError('')
    setReceiptStorageBin('')
    setReceiptCondition('')
    setReceiptNotes('')
    setReceiptVerified(false)
    setReceiptIntakeFile(null)
  }

  const handleConfirmReceipt = (item) => {
    resetReceiptModalState()
    setVerifyModalItem(item)
  }

  const handleVerifyApprove = async () => {
    if (!verifyModalItem || isSubmitting) return
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
      await confirmReceipt(verifyModalItem.id, receiptPayload)
      setVerifyModalItem(null)
      triggerReload()
    } catch (err) {
      if (err?.status === 500) {
        if (await receiptWasPersisted(verifyModalItem.id)) {
          resetReceiptModalState()
          setVerifyModalItem(null)
          triggerReload()
          return
        }

        const hasOptionalReceiptFields = Boolean(
          trimmedStorageBinId ||
          trimmedAdminNotes ||
          receiptVerified,
        )

        if (hasOptionalReceiptFields) {
          try {
            await confirmReceipt(verifyModalItem.id, {
              condition: receiptCondition,
              intakePhotoFile: receiptIntakeFile || undefined,
            })
            resetReceiptModalState()
            setVerifyModalItem(null)
            triggerReload()
            return
          } catch (retryErr) {
            if (await receiptWasPersisted(verifyModalItem.id)) {
              resetReceiptModalState()
              setVerifyModalItem(null)
              triggerReload()
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
      triggerReload()
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
        `An update is available for your ${item.title || 'item'} report. Please check your Lost & Found dashboard.`,
      )
      triggerReload()
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
        categories={categoryNames}
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
                onClick={() => setManualEntryOpen((value) => !value)}
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
              <span className="lf-admin-kpi-value">{kpis.pending}</span>
              <span className="lf-admin-kpi-label">Newly Reported</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--purple"><IconBox /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.received}</span>
              <span className="lf-admin-kpi-label">In Office (Received)</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--orange"><IconClock /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.received}</span>
              <span className="lf-admin-kpi-label">Awaiting Pickup</span>
            </div>
          </div>
          <div className="lf-admin-kpi">
            <div className="lf-admin-kpi-icon lf-admin-kpi-icon--green"><IconCheck /></div>
            <div className="lf-admin-kpi-content">
              <span className="lf-admin-kpi-value">{kpis.delivered}</span>
              <span className="lf-admin-kpi-label">Claimed Today</span>
            </div>
          </div>
        </div>

        <section className="lf-admin-table-section">
          <div className="lf-admin-table-header">
            <h2>Active Inventory</h2>
            <div className="lf-admin-table-tabs">
              {['All', 'Pending', 'In office', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`lf-admin-tab ${
                    tableFilter === tab || (tab === 'In office' && tableFilter === 'Ready') ? 'lf-admin-tab--active' : ''
                  }`}
                  onClick={() => handleTableFilterChange(tab)}
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
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        type="button"
                        className="lf-admin-cell-item lf-admin-cell-item--link"
                        onClick={() =>
                          navigate(`/admin/lost-and-found/item/${item.id}`, {
                            state: { workflow: adminPhase(item) },
                          })
                        }
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
                      <span className={`lf-admin-status lf-admin-status--${adminPhase(item)}`}>
                        {adminPhase(item) === 'pending' && 'Newly Reported'}
                        {adminPhase(item) === 'received' && 'In Office'}
                        {adminPhase(item) === 'delivered' && 'Completed'}
                      </span>
                    </td>
                    <td>
                      <div className="lf-admin-actions">
                        {adminPhase(item) === 'pending' && (
                          <button
                            type="button"
                            className="lf-admin-action-btn lf-admin-action-btn--blue"
                            onClick={() => handleConfirmReceipt(item)}
                          >
                            Confirm Receipt
                          </button>
                        )}
                        {adminPhase(item) === 'received' && (
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
                        {adminPhase(item) === 'delivered' && (
                          <button type="button" className="lf-admin-action-btn lf-admin-action-btn--gray" disabled>
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
                {!isLoading && !items.length && (
                  <tr>
                    <td colSpan="5">{error || 'No items found.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

      </main>

      {verifyModalItem && (
        <div
          className="lf-admin-modal-overlay"
          onClick={() => {
            resetReceiptModalState()
            setVerifyModalItem(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-receipt-title"
        >
          <div className="lf-admin-modal lf-admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="lf-admin-modal-header">
              <h2 id="verify-receipt-title">Verify Item Receipt</h2>
              <span className="lf-admin-modal-badge lf-admin-modal-badge--pending">PENDING VERIFICATION</span>
              <span className="lf-admin-modal-tracking">Tracking ID: #{verifyModalItem.referenceNumber?.replace('LF-', '') || verifyModalItem.id}</span>
              <button
                type="button"
                className="lf-admin-modal-close"
                onClick={() => {
                  resetReceiptModalState()
                  setVerifyModalItem(null)
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
                  {verifyModalItem.image ? <img src={verifyModalItem.image} alt="" /> : <div className="lf-admin-verify-photo-placeholder" />}
                </div>
                <dl className="lf-admin-verify-dl">
                  <dt>ITEM CATEGORY</dt>
                  <dd>{verifyModalItem.category}</dd>
                  <dt>REPORTED COLOR</dt>
                  <dd>-</dd>
                  <dt>BRAND/MODEL</dt>
                  <dd>{verifyModalItem.title}</dd>
                  <dt>DATE FOUND</dt>
                  <dd>{verifyModalItem.datePosted || (verifyModalItem.postedAt ? new Date(verifyModalItem.postedAt).toLocaleDateString() : '-')}</dd>
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
                  <textarea placeholder="Add any specific identifying markers not mentioned by student..." rows={3} value={receiptNotes} onChange={(e) => setReceiptNotes(e.target.value)} />
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
                    setVerifyModalItem(null)
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
              <span className="lf-admin-modal-tracking">Found {handoverItem.datePosted} - ID: {handoverItem.referenceNumber}</span>
              <button type="button" className="lf-admin-modal-close" onClick={() => setHandoverItem(null)} aria-label="Close">
                x
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
                  <span>Student ID Verified Manually - I confirm that I have inspected the physical ID card and the photo matches the claimant.</span>
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
                  <span className="lf-admin-upload-hint">PNG or JPG - optional handover proof</span>
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
