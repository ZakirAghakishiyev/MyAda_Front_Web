import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  clubAdminListItems,
  deleteClubAdminFile,
  fetchClub,
  fetchClubAdminFiles,
  patchClubAdminFile,
  patchClubAdminProfile,
  patchClubAdminProfileLogoOnly,
  patchClubAdminProfileBackgroundOnly,
  postClubAdminFile,
} from '../../api/clubApi'
import { mapClubFileItemFromApi, mapClubFromApi } from '../../api/clubMappers'
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
  const [savingLogo, setSavingLogo] = useState(false)
  const [savingBackground, setSavingBackground] = useState(false)
  const [savingFocusAreas, setSavingFocusAreas] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingResources, setSavingResources] = useState(false)
  const [resourceRows, setResourceRows] = useState([])

  const logoInputRef = useRef(null)
  const bgInputRef = useRef(null)
  /** JSON string of normalized focus list last synced from server (omit `focusAreasJson` on PATCH when unchanged). */
  const lastServerComparableFocusRef = useRef('')
  /** File item ids from last successful load of {@link fetchClubAdminFiles} (or from mapped club `resources` fallback). */
  const fileIdsOnLoadRef = useRef(new Set())
  /** @type {React.MutableRefObject<Map<string, { title: string, url: string }>>} */
  const rowMetaByIdRef = useRef(new Map())

  const loadClubAndFiles = useCallback(async () => {
    if (!clubId) return null
    const [rawClub, filesRes] = await Promise.all([
      fetchClub(clubId),
      fetchClubAdminFiles(clubId).catch(() => null),
    ])
    const mapped = mapClubFromApi(rawClub)
    if (mapped) setActiveClub(mapped)
    const fromFiles = filesRes
      ? clubAdminListItems(filesRes).map(mapClubFileItemFromApi).filter(Boolean)
      : []
    if (fromFiles.length) {
      setResourceRows(
        fromFiles.map((r, i) => ({
          rowId: `srv-f-${r.id || i}`,
          id: r.id,
          title: r.title,
          url: r.url,
          file: null,
          voidFileId: null,
        }))
      )
      const ids = new Set(fromFiles.map((x) => x.id).filter(Boolean))
      fileIdsOnLoadRef.current = ids
      const m = new Map()
      for (const r of fromFiles) {
        if (r.id) m.set(String(r.id), { title: r.title, url: r.url })
      }
      rowMetaByIdRef.current = m
      return mapped
    }
    if (mapped) {
      const list = Array.isArray(mapped.resources) ? mapped.resources : []
      setResourceRows(
        list.map((r, i) => ({
          rowId: `srv-c-${String(r.id ?? i)}`,
          id: r.id != null ? String(r.id) : '',
          title: r.title ? String(r.title) : '',
          url: r.url ? String(r.url) : '',
          file: null,
          voidFileId: null,
        }))
      )
      fileIdsOnLoadRef.current = new Set(list.map((r) => r.id).filter(Boolean))
      const m = new Map()
      for (const r of list) {
        if (r.id) m.set(String(r.id), { title: r.title, url: r.url })
      }
      rowMetaByIdRef.current = m
      return mapped
    }
    setResourceRows([])
    fileIdsOnLoadRef.current = new Set()
    rowMetaByIdRef.current = new Map()
    return null
  }, [clubId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadClubAndFiles()
      } catch {
        if (!cancelled) setActiveClub(null)
      }
    })()
    return () => { cancelled = true }
  }, [loadClubAndFiles])

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
      await loadClubAndFiles()
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
      { rowId: `tmp-${Date.now()}`, id: '', title: '', url: '', file: null, voidFileId: null },
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
      .filter((r) => !r.file && (r.url || '').trim() && !r.voidFileId)
      .filter((r) => !r.id)
      .map((r) => {
        const url = String(r.url || '').trim()
        const title = String(r.title || '').trim()
        const out = { url }
        if (title) out.title = title
        return out
      })
    const presentFileIds = new Set(rows.map((r) => String(r.id || '').trim()).filter(Boolean))
    const toDelete = new Set(
      [...fileIdsOnLoadRef.current].filter((id) => id && !presentFileIds.has(String(id)))
    )
    for (const r of rows) {
      if (r.voidFileId) toDelete.add(String(r.voidFileId))
    }

    setSavingResources(true)
    try {
      for (const fileId of toDelete) {
        if (!fileId) continue
        await deleteClubAdminFile(clubId, fileId)
      }
      for (const r of rows) {
        if (r.voidFileId) continue
        if (r.file instanceof File) {
          if (r.id) {
            const fd = new FormData()
            fd.append('file', r.file, r.file.name)
            const t = String(r.title || '').trim()
            if (t) fd.append('title', t)
            await patchClubAdminFile(clubId, r.id, fd)
          } else {
            await postClubAdminFile(clubId, r.file, String(r.title || '').trim())
          }
        }
      }
      for (const r of rows) {
        if (r.voidFileId || (r.file instanceof File) || !r.id) continue
        const prev = rowMetaByIdRef.current.get(String(r.id))
        const title = String(r.title || '').trim()
        if (prev && title !== (prev.title || '').trim()) {
          const fd = new FormData()
          fd.append('title', title)
          await patchClubAdminFile(clubId, r.id, fd)
        }
      }
      if (keepPayload.length) {
        const fd = new FormData()
        fd.append('resourcesJson', JSON.stringify(keepPayload))
        await patchClubAdminProfile(clubId, fd)
      }
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

  const saveClubLogo = async () => {
    if (!activeClub || !clubId) return
    if (!logoFile) {
      alert('Choose a logo file first.')
      return
    }
    setSavingLogo(true)
    try {
      await patchClubAdminProfileLogoOnly(clubId, logoFile)
      setLogoFile(null)
      setLogoPreview('')
      if (logoInputRef.current) logoInputRef.current.value = ''
      await reloadClub()
      alert('Logo saved.')
    } catch (e) {
      alert(e?.message || 'Could not save logo.')
    } finally {
      setSavingLogo(false)
    }
  }

  const saveClubBackground = async () => {
    if (!activeClub || !clubId) return
    if (!bgFile) {
      alert('Choose a background image first.')
      return
    }
    setSavingBackground(true)
    try {
      await patchClubAdminProfileBackgroundOnly(clubId, bgFile)
      setBgFile(null)
      setBgPreview('')
      if (bgInputRef.current) bgInputRef.current.value = ''
      await reloadClub()
      alert('Background image saved.')
    } catch (e) {
      alert(e?.message || 'Could not save background image.')
    } finally {
      setSavingBackground(false)
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
            Add up to 50 documents. New uploads and replacements go through file upload; use Save to apply. Remove
            a row to delete that file, or &quot;Remove file&quot; then save to clear an attachment.
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
                        onClick={() => updateResourceRow(row.rowId, {
                          url: '',
                          file: null,
                          id: '',
                          voidFileId: row.id || null,
                        })}
                        title="Remove this document from the club; save to apply"
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
            Save the logo and the wide background separately: <code>logoFile</code> and <code>backgroundFile</code> on
            {' '}
            <code>PATCH /club-admin/&#123;id&#125;/profile</code> (per API). Published values map to{' '}
            <code>profileImageUrl</code> (round logo) and <code>backgroundImageUrl</code> for the hero. The top-level
            <code>image</code> field, if present, is used as a background/hero candidate, not the round logo. Each
            upload is a separate request so the two are not mixed up.
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      type="button"
                      className="club-admin-btn-primary"
                      onClick={() => void saveClubLogo()}
                      disabled={!logoFile || savingLogo}
                    >
                      {savingLogo ? 'Saving…' : 'Save logo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="club-admin-field">
              <label>Background image</label>
              <div
                className="club-admin-profile-bg-preview"
                style={{
                  backgroundImage: (bgPreview || activeClub.bannerImage)
                    ? `url(${bgPreview || activeClub.bannerImage})`
                    : undefined,
                }}
                aria-label="Background preview"
                onClick={pickBackground}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pickBackground() }}
              >
                {!bgPreview && !activeClub.bannerImage && (
                  <div className="club-admin-profile-bg-placeholder">Click to upload background</div>
                )}
              </div>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => onBackgroundFile(e.target.files?.[0] ?? null)}
                style={{ display: 'none' }}
              />
              {bgFile && <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb' }}>{bgFile.name}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="club-admin-btn-primary"
                  onClick={() => void saveClubBackground()}
                  disabled={!bgFile || savingBackground}
                >
                  {savingBackground ? 'Saving…' : 'Save background'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

