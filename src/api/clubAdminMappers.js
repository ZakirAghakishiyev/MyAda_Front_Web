function normalizeAdminStatus(status) {
  let s = String(status ?? 'Pending').trim()
  if (s === 'Submitted') s = 'Pending'
  if (/^cancelled$/i.test(s)) s = 'Rejected'
  return s
}

function formatAppliedOn(row) {
  if (row.submittedAt) return new Date(row.submittedAt).toLocaleDateString()
  if (row.membership && typeof row.membership === 'object' && row.membership.createdAt) {
    const d = new Date(String(row.membership.createdAt))
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString()
    return String(row.membership.createdAt)
  }
  if (row.appliedOn) return String(row.appliedOn)
  return '—'
}

/**
 * Map club-admin applications list item (union: applicationType + job | membership).
 * @param {Record<string, unknown>} row
 */
export function mapClubAdminApplicationFromApi(row) {
  if (!row || typeof row !== 'object') return null
  const id = row.id ?? row.applicationId
  if (id == null) return null

  const applicationTypeRaw = String(row.applicationType ?? '').toLowerCase()
  const status = normalizeAdminStatus(row.status)

  if (applicationTypeRaw === 'job' && row.job && typeof row.job === 'object') {
    const j = row.job
    const uid = j.applicantUserId != null ? String(j.applicantUserId) : ''
    const purpose =
      j.purposeOfApplication != null
        ? String(j.purposeOfApplication)
        : j.experience != null
          ? String(j.experience)
          : j.message != null
            ? String(j.message)
            : ''
    const files = []
    if (j.fileUrl != null && String(j.fileUrl).trim()) {
      files.push({
        id: 'cv',
        name: String(j.fileUrl).split(/[/\\]/).pop() || 'cv',
        url: String(j.fileUrl),
        type: 'application/pdf',
      })
    }
    if (Array.isArray(row.files)) files.push(...row.files)

    const interviewSlotId =
      row.interviewSlotId != null
        ? String(row.interviewSlotId)
        : j.interviewSlotId != null
          ? String(j.interviewSlotId)
          : j.interview?.slotId != null
            ? String(j.interview.slotId)
            : ''
    const embedSlot = j.interviewSlot && typeof j.interviewSlot === 'object' ? j.interviewSlot : j.slot && typeof j.slot === 'object' ? j.slot : null
    let interviewStartsAt = j.interviewStartsAt ?? j.interviewStartAt ?? j.scheduledStartAt
    let interviewEndsAt = j.interviewEndsAt ?? j.scheduledEndAt
    if (embedSlot) {
      if (interviewStartsAt == null) interviewStartsAt = embedSlot.startsAt ?? embedSlot.startAt
      if (interviewEndsAt == null) interviewEndsAt = embedSlot.endsAt ?? embedSlot.endAt
    }

    return {
      id: String(id),
      applicationType: 'job',
      applicantName: j.applicantName != null ? String(j.applicantName) : uid ? `User ${uid.slice(0, 8)}…` : 'Applicant',
      email: j.applicantEmail != null ? String(j.applicantEmail) : '—',
      studentId: uid || '—',
      roleType: j.vacancyTitle != null ? String(j.vacancyTitle) : 'Vacancy',
      appliedOn: formatAppliedOn(row),
      status,
      phone: '—',
      department: '—',
      year: '—',
      gpa: '—',
      interviewSlotId: interviewSlotId || undefined,
      interviewStartsAt: interviewStartsAt != null ? String(interviewStartsAt) : undefined,
      interviewEndsAt: interviewEndsAt != null ? String(interviewEndsAt) : undefined,
      answers: {
        purposeOfApplication: purpose,
        additionalAnswers: [],
      },
      files,
      raw: row,
    }
  }

  if (applicationTypeRaw === 'membership' && row.membership && typeof row.membership === 'object') {
    const m = row.membership
    const uid = m.applicantUserId != null ? String(m.applicantUserId) : ''
    return {
      id: String(id),
      applicationType: 'membership',
      applicantName: m.applicantName != null ? String(m.applicantName) : uid ? `User ${uid.slice(0, 8)}…` : 'Applicant',
      email: m.applicantEmail != null ? String(m.applicantEmail) : '—',
      studentId: uid || '—',
      roleType: 'Membership',
      appliedOn: formatAppliedOn(row),
      status,
      phone: '—',
      department: '—',
      year: '—',
      gpa: '—',
      answers: {
        letterOfPurpose: m.letterOfPurpose != null ? String(m.letterOfPurpose) : '',
        previousExperience: m.links != null ? String(m.links) : '',
      },
      files: Array.isArray(row.files) ? row.files : [],
      raw: row,
    }
  }

  return null
}

export function mapClubAdminApplicationDetailFromApi(detail) {
  const base = mapClubAdminApplicationFromApi(detail)
  if (!base) return null
  const notes = Array.isArray(detail.notes)
    ? detail.notes.map((n) => ({
        text: n.text != null ? String(n.text) : '',
        createdAt: n.createdAt != null ? String(n.createdAt) : '',
      }))
    : []
  return { ...base, notes }
}

export function splitClubAdminApplications(items) {
  const arr = Array.isArray(items) ? items : []
  const mapped = arr.map(mapClubAdminApplicationFromApi).filter(Boolean)
  return {
    membership: mapped.filter((r) => r.applicationType === 'membership'),
    job: mapped.filter((r) => r.applicationType === 'job'),
  }
}

/** @deprecated use mapClubAdminApplicationFromApi */
export function normalizeClubAdminApplication(row) {
  return mapClubAdminApplicationFromApi(row)
}
