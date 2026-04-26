import {
  resolveClubMediaUrl,
  resolveClubMediaViaGateway,
  resolveProposedClubImageDisplayUrls,
  resolvePublishedClubImageDisplayUrls,
} from './clubConfig'

export { resolveClubMediaUrl } from './clubConfig'

/** One club file row from `GET/POST` `/club-admin/{clubId}/files` item or public `resources[]` entry. */
export function mapClubFileItemFromApi(item) {
  if (item == null) return null
  if (typeof item === 'string') {
    const u = String(item).trim()
    if (!u) return null
    return { id: '', title: 'Resource', url: resolveClubMediaUrl(u) || u }
  }
  if (typeof item !== 'object') return null
  const idRaw = item.id ?? item.Id
  const id = idRaw != null && String(idRaw).trim() ? String(idRaw) : ''
  const url = String(
    item.url ?? item.URL ?? item.Url ?? item.fileUrl ?? item.FileUrl ?? item.href ?? item.path ?? item.Path ?? ''
  ).trim()
  if (!url) return null
  const title = String(
    item.title ?? item.Title ?? item.name ?? item.Name ?? item.fileName ?? item.FileName ?? 'Resource'
  ).trim() || 'Resource'
  return { id, title, url: resolveClubMediaUrl(url) || url }
}

function firstNonEmptyLink(...candidates) {
  for (const v of candidates) {
    if (v == null) continue
    const t = String(v).trim()
    if (t) return t
  }
  return undefined
}

function isDefaultClubImage(value) {
  if (value == null) return false
  const s = String(value).trim()
  return (
    /^\/?clubs\/default\.(png|svg)(\?.*)?$/i.test(s) ||
    /^https?:\/\/[^?#]+\/clubs\/default\.(png|svg)(\?.*)?$/i.test(s)
  )
}

function pickPreferredClubImage(...candidates) {
  let fallback
  for (const v of candidates) {
    if (v == null) continue
    const t = String(v).trim()
    if (!t) continue
    if (!fallback) fallback = t
    if (!isDefaultClubImage(t)) return t
  }
  return fallback
}

/**
 * Human-readable role for a club officer from `GET /clubs/{id}` `officers[]` item.
 * Prefers nested `position` title, then role/title/position* string fields (avoids showing raw numeric ids).
 */
export function officerRoleLabelFromApiDto(o) {
  if (!o || typeof o !== 'object') return ''
  const pick = (v) => {
    if (v == null) return ''
    const s = String(v).trim()
    return s || ''
  }
  const pos = o.position
  if (pos && typeof pos === 'object') {
    const fromPos = pick(
      pos.title ?? pos.Title ?? pos.name ?? pos.Name ?? pos.positionTitle ?? pos.positionName ?? pos.role ?? pos.Role
    )
    if (fromPos) return fromPos
  }
  const flat = [
    o.role,
    o.Role,
    o.title,
    o.Title,
    o.positionTitle,
    o.PositionTitle,
    o.positionName,
    o.PositionName,
    o.jobTitle,
    o.JobTitle,
    o.officerTitle,
    o.OfficerTitle,
    o.officerRole,
    o.OfficerRole,
    o.roleName,
    o.RoleName,
  ]
  for (const v of flat) {
    const s = pick(v)
    if (s && !/^\d+$/.test(s)) return s
  }
  if (typeof pos === 'string') {
    const s = pick(pos)
    if (s && !/^\d+$/.test(s)) return s
  }
  return ''
}

/** True if this officer row represents the club president (API labels or legacy positionId 1). */
export function officerLooksLikePresident(raw, positionLabel) {
  if (!raw || typeof raw !== 'object') return false
  if (raw.isPresident === true || raw.IsPresident === true) return true
  const blob = `${pickStr(raw.role)} ${pickStr(raw.Role)} ${pickStr(raw.title)} ${pickStr(raw.Title)} ${pickStr(positionLabel)}`.toLowerCase()
  if (blob.includes('president')) return true
  const pid = raw.positionId ?? raw.PositionId ?? raw.position?.id ?? raw.position?.Id
  if (pid != null && String(pid).trim() === '1') return true
  return false
}

function pickStr(v) {
  if (v == null) return ''
  return String(v).trim()
}

function mapEmailFromApi(dto) {
  if (dto.email == null) return null
  const t = String(dto.email).trim()
  return t || null
}

/**
 * Member count for list/detail DTOs: prefers numeric fields, then `members`/`Members` array length.
 * @param {Record<string, unknown>} dto
 */
function memberCountFromClubDto(dto) {
  if (!dto || typeof dto !== 'object') return 0
  const tryNumeric = (o) => {
    if (!o || typeof o !== 'object') return null
    const keys = [
      'memberCount',
      'MemberCount',
      'membersCount',
      'MembersCount',
      'totalMembers',
      'TotalMembers',
      'rosterSize',
      'RosterSize',
      'activeMembers',
      'ActiveMembers',
    ]
    for (const k of keys) {
      if (!(k in o)) continue
      const v = o[k]
      if (v == null || Array.isArray(v)) continue
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) return Math.floor(n)
    }
    if (typeof o.members === 'number') {
      const n = Number(o.members)
      if (Number.isFinite(n) && n >= 0) return Math.floor(n)
    }
    if (typeof o.Members === 'number') {
      const n = Number(o.Members)
      if (Number.isFinite(n) && n >= 0) return Math.floor(n)
    }
    if (o.stats && typeof o.stats === 'object') {
      for (const sk of ['memberCount', 'totalMembers', 'count', 'Count']) {
        if (!(sk in o.stats)) continue
        const n = Number(o.stats[sk])
        if (Number.isFinite(n) && n >= 0) return Math.floor(n)
      }
    }
    return null
  }
  const nested = [dto, dto.club, dto.result, dto.Result, dto.Club, dto.data, dto.Data].filter(
    (x) => x && typeof x === 'object'
  )
  for (const c of nested) {
    const n = tryNumeric(c)
    if (n != null) return n
  }
  for (const c of nested) {
    if (Array.isArray(c.members)) return c.members.length
    if (Array.isArray(c.Members)) return c.Members.length
  }
  return 0
}

/** @param {Record<string, unknown>} dto */
export function mapClubFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null
  const id = dto.id
  const tags = Array.isArray(dto.tags) ? dto.tags : []
  const aboutText =
    dto.about != null && String(dto.about).trim()
      ? String(dto.about)
      : dto.description != null
        ? String(dto.description)
        : ''
  const socialLinks =
    dto.socialLinks && typeof dto.socialLinks === 'object' && !Array.isArray(dto.socialLinks)
      ? dto.socialLinks
      : {}
  const sl = /** @type {Record<string, unknown>} */ (socialLinks)
  // Per CLUB_API: round profile/logo → `profileImageUrl`; `image` / `Image` align with background/hero, not the logo.
  const rawClubImage = pickPreferredClubImage(
    dto.profileImageUrl,
    dto.ProfileImageUrl,
  )
  const clubImageDisplay = rawClubImage
    ? resolvePublishedClubImageDisplayUrls(rawClubImage)
    : { primary: resolveClubMediaUrl('/clubs/default.png') || '/clubs/default.svg', alt: null }
  const resolvedClubImage = clubImageDisplay.primary || resolveClubMediaUrl('/clubs/default.png') || '/clubs/default.svg'
  const rawBanner = pickPreferredClubImage(
    dto.bannerImageUrl,
    dto.BannerImageUrl,
    dto.backgroundImageUrl,
    dto.BackgroundImageUrl,
    dto.image,
    dto.Image,
    dto.coverImageUrl,
    dto.CoverImageUrl,
    dto.heroImageUrl,
    dto.HeroImageUrl,
    dto.bannerImage,
    dto.BannerImage,
    dto.backgroundImage,
    dto.BackgroundImage,
  )
  const bannerImageDisplay = rawBanner ? resolvePublishedClubImageDisplayUrls(rawBanner) : { primary: null, alt: null }
  const bannerImage = bannerImageDisplay.primary ?? undefined
  return {
    id: String(id),
    name: String(dto.name ?? ''),
    category: String(dto.category ?? ''),
    image: resolvedClubImage,
    /** Wide hero / cover image (separate from round profile `image`). */
    bannerImage,
    backgroundImageUrl: bannerImageDisplay.primary ?? undefined,
    backgroundImageUrlAlt: bannerImageDisplay.alt ?? undefined,
    tags,
    members: memberCountFromClubDto(dto),
    about: aboutText,
    description: dto.description != null ? String(dto.description) : '',
    status: dto.status != null ? String(dto.status) : '',
    establishedYear: dto.establishedYear != null ? String(dto.establishedYear) : undefined,
    location: dto.location != null ? String(dto.location) : undefined,
    email: mapEmailFromApi(dto),
    website: firstNonEmptyLink(dto.website, sl.website),
    instagram: firstNonEmptyLink(dto.instagram, sl.instagram),
    x: firstNonEmptyLink(dto.x, sl.x, dto.twitter, sl.twitter),
    twitter: firstNonEmptyLink(dto.twitter, sl.twitter, dto.x, sl.x),
    tiktok: firstNonEmptyLink(dto.tiktok, sl.tiktok),
    focusAreas: Array.isArray(dto.focusAreas)
      ? dto.focusAreas.map((a, i) =>
          typeof a === 'string'
            ? { icon: 'target', title: a, description: '' }
            : a && typeof a === 'object'
              ? {
                  icon: String(a.icon || 'target'),
                  title: String(a.title ?? '').trim(),
                  description: String(a.description ?? '').trim(),
                }
              : { icon: 'target', title: `Area ${i + 1}`, description: '' }
        )
      : [],
    officers: Array.isArray(dto.officers) ? dto.officers : [],
    announcements: Array.isArray(dto.announcements) ? dto.announcements : [],
    memberProfiles: Array.isArray(dto.memberProfiles) ? dto.memberProfiles : [],
    socialLinks,
    resources: (() => {
      const raw = Array.isArray(dto.resources)
        ? dto.resources
        : Array.isArray(dto.documents)
          ? dto.documents
          : Array.isArray(dto.Resources)
            ? dto.Resources
            : Array.isArray(dto.Documents)
              ? dto.Documents
              : null
      if (raw == null || !Array.isArray(raw)) return []
      return raw
        .map((r, i) => {
          if (typeof r === 'string') {
            const url = String(r).trim()
            return url ? { id: String(i), title: 'Link', url: resolveClubMediaUrl(url) || url } : null
          }
          if (!r || typeof r !== 'object') return null
          const url = String(
            r.url ?? r.URL ?? r.Url ?? r.fileUrl ?? r.FileUrl ?? r.href ?? r.link ?? r.path ?? r.Path
          ).trim()
          if (!url) return null
          const title = String(
            r.title ?? r.Title ?? r.name ?? r.Name ?? r.fileName ?? r.FileName ?? 'Resource'
          ).trim() || 'Resource'
          return { id: String(r.id ?? r.Id ?? i), title, url: resolveClubMediaUrl(url) || url }
        })
        .filter(Boolean)
    })(),
    categoryId: dto.categoryId,
    profileImageUrl: clubImageDisplay.primary ?? undefined,
    profileImageUrlAlt: clubImageDisplay.alt ?? undefined,
    raw: dto,
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** @param {Record<string, unknown>} dto */
export function mapEventFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null
  const id = dto.id ?? dto.eventId
  const startRaw = dto.startTime ?? dto.start
  const endRaw = dto.endTime ?? dto.end
  let date = ''
  let time = ''
  let endTime = ''
  if (startRaw) {
    const d = new Date(String(startRaw))
    if (!Number.isNaN(d.getTime())) {
      date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
      time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    }
  }
  if (endRaw) {
    const d = new Date(String(endRaw))
    if (!Number.isNaN(d.getTime())) {
      endTime = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    }
  }
  const title = String(dto.name ?? dto.title ?? '')
  const rawSubs = Array.isArray(dto.subEvents) ? dto.subEvents : []
  const subEvents = rawSubs.map((sub) => {
    if (!sub || typeof sub !== 'object') return null
    const st = sub.startTime ?? sub.start
    const et = sub.endTime ?? sub.end
    let startTime = sub.startTimeStr ?? sub.start
    let endTimeStr = sub.endTimeStr ?? sub.end
    if (st && typeof st === 'string' && st.includes('T')) {
      const d = new Date(st)
      if (!Number.isNaN(d.getTime())) startTime = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    }
    if (et && typeof et === 'string' && et.includes('T')) {
      const d = new Date(et)
      if (!Number.isNaN(d.getTime())) endTimeStr = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    }
    return {
      title: String(sub.name ?? sub.title ?? ''),
      startTime: startTime != null ? String(startTime) : '',
      endTime: endTimeStr != null ? String(endTimeStr) : '',
    }
  }).filter(Boolean)

  return {
    id: String(id),
    clubId: dto.clubId != null ? Number(dto.clubId) : undefined,
    clubName: String(dto.clubName ?? dto.club ?? ''),
    title,
    category: dto.category != null ? String(dto.category) : '',
    description: String(dto.description ?? ''),
    date,
    time,
    endTime,
    location: String(dto.location ?? ''),
    /** API exposes event art as `imageUrl` (and sometimes `image` / poster aliases). */
    image: (() => {
      const raw = firstNonEmptyLink(
        dto.imageUrl,
        dto.ImageUrl,
        dto.image,
        dto.Image,
        dto.posterUrl,
        dto.PosterUrl
      )
      return raw ? resolveClubMediaUrl(raw) || raw : null
    })(),
    seatLimit: dto.seatLimit != null ? Number(dto.seatLimit) : undefined,
    requirements: dto.requirements != null ? String(dto.requirements) : '',
    prerequisites: dto.prerequisites != null ? String(dto.prerequisites) : '',
    notes: dto.notes != null ? String(dto.notes) : '',
    status: dto.status != null ? String(dto.status) : '',
    subEvents,
    raw: dto,
  }
}

/** @param {Record<string, unknown>} dto */
function normalizeClubProposalOtherMembers(dto) {
  const raw = dto?.otherMembers ?? dto?.otherMembersJson
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/** Logo / cover image path from various API shapes (string URL or nested). */
function extractClubProposalLogoPath(p) {
  if (!p || typeof p !== 'object') return ''
  const lf = p.logoFile
  const logoFileStr =
    typeof lf === 'string' ? lf.trim() : lf && typeof lf === 'object' ? String(lf.url ?? lf.path ?? '').trim() : ''
  return firstNonEmptyLink(
    p.logoUrl,
    p.logoFileUrl,
    p.clubLogoUrl,
    p.logoImageUrl,
    p.profileImageUrl,
    p.ProfileImageUrl,
    p.image,
    p.Image,
    logoFileStr,
    p?.logo?.url,
    p?.clubLogo?.url
  )
}

/** Constitution PDF path from various API shapes. */
function extractClubProposalConstitutionPath(p) {
  if (!p || typeof p !== 'object') return ''
  const cf = p.constitutionFile
  const constitutionFileStr =
    typeof cf === 'string' ? cf.trim() : cf && typeof cf === 'object' ? String(cf.url ?? cf.path ?? '').trim() : ''
  return firstNonEmptyLink(
    p.constitutionUrl,
    p.constitutionFileUrl,
    p.constitutionPdfUrl,
    p.constitutionDocumentUrl,
    p.pdfUrl,
    p.documentUrl,
    constitutionFileStr,
    p?.constitutionDoc?.url,
    p?.constitution?.url,
    p?.documents?.constitutionUrl
  )
}

function proposalDocumentDisplayUrl(raw) {
  const s = raw != null ? String(raw).trim() : ''
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (/^data:/i.test(s)) return s
  const gw = resolveClubMediaViaGateway(s)
  const s3 = resolveClubMediaUrl(s)
  return gw || s3 || null
}

function filenameFromUrlOrPath(url) {
  const s = String(url ?? '').trim()
  if (!s) return null
  try {
    const noQuery = s.split('?')[0]
    const seg = noQuery.split('/').filter(Boolean).pop()
    return seg && /\.[a-z0-9]+$/i.test(seg) ? seg : null
  } catch {
    return null
  }
}

function formatProposalDocSize(v) {
  if (v == null || v === '') return '—'
  if (typeof v === 'string' && /[km]b|bytes?/i.test(v)) return v
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${Math.round(n)} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function buildPrimaryOfficersFromProposal(p) {
  if (Array.isArray(p.primaryOfficers) && p.primaryOfficers.length) return p.primaryOfficers
  const out = []
  const pres = p.presidentStudentId ?? p.presidentId ?? p.PresidentStudentId
  const vp = p.vicePresidentStudentId ?? p.vicePresidentId ?? p.VicePresidentStudentId
  if (pres != null && String(pres).trim()) out.push({ role: 'President', studentId: String(pres).trim() })
  if (vp != null && String(vp).trim()) out.push({ role: 'Vice President', studentId: String(vp).trim() })
  return out
}

function buildConstitutionDocForProposal(p) {
  const nested = p.constitutionDoc && typeof p.constitutionDoc === 'object' ? p.constitutionDoc : {}
  const rawPath = extractClubProposalConstitutionPath(p) || (nested.url ? String(nested.url) : '')
  const url = proposalDocumentDisplayUrl(rawPath) || proposalDocumentDisplayUrl(nested.url)
  const name =
    String(nested.name || nested.fileName || filenameFromUrlOrPath(rawPath) || filenameFromUrlOrPath(url) || '').trim() ||
    (url ? 'Constitution.pdf' : '')
  const size = formatProposalDocSize(
    nested.size ?? nested.fileSize ?? p.constitutionFileSize ?? p.constitutionSizeBytes
  )
  const uploadedAt =
    nested.uploadedAt != null
      ? String(nested.uploadedAt)
      : p.submittedAt
        ? new Date(p.submittedAt).toLocaleDateString()
        : '—'
  if (!url && !name) return null
  return { name: name || 'Constitution.pdf', size, uploadedAt, url: url || null }
}

/** Student Services dashboard: map API club proposal to UI row shape */
export function mapStudentServicesClubProposal(p, index = 0) {
  if (!p || typeof p !== 'object') return null
  const id = String(p.id ?? index)
  const proposalId = String(p.proposalId ?? p.proposalID ?? p.id ?? id)
  const desc = String(p.description ?? p.shortDesc ?? '')
  const rawLogo = extractClubProposalLogoPath(p)
  const { primary: logoImageUrl, alt: logoImageUrlAlt } = resolveProposedClubImageDisplayUrls(rawLogo)
  const constitutionDoc = buildConstitutionDocForProposal(p)
  return {
    id,
    proposalId,
    clubName: String(p.name ?? p.clubName ?? 'Club proposal'),
    shortName: String(p.shortName ?? ''),
    shortDesc: desc.slice(0, 800),
    uniqueDesc: String(p.uniqueDesc ?? ''),
    goals: String(p.goals ?? ''),
    activities: String(p.activities ?? ''),
    category: String(p.category ?? 'GENERAL').toUpperCase(),
    submittedBy: String(p.submittedBy ?? p.applicantName ?? '—'),
    submittedAt: p.submittedAt
      ? new Date(p.submittedAt).toLocaleDateString()
      : String(p.submittedAt ?? '—'),
    status: String(p.status ?? 'pending_review').toLowerCase().replace(/\s+/g, '_'),
    primaryOfficers: buildPrimaryOfficersFromProposal(p),
    otherMembers: normalizeClubProposalOtherMembers(p),
    alignment: String(p.alignment ?? ''),
    vision: String(p.vision ?? ''),
    commitment: p.commitment ?? 'yes',
    logoImageUrl: logoImageUrl || null,
    logoImageUrlAlt: logoImageUrlAlt || null,
    constitutionDoc: constitutionDoc ?? { name: '', size: '—', uploadedAt: '—', url: null },
    raw: p,
  }
}

export function mapStudentServicesEventProposal(p, index = 0) {
  if (!p || typeof p !== 'object') return null
  const id = String(p.id ?? index)
  const rawSubs = Array.isArray(p.subEvents) ? p.subEvents : []
  const subEvents = rawSubs
    .map((se) => {
      if (!se || typeof se !== 'object') return null
      const title = String(se.title ?? se.name ?? '').trim()
      const capacity = String(se.capacity ?? '').trim()
      const start = String(se.start ?? se.startTime ?? '').trim()
      const end = String(se.end ?? se.endTime ?? '').trim()
      const timeRange =
        String(se.timeRange ?? '').trim() || (start && end ? `${start} - ${end}` : start || end || '')
      const venueNotes = String(se.venueNotes ?? se.venue ?? se.location ?? '').trim()
      const date = String(se.date ?? '').trim()
      return { title, capacity, start, end, date, timeRange, venueNotes, raw: se }
    })
    .filter(Boolean)
  const rawPoster = firstNonEmptyLink(
    p.imageUrl,
    p.ImageUrl,
    p.posterUrl,
    p.PosterUrl,
    p.eventImageUrl,
    p.EventImageUrl
  )
  const posterDisplay = rawPoster ? resolvePublishedClubImageDisplayUrls(rawPoster) : { primary: null, alt: null }
  const posterImageUrl = posterDisplay.primary ?? null
  const posterImageUrlAlt = posterDisplay.alt ?? null
  const obj = p.objectives
  const objectives = (() => {
    if (Array.isArray(obj)) return obj.map((x) => String(x))
    if (typeof obj === 'string' && obj.trim()) {
      const lines = obj.split(/\n+/).map((s) => s.trim()).filter(Boolean)
      return lines.length ? lines : [obj.trim()]
    }
    return []
  })()
  return {
    id,
    proposalId: String(p.proposalId ?? p.id ?? id),
    eventTitle: String(p.eventTitle ?? p.name ?? p.title ?? 'Event proposal'),
    submittedOn: p.submittedOn ?? (p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : '—'),
    submittedBy: String(
      p.submittedBy ?? p.submittedByOrganization ?? p.SubmittedByOrganization ?? p.submittedByStudentId ?? '—'
    ),
    submittedAgo: String(p.submittedAgo ?? ''),
    clubName: String(
      p.clubName ?? (p.club && typeof p.club === 'object' ? p.club.name : '') ?? ''
    ),
    status: String(p.status ?? 'PENDING REVIEW').toUpperCase(),
    eventDateShort: String(p.eventDateShort ?? ''),
    dateTime: String(p.dateTime ?? ''),
    timeRange: String(p.timeRange ?? ''),
    duration: String(p.duration ?? ''),
    durationLabel: String(p.durationLabel ?? ''),
    attendance: String(p.attendance ?? ''),
    attendanceNote: String(p.attendanceNote ?? ''),
    venue: String(p.venue ?? p.location ?? ''),
    venueRoom: String(p.venueRoom ?? ''),
    requestedBuildingId: p.requestedBuildingId ?? 'b1',
    requestedRoomId: p.requestedRoomId ?? 'r1',
    description: String(p.description ?? ''),
    objectives,
    subEvents,
    posterImageUrl,
    posterImageUrlAlt,
    posterPlaceholder: !posterImageUrl,
    raw: p,
  }
}

export function mapStudentServicesDirectoryClub(c) {
  if (!c || typeof c !== 'object') return null
  const normalizeStatus = (s) => {
    const v = String(s ?? '').trim().toLowerCase()
    if (!v) return 'Active'
    // Backend may expose internal enums; map them to UI-friendly values.
    if (v === 'approved' || v === 'active') return 'Active'
    if (v === 'archived' || v === 'inactive') return 'Inactive'
    // Numeric enums seen in some implementations (example: 3 = archived/inactive).
    if (v === '3') return 'Inactive'
    if (v === '1' || v === '2') return 'Active'
    // Fallback: preserve capitalization of known UI values; otherwise default to Active.
    if (v === 'inactive') return 'Inactive'
    return 'Active'
  }
  const rawProfile = firstNonEmptyLink(
    c.profileImageUrl,
    c.ProfileImageUrl,
    typeof c.club === 'object' && c.club ? c.club.profileImageUrl : undefined,
    typeof c.club === 'object' && c.club ? c.club.ProfileImageUrl : undefined
  )
  const pubDisplay = rawProfile ? resolvePublishedClubImageDisplayUrls(rawProfile) : { primary: null, alt: null }
  const profileImageUrl = pubDisplay.primary ?? undefined
  const profileImageUrlAlt = pubDisplay.alt ?? undefined
  const nestedClub =
    typeof c.club === 'object' && c.club && !Array.isArray(c.club)
      ? /** @type {Record<string, unknown>} */ (c.club)
      : null
  const rawProposed = firstNonEmptyLink(
    c.proposedProfileImageUrl,
    c.ProposedProfileImageUrl,
    c.proposedProfileImageURL,
    c.ProposedProfileImageURL,
    c.pendingProfileImageUrl,
    c.PendingProfileImageUrl,
    c.pendingProfileImage,
    c.proposed_profile_image_url,
    c.pending_profile_image_url,
    c.proposedImageUrl,
    c.ProposedImageUrl,
    nestedClub?.proposedProfileImageUrl,
    nestedClub?.ProposedProfileImageUrl,
    nestedClub?.pendingProfileImageUrl,
    c.Result?.proposedProfileImageUrl,
    c.result?.proposedProfileImageUrl
  )
  const propDisplay = rawProposed ? resolveProposedClubImageDisplayUrls(rawProposed) : { primary: null, alt: null }
  return {
    id: String(c.id),
    name: String(c.name ?? ''),
    established: c.established != null ? String(c.established) : '—',
    president: String(c.president ?? c.presidentName ?? '—'),
    presidentId: String(c.presidentId ?? ''),
    members: memberCountFromClubDto(c),
    category: String(c.category ?? ''),
    status: normalizeStatus(c.status),
    iconColor: c.iconColor ?? 'blue',
    profileImageUrl,
    profileImageUrlAlt,
    proposedProfileImageUrl: propDisplay.primary ?? undefined,
    proposedProfileImageUrlAlt: propDisplay.alt ?? undefined,
    raw: c,
  }
}

export function mapStudentServicesApprovedEvent(e) {
  const m = mapEventFromApi(e)
  if (!m) return null
  return {
    id: m.id,
    title: m.title,
    date: m.date,
    club: m.clubName || '—',
    venue: m.location || '—',
    capacity: m.seatLimit ?? 0,
    durationHours: 2,
    description: m.description,
    subEvents: m.subEvents || [],
    image: m.image,
    raw: e,
  }
}

export function mapVacancyFromApi(dto, index = 0) {
  if (!dto || typeof dto !== 'object') return null
  const id =
    dto.id ??
    dto.vacancyId ??
    dto.vacancyID ??
    dto.vacancy_id ??
    dto.VacancyId ??
    dto.VacancyID ??
    index
  const desc = dto.description != null ? String(dto.description) : ''
  const aboutRole = desc
    ? desc.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : []
  const isActive = dto.isActive !== undefined ? Boolean(dto.isActive) : !/^inactive$/i.test(String(dto.status ?? ''))
  const statusLabel =
    dto.status != null
      ? String(dto.status)
      : isActive
        ? 'active'
        : 'inactive'
  const clubNameRaw = dto.clubName ?? dto.club?.name ?? dto.club?.title ?? dto.club
  return {
    id: String(id),
    position: String(dto.title ?? dto.position ?? ''),
    clubName: clubNameRaw != null ? String(clubNameRaw) : '',
    clubId: dto.clubId != null ? String(dto.clubId) : undefined,
    category: String(dto.category ?? 'General'),
    categoryTag: dto.categoryTag != null ? String(dto.categoryTag) : undefined,
    employmentType: dto.employmentType != null ? String(dto.employmentType) : 'Part-time',
    location: dto.location != null ? String(dto.location) : 'On-campus',
    postedAt: dto.postedAt
      ? new Date(String(dto.postedAt)).toLocaleDateString()
      : dto.createdAt
        ? new Date(String(dto.createdAt)).toLocaleDateString()
        : '',
    deadline: dto.deadline
      ? new Date(String(dto.deadline)).toLocaleDateString()
      : dto.applicationDeadline
        ? new Date(String(dto.applicationDeadline)).toLocaleDateString()
        : '',
    applicants: dto.applicantsCount ?? dto.applicationsCount ?? dto.totalApplicants ?? undefined,
    aboutRole: aboutRole.length ? aboutRole : [desc || 'Details coming soon.'],
    benefits: Array.isArray(dto.benefits) ? dto.benefits : undefined,
    isActive,
    status: statusLabel,
    raw: dto,
  }
}
