import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchClub, fetchClubMembers, fetchEvents, fetchMyClubMemberships } from '../api/clubApi'
import {
  mapClubFromApi,
  mapEventFromApi,
  officerRoleLabelFromApiDto,
  officerLooksLikePresident,
} from '../api/clubMappers'
import { fetchAuthUserForClubRoster } from '../api/authUsersApi'
import { pickUserGuidForAuthLookup } from '../utils/userGuids'
import { ClubFocusAreaIcon } from '../components/club/ClubFocusAreaIcon'
import ClubsAreaNav from '../components/clubs/ClubsAreaNav'
import './ClubVacancies.css'
import './ClubDetail.css'

const IconPerson = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)
const IconYouTube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 12s0-3.25-.42-4.81a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.5 2.5 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77C22 15.25 22 12 22 12z" />
    <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
  </svg>
)
const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37a4 4 0 1 1-3.37-3.37 4 4 0 0 1 3.37 3.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
)
const IconTikTok = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3v10.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c1.2 2 2.8 3 5 3" />
  </svg>
)
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const TABS = [
  { id: 'about', label: 'About Us' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'members', label: 'Members' },
  { id: 'resources', label: 'Resources' }
]

const formatEventDate = (dateStr) => {
  if (!dateStr) return { month: '', day: '' }
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = d.getDate()
  return { month, day }
}

const trimStr = (v) => (v != null ? String(v).trim() : '')

const emailFromAuthUserDto = (user) => {
  if (!user || typeof user !== 'object') return ''
  return trimStr(user.email ?? user.Email)
}

/**
 * Display name strictly from `firstName` + `lastName` on the auth user DTO
 * (AUTH_API_DOC §4 response shape). Other fields (id, userName, email, ...)
 * are intentionally ignored: the club detail UI only renders the person's name.
 */
const firstLastNameFromAuthUserDto = (user) => {
  if (!user || typeof user !== 'object') return ''
  const first = trimStr(user.firstName ?? user.FirstName)
  const last = trimStr(user.lastName ?? user.LastName)
  return [first, last].filter(Boolean).join(' ').trim()
}

const fetchAuthProfilesByLookupKey = async (lookupKeys) => {
  const keys = Array.from(new Set(lookupKeys.map(trimStr).filter(Boolean)))
  if (!keys.length) return new Map()
  const profiles = await Promise.all(
    keys.map((key) => fetchAuthUserForClubRoster(key).catch(() => null))
  )
  const byKey = new Map()
  keys.forEach((key, index) => {
    const profile = profiles[index]
    if (profile && typeof profile === 'object') byKey.set(key, profile)
  })
  return byKey
}

const toAbsoluteUrl = (raw) => {
  const s = trimStr(raw)
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (/^mailto:/i.test(s)) return s
  return `https://${s.replace(/^\/+/, '')}`
}

const formatAnnouncementDate = (raw) => {
  const s = raw != null ? String(raw) : ''
  if (!s.trim()) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.trim()
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const ClubDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('about')
  const [club, setClub] = useState(null)
  const [memberRows, setMemberRows] = useState([])
  const [officerRows, setOfficerRows] = useState([])
  const [president, setPresident] = useState(null)
  const [officersExpanded, setOfficersExpanded] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loadState, setLoadState] = useState({ loading: true, error: null })
  const [isClubMember, setIsClubMember] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      setLoadState({ loading: true, error: null })
      try {
        const [rawClub, rawMembers, rawEvents, myMemberships] = await Promise.all([
          fetchClub(id),
          fetchClubMembers(id).catch(() => ({ items: [] })),
          fetchEvents({ limit: 48 }).catch(() => ({ items: [] })),
          fetchMyClubMemberships().catch(() => ({ items: [] })),
        ])
        if (cancelled) return
        const mapped = mapClubFromApi(rawClub)
        setClub(
          mapped || {
            id: String(id),
            name: 'Club',
            category: '',
            image: null,
            profileImageUrl: null,
            bannerImage: null,
            backgroundImageUrl: null,
            tags: [],
            members: 0,
            about: '',
            officers: [],
            announcements: [],
            email: null,
            socialLinks: {},
            resources: [],
          }
        )

        // Officers (from club detail DTO): resolve president from API labels + enrich with auth user.
        const rawOfficers = Array.isArray(rawClub?.officers) ? rawClub.officers : (Array.isArray(mapped?.raw?.officers) ? mapped.raw.officers : [])
        const normalizedOfficers = rawOfficers
          .map((o, idx) => {
            if (!o || typeof o !== 'object') return null
            const positionId = o.positionId ?? o.positionID ?? o.position?.id ?? o.position
            const pid = positionId != null ? String(positionId) : ''
            const uid = pickUserGuidForAuthLookup(o) || ''
            const positionLabel = officerRoleLabelFromApiDto(o)
            const explicitRole = String(o.role ?? o.title ?? o.Title ?? '').trim()
            return {
              _idx: idx,
              id: String(o.id ?? `${idx}`),
              userId: uid,
              positionId: pid,
              positionLabel,
              role: explicitRole || positionLabel,
              name: firstLastNameFromAuthUserDto(o) || '',
              raw: o,
            }
          })
          .filter(Boolean)

        const presidentRow =
          normalizedOfficers.find((o) => officerLooksLikePresident(o.raw, o.positionLabel)) || null
        const restRows = normalizedOfficers.filter((o) => !presidentRow || o !== presidentRow)
        setOfficerRows(restRows)
        setPresident(null)
        setOfficersExpanded(false)

        const idsToFetch = Array.from(
          new Set([presidentRow?.userId, ...restRows.map((r) => r.userId)].filter(Boolean))
        )
        if (idsToFetch.length) {
          const byId = await fetchAuthProfilesByLookupKey(idsToFetch)
          const nameFor = (uid) =>
            firstLastNameFromAuthUserDto(uid ? byId.get(uid) : null)
          if (!cancelled) {
            if (presidentRow) {
              setPresident({
                userId: presidentRow.userId,
                name:
                  nameFor(presidentRow.userId) ||
                  firstLastNameFromAuthUserDto(presidentRow.raw) ||
                  '',
              })
            }
            setOfficerRows((prev) =>
              prev.map((r) => ({
                ...r,
                name:
                  nameFor(r.userId) ||
                  firstLastNameFromAuthUserDto(r.raw) ||
                  '',
                role:
                  r.role ||
                  r.positionLabel ||
                  officerRoleLabelFromApiDto(r.raw) ||
                  '',
              }))
            )
          }
        } else if (presidentRow && !cancelled) {
          setPresident({
            userId: presidentRow.userId,
            name: firstLastNameFromAuthUserDto(presidentRow.raw) || '',
          })
        }

        const mItems = rawMembers?.items ?? rawMembers ?? []
        const baseMembers = (Array.isArray(mItems) ? mItems : []).map((m, index) => {
          const userGuid = pickUserGuidForAuthLookup(m) || ''
          return { ...m, _userId: userGuid, _idx: index }
        })
        setMemberRows(baseMembers)
        const uniqueUserIds = Array.from(new Set(baseMembers.map((m) => m._userId).filter(Boolean)))
        if (uniqueUserIds.length) {
          const byId = await fetchAuthProfilesByLookupKey(uniqueUserIds)
          if (!cancelled) {
            setMemberRows((prev) =>
              prev.map((m) => {
                const p = m._userId ? byId.get(m._userId) : null
                const fullName = firstLastNameFromAuthUserDto(p) || firstLastNameFromAuthUserDto(m)
                if (!p && !fullName) return m
                return {
                  ...m,
                  name: fullName || m.name,
                  fullName: fullName || m.fullName,
                  email: emailFromAuthUserDto(p) || m.email,
                }
              })
            )
          }
        }
        const evItems = (rawEvents?.items ?? []).map((row) => mapEventFromApi(row)).filter(Boolean)
        const sid = String(id)
        const filtered = evItems.filter(
          (e) =>
            String(e.clubId) === sid ||
            (mapped?.name && e.clubName && e.clubName === mapped.name)
        )
        setUpcomingEvents((filtered.length ? filtered : evItems).slice(0, 6))
        const memList = myMemberships?.items ?? myMemberships ?? []
        const active = Array.isArray(memList) && memList.some((m) => {
          const cid = m.clubId ?? m.club?.id ?? m.id
          const st = (m.status ?? m.membershipStatus ?? '').toString().toLowerCase()
          return String(cid) === sid && (!st || st === 'active' || st === 'approved')
        })
        setIsClubMember(Boolean(active))
        setLoadState({ loading: false, error: null })
      } catch (e) {
        if (!cancelled) {
          setClub(null)
          setLoadState({ loading: false, error: e?.message || 'Failed to load club.' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const focusAreas = useMemo(() => {
    const raw = club?.focusAreas || []
    return raw.map((area, i) => {
      if (typeof area === 'string') {
        const t = area.trim()
        return { icon: 'target', title: t || `Area ${i + 1}`, description: '' }
      }
      const title = String(area.title ?? area.name ?? `Area ${i + 1}`).trim()
      const description = String(area.description ?? '').trim()
      const icon = typeof area.icon === 'string' && area.icon ? area.icon : 'target'
      return { icon, title, description }
    })
  }, [club])

  const members = useMemo(() => {
    if (!club) return []
    if (memberRows.length > 0) {
      return memberRows.map((m) => ({
        name: firstLastNameFromAuthUserDto(m) || trimStr(m.name ?? m.fullName) || 'Member',
        role: m.role ?? m.position ?? m.Position ?? 'Member',
        department: m.department ?? m.program ?? m.Program ?? club.category,
      }))
    }
    const offs = Array.isArray(club.officers) ? club.officers : []
    if (offs.length === 0) {
      return [
        { name: 'Members', role: 'Roster', department: 'See club officers when available' },
      ]
    }
    return offs.map((officer) => ({
      name: firstLastNameFromAuthUserDto(officer) || 'Officer',
      role: officerRoleLabelFromApiDto(officer) || officer.role || officer.title || '',
      department: club.category,
    }))
  }, [club, memberRows])

  const memberCount = useMemo(() => {
    if (!club) return 0
    if (memberRows.length > 0) return memberRows.length
    const dtoCount = club.members ?? club.memberCount ?? club.membersCount ?? club.totalMembers
    const n = Number(dtoCount)
    return Number.isFinite(n) ? n : 0
  }, [club, memberRows.length])

  const officersList = useMemo(() => {
    const rest = officerRows
      .map((o) => {
        const role =
          o.role ||
          o.positionLabel ||
          officerRoleLabelFromApiDto(o.raw) ||
          'Officer'
        return {
          name: trimStr(o.name) || role || 'Officer',
          role,
        }
      })
      .filter((o) => o.name || o.role)
    if (!rest.length) return []
    const limit = 3
    if (officersExpanded) return rest
    return rest.slice(0, limit)
  }, [officerRows, officersExpanded])

  const hasMoreOfficers = useMemo(() => officerRows.length > 3, [officerRows.length])

  const contactLinkRows = useMemo(() => {
    if (!club) return []
    const sl = club.socialLinks && typeof club.socialLinks === 'object' ? club.socialLinks : {}
    const rows = [
      {
        key: 'website',
        href: toAbsoluteUrl(club.website ?? sl.website),
        Icon: IconYouTube,
        textForHref: () => 'YouTube',
      },
      {
        key: 'instagram',
        href: toAbsoluteUrl(club.instagram ?? sl.instagram),
        Icon: IconInstagram,
        textForHref: () => 'Instagram',
      },
      {
        key: 'x',
        href: toAbsoluteUrl(club.x ?? club.twitter ?? sl.x ?? sl.twitter),
        Icon: IconX,
        textForHref: () => 'X (Twitter)',
      },
      {
        key: 'tiktok',
        href: toAbsoluteUrl(club.tiktok ?? sl.tiktok),
        Icon: IconTikTok,
        textForHref: () => 'TikTok',
      },
    ]
    return rows
      .filter((r) => r.href)
      .map((r) => ({
        key: r.key,
        href: r.href,
        Icon: r.Icon,
        text: r.textForHref(r.href),
      }))
  }, [club])

  const announcementsDisplay = useMemo(() => {
    const raw = club?.announcements
    if (!Array.isArray(raw)) return []
    return raw.map((a, index) => {
      if (!a || typeof a !== 'object') {
        return {
          key: `a-${index}`,
          date: '',
          title: 'Announcement',
          message: typeof a === 'string' ? a : '',
        }
      }
      const dateRaw = a.date ?? a.createdAt ?? a.publishedAt ?? a.createdAtUtc ?? a.timestamp
      return {
        key: String(a.id ?? a.slug ?? `${a.title ?? ''}-${index}`),
        date: formatAnnouncementDate(dateRaw),
        title: trimStr(a.title) || 'Announcement',
        message: trimStr(a.message ?? a.body ?? a.content ?? a.text),
      }
    })
  }, [club])

  const clubResources = useMemo(() => {
    if (!club) return []
    const r = club.resources
    if (Array.isArray(r) && r.length) return r
    // Fallback when the public club DTO exposes `documents` / alternate casing but mapper was built from a slimmer object.
    const fromRaw = mapClubFromApi(club.raw)
    if (Array.isArray(fromRaw?.resources) && fromRaw.resources.length) return fromRaw.resources
    return []
  }, [club])

  const clubLogoImage = useMemo(
    () => club?.profileImageUrl || club?.image || '',
    [club]
  )

  const clubHeroImage = useMemo(
    () => club?.backgroundImageUrl || club?.bannerImage || '',
    [club]
  )

  if (loadState.loading) {
    return (
      <div className="club-detail-page club-detail-page--not-found">
        <ClubsAreaNav />
        <div className="club-detail-container">
          <div className="club-detail-loading-indicator" role="status" aria-live="polite">
            <span className="club-detail-loading-spinner" aria-hidden="true" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (loadState.error || !club) {
    return (
      <div className="club-detail-page club-detail-page--not-found">
        <ClubsAreaNav />
        <div className="club-detail-container">
          <p>{loadState.error || 'Club not found.'}</p>
          <button type="button" className="club-detail-btn-primary" onClick={() => navigate('/clubs')}>
            Back to Clubs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="club-detail-page">
      <ClubsAreaNav />

      {/* Hero with banner and floating card */}
      <section className="club-detail-hero">
        <div
          className="club-detail-hero-banner"
          style={{
            backgroundImage: clubHeroImage ? `url(${clubHeroImage})` : undefined,
          }}
        />
        <div className="club-detail-hero-card">
          <div className="club-detail-hero-card-logo" style={{ backgroundImage: clubLogoImage ? `url(${clubLogoImage})` : undefined }} />
          <div className="club-detail-hero-card-info">
            <h1 className="club-detail-hero-title">{club.name}</h1>
            <span className="club-detail-hero-tag">{club.category}</span>
            <div className="club-detail-hero-stats">
              <span><IconPerson /> {memberCount} Members</span>
              {club.establishedYear && <span>Est. {club.establishedYear}</span>}
              {club.location && <span>{club.location}</span>}
            </div>
          </div>
          <div className="club-detail-hero-actions">
            {president?.name ? (
              <div className="club-detail-president">
                <div className="club-detail-president-label">President</div>
                <div className="club-detail-president-name">{president.name}</div>
              </div>
            ) : null}
            <button type="button" className="club-detail-btn-primary" onClick={() => navigate(`/clubs/${id}/join`)}>
              <IconPlus /> Join Club
            </button>
          </div>
        </div>
      </section>

      <div className="club-detail-layout">
        <main className="club-detail-main">
          <div className="club-detail-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`club-detail-tab ${activeTab === tab.id ? 'club-detail-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'about' && (
            <div className="club-detail-content">
              <section className="club-detail-section">
                <h2 className="club-detail-section-title">Our Mission</h2>
                <p className="club-detail-mission">{club.about}</p>
              </section>

              {focusAreas.length > 0 && (
                <section className="club-detail-section">
                  <h2 className="club-detail-section-title">Key Focus Areas</h2>
                  <div className="club-detail-focus-grid">
                    {focusAreas.map((area, i) => (
                      <div key={i} className="club-detail-focus-card">
                        <span className="club-detail-focus-icon"><ClubFocusAreaIcon name={area.icon} /></span>
                        <h3 className="club-detail-focus-title">{area.title}</h3>
                        <p className="club-detail-focus-desc">{area.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="club-detail-section">
                <div className="club-detail-section-head">
                  <h2 className="club-detail-section-title">Recent Activities</h2>
                  <Link to={`/clubs/events?club=${club.id}`} className="club-detail-link">View All</Link>
                </div>
                <div className="club-detail-activities-grid">
                  {upcomingEvents.slice(0, 2).map((ev) => (
                    <Link key={ev.id} to={`/clubs/events/${ev.id}`} className="club-detail-activity-card">
                      <div
                        className="club-detail-activity-img"
                        style={{
                          backgroundImage: (ev.image || clubHeroImage || clubLogoImage) ? `url(${ev.image || clubHeroImage || clubLogoImage})` : undefined,
                        }}
                      />
                      <span className="club-detail-activity-title">{ev.title}</span>
                    </Link>
                  ))}
                  {upcomingEvents.length < 2 && (
                    <div className="club-detail-activity-card club-detail-activity-card--placeholder">
                      <div
                        className="club-detail-activity-img"
                        style={{
                          backgroundImage: (clubHeroImage || clubLogoImage) ? `url(${clubHeroImage || clubLogoImage})` : undefined,
                        }}
                      />
                      <span className="club-detail-activity-title">More activities coming soon</span>
                    </div>
                  )}
                </div>
              </section>

            </div>
          )}

          {activeTab === 'members' && (
            <div className="club-detail-content">
              <section className="club-detail-section">
                <h2 className="club-detail-section-title">Club Members</h2>
                <ul className="club-detail-members-list">
                  {members.map((member, index) => (
                    <li key={`${member.name}-${index}`} className="club-detail-member-item">
                      <span className="club-detail-member-avatar" />
                      <div>
                        <span className="club-detail-member-name">{member.name}</span>
                        <span className="club-detail-member-meta">
                          {member.role}{member.department ? ` · ${member.department}` : ''}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="club-detail-content">
              {isClubMember ? (
                <section className="club-detail-section">
                  <h2 className="club-detail-section-title">Club Announcements</h2>
                  {announcementsDisplay.length > 0 ? (
                    <ul className="club-detail-announcements-list">
                      {announcementsDisplay.map((announcement) => (
                        <li key={announcement.key} className="club-detail-announcement-item">
                          {announcement.date ? (
                            <span className="club-detail-announcement-date">{announcement.date}</span>
                          ) : null}
                          <h3 className="club-detail-announcement-title">{announcement.title}</h3>
                          <p className="club-detail-announcement-text">{announcement.message}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="club-detail-placeholder">No announcements yet.</p>
                  )}
                </section>
              ) : (
                <section className="club-detail-section">
                  <h2 className="club-detail-section-title">Club Announcements</h2>
                  <p className="club-detail-placeholder">Announcements are visible only to club members.</p>
                </section>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="club-detail-content">
              <section className="club-detail-section">
                <h2 className="club-detail-section-title">Resources and documents</h2>
                {clubResources.length > 0 ? (
                  <ul className="club-detail-announcements-list">
                    {clubResources.map((doc, i) => {
                      const href = (doc && typeof doc === 'object' ? doc.url ?? doc.href : null) || ''
                      const label =
                        (doc && typeof doc === 'object' ? doc.title ?? doc.name : null) ||
                        (typeof doc === 'string' ? 'Resource' : 'Resource')
                      return (
                        <li
                          key={doc && typeof doc === 'object' && doc.id != null ? `res-${doc.id}` : `res-${i}`}
                          className="club-detail-announcement-item"
                        >
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="club-detail-resource-link"
                            >
                              {label}
                            </a>
                          ) : (
                            <span className="club-detail-resource-link">{label}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="club-detail-placeholder">No documents shared yet.</p>
                )}
              </section>
            </div>
          )}
        </main>

        <aside className="club-detail-sidebar">
          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Club Officers</h3>
            <ul className="club-detail-officers">
              {officersList.map((o, i) => (
                <li key={i} className="club-detail-officer">
                  <span className="club-detail-officer-avatar" />
                  <div>
                    <span className="club-detail-officer-name">{o.name}</span>
                    <span className="club-detail-officer-role">{o.role}</span>
                  </div>
                </li>
              ))}
            </ul>
            {hasMoreOfficers && (
              <button
                type="button"
                className="club-detail-btn-outline club-detail-officers-toggle"
                onClick={() => setOfficersExpanded((v) => !v)}
              >
                {officersExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
            {!president && officersList.length === 0 ? (
              <p className="club-detail-placeholder">No officers listed yet.</p>
            ) : null}
          </section>

          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Upcoming Events</h3>
            <ul className="club-detail-events">
              {upcomingEvents.map((ev) => {
                const { month, day } = formatEventDate(ev.date)
                return (
                  <li key={ev.id} className="club-detail-event">
                    <div className="club-detail-event-date">
                      <span className="club-detail-event-month">{month}</span>
                      <span className="club-detail-event-day">{day}</span>
                    </div>
                    <div className="club-detail-event-info">
                      <Link to={`/clubs/events/${ev.id}`} className="club-detail-event-title">{ev.title}</Link>
                      <span className="club-detail-event-meta">{ev.time} · {ev.location}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Link to={`/clubs/events?club=${club.id}`} className="club-detail-btn-outline">View Upcoming Events</Link>
          </section>

          <section className="club-detail-sidebar-block">
            <h3 className="club-detail-sidebar-title">Contact & Links</h3>
            <div className="club-detail-contact">
              {trimStr(club.email) ? (
                <a href={`mailto:${trimStr(club.email)}`} className="club-detail-contact-row">
                  <IconMail /> {trimStr(club.email)}
                </a>
              ) : null}
              {contactLinkRows.map((row) => {
                const RowIcon = row.Icon
                return (
                  <a
                    key={row.key}
                    href={row.href}
                    title={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="club-detail-contact-row"
                  >
                    <RowIcon /> {row.text}
                  </a>
                )
              })}
            </div>
            {!trimStr(club.email) && contactLinkRows.length === 0 ? (
              <p className="club-detail-placeholder">No public contact info yet.</p>
            ) : null}
          </section>
        </aside>
      </div>

      <footer className="club-detail-footer">
        <div className="club-detail-footer-inner">
          <Link to="/" className="club-detail-nav-logo">MyAda</Link>
          <nav className="club-detail-footer-links">
            <a href="#help">Help Center</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#guidelines">University Guidelines</a>
          </nav>
          <span className="club-detail-footer-copy">© {new Date().getFullYear()} MyAda University Platforms.</span>
        </div>
      </footer>
    </div>
  )
}

export default ClubDetail
