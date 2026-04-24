/** Map interview slot DTO (club-admin or applications/*) for student picker UI. */
export function mapInterviewSlotForStudent(slot, index = 0) {
  if (!slot || typeof slot !== 'object') return null
  const id = slot.id != null ? String(slot.id) : `slot-${index}`
  const startsAtRaw = slot.startsAt ?? slot.startAt
  const endsAtRaw = slot.endsAt ?? slot.endAt
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null
  const pad2 = (n) => String(n).padStart(2, '0')
  let date = ''
  let startTime = ''
  let endTime = ''
  if (startsAt && !Number.isNaN(startsAt.getTime())) {
    date = `${startsAt.getFullYear()}-${pad2(startsAt.getMonth() + 1)}-${pad2(startsAt.getDate())}`
    startTime = `${pad2(startsAt.getHours())}:${pad2(startsAt.getMinutes())}`
  }
  if (endsAt && !Number.isNaN(endsAt.getTime())) {
    endTime = `${pad2(endsAt.getHours())}:${pad2(endsAt.getMinutes())}`
  }
  const cap = slot.capacity != null ? Number(slot.capacity) : undefined
  const booked = slot.bookedCount != null ? Number(slot.bookedCount) : slot.booked != null ? Number(slot.booked) : undefined
  const remainingCapacity = slot.remainingCapacity != null ? Number(slot.remainingCapacity) : undefined
  const bookable = slot.bookable != null ? Boolean(slot.bookable) : undefined
  const takenByAnother =
    bookable === false ||
    (remainingCapacity != null ? remainingCapacity <= 0 : cap != null && booked != null && booked >= cap)
  return {
    id,
    date,
    startTime,
    endTime,
    startsAt: startsAtRaw ?? null,
    endsAt: endsAtRaw ?? null,
    takenByAnother,
    remainingCapacity,
    bookable,
    raw: slot,
  }
}

export function normalizeInterviewSlotsResponse(data) {
  const items = data?.items ?? data?.slots ?? (Array.isArray(data) ? data : [])
  return Array.isArray(items) ? items : []
}

/** Me /vacancy-applications status → display labels used in MyVacancyApplications UI */
export function mapMeVacancyStatusToDisplay(status) {
  const s = String(status ?? 'Pending').trim()
  if (/^interviewinvited$/i.test(s)) return 'Called for Interview'
  if (/^interviewscheduled$/i.test(s) || /interview\s*scheduled/i.test(s)) return 'Interview Scheduled'
  if (/^pending$/i.test(s)) return 'Submitted'
  if (/^reviewing$/i.test(s)) return 'Under Review'
  if (/interview\s*scheduled/i.test(s)) return 'Interview Scheduled'
  if (/^approved$/i.test(s)) return 'Accepted'
  if (/^rejected$/i.test(s)) return 'Declined'
  if (/^cancelled$/i.test(s)) return 'Declined'
  return s || 'Under Review'
}

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * Shapes: flat booking, nested `slot`, or slot-like object.
 * @returns {{ date: string, startTime: string, endTime: string } | null}
 */
export function mapApiBookingToDisplay(booking) {
  if (!booking || typeof booking !== 'object') return null
  let startRaw = booking.startAt ?? booking.startsAt
  let endRaw = booking.endAt ?? booking.endsAt
  const slot = booking.slot
  if (slot && typeof slot === 'object') {
    if (startRaw == null) startRaw = slot.startsAt ?? slot.startAt
    if (endRaw == null) endRaw = slot.endsAt ?? slot.endAt
  }
  if (startRaw == null) return null
  const start = new Date(String(startRaw))
  if (Number.isNaN(start.getTime())) return null
  const end = endRaw != null ? new Date(String(endRaw)) : null
  const date = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`
  const hhmm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  return {
    date,
    startTime: hhmm(start),
    endTime: end && !Number.isNaN(end.getTime()) ? hhmm(end) : '',
  }
}

/**
 * @param {string|undefined} isoStart
 * @param {string|undefined} isoEnd
 */
export function formatInterviewTimeShort(isoStart, isoEnd) {
  if (isoStart == null || String(isoStart).trim() === '') return '—'
  const s = new Date(String(isoStart))
  if (Number.isNaN(s.getTime())) return '—'
  const e = isoEnd != null && String(isoEnd).trim() !== '' ? new Date(String(isoEnd)) : null
  const dOpts = { month: 'short', day: 'numeric', year: 'numeric' }
  const tOpts = { hour: '2-digit', minute: '2-digit' }
  if (e && !Number.isNaN(e.getTime())) {
    return `${s.toLocaleString(undefined, { ...dOpts, ...tOpts })} – ${e.toLocaleTimeString(undefined, tOpts)}`
  }
  return s.toLocaleString(undefined, { ...dOpts, ...tOpts })
}
