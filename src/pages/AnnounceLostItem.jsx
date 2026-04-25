import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LostAndFound.css'
import { createLostReport, getLostFoundCategories } from '../api/lostFoundApi'
import { getBuildings, getRoomsByBuildingId } from '../api/locationApi'

const MAX_DESCRIPTION_LENGTH = 500
const DEFAULT_CATEGORIES = ['Electronics', 'Documents', 'Personal Items', 'Accessories']

const AnnounceLostItem = () => {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [locationType, setLocationType] = useState('building')
  const [buildingId, setBuildingId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [roomAreaText, setRoomAreaText] = useState('')
  const [campusLocation, setCampusLocation] = useState('')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

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
        setCategories(result.length ? result : DEFAULT_CATEGORIES)
      })
      .catch(() => {
        if (isMounted) setCategories(DEFAULT_CATEGORIES)
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (locationType !== 'building' || !buildingId) {
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
  }, [locationType, buildingId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const formData = new FormData(event.currentTarget)
      const selectedBuilding = buildings.find((b) => String(b.id) === String(buildingId))
      const selectedRoom = rooms.find((r) => String(r.id) === String(roomId))
      let location = ''
      if (locationType === 'building') {
        location = [selectedBuilding?.name, roomId ? selectedRoom?.name : roomAreaText].filter(Boolean).join(', ').trim()
      } else {
        location = (campusLocation || '').trim()
      }
      if (!location) {
        alert('Please provide location details (building and room/area, or campus).')
        setIsSubmitting(false)
        return
      }
      const timeLost = String(formData.get('timeLost') || '').trim() || '12:00'
      const lostBody = {
        type: 'lost',
        itemName: String(formData.get('itemName') || '').trim(),
        category: String(formData.get('category') || '').trim() || DEFAULT_CATEGORIES[0],
        description: String(description || '').trim(),
        location,
        dateLost: String(formData.get('dateLost') || '').trim(),
        timeLost,
        contactName: String(formData.get('contactName') || '').trim(),
        contactPhone: String(formData.get('contactPhone') || '').trim(),
        status: 'pending',
      }
      if (photoFile) {
        const fd = new FormData()
        Object.entries(lostBody).forEach(([k, v]) => {
          if (v !== undefined && v !== null && String(v).trim() !== '') fd.append(k, String(v))
        })
        fd.append('files', photoFile)
        await createLostReport(fd)
      } else {
        await createLostReport(lostBody)
      }
      alert('Lost item report submitted for review.')
      navigate('/lost-and-found')
    } catch (err) {
      alert(err?.message || 'Failed to submit lost item report.')
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
      aria-labelledby="lf-report-title"
    >
      <div className="lf-report-popup">
        <header className="lf-report-popup-header">
          <button type="button" className="lf-icon-button lf-report-popup-back" onClick={() => navigate(-1)} aria-label="Close">
            <span className="lf-back-arrow">‹</span>
          </button>
          <div className="lf-header-title lf-report-popup-header-title">
            <h1 id="lf-report-title">Report Lost Item</h1>
            <span className="lf-subtitle">Report your lost item to help others find it</span>
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
                <select required defaultValue="" name="category">
                  <option value="" disabled>Category *</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
          </div>
        </section>

        {/* 2. Location Details (optional for lost items) */}
        <section className="lf-report-section">
          <h2 className="lf-report-section-title">
            <span className="lf-report-section-num">2</span>
            Location Details
          </h2>
          <div className="lf-report-fields">
            <label className="lf-field">
              <select value={locationType} onChange={(e) => setLocationType(e.target.value)}>
                <option value="building">Building</option>
                <option value="campus">Campus</option>
              </select>
            </label>
            {locationType === 'building' && (
              <>
                <label className="lf-field">
                  <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
                    <option value="">Building (optional)</option>
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
                      <option value="">Room (optional)</option>
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
                      placeholder="Room/Area (optional)"
                      value={roomAreaText}
                      onChange={(e) => setRoomAreaText(e.target.value)}
                      disabled={Boolean(roomId)}
                    />
                  </label>
                </div>
              </>
            )}
            {locationType === 'campus' && (
              <label className="lf-field">
                <input
                  type="text"
                  placeholder="Campus location"
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                />
              </label>
            )}
          </div>
        </section>

        {/* 3. When did you lose it? */}
        <section className="lf-report-section">
          <h2 className="lf-report-section-title">
            <span className="lf-report-section-num">3</span>
            When did you lose it?
          </h2>
          <div className="lf-report-fields">
            <div className="lf-field-row">
              <label className="lf-field">
                <span className="lf-field-label">Date</span>
                <input type="date" required name="dateLost" />
              </label>
              <label className="lf-field">
                <span className="lf-field-label">Time</span>
                <input type="time" name="timeLost" />
              </label>
            </div>
          </div>
        </section>

        {/* 4. Description */}
        <section className="lf-report-section">
          <h2 className="lf-report-section-title">
            <span className="lf-report-section-num">4</span>
            Description
          </h2>
          <div className="lf-report-fields">
            <label className="lf-field lf-field-textarea-wrap">
              <textarea
                rows={4}
                placeholder="Describe the item (optional)"
                value={description}
                onChange={handleDescriptionChange}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <span className="lf-char-count">{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
            </label>
          </div>
        </section>

        {/* 5. Photos (optional for lost items) */}
        <section className="lf-report-section">
          <h2 className="lf-report-section-title">
            <span className="lf-report-section-num">5</span>
            Photos
          </h2>
          <div className="lf-report-fields">
            <label className="lf-add-photo">
              <input
                type="file"
                accept="image/*"
                name="photo"
                className="lf-add-photo-input"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              <span className="lf-add-photo-icon">🖼️+</span>
              <span className="lf-add-photo-text">Add Photo</span>
              {photoFile && <span className="lf-add-photo-filename">{photoFile.name}</span>}
            </label>
          </div>
        </section>

        {/* 6. Your Contact Information */}
        <section className="lf-report-section">
          <h2 className="lf-report-section-title">
            <span className="lf-report-section-num">6</span>
            Your Contact Information
          </h2>
          <div className="lf-report-fields">
            <label className="lf-field">
              <input type="text" required name="contactName" placeholder="Your Name *" />
            </label>
            <label className="lf-field">
              <input type="tel" required name="contactPhone" placeholder="Phone Number *" />
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

export default AnnounceLostItem
