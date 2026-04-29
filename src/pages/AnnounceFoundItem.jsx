import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LostAndFound.css'
import { createFoundReport, getLostFoundCategories } from '../api/lostFoundApi'
import { getBuildings, getRoomsByBuildingId, validateRoomLocation } from '../api/locationApi'

const MAX_DESCRIPTION_LENGTH = 500
const DEFAULT_CATEGORIES = []

const AnnounceFoundItem = () => {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [buildingId, setBuildingId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [roomAreaText, setRoomAreaText] = useState('')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  useEffect(() => {
    let isMounted = true
    getBuildings()
      .then((result) => {
        if (isMounted) setBuildings(result)
      })
      .catch(() => {
        if (isMounted) setBuildings([])
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    getLostFoundCategories()
      .then((result) => {
        if (!isMounted) return
        const nextCategories = result.length ? result : DEFAULT_CATEGORIES
        setCategories(nextCategories)
        setSelectedCategoryId((current) => {
          if (nextCategories.some((category) => String(category.id) === String(current))) return current
          const firstValid = nextCategories.find((category) => category.id != null)
          return firstValid ? String(firstValid.id) : ''
        })
      })
      .catch(() => {
        if (!isMounted) return
        setCategories(DEFAULT_CATEGORIES)
        setSelectedCategoryId('')
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!buildingId) {
      setRooms([])
      return
    }
    let isMounted = true
    getRoomsByBuildingId(buildingId)
      .then((result) => {
        if (isMounted) setRooms(result)
      })
      .catch(() => {
        if (isMounted) setRooms([])
      })
    return () => {
      isMounted = false
    }
  }, [buildingId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!photoFile) {
      alert('Please attach at least one image.')
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData(event.currentTarget)
      if (!selectedCategoryId) {
        alert('Please choose a valid category.')
        setIsSubmitting(false)
        return
      }
      if (roomId) {
        const isValid = await validateRoomLocation(roomId, buildingId)
        if (!isValid) {
          alert('Selected room does not belong to selected building.')
          setIsSubmitting(false)
          return
        }
      }
      const selectedBuilding = buildings.find((b) => String(b.id) === String(buildingId))
      const selectedRoom = rooms.find((r) => String(r.id) === String(roomId))
      const roomOrArea = roomId
        ? String(selectedRoom?.name || selectedRoom?.number || '').trim()
        : String(roomAreaText || '').trim()
      if (!selectedBuilding?.name || !roomOrArea) {
        alert('Building and room/area are required.')
        setIsSubmitting(false)
        return
      }
      const foundFields = {
        itemName: String(formData.get('itemName') || '').trim(),
        categoryId: Number(selectedCategoryId),
        description: String(description || '').trim(),
        locationType: 'building',
        building: selectedBuilding.name,
        isRoom: roomId ? 'true' : 'false',
        roomOrArea,
        collectionPlace: String(formData.get('collectionPlace') || '').trim(),
      }
      await createFoundReport(foundFields, [photoFile])
      alert('Found item report submitted for review.')
      navigate(-1)
    } catch (err) {
      alert(err?.message || 'Failed to submit found item report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDescriptionChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_DESCRIPTION_LENGTH) setDescription(value)
  }

  return (
    <div
      className="lf-report-popup-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lf-report-found-title"
    >
      <div className="lf-report-popup">
        <header className="lf-report-popup-header">
          <button type="button" className="lf-icon-button lf-report-popup-back" onClick={() => navigate(-1)} aria-label="Close">
            <span className="lf-back-arrow">‹</span>
          </button>
          <div className="lf-header-title lf-report-popup-header-title">
            <h1 id="lf-report-found-title">Report Found Item</h1>
            <span className="lf-subtitle">Report a found item to help the owner get it back</span>
          </div>
          <div className="lf-report-popup-header-spacer" aria-hidden="true" />
        </header>

        <form className="lf-report-form" onSubmit={handleSubmit}>
          {/* 1. Basic Information */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">1</span>
              Basic Information
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field">
                <input type="text" required name="itemName" placeholder="Item Name *" />
              </label>
              <label className="lf-field">
                <select required value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                  <option value="" disabled>Category *</option>
                  {categories.map((category) => (
                    <option key={category.id ?? category.name} value={category.id != null ? String(category.id) : ''} disabled={category.id == null}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* 2. Location Details (required for found items) */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">2</span>
              Location Details
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field">
                <select required value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
                  <option value="" disabled>Building *</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={String(building.id)}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="lf-field-row">
                <label className="lf-field">
                  <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!buildingId}>
                    <option value="">Select Room (optional)</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={String(room.id)}>
                        {room.name || room.number}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lf-field">
                  <input
                    type="text"
                    required={!roomId}
                    placeholder="Room/Area *"
                    value={roomAreaText}
                    onChange={(e) => setRoomAreaText(e.target.value)}
                    disabled={Boolean(roomId)}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* 3. Description */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">3</span>
              Description
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field lf-field-textarea-wrap">
                <textarea
                  rows={4}
                  placeholder="Describe the item"
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                <span className="lf-char-count">{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
              </label>
            </div>
          </section>

          {/* 5. Photos (required for found items) */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">4</span>
              Photos
            </h2>
            <div className="lf-report-fields">
              <label className="lf-add-photo">
                <input
                  type="file"
                  accept="image/*"
                  className="lf-add-photo-input"
                  required
                  name="photo"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
                <span className="lf-add-photo-icon">🖼️+</span>
                <span className="lf-add-photo-text">Add Photo *</span>
                {photoFile && <span className="lf-add-photo-filename">{photoFile.name}</span>}
              </label>
            </div>
          </section>

          {/* 5. Collection */}
          <section className="lf-report-section">
            <h2 className="lf-report-section-title">
              <span className="lf-report-section-num">5</span>
              Collection
            </h2>
            <div className="lf-report-fields">
              <label className="lf-field">
                <input type="text" required name="collectionPlace" placeholder="Where can it be collected? *" />
              </label>
            </div>
          </section>

          <button type="submit" className="lf-submit-review" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AnnounceFoundItem
