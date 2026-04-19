import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchClub, patchClubAdminProfile } from '../../api/clubApi'
import { mapClubFromApi } from '../../api/clubMappers'
import { useClubAdminClubId } from '../../hooks/useClubAdminClubId'
import './ClubAdmin.css'

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const FOCUS_ICON_OPTIONS = [
  { key: 'target', label: 'Target' },
  { key: 'star', label: 'Star' },
  { key: 'award', label: 'Award' },
  { key: 'sparkles', label: 'Sparkles' },
  { key: 'flag', label: 'Flag' },
  { key: 'compass', label: 'Compass' },
  { key: 'layers', label: 'Layers' },
  { key: 'grid', label: 'Grid' },
  { key: 'circle', label: 'Circle' },
  { key: 'badge', label: 'Badge' },
  { key: 'book', label: 'Book' },
  { key: 'book-open', label: 'Book Open' },
  { key: 'graduation-cap', label: 'Graduation Cap' },
  { key: 'lightbulb', label: 'Lightbulb' },
  { key: 'brain', label: 'Brain' },
  { key: 'notebook', label: 'Notebook' },
  { key: 'pencil', label: 'Pencil' },
  { key: 'microscope', label: 'Microscope' },
  { key: 'atom', label: 'Atom' },
  { key: 'calculator', label: 'Calculator' },
  { key: 'palette', label: 'Palette' },
  { key: 'brush', label: 'Brush' },
  { key: 'music', label: 'Music' },
  { key: 'mic', label: 'Mic' },
  { key: 'guitar', label: 'Guitar' },
  { key: 'camera', label: 'Camera' },
  { key: 'video', label: 'Video' },
  { key: 'film', label: 'Film' },
  { key: 'clapperboard', label: 'Clapperboard' },
  { key: 'headphones', label: 'Headphones' },
  { key: 'laptop', label: 'Laptop' },
  { key: 'code', label: 'Code' },
  { key: 'cpu', label: 'CPU' },
  { key: 'settings', label: 'Settings' },
  { key: 'database', label: 'Database' },
  { key: 'server', label: 'Server' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'users', label: 'Users' },
  { key: 'user-plus', label: 'User Plus' },
  { key: 'heart', label: 'Heart' },
  { key: 'handshake', label: 'Handshake' },
  { key: 'message-circle', label: 'Message Circle' },
  { key: 'megaphone', label: 'Megaphone' },
  { key: 'globe', label: 'Globe' },
  { key: 'map', label: 'Map' },
  { key: 'briefcase', label: 'Briefcase' },
  { key: 'bar-chart', label: 'Bar Chart' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'ticket', label: 'Ticket' },
  { key: 'rocket', label: 'Rocket' },
  { key: 'trending-up', label: 'Trending Up' },
  { key: 'clipboard', label: 'Clipboard' },
  { key: 'check-circle', label: 'Check Circle' },
]

const FocusIcon = ({ name }) => {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'target':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
    case 'star':
      return <svg {...common}><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" /></svg>
    case 'award':
      return <svg {...common}><circle cx="12" cy="8" r="6" /><path d="m8.2 14.9-1.7 6.1L12 18l5.5 3-1.7-6.1" /></svg>
    case 'sparkles':
      return <svg {...common}><path d="M12 3l1.8 3.7L17.5 8.5l-3.7 1.8L12 14l-1.8-3.7L6.5 8.5l3.7-1.8L12 3z" /><path d="M5 17l.8 1.7L7.5 20l-1.7.8L5 22l-.8-1.2L2.5 20l1.7-.3L5 17z" /><path d="M19 14l.9 1.9L22 17l-2.1 1L19 20l-.9-2L16 17l2.1-1 .9-2z" /></svg>
    case 'flag':
      return <svg {...common}><path d="M4 4v16" /><path d="M4 4h11l-1.5 3L15 10H4" /></svg>
    case 'compass':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><polygon points="14.5 9.5 9.5 14.5 11.2 11.2 14.5 9.5" /></svg>
    case 'layers':
      return <svg {...common}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 12 12 17 22 12" /><polyline points="2 17 12 22 22 17" /></svg>
    case 'grid':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
    case 'circle':
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>
    case 'badge':
      return <svg {...common}><path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3z" /><path d="m9.5 12 1.7 1.7 3.3-3.3" /></svg>
    case 'book':
      return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z" /></svg>
    case 'book-open':
      return <svg {...common}><path d="M2 6h8a3 3 0 0 1 3 3v11H5a3 3 0 0 0-3 3z" /><path d="M22 6h-8a3 3 0 0 0-3 3v11h8a3 3 0 0 1 3 3z" /></svg>
    case 'graduation-cap':
      return <svg {...common}><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
    case 'lightbulb':
      return <svg {...common}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12c.8.8 1.4 1.8 1.7 3h4.6c.3-1.2.9-2.2 1.7-3A7 7 0 0 0 12 2z" /></svg>
    case 'brain':
      return <svg {...common}><path d="M9.5 7A2.5 2.5 0 1 0 7 9.5V15a2.5 2.5 0 1 0 2.5 2.5V7z" /><path d="M14.5 7A2.5 2.5 0 1 1 17 9.5V15a2.5 2.5 0 1 1-2.5 2.5V7z" /></svg>
    case 'notebook':
      return <svg {...common}><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="8" y2="18" /></svg>
    case 'pencil':
      return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
    case 'microscope':
      return <svg {...common}><path d="M6 18h12" /><path d="M8 18a4 4 0 0 0 4-4V6" /><rect x="9" y="3" width="6" height="3" /><path d="M12 6v3" /></svg>
    case 'atom':
      return <svg {...common}><circle cx="12" cy="12" r="2" /><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(45 12 12)" /><ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(-45 12 12)" /></svg>
    case 'calculator':
      return <svg {...common}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><circle cx="9" cy="11" r="1" /><circle cx="12" cy="11" r="1" /><circle cx="15" cy="11" r="1" /><circle cx="9" cy="15" r="1" /><circle cx="12" cy="15" r="1" /><circle cx="15" cy="15" r="1" /></svg>
    case 'palette':
      return <svg {...common}><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="14.5" cy="7.5" r="1" /></svg>
    case 'brush':
      return <svg {...common}><path d="m9 11 8-8 4 4-8 8" /><path d="M7 13c-2 0-3 1.5-3 3 0 2-1 3-1 3s4-.2 5-2c1-1.8 0-4-1-4z" /></svg>
    case 'music':
      return <svg {...common}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
    case 'mic':
      return <svg {...common}><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="22" /></svg>
    case 'guitar':
      return <svg {...common}><path d="M7 18a3 3 0 1 0 4 4l5-5-4-4-5 5z" /><path d="m14 10 3-3" /><path d="m16 8 2 2" /></svg>
    case 'camera':
      return <svg {...common}><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="4" /></svg>
    case 'video':
      return <svg {...common}><rect x="2" y="6" width="15" height="12" rx="2" /><polygon points="17 10 22 7 22 17 17 14" /></svg>
    case 'film':
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" /></svg>
    case 'clapperboard':
      return <svg {...common}><path d="M3 8h18v12H3z" /><path d="m3 8 3-5h4l-3 5m3-5h4l-3 5m3-5h4l-3 5" /></svg>
    case 'headphones':
      return <svg {...common}><path d="M3 13a9 9 0 0 1 18 0" /><rect x="2" y="13" width="4" height="8" rx="2" /><rect x="18" y="13" width="4" height="8" rx="2" /></svg>
    case 'laptop':
      return <svg {...common}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M2 20h20" /></svg>
    case 'code':
      return <svg {...common}><polyline points="8 17 3 12 8 7" /><polyline points="16 7 21 12 16 17" /></svg>
    case 'cpu':
      return <svg {...common}><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" /></svg>
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg>
    case 'database':
      return <svg {...common}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v10c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 10c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
    case 'server':
      return <svg {...common}><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><line x1="7" y1="7" x2="7.01" y2="7" /><line x1="7" y1="17" x2="7.01" y2="17" /></svg>
    case 'wifi':
      return <svg {...common}><path d="M5 12a11 11 0 0 1 14 0" /><path d="M8.5 15.5a6 6 0 0 1 7 0" /><path d="M12 20h.01" /></svg>
    case 'cloud':
      return <svg {...common}><path d="M18 18a4 4 0 0 0 .5-8 6 6 0 0 0-11.6-1.5A4 4 0 0 0 7 18h11z" /></svg>
    case 'users':
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9" /></svg>
    case 'user-plus':
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" /></svg>
    case 'heart':
      return <svg {...common}><path d="M20.8 8.6a5 5 0 0 0-8.8-3.3 5 5 0 0 0-8.8 3.3c0 5.1 8.8 10.7 8.8 10.7s8.8-5.6 8.8-10.7z" /></svg>
    case 'handshake':
      return <svg {...common}><path d="m11 12 2 2a2 2 0 0 0 3 0l3-3" /><path d="M2 9l4-4 5 5-4 4z" /><path d="M22 9l-4-4-5 5 4 4z" /></svg>
    case 'message-circle':
      return <svg {...common}><path d="M21 11.5a8.5 8.5 0 1 1-3-6.5A8.5 8.5 0 0 1 21 11.5z" /><path d="M8 21l-1.5-4.5" /></svg>
    case 'megaphone':
      return <svg {...common}><path d="m3 11 14-5v12L3 13v-2z" /><path d="M11.5 14.5a3 3 0 1 1-5.7-1.5" /></svg>
    case 'globe':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
    case 'map':
      return <svg {...common}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>
    case 'briefcase':
      return <svg {...common}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
    case 'bar-chart':
      return <svg {...common}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    case 'ticket':
      return <svg {...common}><path d="M3 9a2 2 0 0 0 0 6v4h18v-4a2 2 0 0 0 0-6V5H3v4z" /><line x1="12" y1="5" x2="12" y2="19" /></svg>
    case 'rocket':
      return <svg {...common}><path d="M5 19c2.5-.5 5-2.5 6-4l2-2c2.5-1 4-3.5 5-6 0 0-3 .5-5 2l-2 2c-1.5 1-3.5 3.5-4 6z" /><path d="M9 15l-3 3" /></svg>
    case 'trending-up':
      return <svg {...common}><polyline points="22 7 13 16 9 12 2 19" /><polyline points="16 7 22 7 22 13" /></svg>
    case 'clipboard':
      return <svg {...common}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /></svg>
    case 'check-circle':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></svg>
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>
  }
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

export default function ClubAdminProfile() {
  const clubId = useClubAdminClubId()
  const [activeClub, setActiveClub] = useState(null)

  const initialProfile = useMemo(() => {
    if (!activeClub) {
      return {
        website: '',
        instagram: '',
        x: '',
        tiktok: '',
        backgroundImage: '',
      }
    }
    return {
      website: activeClub.website || '',
      instagram: activeClub.instagram || '',
      x: activeClub.x || '',
      tiktok: activeClub.tiktok || '',
    }
  }, [activeClub])

  const [profile, setProfile] = useState(initialProfile)
  const [savedSocialLinks, setSavedSocialLinks] = useState({
    website: '',
    instagram: '',
    x: '',
    tiktok: '',
  })
  const [socialLinksSavedAt, setSocialLinksSavedAt] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [bgFile, setBgFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [bgPreview, setBgPreview] = useState('')
  const [focusAreas, setFocusAreas] = useState([])
  const [iconPickerFor, setIconPickerFor] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const logoInputRef = useRef(null)
  const bgInputRef = useRef(null)

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

  useEffect(() => {
    setProfile(initialProfile)
    setSavedSocialLinks({
      website: (initialProfile.website || '').trim(),
      instagram: (initialProfile.instagram || '').trim(),
      x: (initialProfile.x || '').trim(),
      tiktok: (initialProfile.tiktok || '').trim(),
    })
    setSocialLinksSavedAt(null)
    setLogoFile(null)
    setBgFile(null)
    setLogoPreview('')
    setBgPreview('')
    setIconPickerFor(null)
    setFocusAreas(
      (activeClub?.focusAreas || []).map((area, idx) => ({
        id: `${idx}-${area.title || 'focus'}`,
        icon: area.icon || 'target',
        title: area.title || '',
        description: area.description || '',
      }))
    )
  }, [initialProfile])

  const pickLogo = () => logoInputRef.current?.click()
  const pickBackground = () => bgInputRef.current?.click()

  const normalizedSocialLinks = useMemo(
    () => ({
      website: profile.website.trim(),
      instagram: profile.instagram.trim(),
      x: profile.x.trim(),
      tiktok: profile.tiktok.trim(),
    }),
    [profile.website, profile.instagram, profile.x, profile.tiktok]
  )

  const hasUnsavedSocialLinks = useMemo(
    () =>
      normalizedSocialLinks.website !== savedSocialLinks.website ||
      normalizedSocialLinks.instagram !== savedSocialLinks.instagram ||
      normalizedSocialLinks.x !== savedSocialLinks.x ||
      normalizedSocialLinks.tiktok !== savedSocialLinks.tiktok,
    [normalizedSocialLinks, savedSocialLinks]
  )

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

  const askForChange = async () => {
    if (!activeClub) return
    if (hasUnsavedSocialLinks) {
      alert('Please save social media link changes before asking for change.')
      return
    }
    const payload = {
      clubId: activeClub.id,
      socialLinks: { ...savedSocialLinks },
      requestedLogo: logoFile ? { name: logoFile.name, type: logoFile.type, size: logoFile.size } : null,
      requestedBackgroundImage: bgFile ? { name: bgFile.name, type: bgFile.type, size: bgFile.size } : null,
      focusAreas: focusAreas
        .map((area) => ({
          icon: area.icon,
          title: area.title.trim(),
          description: area.description.trim(),
        }))
        .filter((area) => area.title || area.description),
    }
    // Empty social links are intentionally omitted from public render.
    Object.keys(payload.socialLinks).forEach((k) => {
      if (!payload.socialLinks[k]) delete payload.socialLinks[k]
    })

    const formData = new FormData()
    if (payload.requestedLogo && logoFile) formData.append('logoFile', logoFile)
    if (payload.requestedBackgroundImage && bgFile) formData.append('backgroundFile', bgFile)
    if (Object.keys(payload.socialLinks).length) {
      formData.append('socialLinks', JSON.stringify(payload.socialLinks))
    }
    if (payload.focusAreas.length) {
      formData.append('focusAreasJson', JSON.stringify(payload.focusAreas))
    }
    setSavingProfile(true)
    try {
      await patchClubAdminProfile(clubId, formData)
      alert('Profile update request submitted.')
    } catch (e) {
      alert(e?.message || 'Could not submit profile changes.')
      return
    } finally {
      setSavingProfile(false)
    }
  }

  const saveSocialLinks = () => {
    setSavedSocialLinks(normalizedSocialLinks)
    setProfile((prev) => ({
      ...prev,
      website: normalizedSocialLinks.website,
      instagram: normalizedSocialLinks.instagram,
      x: normalizedSocialLinks.x,
      tiktok: normalizedSocialLinks.tiktok,
    }))
    setSocialLinksSavedAt(Date.now())
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
            Request updates to public profile details shown in the club page.
          </p>
        </div>

        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Social Media Links</h2>
          </div>

          <div className="club-admin-profile-links-fixed">
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
              Empty fields will not be shown in Contact &amp; Links.
            </small>
            <button type="button" className="club-admin-btn-primary" onClick={saveSocialLinks} disabled={!hasUnsavedSocialLinks}>
              Save
            </button>
          </div>
          {socialLinksSavedAt && !hasUnsavedSocialLinks && (
            <small className="club-admin-char-limit">Social media links saved.</small>
          )}
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
          </div>
        </div>

        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Branding</h2>
          </div>

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

