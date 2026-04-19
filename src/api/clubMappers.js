import { clubGatewayOrigin } from './clubConfig'

export function resolveClubMediaUrl(path) {
  if (path == null || path === '') return null
  const s = String(path)
  if (/^https?:\/\//i.test(s)) return s
  const origin = clubGatewayOrigin().replace(/\/+$/, '')
  return `${origin}${s.startsWith('/') ? s : `/${s}`}`
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
  return {
    id: String(id),
    name: String(dto.name ?? ''),
    category: String(dto.category ?? ''),
    image: resolveClubMediaUrl(dto.image) || dto.image,
    tags,
    members: Number(dto.members) || 0,
    about: aboutText,
    description: dto.description != null ? String(dto.description) : '',
    status: dto.status != null ? String(dto.status) : '',
    establishedYear: dto.establishedYear != null ? String(dto.establishedYear) : undefined,
    location: dto.location != null ? String(dto.location) : undefined,
    email: dto.email != null ? String(dto.email) : 'clubs@ada.edu.az',
    website: dto.website != null ? String(dto.website) : undefined,
    instagram: dto.instagram != null ? String(dto.instagram) : undefined,
    x: dto.x != null ? String(dto.x) : dto.twitter != null ? String(dto.twitter) : undefined,
    tiktok: dto.tiktok != null ? String(dto.tiktok) : undefined,
    focusAreas: Array.isArray(dto.focusAreas) ? dto.focusAreas : [],
    officers: Array.isArray(dto.officers) ? dto.officers : [],
    announcements: Array.isArray(dto.announcements) ? dto.announcements : [],
    memberProfiles: Array.isArray(dto.memberProfiles) ? dto.memberProfiles : [],
    socialLinks: dto.socialLinks && typeof dto.socialLinks === 'object' ? dto.socialLinks : {},
    categoryId: dto.categoryId,
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
    image: resolveClubMediaUrl(dto.image) || dto.image || null,
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
/** Student Services dashboard: map API club proposal to UI row shape */
export function mapStudentServicesClubProposal(p, index = 0) {
  if (!p || typeof p !== 'object') return null
  const id = String(p.id ?? index)
  const proposalId = String(p.proposalId ?? p.proposalID ?? id)
  const desc = String(p.description ?? p.shortDesc ?? '')
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
    primaryOfficers: Array.isArray(p.primaryOfficers) ? p.primaryOfficers : [],
    otherMembers: Array.isArray(p.otherMembers) ? p.otherMembers : [],
    alignment: String(p.alignment ?? ''),
    vision: String(p.vision ?? ''),
    commitment: p.commitment ?? 'yes',
    constitutionDoc: p.constitutionDoc ?? { name: 'constitution.pdf', size: '—', uploadedAt: '—' },
    raw: p,
  }
}

export function mapStudentServicesEventProposal(p, index = 0) {
  if (!p || typeof p !== 'object') return null
  const id = String(p.id ?? index)
  return {
    id,
    proposalId: String(p.proposalId ?? p.id ?? id),
    eventTitle: String(p.eventTitle ?? p.name ?? p.title ?? 'Event proposal'),
    submittedOn: p.submittedOn ?? (p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : '—'),
    submittedBy: String(p.submittedBy ?? '—'),
    submittedAgo: String(p.submittedAgo ?? ''),
    clubName: String(p.clubName ?? ''),
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
    objectives: Array.isArray(p.objectives) ? p.objectives : [],
    subEvents: Array.isArray(p.subEvents) ? p.subEvents : [],
    posterPlaceholder: true,
    raw: p,
  }
}

export function mapStudentServicesDirectoryClub(c) {
  if (!c || typeof c !== 'object') return null
  const profileImageUrl =
    c.profileImageUrl != null
      ? resolveClubMediaUrl(c.profileImageUrl) || c.profileImageUrl
      : c.image != null
        ? resolveClubMediaUrl(c.image) || c.image
        : undefined
  return {
    id: String(c.id),
    name: String(c.name ?? ''),
    established: c.established != null ? String(c.established) : '—',
    president: String(c.president ?? c.presidentName ?? '—'),
    presidentId: String(c.presidentId ?? ''),
    members: Number(c.members) || 0,
    category: String(c.category ?? ''),
    status: String(c.status ?? 'Active'),
    iconColor: c.iconColor ?? 'blue',
    profileImageUrl,
    proposedProfileImageUrl: c.proposedProfileImageUrl
      ? resolveClubMediaUrl(c.proposedProfileImageUrl)
      : undefined,
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

export function mapVacancyFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null
  const id = dto.id ?? dto.vacancyId
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
  return {
    id: String(id),
    position: String(dto.title ?? dto.position ?? ''),
    clubName: String(dto.clubName ?? ''),
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
