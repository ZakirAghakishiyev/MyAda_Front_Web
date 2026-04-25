import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchClub,
  patchClubAdminProfile,
  uploadStudentServicesClubProfileImage,
  uploadStudentServicesClubBackgroundImage,
} from '../../api/clubApi'
import { mapClubFromApi } from '../../api/clubMappers'
import { useClubAdminClubId } from '../../hooks/useClubAdminClubId'
import { FOCUS_ICON_OPTIONS, ClubFocusAreaIcon } from '../../components/club/ClubFocusAreaIcon'
import './ClubAdmin.css'

const FocusIcon = ClubFocusAreaIcon

function serializeComparableFocusAreasFromApi(list) {
  const normalized = (Array.isArray(list) ? list : [])
    .map((area) => {
      if (typeof area === 'string') {
        const t = area.trim()
        return t ? { icon: 'target', title: t, description: '' } : null
      }
      if (!area || typeof area !== 'object') return null
      const title = String(area.title ?? '').trim()
      const description = String(area.description ?? '').trim()
      if (!title && !description) return null
      return {
        icon: String(area.icon || 'target'),
        title,
        description,
      }
    })
    .filter(Boolean)
  return JSON.stringify(normalized)
}

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const SOCIAL_KEYS = ['website', 'instagram', 'x', 'tiktok']

/** Merge-patch for `socialLinks`: only keys that changed vs baseline; empty string clears on server. */
function buildSocialLinksMergePatch(baseline, profile) {
  const patch = {}
  for (const k of SOCIAL_KEYS) {
    const cur = String(profile[k] ?? '').trim()
    const base = String(baseline[k] ?? '').trim()
    if (cur !== base) patch[k] = cur
  }
  return patch
}

export default function ClubAdminProfile() {
  const clubId = useClubAdminClubId()
  const [activeClub, setActiveClub] = useState(null)

  const initialProfile = useMemo(() => {
    if (!activeClub) {
      return {
        email: '',
        website: '',
        instagram: '',
        x: '',
        tiktok: '',
        backgroundImage: '',
      }
    }
    const email =
      activeClub.email != null && String(activeClub.email).trim() ? String(activeClub.email).trim() : ''
    return {
      email,
      website: activeClub.website ? String(activeClub.website) : '',
      instagram: activeClub.instagram ? String(activeClub.instagram) : '',
      x: activeClub.x ? String(activeClub.x) : '',
      tiktok: activeClub.tiktok ? String(activeClub.tiktok) : '',
    }
  }, [activeClub])

  const [profile, setProfile] = useState(initialProfile)
  const [contactBaseline, setContactBaseline] = useState({
    email: '',
    website: '',
    instagram: '',
    x: '',
    tiktok: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [bgFile, setBgFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [bgPreview, setBgPreview] = useState('')
  const [focusAreas, setFocusAreas] = useState([])
  const [iconPickerFor, setIconPickerFor] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingFocusAreas, setSavingFocusAreas] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingResources, setSavingResources] = useState(false)
  const [resourceRows, setResourceRows] = useState([])

  const logoInputRef = useRef(null)
  const bgInputRef = useRef(null)
  /** JSON string of normalized focus list last synced from server (omit `focusAreasJson` on PATCH when unchanged). */
  const lastServerComparableFocusRef = useRef('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = await fetchClub(clubId)
        if (cancelled) return
        const mapped = mapClubFromApi(raw)
        if (mapped) setActiveClub(mapped)
      } catch {
        if (!cancelled) setActiveClub(null)
      }
    })()
    return () => { cancelled = true }
  }, [clubId])

  const resourcesSig = useMemo(() => {
    if (!activeClub || String(activeClub.id) !== String(clubId)) return `${clubId}:`
    const body = JSON.stringify(
      (activeClub.resources || []).map((r) => [String(r.id ?? ''), r.url || '', r.title || ''])
    )
    return `${clubId}:${body}`
  }, [activeClub, clubId])

  useEffect(() => {
    setProfile(initialProfile)
    setContactBaseline({
      email: (initialProfile.email || '').trim(),
      website: (initialProfile.website || '').trim(),
      instagram: (initialProfile.instagram || '').trim(),
      x: (initialProfile.x || '').trim(),
      tiktok: (initialProfile.tiktok || '').trim(),
    })
    setLogoFile(null)
    setBgFile(null)
    setLogoPreview('')
    setBgPreview('')
    setIconPickerFor(null)
  }, [initialProfile])

  useEffect(() => {
    if (!activeClub || String(activeClub.id) !== String(clubId)) return
    setResourceRows(
      (activeClub.resources || []).map((r, i) => ({
        rowId: `srv-${String(r.id ?? i)}-${r.url || ''}`,
        id: r.id != null ? String(r.id) : '',
        title: r.title ? String(r.title) : '',
        url: r.url ? String(r.url) : '',
        file: null,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `resourcesSig` already tracks server resources; avoid re-running when unrelated `activeClub` fields change
  }, [resourcesSig, clubId])

  useEffect(() => {
    if (!clubId || !activeClub || String(activeClub.id) !== String(clubId)) return
    lastServerComparableFocusRef.current = serializeComparableFocusAreasFromApi(activeClub.focusAreas)
    setFocusAreas(
      (activeClub.focusAreas || []).map((area, idx) => ({
        id: `${clubId}-focus-${idx}`,
        icon: area.icon || 'target',
        title: typeof area === 'string' ? area : area.title || '',
        description: typeof area === 'string' ? '' : area.description || '',
      }))
    )
  }, [clubId, activeClub])

  const pickLogo = () => logoInputRef.current?.click()
  const pickBackground = () => bgInputRef.current?.click()

  const hasUnsavedContact = useMemo(() => {
    const emailCur = (profile.email || '').trim()
    const emailBase = (contactBaseline.email || '').trim()
    if (emailCur !== emailBase) return true
    const patch = buildSocialLinksMergePatch(contactBaseline, profile)
    return Object.keys(patch).length > 0
  }, [profile, contactBaseline])

  const reloadClub = async () => {
    if (!clubId) return
    try {
      const raw = await fetchClub(clubId)
      const mapped = mapClubFromApi(raw)
      if (mapped) setActiveClub(mapped)
    } catch {
      /* ignore */
    }
  }

  const saveContactAndLinks = async () => {
    if (!activeClub || !clubId) return
    const socialPatch = buildSocialLinksMergePatch(contactBaseline, profile)
    const emailNext = (profile.email || '').trim()
    const emailBase = (contactBaseline.email || '').trim()
    const emailChanged = emailNext !== emailBase
    if (Object.keys(socialPatch).length === 0 && !emailChanged) {
      alert('Nothing to save.')
      return
    }
    const formData = new FormData()
    if (Object.keys(socialPatch).length > 0) {
      formData.append('socialLinks', JSON.stringify(socialPatch))
    }
    if (emailChanged) {
      formData.append('email', emailNext)
    }
    setSavingContact(true)
    try {
      await patchClubAdminProfile(clubId, formData)
      await reloadClub()
      alert('Contact and links saved.')
    } catch (e) {
      alert(e?.message || 'Could not save contact and links.')
    } finally {
      setSavingContact(false)
    }
  }

  const addResourceRow = () => {
    if (resourceRows.length >= 50) return
    setResourceRows((prev) => [
      ...prev,
      { rowId: `tmp-${Date.now()}`, id: '', title: '', url: '', file: null },
    ])
  }

  const updateResourceRow = (rowId, patch) => {
    setResourceRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
  }

  const removeResourceRow = (rowId) => {
    setResourceRows((prev) => prev.filter((r) => r.rowId !== rowId))
  }

  const saveResourcesList = async () => {
    if (!clubId) return
    const rows = resourceRows.slice(0, 50)
    const keepPayload = rows
      .filter((r) => !r.file && (r.url || '').trim())
      .map((r) => {
        const url = String(r.url || '').trim()
        const title = String(r.title || '').trim()
        const out = { url }
        if (title) out.title = title
        const id = String(r.id || '').trim()
        if (id && !String(r.rowId).startsWith('tmp-')) out.id = id
        return out
      })
    const newFileRows = rows
      .filter((r) => r.file instanceof File)
      .map((r) => ({ title: String(r.title || '').trim(), file: r.file }))
    setSavingResources(true)
    try {
      const formData = new FormData()
      // Existing resources are kept via JSON; new ones are uploaded as files.
      // Backend is expected to attach URLs for uploaded files and return them on next GET.
      formData.append('resourcesJson', JSON.stringify(keepPayload))
      if (newFileRows.length) {
        const meta = []
        for (const r of newFileRows) {
          formData.append('resourceFiles', r.file)
          meta.push({ title: r.title })
        }
        formData.append('resourceFilesMetaJson', JSON.stringify(meta))
      }
      await patchClubAdminProfile(clubId, formData)
      await reloadClub()
      alert('Resources saved.')
    } catch (e) {
      alert(e?.message || 'Could not save resources.')
    } finally {
      setSavingResources(false)
    }
  }

  const onLogoFile = async (file) => {
    if (!file) return
    setLogoFile(file)
    try {
      const url = await fileToDataUrl(file)
      setLogoPreview(String(url))
    } catch {
      setLogoPreview('')
    }
  }

  const onBackgroundFile = async (file) => {
    if (!file) return
    setBgFile(file)
    try {
      const url = await fileToDataUrl(file)
      setBgPreview(String(url))
    } catch {
      setBgPreview('')
    }
  }

  const updateFocusArea = (id, patch) => {
    setFocusAreas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const addFocusArea = () => {
    if (focusAreas.length >= 6) return
    setFocusAreas((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, icon: 'target', title: '', description: '' },
    ])
  }

  const removeFocusArea = (id) => {
    setFocusAreas((prev) => prev.filter((f) => f.id !== id))
    setIconPickerFor((prev) => (prev === id ? null : prev))
  }

  const selectFocusIcon = (id, iconKey) => {
    updateFocusArea(id, { icon: iconKey })
    setIconPickerFor(null)
  }

  const normalizedFocusAreasPayload = () =>
    focusAreas
      .map((area) => ({
        icon: area.icon,
        title: area.title.trim(),
        description: area.description.trim(),
      }))
      .filter((area) => area.title || area.description)

  const confirmFocusAreas = async () => {
    if (!activeClub) return
    const payload = normalizedFocusAreasPayload()
    const formData = new FormData()
    formData.append('focusAreasJson', JSON.stringify(payload))
    setSavingFocusAreas(true)
    try {
      const result = await patchClubAdminProfile(clubId, formData)
      const saved =
        result && typeof result === 'object' && Array.isArray(result.focusAreas) ? result.focusAreas : payload
      alert('Key focus areas saved.')
      lastServerComparableFocusRef.current = serializeComparableFocusAreasFromApi(saved)
      setActiveClub((prev) => (prev ? { ...prev, focusAreas: saved } : prev))
    } catch (e) {
      alert(e?.message || 'Could not save focus areas.')
    } finally {
      setSavingFocusAreas(false)
    }
  }

  const askForChange = async () => {
    if (!activeClub) return
    const socialPatch = buildSocialLinksMergePatch(contactBaseline, profile)
    const emailNext = (profile.email || '').trim()
    const emailBase = (contactBaseline.email || '').trim()
    const emailChanged = emailNext !== emailBase
    const focusPayload = normalizedFocusAreasPayload()
    const focusSerialized = JSON.stringify(focusPayload)
    const sentFocus = focusSerialized !== lastServerComparableFocusRef.current
    const hasPart =
      Boolean(logoFile) ||
      Boolean(bgFile) ||
      Object.keys(socialPatch).length > 0 ||
      emailChanged ||
      sentFocus
    if (!hasPart) {
      alert('Nothing to submit. Add a logo, background image, update contact/links, or change key focus areas.')
      return
    }
    setSavingProfile(true)
    try {
      if (logoFile) {
        try {
          await uploadStudentServicesClubProfileImage(clubId, logoFile)
        } catch (e) {
          // Student Services route is admin-only on some gateways; fall back to direct club-admin persist.
          if (e?.status === 403 || e?.status === 404) {
            const logoFd = new FormData()
            logoFd.append('logoFile', logoFile)
            await patchClubAdminProfile(clubId, logoFd)
          } else {
            throw e
          }
        }
      }
      if (bgFile) {
        await uploadStudentServicesClubBackgroundImage(clubId, bgFile)
      }
      const patchFd = new FormData()
      if (Object.keys(socialPatch).length > 0) {
        patchFd.append('socialLinks', JSON.stringify(socialPatch))
      }
      if (emailChanged) {
        patchFd.append('email', emailNext)
      }
      if (sentFocus) {
        patchFd.append('focusAreasJson', focusSerialized)
      }
      const hasTextPatch =
        Object.keys(socialPatch).length > 0 || emailChanged || sentFocus
      if (hasTextPatch) {
        await patchClubAdminProfile(clubId, patchFd)
      }
      const parts = []
      if (logoFile) parts.push('logo sent to Student Services for review')
      if (bgFile) parts.push('background submitted')
      if (hasTextPatch) parts.push('profile text saved')
      alert(parts.length ? `${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('. ')}.` : 'Done.')
      setLogoFile(null)
      setLogoPreview('')
      setBgFile(null)
      setBgPreview('')
      await reloadClub()
    } catch (e) {
      alert(e?.message || 'Could not submit profile changes.')
    } finally {
      setSavingProfile(false)
    }
  }

  if (!activeClub) {
    return (
      <div className="club-admin-page">
        <div className="club-admin-content">
          <div className="club-admin-card">
            <div className="club-admin-card-head">
              <h2 className="club-admin-card-title">Club Profile</h2>
            </div>
            <p style={{ margin: 0, color: '#64748b' }}>
              Select a club first (use the <code>?club=</code> query parameter) to edit profile settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="club-admin-page">
      <div className="club-admin-content">
        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Club Profile</h2>
          </div>
          <p style={{ margin: 0, color: '#64748b' }}>
            Public contact email, links, and resources are saved immediately and match the student club detail page.
          </p>
        </div>

        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Contact &amp; public links</h2>
          </div>

          <div className="club-admin-profile-links-fixed">
            <div className="club-admin-field">
              <label>Public contact email</label>
              <input
                type="email"
                maxLength={320}
                placeholder="name@university.edu"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
              <small className="club-admin-char-limit">Save with the field cleared to remove the public email.</small>
            </div>
            <div className="club-admin-field">
              <label>Website</label>
              <input type="url" placeholder="https://..." value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} />
            </div>
            <div className="club-admin-field">
              <label>Instagram</label>
              <input type="url" placeholder="https://instagram.com/..." value={profile.instagram} onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))} />
            </div>
            <div className="club-admin-field">
              <label>X (Twitter)</label>
              <input type="url" placeholder="https://x.com/..." value={profile.x} onChange={(e) => setProfile((p) => ({ ...p, x: e.target.value }))} />
            </div>
            <div className="club-admin-field">
              <label>TikTok</label>
              <input type="url" placeholder="https://www.tiktok.com/@..." value={profile.tiktok} onChange={(e) => setProfile((p) => ({ ...p, tiktok: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <small className="club-admin-char-limit" style={{ marginTop: 0 }}>
              Only changed links are sent. Clear a link and save to remove it on the public page.
            </small>
            <button type="button" className="club-admin-btn-primary" onClick={saveContactAndLinks} disabled={!hasUnsavedContact || savingContact}>
              {savingContact ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Resources &amp; documents</h2>
          </div>
          <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 14 }}>
            Upload up to 50 documents. Saving replaces the whole list (remove all rows and save to clear).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resourceRows.map((row) => (
              <div key={row.rowId} className="club-admin-resource-row">
                <div className="club-admin-field club-admin-resource-row__title">
                  <label>Title</label>
                  <input
                    type="text"
                    placeholder="Document name"
                    value={row.title}
                    onChange={(e) => updateResourceRow(row.rowId, { title: e.target.value })}
                  />
                </div>
                <div className="club-admin-field club-admin-resource-row__file">
                  <label>File</label>
                  {row.url && !row.file ? (
                    <div className="club-admin-resource-existing">
                      <a href={row.url} target="_blank" rel="noreferrer" className="club-admin-resource-link">
                        View current file
                      </a>
                      <button
                        type="button"
                        className="club-admin-btn-secondary"
                        onClick={() => updateResourceRow(row.rowId, { url: '', id: '' })}
                        title="Remove this existing document"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label className="club-admin-file-picker">
                      <input
                        type="file"
                        onChange={(e) => updateResourceRow(row.rowId, { file: e.target.files?.[0] ?? null })}
                      />
                      <span className="club-admin-file-picker__btn">Choose file</span>
                      <span className="club-admin-file-picker__name">{row.file ? row.file.name : 'No file chosen'}</span>
                    </label>
                  )}
                </div>
                <button type="button" className="club-admin-btn-secondary club-admin-resource-row__remove" onClick={() => removeResourceRow(row.rowId)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="club-admin-btn-secondary" onClick={addResourceRow} disabled={resourceRows.length >= 50}>
              + Add document
            </button>
            <button type="button" className="club-admin-btn-primary" onClick={saveResourcesList} disabled={savingResources}>
              {savingResources ? 'Saving…' : 'Save resources'}
            </button>
          </div>
        </div>

        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Key Focus Areas</h2>
          </div>

          <div className="club-admin-profile-focus-list">
            {focusAreas.map((area) => (
              <div key={area.id} className="club-admin-profile-focus-item">
                <div className="club-admin-form-row">
                  <div className="club-admin-field">
                    <label>Icon</label>
                    <div className="club-admin-icon-picker">
                      <button
                        type="button"
                        className="club-admin-icon-picker-trigger"
                        onClick={() => setIconPickerFor((prev) => (prev === area.id ? null : area.id))}
                      >
                        <span className="club-admin-icon-picker-trigger-icon">
                          <FocusIcon name={area.icon} />
                        </span>
                        Choose icon
                      </button>
                      {iconPickerFor === area.id && (
                        <div className="club-admin-icon-picker-grid" role="listbox" aria-label="Focus area icon selection">
                          {FOCUS_ICON_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              className={`club-admin-icon-picker-option ${area.icon === opt.key ? 'club-admin-icon-picker-option--active' : ''}`}
                              onClick={() => selectFocusIcon(area.id, opt.key)}
                              title={opt.label}
                              aria-label={opt.label}
                            >
                              <FocusIcon name={opt.key} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="club-admin-field">
                    <label>Heading (max 40)</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={area.title}
                      onChange={(e) => updateFocusArea(area.id, { title: e.target.value })}
                      placeholder="e.g. Portrait & Street"
                    />
                    <small className="club-admin-char-limit">{area.title.length}/40</small>
                  </div>
                </div>
                <div className="club-admin-field">
                  <label>Body (max 180)</label>
                  <textarea
                    maxLength={180}
                    rows={3}
                    value={area.description}
                    onChange={(e) => updateFocusArea(area.id, { description: e.target.value })}
                    placeholder="Describe this focus area..."
                  />
                  <small className="club-admin-char-limit">{area.description.length}/180</small>
                </div>
                <div className="club-admin-profile-focus-preview">
                  <span className="club-admin-profile-focus-icon"><FocusIcon name={area.icon} /></span>
                  <div>
                    <div className="club-admin-profile-focus-title">{area.title || 'Focus Area Title'}</div>
                    <div className="club-admin-profile-focus-text">{area.description || 'Focus area description preview.'}</div>
                  </div>
                </div>
                <div className="club-admin-profile-focus-actions">
                  <button type="button" className="club-admin-btn-secondary" onClick={() => removeFocusArea(area.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="club-admin-btn-secondary" onClick={addFocusArea} disabled={focusAreas.length >= 6}>
              + Add Focus Area
            </button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                type="button"
                className="club-admin-btn-primary"
                onClick={confirmFocusAreas}
                disabled={savingFocusAreas}
              >
                {savingFocusAreas ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>

        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Branding</h2>
          </div>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14 }}>
            Club logo is uploaded to Student Services as a pending change until an administrator approves it.
            Background images use the same Student Services flow when available; otherwise they are saved via club admin.
          </p>

          <div className="club-admin-profile-branding-grid">
            <div className="club-admin-field">
              <label>Club logo</label>
              <div className="club-admin-profile-logo-row">
                <div
                  className="club-admin-profile-logo-preview"
                  style={{
                    backgroundImage: `url(${logoPreview || activeClub.image || ''})`,
                  }}
                  aria-label="Logo preview"
                />
                <div style={{ flex: 1 }}>
                  <div className="club-admin-upload-zone" onClick={pickLogo} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pickLogo() }}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
                    />
                    <IconUpload />
                    <div style={{ marginTop: 8, fontWeight: 600 }}>Click to upload logo</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>PNG/JPG/SVG • recommended square</div>
                    {logoFile && <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb' }}>{logoFile.name}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="club-admin-field">
              <label>Background image</label>
              <div
                className="club-admin-profile-bg-preview"
                style={{ backgroundImage: bgPreview ? `url(${bgPreview})` : undefined }}
                aria-label="Background preview"
                onClick={pickBackground}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pickBackground() }}
              >
                {!bgPreview && <div className="club-admin-profile-bg-placeholder">Click to upload background</div>}
              </div>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => onBackgroundFile(e.target.files?.[0] ?? null)}
                style={{ display: 'none' }}
              />
              {bgFile && <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb' }}>{bgFile.name}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="club-admin-btn-primary" onClick={askForChange} disabled={savingProfile}>
              {savingProfile ? 'Submitting…' : 'Ask for Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

