/** Map interview slot DTO (club-admin or applications/*) for student picker UI. */
export function mapInterviewSlotForStudent(slot, index = 0) {
  if (!slot || typeof slot !== 'object') return null
  const id = slot.id != null ? String(slot.id) : `slot-${index}`
  const startsAt = slot.startsAt ? new Date(slot.startsAt) : null
  const endsAt = slot.endsAt ? new Date(slot.endsAt) : null
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
  const takenByAnother = cap != null && booked != null && booked >= cap
  return {
    id,
    date,
    startTime,
    endTime,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    takenByAnother,
    raw: slot,
  }
}

export function normalizeInterviewSlotsResponse(data) {
  const items = data?.items ?? (Array.isArray(data) ? data : [])
  return Array.isArray(items) ? items : []
}

/** Me /vacancy-applications status → display labels used in MyVacancyApplications UI */
export function mapMeVacancyStatusToDisplay(status) {
  const s = String(status ?? 'Pending').trim()
  if (/^pending$/i.test(s)) return 'Under Review'
  if (/^reviewing$/i.test(s)) return 'Called for Interview'
  if (/interview\s*scheduled/i.test(s)) return 'Interview Scheduled'
  if (/^approved$/i.test(s)) return 'Accepted'
  if (/^rejected$/i.test(s)) return 'Declined'
  if (/^cancelled$/i.test(s)) return 'Declined'
  return s || 'Under Review'
}
