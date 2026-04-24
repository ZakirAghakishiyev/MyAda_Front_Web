import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  createFoundReport,
  createLostReport,
  getLostFoundCategories,
  getLostFoundItems,
  uploadLostFoundImages,
} from '../api/lostFoundApi'
import { getBuildings, getRoomsByBuildingId, validateRoomLocation } from '../api/locationApi'
import './LostAndFound2.css'

const STEPS = ['Info'] /* single step: all fields on one screen, submit directly */
const DEFAULT_REPORT_CATEGORIES = ['Electronics', 'Documents', 'Personal Items', 'Accessories']
const ANNOUNCEMENT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'lost', label: 'Lost items' },
  { value: 'found', label: 'Found items' },
  { value: 'my', label: 'My announcements' }
]
const ITEMS_PER_PAGE = 8
const MAX_DESCRIPTION_LENGTH = 500

const DRAFT_COOKIE_KEYS = {
  'report-lost': 'lf2_draft_lost',
  'report-found': 'lf2_draft_found'
}

const setDraftCookie = (key, value, days = 7) => {
  if (typeof document === 'undefined') return
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `${key}=${encoded}; expires=${expires}; path=/`
  } catch (err) {
    console.error('Failed to save draft cookie', err)
  }
}

const getDraftCookie = (key) => {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const prefix = `${key}=`
  const raw = cookies.find(c => c.startsWith(prefix))
  if (!raw) return null
  const value = raw.substring(prefix.length)
  try {
    return JSON.parse(decodeURIComponent(value))
  } catch (err) {
    console.error('Failed to parse draft cookie', err)
    return null
  }
}

const clearDraftCookie = (key) => {
  if (typeof document === 'undefined') return
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

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

function computeDaysAgo(item) {
  if (typeof item?.daysAgo === 'number') return item.daysAgo
  const source = item?.postedAt || item?.datePosted
  if (!source) return 0
  const dt = new Date(source)
  if (Number.isNaN(dt.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - dt.getTime()) / 86400000))
}

const LostAndFound2 = ({ initialReport, fromAdmin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState('dashboard') // 'dashboard' | 'report-lost' | 'report-found'
  const isReportOpen = view === 'report-lost' || view === 'report-found'

  useEffect(() => {
    const openReport = initialReport || location.state?.openReport
    if (openReport === 'lost') setView('report-lost')
    else if (openReport === 'found') setView('report-found')
  }, [initialReport, location.state?.openReport])
  const [searchQuery, setSearchQuery] = useState('')
  const [announcementFilter, setAnnouncementFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('All Items')
  const [currentPage, setCurrentPage] = useState(1)
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [isItemsLoading, setIsItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState('')
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [reportCategories, setReportCategories] = useState(DEFAULT_REPORT_CATEGORIES)

  // Report form state (shared structure for lost/found)
  const [reportStep, setReportStep] = useState(0)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportForm, setReportForm] = useState({
    itemName: '',
    category: DEFAULT_REPORT_CATEGORIES[0],
    locationType: '',
    building: '',
    floor: '',
    roomArea: '',
    isRoom: '',
    campusLocation: '',
    description: '',
    photos: []
  })
  const selectedPhoto = reportForm.photos[0] || null
  const selectedPhotoPreviewUrl = useMemo(
    () => (selectedPhoto ? URL.createObjectURL(selectedPhoto) : ''),
    [selectedPhoto]
  )

  useEffect(() => {
    return () => {
      if (selectedPhotoPreviewUrl) URL.revokeObjectURL(selectedPhotoPreviewUrl)
    }
  }, [selectedPhotoPreviewUrl])

  useEffect(() => {
    if (!isReportOpen) return
    let isMounted = true
    const loadBuildings = async () => {
      try {
        const result = await getBuildings()
        if (!isMounted) return
        setBuildings(result)
      } catch {
        if (!isMounted) return
        setBuildings([])
      }
    }
    loadBuildings()
    return () => {
      isMounted = false
    }
  }, [isReportOpen])

  useEffect(() => {
    if (!isReportOpen) return
    let isMounted = true
    getLostFoundCategories()
      .then((result) => {
        if (!isMounted) return
        const categories = result.length ? result : DEFAULT_REPORT_CATEGORIES
        setReportCategories(categories)
        setReportForm((prev) => ({
          ...prev,
          category: categories.includes(prev.category) ? prev.category : categories[0],
        }))
      })
      .catch(() => {
        if (isMounted) setReportCategories(DEFAULT_REPORT_CATEGORIES)
      })
    return () => {
      isMounted = false
    }
  }, [isReportOpen])

  useEffect(() => {
    if (!isReportOpen || reportForm.locationType !== 'building' || !reportForm.building) {
      setRooms([])
      return
    }
    let isMounted = true
    const loadRooms = async () => {
      try {
        const result = await getRoomsByBuildingId(reportForm.building)
        if (!isMounted) return
        setRooms(result)
      } catch {
        if (!isMounted) return
        setRooms([])
      }
    }
    loadRooms()
    return () => {
      isMounted = false
    }
  }, [isReportOpen, reportForm.locationType, reportForm.building])

  useEffect(() => {
    if (view !== 'report-lost' && view !== 'report-found') return
    const key = DRAFT_COOKIE_KEYS[view]
    const draft = key ? getDraftCookie(key) : null
    if (!draft || !draft.reportForm) return

    setReportForm(prev => ({
      ...prev,
      ...draft.reportForm,
      photos: []
    }))
    if (typeof draft.reportStep === 'number' && draft.reportStep >= 0 && draft.reportStep < STEPS.length) {
      setReportStep(Math.min(draft.reportStep, STEPS.length - 1))
    }
  }, [view])

  useEffect(() => {
    if (view !== 'dashboard') return
    let isMounted = true
    const loadItems = async () => {
      setIsItemsLoading(true)
      setItemsError('')
      try {
        const type =
          announcementFilter === 'lost'
            ? 'lost'
            : announcementFilter === 'found'
              ? 'found'
              : 'all'
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          type,
          q: searchQuery.trim() || undefined,
          category: categoryFilter === 'All Items' ? undefined : categoryFilter,
          postedBy: announcementFilter === 'my' ? 'me' : undefined,
        }
        const res = await getLostFoundItems(params)
        if (!isMounted) return
        setItems(Array.isArray(res.items) ? res.items : [])
        setTotalItems(Number(res.total || 0))
      } catch (err) {
        if (!isMounted) return
        setItemsError(err?.message || 'Failed to load items.')
      } finally {
        if (isMounted) setIsItemsLoading(false)
      }
    }
    loadItems()
    return () => {
      isMounted = false
    }
  }, [view, announcementFilter, categoryFilter, searchQuery, currentPage])

  const normalizedItems = useMemo(() => {
    let list = items.map(item => ({
      ...item,
      displayCategory: item.category || 'Other',
      type: item.type || 'found',
      image: item.image || item.images?.[0] || null,
      daysAgo: computeDaysAgo(item),
      location: item.location || 'Location not specified',
      description: item.description || '',
    }))
    return list
  }, [items])

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const paginatedItems = normalizedItems

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, announcementFilter, categoryFilter])

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
      category: reportCategories[0] || DEFAULT_REPORT_CATEGORIES[0],
      locationType: '',
      building: '',
      floor: '',
      roomArea: '',
      isRoom: '',
      campusLocation: '',
      description: '',
      photos: []
    })
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (isSubmittingReport) return
    if (view === 'report-found' && reportForm.photos.length === 0) {
      alert('Please upload at least one image for found items.')
      return
    }

    setIsSubmittingReport(true)
    try {
      if (
        reportForm.locationType === 'building' &&
        reportForm.isRoom === 'yes' &&
        reportForm.building &&
        reportForm.roomArea
      ) {
        const isValid = await validateRoomLocation(reportForm.roomArea, reportForm.building)
        if (!isValid) {
          alert('Selected room does not belong to selected building.')
          setIsSubmittingReport(false)
          return
        }
      }

      const photoUrls = await uploadLostFoundImages(reportForm.photos)
      const selectedBuilding = buildings.find((b) => String(b.id) === String(reportForm.building))
      const selectedRoom = rooms.find((r) => String(r.id) === String(reportForm.roomArea))
      const basePayload = {
        itemName: reportForm.itemName.trim(),
        category: reportForm.category,
        description: reportForm.description.trim(),
        locationType: reportForm.locationType || 'building',
        building: selectedBuilding?.name || undefined,
        isRoom: reportForm.locationType === 'building' ? reportForm.isRoom || undefined : undefined,
        roomOrArea:
          reportForm.locationType === 'building'
            ? reportForm.isRoom === 'yes'
              ? selectedRoom?.name || undefined
              : reportForm.roomArea || undefined
            : undefined,
        campusLocation: reportForm.locationType === 'campus' ? reportForm.campusLocation || undefined : undefined,
        photoUrls,
      }

      if (view === 'report-lost') {
        await createLostReport(basePayload)
        alert('Lost item report submitted for review.')
      } else {
        await createFoundReport({
          ...basePayload,
          collectionPlace: 'Campus Lost & Found Office',
        })
        alert('Found item report submitted for review.')
      }

      const key = DRAFT_COOKIE_KEYS[view]
      if (key) {
        clearDraftCookie(key)
      }
      if (fromAdmin || location.state?.from === 'admin') {
        navigate('/admin/lost-and-found')
        return
      }
      backToDashboard()
    } catch (err) {
      alert(err?.message || 'Failed to submit report.')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    const firstImage = files[0] || null
    setReportForm(prev => ({ ...prev, photos: firstImage ? [firstImage] : [] }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
    const firstImage = files[0] || null
    setReportForm(prev => ({ ...prev, photos: firstImage ? [firstImage] : [] }))
  }
  const handleDragOver = (e) => e.preventDefault()
  const handleRemovePhoto = () => {
    setReportForm((prev) => ({ ...prev, photos: [] }))
  }

  const reportTitle = view === 'report-lost' ? 'Report a Lost Item' : 'Report a Found Item'
  const reportSubtitle = view === 'report-lost'
    ? 'Provide details about your lost item to help the community return it to you.'
    : 'Provide details about the item you found to help reunite it with its owner.'

  const handleSaveDraft = () => {
    if (!isReportOpen) return
    const key = DRAFT_COOKIE_KEYS[view]
    if (!key) return

    const payload = {
      view,
      reportStep,
      reportForm: {
        ...reportForm,
        photos: []
      },
      savedAt: Date.now()
    }

    setDraftCookie(key, payload)
    alert('Draft saved on this device. It will be restored next time you open this form.')
  }

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
                        {reportCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
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
                      <span className="lf2-label">
                        Location
                        {view === 'report-found' && ' *'}
                      </span>
                      <div className="lf2-fields">
                        <label className="lf2-field">
                          <span className="lf2-label">Choose location type</span>
                          <div className="lf2-field">
                            <label>
                              <input
                                type="radio"
                                name="locationType"
                                value="building"
                                checked={reportForm.locationType === 'building'}
                                onChange={e =>
                                  setReportForm(f => ({
                                    ...f,
                                    locationType: e.target.value,
                                    building: '',
                                    floor: '',
                                    roomArea: '',
                                    isRoom: '',
                                    campusLocation: ''
                                  }))
                                }
                                required={view === 'report-found'}
                              />{' '}
                              Building
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="locationType"
                                value="campus"
                                checked={reportForm.locationType === 'campus'}
                                onChange={e =>
                                  setReportForm(f => ({
                                    ...f,
                                    locationType: e.target.value,
                                    building: '',
                                    floor: '',
                                    roomArea: '',
                                    isRoom: ''
                                  }))
                                }
                                required={view === 'report-found'}
                              />{' '}
                              Campus
                            </label>
                          </div>
                        </label>
                      </div>
                    </label>

                    {reportForm.locationType === 'campus' && (
                      <label className="lf2-field">
                        <span className="lf2-label">
                          Campus location
                          {view === 'report-found' && ' *'}
                        </span>
                        <input
                          type="text"
                          placeholder="Describe where on campus (e.g. main yard, parking area)"
                          value={reportForm.campusLocation}
                          onChange={e => setReportForm(f => ({ ...f, campusLocation: e.target.value }))}
                          required={view === 'report-found'}
                        />
                      </label>
                    )}

                    {reportForm.locationType === 'building' && (
                      <>
                        <label className="lf2-field">
                          <span className="lf2-label">
                            Building
                            {view === 'report-found' && ' *'}
                          </span>
                          <select
                            value={reportForm.building}
                            onChange={e =>
                              setReportForm(f => ({
                                ...f,
                                building: e.target.value,
                                roomArea: '',
                                isRoom: ''
                              }))
                            }
                            required={view === 'report-found'}
                          >
                            <option value="">Select building...</option>
                            {buildings.map(b => (
                              <option key={b.id} value={String(b.id)}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* <label className="lf2-field">
                          <span className="lf2-label">
                            Floor
                            {view === 'report-found' && ' *'}
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 2nd Floor"
                            value={reportForm.floor}
                            onChange={e => setReportForm(f => ({ ...f, floor: e.target.value }))}
                            required={view === 'report-found'}
                          />
                        </label> */}

                        <label className="lf2-field">
                          <span className="lf2-label">
                            Is it a room?
                            {view === 'report-found' && ' *'}
                          </span>
                          <select
                            value={reportForm.isRoom}
                            onChange={e =>
                              setReportForm(f => ({
                                ...f,
                                isRoom: e.target.value,
                                roomArea: ''
                              }))
                            }
                            required={view === 'report-found'}
                          >
                            <option value="">Select...</option>
                            <option value="yes">Yes, it is a room</option>
                            <option value="no">No, another area</option>
                          </select>
                        </label>

                        {reportForm.isRoom === 'yes' && (
                          <label className="lf2-field">
                            <span className="lf2-label">
                              Room
                              {view === 'report-found' && ' *'}
                            </span>
                            <select
                              value={reportForm.roomArea}
                              onChange={e => setReportForm(f => ({ ...f, roomArea: e.target.value }))}
                              required={view === 'report-found'}
                            >
                              <option value="">Select room...</option>
                              {rooms.map(room => (
                                <option key={room.id} value={String(room.id)}>
                                  {room.name || room.number}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        {reportForm.isRoom === 'no' && (
                          <label className="lf2-field">
                            <span className="lf2-label">
                              Location details
                              {view === 'report-found' && ' *'}
                            </span>
                            <input
                              type="text"
                              placeholder="e.g. Lobby near reception"
                              value={reportForm.roomArea}
                              onChange={e => setReportForm(f => ({ ...f, roomArea: e.target.value }))}
                              required={view === 'report-found'}
                            />
                          </label>
                        )}
                      </>
                    )}
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
                      required={view === 'report-found'}
                      onChange={handlePhotoChange}
                      className="lf2-dropzone-input"
                    />
                    <IconCloud />
                    <span>Drag and drop an image here</span>
                    <span className="lf2-dropzone-hint">PNG, JPG up to 10MB (single image only)</span>
                    {selectedPhoto && (
                      <span className="lf2-dropzone-count">1 image selected</span>
                    )}
                  </label>
                  {selectedPhoto ? (
                    <div className="lf2-upload-preview">
                      <img src={selectedPhotoPreviewUrl} alt="Selected upload preview" className="lf2-upload-preview-image" />
                      <div className="lf2-upload-preview-actions">
                        <span className="lf2-upload-preview-name">{selectedPhoto.name}</span>
                        <button type="button" className="lf2-btn lf2-btn--draft" onClick={handleRemovePhoto}>
                          Remove image
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              </>
            )}

            <div className="lf2-form-actions">
              <button type="button" className="lf2-btn lf2-btn--back" onClick={reportStep === 0 ? backToDashboard : () => setReportStep(s => s - 1)}>
                <span>‹</span> Back
              </button>
              <button type="button" className="lf2-btn lf2-btn--draft" onClick={handleSaveDraft}>
                Save as Draft
              </button>
              <button type="submit" className="lf2-btn lf2-btn--primary" disabled={isSubmittingReport}>
                {isSubmittingReport ? 'Submitting...' : 'Submit'}
              </button>
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

      <div className="lf2-announcement-filters">
        {ANNOUNCEMENT_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`lf2-cat-pill ${announcementFilter === value ? 'lf2-cat-pill--active' : ''}`}
            onClick={() => {
              setAnnouncementFilter(value)
              setCurrentPage(1)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="lf2-categories">
        {['All Items', ...reportCategories].map(cat => (
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
        {isItemsLoading ? (
          <p className="lf-list-empty">Loading items...</p>
        ) : itemsError ? (
          <p className="lf-list-empty">{itemsError}</p>
        ) : paginatedItems.length === 0 ? (
          <p className="lf-list-empty">No items found.</p>
        ) : (
          paginatedItems.map(item => (
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
                <span>{item.type === 'lost' ? 'Lost item' : 'Found item'}</span>
              </div>
                <div className="lf2-card-location">
                  <IconPin />
                  <span>{item.location}</span>
                </div>
              <span className="lf2-card-category">
                {item.displayCategory || item.category}
              </span>
                <p className="lf2-card-desc">{item.description}</p>
              </div>
            </article>
          ))
        )}
      </div>

      <footer className="lf2-footer">
        <span className="lf2-footer-count">
          Showing {paginatedItems.length} of {totalItems} items
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
