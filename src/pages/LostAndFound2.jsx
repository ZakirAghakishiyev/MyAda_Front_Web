import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  createFoundReport,
  createLostReport,
  getLostFoundCategories,
  getLostFoundItems,
  getLostFoundStatusBadgeVariant,
} from '../api/lostFoundApi'
import { getBuildings, getRoomsByBuildingId, validateRoomLocation } from '../api/locationApi'
import './LostAndFound2.css'

const STEPS = ['Info'] /* single step: all fields on one screen, submit directly */
const DEFAULT_REPORT_CATEGORIES = []
const ANNOUNCEMENT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'lost', label: 'Lost items' },
  { value: 'found', label: 'Found items' },
  { value: 'my', label: 'My announcements' }
]
const ITEMS_PER_PAGE = 8
const MAX_DESCRIPTION_LENGTH = 500

function firstValidCategoryId(categories) {
  const match = (Array.isArray(categories) ? categories : []).find((category) => category?.id != null)
  return match ? String(match.id) : ''
}

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

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
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

/** Composes a single human-readable location line from the shared building/campus form. */
function composeReportLocationString(reportForm, buildings, rooms) {
  const locationType = reportForm.locationType || 'building'
  if (locationType === 'campus') {
    return String(reportForm.campusLocation || '').trim()
  }
  const selectedBuilding = buildings.find((b) => String(b.id) === String(reportForm.building))
  const selectedRoom = rooms.find((r) => String(r.id) === String(reportForm.roomArea))
  const buildingName = (selectedBuilding?.name || '').trim()
  let detail = ''
  if (reportForm.isRoom === 'yes') {
    detail = String(selectedRoom?.name || selectedRoom?.number || '').trim()
  } else if (reportForm.isRoom === 'no') {
    detail = String(reportForm.roomArea || '').trim()
  }
  return [buildingName, detail].filter(Boolean).join(', ').trim()
}

/** Lost report API requires date/time/contact; used when the contact section was removed from the form. */
function lostReportApiContactDefaults() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return {
    dateLost: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    timeLost: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    contactName: 'Submitted via campus portal',
    contactPhone: '+994000000000',
  }
}

const LostAndFound2 = ({ initialReport, fromAdmin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState('dashboard') // 'dashboard' | 'report-lost' | 'report-found'
  const isReportOpen = view === 'report-lost' || view === 'report-found'

  useEffect(() => {
    const openReport = initialReport || location.state?.openReport
    if (openReport === 'lost') {
      setView('report-lost')
      setReportForm((f) => ({ ...f, locationType: f.locationType || 'building' }))
    } else if (openReport === 'found') {
      setView('report-found')
      setReportForm((f) => ({ ...f, locationType: f.locationType || 'building' }))
    }
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
    categoryId: firstValidCategoryId(DEFAULT_REPORT_CATEGORIES),
    locationType: '',
    building: '',
    floor: '',
    roomArea: '',
    isRoom: '',
    campusLocation: '',
    description: '',
    photos: [],
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
    if (view !== 'report-lost' && view !== 'report-found') return
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
  }, [view])

  useEffect(() => {
    let isMounted = true
    getLostFoundCategories()
      .then((result) => {
        if (!isMounted) return
        const categories = result.length ? result : DEFAULT_REPORT_CATEGORIES
        setReportCategories(categories)
        setReportForm((prev) => ({
          ...prev,
          categoryId: categories.some((category) => String(category.id) === String(prev.categoryId))
            ? prev.categoryId
            : firstValidCategoryId(categories),
        }))
      })
      .catch(() => {
        if (!isMounted) return
        setReportCategories(DEFAULT_REPORT_CATEGORIES)
        setReportForm((prev) => ({
          ...prev,
          categoryId: firstValidCategoryId(DEFAULT_REPORT_CATEGORIES),
        }))
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if ((view !== 'report-lost' && view !== 'report-found') || reportForm.locationType !== 'building' || !reportForm.building) {
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
  }, [view, reportForm.locationType, reportForm.building])

  useEffect(() => {
    if (view !== 'report-lost' && view !== 'report-found') return
    const key = DRAFT_COOKIE_KEYS[view]
    const draft = key ? getDraftCookie(key) : null
    if (!draft || !draft.reportForm) return

    setReportForm(prev => ({
      ...prev,
      ...draft.reportForm,
      photos: [],
      locationType: draft.reportForm.locationType || prev.locationType || 'building',
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
          categoryId: categoryFilter === 'All Items' ? undefined : categoryFilter,
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
      displayStatus: String(item.status || item.adminStatus || 'Pending verification'),
    }))
    return list
  }, [items])

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const paginatedItems = normalizedItems

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, announcementFilter, categoryFilter])

  const openReportLost = () => {
    setView('report-lost')
    setReportForm((f) => ({
      ...f,
      locationType: f.locationType || 'building',
    }))
  }
  const openReportFound = () => {
    setView('report-found')
    setReportForm((f) => ({
      ...f,
      locationType: f.locationType || 'building',
    }))
  }
  const backToDashboard = () => {
    if (fromAdmin || location.state?.from === 'admin') {
      navigate('/admin/lost-and-found')
      return
    }
    setView('dashboard')
    setReportStep(0)
    setReportForm({
      itemName: '',
      categoryId: firstValidCategoryId(reportCategories),
      locationType: '',
      building: '',
      floor: '',
      roomArea: '',
      isRoom: '',
      campusLocation: '',
      description: '',
      photos: [],
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
      if (!reportForm.categoryId) {
        alert('Please choose a valid category.')
        setIsSubmittingReport(false)
        return
      }
      if (
        (view === 'report-found' || view === 'report-lost') &&
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

      if (view === 'report-lost') {
        const composedLoc = composeReportLocationString(reportForm, buildings, rooms)
        const location = composedLoc.trim() || 'Not specified'
        const { dateLost, timeLost, contactName, contactPhone } = lostReportApiContactDefaults()
        const lostBody = {
          type: 'lost',
          itemName: reportForm.itemName.trim(),
          categoryId: Number(reportForm.categoryId),
          description: (reportForm.description || '').trim(),
          location,
          dateLost,
          timeLost,
          contactName,
          contactPhone,
          status: 'pending',
        }
        if (reportForm.photos.length) {
          const fd = new FormData()
          Object.entries(lostBody).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).trim() !== '') fd.append(k, String(v))
          })
          reportForm.photos.forEach((f) => fd.append('files', f))
          await createLostReport(fd)
        } else {
          await createLostReport(lostBody)
        }
        alert('Lost item report submitted for review.')
      } else {
        const selectedBuilding = buildings.find((b) => String(b.id) === String(reportForm.building))
        const selectedRoom = rooms.find((r) => String(r.id) === String(reportForm.roomArea))
        const locationType = reportForm.locationType || 'building'
        const foundFields = {
          itemName: reportForm.itemName.trim(),
          categoryId: Number(reportForm.categoryId),
          description: (reportForm.description || '').trim(),
          locationType,
          collectionPlace: 'Campus Lost & Found Office',
        }
        if (locationType === 'building') {
          if (!selectedBuilding?.name) {
            alert('Please select a building.')
            setIsSubmittingReport(false)
            return
          }
          foundFields.building = selectedBuilding.name
          foundFields.isRoom = reportForm.isRoom === 'yes' ? 'true' : 'false'
          const roomOrArea =
            reportForm.isRoom === 'yes'
              ? (selectedRoom?.name || '').trim()
              : String(reportForm.roomArea || '').trim()
          if (!roomOrArea) {
            alert('Please complete building location (room or area).')
            setIsSubmittingReport(false)
            return
          }
          foundFields.roomOrArea = roomOrArea
        } else if (locationType === 'campus') {
          const cl = String(reportForm.campusLocation || '').trim()
          if (!cl) {
            alert('Please describe the campus location.')
            setIsSubmittingReport(false)
            return
          }
          foundFields.campusLocation = cl
        }
        await createFoundReport(foundFields, reportForm.photos)
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

  const locationFieldsRequired = view === 'report-found'

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
                        value={reportForm.categoryId}
                        onChange={e => setReportForm(f => ({ ...f, categoryId: e.target.value }))}
                      >
                        <option value="" disabled>Select category...</option>
                        {reportCategories.map((category) => (
                          <option
                            key={category.id ?? category.name}
                            value={category.id != null ? String(category.id) : ''}
                            disabled={category.id == null}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                {(view === 'report-lost' || view === 'report-found') && (
                    <section className="lf2-section">
                      <h2 className="lf2-section-title">
                        <span className="lf2-section-icon"><IconPin /></span>
                        Location
                        {locationFieldsRequired && <span className="lf2-required-hint"> *</span>}
                        {!locationFieldsRequired && <span className="lf2-optional-hint"> (optional)</span>}
                      </h2>
                      <p className="lf2-section-desc">
                        {locationFieldsRequired
                          ? 'Where the item was found on campus.'
                          : 'Same fields as found reports; leave anything blank if you are unsure.'}
                      </p>
                      <div className="lf2-fields">
                        <label className="lf2-field">
                          <span className="lf2-label">
                            Location type
                            {locationFieldsRequired && ' *'}
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
                                    required={locationFieldsRequired}
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
                              {locationFieldsRequired && ' *'}
                            </span>
                            <input
                              type="text"
                              placeholder="Describe where on campus (e.g. main yard, parking area)"
                              value={reportForm.campusLocation}
                              onChange={e => setReportForm(f => ({ ...f, campusLocation: e.target.value }))}
                              required={locationFieldsRequired}
                            />
                          </label>
                        )}

                        {reportForm.locationType === 'building' && (
                          <>
                            <label className="lf2-field">
                              <span className="lf2-label">
                                Building
                                {locationFieldsRequired && ' *'}
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
                                required={locationFieldsRequired}
                              >
                                <option value="">Select building...</option>
                                {buildings.map(b => (
                                  <option key={b.id} value={String(b.id)}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="lf2-field">
                              <span className="lf2-label">
                                Is it a room?
                                {locationFieldsRequired && ' *'}
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
                                required={locationFieldsRequired}
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
                                  {locationFieldsRequired && ' *'}
                                </span>
                                <select
                                  value={reportForm.roomArea}
                                  onChange={e => setReportForm(f => ({ ...f, roomArea: e.target.value }))}
                                  required={locationFieldsRequired}
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
                                  {locationFieldsRequired && ' *'}
                                  {!locationFieldsRequired && <span className="lf2-optional-hint"> (optional)</span>}
                                </span>
                                <input
                                  type="text"
                                  placeholder="e.g. Lobby near reception"
                                  value={reportForm.roomArea}
                                  onChange={e => setReportForm(f => ({ ...f, roomArea: e.target.value }))}
                                  required={locationFieldsRequired}
                                />
                              </label>
                            )}
                          </>
                        )}
                      </div>
                    </section>
                )}

                <section className="lf2-section">
                  <h2 className="lf2-section-title">
                    <span className="lf2-section-icon lf2-section-icon--info"><IconInfo /></span>
                    Description
                    {view === 'report-lost' && <span className="lf2-optional-hint"> (optional)</span>}
                  </h2>
                  <p className="lf2-section-desc">Describe the item to help identify it.</p>
                  <div className="lf2-fields">
                    <label className="lf2-field">
                      <span className="lf2-label">Description{view === 'report-lost' && ' (optional)'}</span>
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
        <button type="button" className="lf2-icon-btn" onClick={() => navigate('/')} aria-label="Go to home">
          <IconHome />
        </button>
        <div className="lf2-logo-wrap">
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
        {[
          { id: 'All Items', name: 'All Items' },
          ...reportCategories.map((category) => ({
            id: category.id != null ? String(category.id) : `name:${category.name}`,
            name: category.name,
          })),
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`lf2-cat-pill ${categoryFilter === cat.id ? 'lf2-cat-pill--active' : ''}`}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.name}
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
              <span
                className={`lf2-card-status lf2-card-status--${getLostFoundStatusBadgeVariant(item.displayStatus)}`}
                title={item.displayStatus}
              >
                {String(item.displayStatus).toUpperCase()}
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

    </div>
  )
}

export default LostAndFound2
