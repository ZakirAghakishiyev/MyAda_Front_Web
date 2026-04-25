import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchProposalMemberProfile, resolveEnteredIdToOrganizationalId } from '../api/authUsersApi'
import {
  CLUB_PROPOSAL_MAX_CONSTITUTION_BYTES,
  CLUB_PROPOSAL_MAX_LOGO_BYTES,
  fetchStudentServicesProposalRequirements,
  submitClubProposal,
} from '../api/clubApi'
import ClubsAreaNav from '../components/clubs/ClubsAreaNav'
import './ProposeClub.css'

const STEPS = 4
const STEP_LABELS = ['DETAILS', 'LEADERSHIP', 'ALIGNMENT', 'REVIEW']
const DESC_MAX = 500
const MIN_ALIGNMENT_WORDS = 200
const POSITION_OPTIONS = ['Select Position', 'Secretary', 'Treasurer', 'Social Media Manager', 'Event Coordinator', 'Outreach Officer', 'Other']
const STUDENT_ID_REGEX = /^\d{9}$/
/** Standard UUID string (e.g. from directory / SSO user id) */
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const INVALID_MEMBER_ID_MSG = 'Use a 9-digit student ID or a GUID (e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890)'

function isValidProposalMemberId(raw) {
  const s = String(raw || '').trim()
  if (!s) return false
  return STUDENT_ID_REGEX.test(s) || GUID_REGEX.test(s)
}

const PROPOSE_CLUB_DRAFT_COOKIE_KEY = 'clubs_propose_club_draft'

const DEFAULT_REQUIREMENTS = [
  'Minimum of 10 currently enrolled student members required.',
  'Founding members must maintain a minimum 2.5 cumulative GPA.',
  'Club constitution must align with university anti-discrimination policies.',
]

function parseDeadlineToDate(deadlineRaw) {
  const s = (deadlineRaw || '').trim()
  if (!s) return null

  // If backend sends an ISO timestamp (e.g. "2026-04-25T08:00:00Z"), Date parses it as UTC and
  // displays it in the user's local timezone when formatting.
  if (s.includes('T')) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // If backend sends an ISO date only (e.g. "2026-05-01"), treat it as end-of-day local time.
  const endOfDay = new Date(`${s}T23:59:59.999`)
  return Number.isNaN(endOfDay.getTime()) ? null : endOfDay
}

const formatDeadlineLabel = (deadlineRaw) => {
  const d = parseDeadlineToDate(deadlineRaw)
  if (!d) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

const isAfterDeadline = (deadlineRaw) => {
  const d = parseDeadlineToDate(deadlineRaw)
  if (!d) return false
  return Date.now() > d.getTime()
}

const setDraftCookie = (key, value, days = 7) => {
  if (typeof document === 'undefined') return
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `${key}=${encoded}; expires=${expires}; path=/`
  } catch (err) {
    console.error('Failed to save draft cookie', err)
  }
}

const getDraftCookie = (key) => {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const prefix = `${key}=`
  const raw = cookies.find((c) => c.startsWith(prefix))
  if (!raw) return null
  const value = raw.substring(prefix.length)
  try {
    return JSON.parse(decodeURIComponent(value))
  } catch (err) {
    console.error('Failed to parse draft cookie', err)
    return null
  }
}

const clearDraftCookie = (key) => {
  if (typeof document === 'undefined') return
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)
const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const IconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconPeople = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconDiamond = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
  </svg>
)
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)
const IconUploadImage = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
)
const IconUploadDoc = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
)
const countWords = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length

const ProposeClub = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const clubsHome = location.pathname.startsWith('/student-services') ? '/student-services' : '/clubs'
  const [step, setStep] = useState(1)
  const [clubName, setClubName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [uniqueDesc, setUniqueDesc] = useState('')
  const [goals, setGoals] = useState('')
  const [activities, setActivities] = useState('')
  const [presidentId, setPresidentId] = useState('')
  const [vicePresidentId, setVicePresidentId] = useState('')
  const [presidentError, setPresidentError] = useState('')
  const [vpError, setVpError] = useState('')
  const [vpStatus, setVpStatus] = useState('')
  const [presidentDisplayName, setPresidentDisplayName] = useState('')
  const [presidentNameLoading, setPresidentNameLoading] = useState(false)
  const [vicePresidentDisplayName, setVicePresidentDisplayName] = useState('')
  const [vicePresidentNameLoading, setVicePresidentNameLoading] = useState(false)
  const [otherMemberId, setOtherMemberId] = useState('')
  const [otherMemberPosition, setOtherMemberPosition] = useState('')
  const [otherMemberIdError, setOtherMemberIdError] = useState('')
  const [otherMemberInputDisplayName, setOtherMemberInputDisplayName] = useState('')
  const [otherMemberInputNameLoading, setOtherMemberInputNameLoading] = useState(false)
  const [otherMembers, setOtherMembers] = useState([])
  const presidentBlurSeq = useRef(0)
  const vpBlurSeq = useRef(0)
  const otherMemberInputBlurSeq = useRef(0)
  const [alignment, setAlignment] = useState('')
  const [vision, setVision] = useState('')
  const [commitment, setCommitment] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [constitutionFile, setConstitutionFile] = useState(null)
  const [logoFileError, setLogoFileError] = useState('')
  const [constitutionFileError, setConstitutionFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [policy, setPolicy] = useState({
    loading: true,
    requirements: DEFAULT_REQUIREMENTS,
    deadline: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const dto = await fetchStudentServicesProposalRequirements()
        if (cancelled) return
        const reqs = Array.isArray(dto?.requirements) ? dto.requirements.filter((r) => typeof r === 'string' && r.trim()) : null
        setPolicy({
          loading: false,
          requirements: reqs && reqs.length ? reqs : DEFAULT_REQUIREMENTS,
          deadline: dto?.deadline != null ? String(dto.deadline) : null,
        })
      } catch {
        if (!cancelled) {
          setPolicy((p) => ({
            ...p,
            loading: false,
          }))
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const draft = getDraftCookie(PROPOSE_CLUB_DRAFT_COOKIE_KEY)
    if (!draft) return

    if (typeof draft.step === 'number' && draft.step >= 1 && draft.step <= STEPS) {
      setStep(draft.step)
    }
    setClubName(draft.clubName || '')
    setShortDesc(draft.shortDesc || '')
    setUniqueDesc(draft.uniqueDesc || '')
    setGoals(draft.goals || '')
    setActivities(draft.activities || '')
    setPresidentId(draft.presidentId || '')
    setVicePresidentId(draft.vicePresidentId || '')
    setOtherMembers(
      Array.isArray(draft.otherMembers)
        ? draft.otherMembers.map((m, idx) => ({
            rowId: m.rowId || `draft-${idx}-${String(m.studentId || '')}`,
            studentId: m.studentId,
            position: m.position,
            displayName: m.displayName !== undefined ? m.displayName : undefined,
          }))
        : []
    )
    setAlignment(draft.alignment || '')
    setVision(draft.vision || '')
    setCommitment(draft.commitment || '')
  }, [])

  const handleBack = () => {
    if (step === 1) navigate(clubsHome)
    else setStep((s) => s - 1)
  }

  const validatePresidentId = (val) => {
    if (!val) return ''
    return isValidProposalMemberId(val) ? '' : INVALID_MEMBER_ID_MSG
  }
  const validateVpId = (val) => {
    if (!val) return ''
    return isValidProposalMemberId(val) ? '' : INVALID_MEMBER_ID_MSG
  }

  const runPresidentNameLookup = (raw) => {
    if (!isValidProposalMemberId(raw)) {
      setPresidentDisplayName('')
      setPresidentNameLoading(false)
      return
    }
    presidentBlurSeq.current += 1
    const seq = presidentBlurSeq.current
    setPresidentNameLoading(true)
    fetchProposalMemberProfile(raw)
      .then((pr) => {
        if (seq !== presidentBlurSeq.current) return
        setPresidentDisplayName(pr?.displayName || '')
      })
      .finally(() => {
        if (seq === presidentBlurSeq.current) setPresidentNameLoading(false)
      })
  }

  const onPresidentBlur = () => {
    setPresidentError(validatePresidentId(presidentId))
    runPresidentNameLookup(presidentId.trim())
  }

  const runVpNameLookup = (raw) => {
    if (!isValidProposalMemberId(raw)) {
      setVicePresidentDisplayName('')
      setVicePresidentNameLoading(false)
      return
    }
    vpBlurSeq.current += 1
    const seq = vpBlurSeq.current
    setVicePresidentNameLoading(true)
    fetchProposalMemberProfile(raw)
      .then((pr) => {
        if (seq !== vpBlurSeq.current) return
        setVicePresidentDisplayName(pr?.displayName || '')
      })
      .finally(() => {
        if (seq === vpBlurSeq.current) setVicePresidentNameLoading(false)
      })
  }

  const onVpBlur = () => {
    setVpError(validateVpId(vicePresidentId))
    if (vicePresidentId && isValidProposalMemberId(vicePresidentId)) setVpStatus('Waitlisted for verification')
    else setVpStatus('')
    runVpNameLookup(vicePresidentId.trim())
  }

  /** When opening Leadership step, resolve officer names (draft restore / return from later step). */
  useEffect(() => {
    if (step !== 2) return
    let cancelled = false
    ;(async () => {
      const p = presidentId.trim()
      if (isValidProposalMemberId(p)) {
        if (!cancelled) setPresidentNameLoading(true)
        const pr = await fetchProposalMemberProfile(p)
        if (!cancelled) {
          setPresidentDisplayName(pr?.displayName || '')
          setPresidentNameLoading(false)
        }
      } else if (!cancelled) {
        setPresidentDisplayName('')
      }
      const v = vicePresidentId.trim()
      if (isValidProposalMemberId(v)) {
        if (!cancelled) setVicePresidentNameLoading(true)
        const vr = await fetchProposalMemberProfile(v)
        if (!cancelled) {
          setVicePresidentDisplayName(vr?.displayName || '')
          setVicePresidentNameLoading(false)
        }
      } else if (!cancelled) {
        setVicePresidentDisplayName('')
      }
    })()
    return () => {
      cancelled = true
    }
    // Intentionally only `step`: avoid auth lookup on every keystroke; blur handlers refresh names.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  /** Resolve display names for executive rows still missing them (e.g. draft with saved roster). */
  useEffect(() => {
    if (step !== 2) return
    let cancelled = false
    ;(async () => {
      for (const m of otherMembers) {
        if (cancelled) return
        const sid = String(m.studentId || '').trim()
        if (!isValidProposalMemberId(sid) || m.displayName !== undefined) continue
        const rowId = m.rowId
        const pr = await fetchProposalMemberProfile(sid)
        if (cancelled) return
        setOtherMembers((prev) =>
          prev.map((row) => (row.rowId === rowId ? { ...row, displayName: pr?.displayName || '' } : row))
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [step, otherMembers])

  const onOtherMemberIdBlur = () => {
    const raw = otherMemberId.trim()
    if (!isValidProposalMemberId(raw)) {
      setOtherMemberInputDisplayName('')
      setOtherMemberInputNameLoading(false)
      return
    }
    otherMemberInputBlurSeq.current += 1
    const seq = otherMemberInputBlurSeq.current
    setOtherMemberInputNameLoading(true)
    fetchProposalMemberProfile(raw)
      .then((pr) => {
        if (seq !== otherMemberInputBlurSeq.current) return
        setOtherMemberInputDisplayName(pr?.displayName || '')
      })
      .finally(() => {
        if (seq === otherMemberInputBlurSeq.current) setOtherMemberInputNameLoading(false)
      })
  }

  const addOtherMember = () => {
    const id = otherMemberId.trim()
    const pos = otherMemberPosition && otherMemberPosition !== 'Select Position' ? otherMemberPosition : null
    setOtherMemberIdError('')
    if (!id || !pos) return
    if (!isValidProposalMemberId(id)) {
      setOtherMemberIdError(INVALID_MEMBER_ID_MSG)
      return
    }
    const rowId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setOtherMembers((prev) => [...prev, { rowId, studentId: id, position: pos, displayName: undefined }])
    setOtherMemberId('')
    setOtherMemberPosition('')
    setOtherMemberInputDisplayName('')
    setOtherMemberInputNameLoading(false)
  }
  const removeOtherMember = (index) => setOtherMembers((prev) => prev.filter((_, i) => i !== index))

  const canContinueStep1 = clubName.trim() && shortDesc.trim() && uniqueDesc.trim() && goals.trim() && activities.trim()
  const canContinueStep2 = presidentId.trim() && vicePresidentId.trim() && !validatePresidentId(presidentId) && !validateVpId(vicePresidentId)
  const alignmentWords = countWords(alignment)
  const canContinueStep3 = alignment.trim() && vision.trim() && commitment === 'yes' && alignmentWords >= MIN_ALIGNMENT_WORDS
  const canContinueStep4 =
    logoFile &&
    constitutionFile &&
    !logoFileError &&
    !constitutionFileError &&
    logoFile.size <= CLUB_PROPOSAL_MAX_LOGO_BYTES &&
    constitutionFile.size <= CLUB_PROPOSAL_MAX_CONSTITUTION_BYTES

  const canContinue =
    (step === 1 && canContinueStep1) ||
    (step === 2 && canContinueStep2) ||
    (step === 3 && canContinueStep3) ||
    (step === 4 && canContinueStep4)

  const step3BlockedMessage =
    step === 3 && !canContinueStep3
      ? !alignment.trim()
        ? 'Continue stays off until you write your mission alignment (below).'
        : alignmentWords < MIN_ALIGNMENT_WORDS
          ? `Mission alignment must be at least ${MIN_ALIGNMENT_WORDS} words. You have ${alignmentWords} — add about ${MIN_ALIGNMENT_WORDS - alignmentWords} more.`
          : !vision.trim()
            ? 'Continue stays off until you fill in long-term vision (3–5 years).'
            : commitment !== 'yes'
              ? 'Continue stays off until you select “Yes, I commit”.'
              : null
      : null

  const deadlinePassed = isAfterDeadline(policy.deadline)

  // Deny access entirely after the deadline.
  useEffect(() => {
    if (policy.loading) return
    if (!deadlinePassed) return
    navigate(clubsHome, { replace: true, state: { toast: 'Club proposals are closed (deadline passed).' } })
  }, [policy.loading, deadlinePassed, navigate, clubsHome])

  const handleContinue = async () => {
    if (step < STEPS) {
      setStep((s) => s + 1)
      return
    }
    if (deadlinePassed) {
      alert('The submission deadline has passed. New club proposals are currently closed.')
      return
    }
    if (!logoFile || !constitutionFile || !clubName.trim()) return
    setSubmitting(true)
    try {
      const presidentLookup = presidentId.trim()
      const vpLookup = vicePresidentId.trim()
      const otherLookups = otherMembers.map((m) => String(m.studentId || '').trim()).filter(Boolean)
      const uniqueLookups = [...new Set([presidentLookup, vpLookup, ...otherLookups].filter(Boolean))]
      /** Resolve directory input to organizational id for Club API (do not send Auth user GUID). */
      const orgIdByLookup = new Map()
      await Promise.all(
        uniqueLookups.map(async (lookup) => {
          const orgId = await resolveEnteredIdToOrganizationalId(lookup)
          orgIdByLookup.set(lookup, orgId)
        })
      )
      const presidentOrg = orgIdByLookup.get(presidentLookup) || ''
      const vpOrg = orgIdByLookup.get(vpLookup) || ''
      const otherMembersForApi = otherMembers.map((m) => {
        const lookup = String(m.studentId || '').trim()
        const org = lookup ? orgIdByLookup.get(lookup) : ''
        return { ...m, studentId: org || lookup }
      })

      const description = [
        shortDesc && `Summary: ${shortDesc}`,
        uniqueDesc && `Uniqueness: ${uniqueDesc}`,
        goals && `Goals: ${goals}`,
        activities && `Activities: ${activities}`,
        alignment && `Mission alignment: ${alignment}`,
        vision && `Vision: ${vision}`,
      ]
        .filter(Boolean)
        .join('\n\n')
      await submitClubProposal({
        name: clubName.trim(),
        description: description.slice(0, 12000),
        logoFile,
        constitutionFile,
        presidentStudentId: presidentOrg,
        vicePresidentStudentId: vpOrg,
        // API: repeated `otherMembersJson` = organizational ids (resolved via Auth).
        otherMembers: otherMembersForApi,
        commitment: commitment === 'yes' ? 'yes' : 'no',
        shortDesc: shortDesc.trim().slice(0, DESC_MAX),
        uniqueDesc: uniqueDesc.trim(),
        goals: goals.trim(),
        activities: activities.trim(),
        alignment: alignment.trim(),
        vision: vision.trim(),
      })
      clearDraftCookie(PROPOSE_CLUB_DRAFT_COOKIE_KEY)
      navigate(clubsHome)
    } catch (e) {
      alert(e?.message || 'Could not submit proposal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const progressPct = (step / STEPS) * 100

  const handleSaveDraft = () => {
    const payload = {
      step,
      clubName,
      shortDesc,
      uniqueDesc,
      goals,
      activities,
      presidentId,
      vicePresidentId,
      otherMembers,
      alignment,
      vision,
      commitment,
      savedAt: Date.now()
    }
    setDraftCookie(PROPOSE_CLUB_DRAFT_COOKIE_KEY, payload)
    alert('Club registration draft saved. It will be restored when you reopen this page on this browser.')
  }

  const Sidebar = () => (
    <aside className="propose-sidebar">
      <div className="propose-sidebar-panel propose-sidebar-panel--blue">
        <IconInfo />
        <div>
          <strong>Eligibility Requirements</strong>
          <ul>
            {(policy.requirements || DEFAULT_REQUIREMENTS).map((r, idx) => (
              <li key={`${idx}-${r}`}>{r}</li>
            ))}
          </ul>
          <a href="#handbook" className="propose-sidebar-link">VIEW FULL HANDBOOK</a>
        </div>
      </div>
      <div className="propose-sidebar-panel propose-sidebar-panel--yellow">
        <IconWarning />
        <div>
          <strong>Submission Deadline</strong>
          <p>For Fall Semester recognition, all applications must be submitted by:</p>
          <p className="propose-sidebar-deadline">
            {policy.loading ? 'Loading…' : formatDeadlineLabel(policy.deadline)}
          </p>
          {deadlinePassed ? (
            <p className="propose-sidebar-note">Submissions are closed because the deadline has passed.</p>
          ) : (
            <p className="propose-sidebar-note">Applications submitted after this date will be considered for the next cycle.</p>
          )}
        </div>
      </div>
    </aside>
  )

  if (!policy.loading && deadlinePassed) {
    return (
      <div className="propose-page">
        <ClubsAreaNav />
        <div className="propose-content-wrap">
          <div className="propose-main-col">
            <div className="propose-card">
              <h1 className="propose-page-title" style={{ marginTop: 0 }}>Club proposals are closed</h1>
              <p className="propose-card-desc" style={{ marginTop: 8 }}>
                The submission deadline has passed.
              </p>
              <div className="propose-warning-box" style={{ marginTop: 16 }}>
                <IconWarning />
                <div>
                  <strong>Submission Deadline</strong>
                  <p style={{ margin: '6px 0 0' }}>{formatDeadlineLabel(policy.deadline)}</p>
                </div>
              </div>
              <div className="propose-actions propose-actions--footer" style={{ justifyContent: 'flex-start' }}>
                <button type="button" className="propose-btn-primary" onClick={() => navigate(clubsHome, { replace: true })}>
                  Back
                </button>
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    )
  }

  return (
    <div className="propose-page">
      <ClubsAreaNav />

      <div className="propose-content-wrap">
        <div className="propose-main-col">
          <h1 className="propose-page-title">New Club Registration</h1>
          <div className="propose-stepper">
            {STEP_LABELS.map((label, i) => (
              <span key={i} className={`propose-stepper-item ${i + 1 === step ? 'propose-stepper-item--active' : ''}`}>
                {i + 1}. {label}
              </span>
            ))}
            <span className="propose-stepper-right">Step {step} of {STEPS}</span>
          </div>

          {step === 1 && (
            <div className="propose-card">
              <h2 className="propose-card-heading">Club Fundamentals</h2>
              <p className="propose-card-desc">Provide the basic details and objectives for your proposed campus organization.</p>
              <div className="propose-field">
                <label>Proposed Club Name <span className="propose-required">*</span></label>
                <input type="text" placeholder="e.g., Chess Society" value={clubName} onChange={(e) => setClubName(e.target.value)} />
              </div>
              <div className="propose-field">
                <label>Short Description <span className="propose-required">*</span></label>
                <textarea placeholder="Briefly describe your club for the student directory..." value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, DESC_MAX))} rows={4} />
                <span className="propose-char-count">{shortDesc.length}/500 characters</span>
              </div>
              <div className="propose-field">
                <label>What makes this club unique? <span className="propose-required">*</span></label>
                <textarea placeholder="Explain how this club differs from existing campus organizations..." value={uniqueDesc} onChange={(e) => setUniqueDesc(e.target.value)} rows={4} />
              </div>
              <div className="propose-field">
                <label>Main goals and objectives <span className="propose-required">*</span></label>
                <textarea placeholder="List at least three key goals for the upcoming academic year..." value={goals} onChange={(e) => setGoals(e.target.value)} rows={4} />
              </div>
              <div className="propose-field">
                <label>Proposed activities/events <span className="propose-required">*</span></label>
                <textarea placeholder="Describe typical events, workshops, or meetings..." value={activities} onChange={(e) => setActivities(e.target.value)} rows={4} />
              </div>
              <div className="propose-actions">
                <button type="button" className="propose-btn-secondary" onClick={handleSaveDraft}>Save as Draft</button>
                <button type="button" className="propose-btn-primary" onClick={handleContinue} disabled={!canContinue}>
                  Continue to Step 2 <IconChevronRight />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="propose-card">
              <div className="propose-section-header">
                <IconShield />
                <h2>Primary Officers</h2>
              </div>
              <div className="propose-field">
                <label>President Student ID <span className="propose-required">*</span></label>
                <div className="propose-id-with-name">
                  <input
                    type="text"
                    placeholder="e.g. 123456789 or GUID"
                    value={presidentId}
                    onChange={(e) => {
                      setPresidentId(e.target.value)
                      if (presidentError) setPresidentError('')
                      presidentBlurSeq.current += 1
                      setPresidentDisplayName('')
                      setPresidentNameLoading(false)
                    }}
                    onBlur={onPresidentBlur}
                    className={presidentError ? 'propose-input-error' : ''}
                  />
                  {presidentNameLoading ? (
                    <span className="propose-resolved-name propose-resolved-name--muted">Looking up…</span>
                  ) : presidentDisplayName ? (
                    <span className="propose-resolved-name">{presidentDisplayName}</span>
                  ) : null}
                </div>
                {presidentError && <span className="propose-field-error"><span className="propose-field-error-icon">!</span> {presidentError}</span>}
              </div>
              <div className="propose-field">
                <label>Vice President Student ID <span className="propose-required">*</span></label>
                <div className="propose-id-with-name">
                  <input
                    type="text"
                    placeholder="e.g. 987654321 or GUID"
                    value={vicePresidentId}
                    onChange={(e) => {
                      setVicePresidentId(e.target.value)
                      if (vpError) setVpError('')
                      vpBlurSeq.current += 1
                      setVicePresidentDisplayName('')
                      setVicePresidentNameLoading(false)
                    }}
                    onBlur={onVpBlur}
                    className={vpError ? 'propose-input-error' : ''}
                  />
                  {vicePresidentNameLoading ? (
                    <span className="propose-resolved-name propose-resolved-name--muted">Looking up…</span>
                  ) : vicePresidentDisplayName ? (
                    <span className="propose-resolved-name">{vicePresidentDisplayName}</span>
                  ) : null}
                </div>
                {vpError && <span className="propose-field-error"><span className="propose-field-error-icon">!</span> {vpError}</span>}
                {vpStatus && !vpError && <span className="propose-field-hint">{vpStatus}</span>}
              </div>

              <div className="propose-section-header propose-section-header--mt">
                <IconPeople />
                <h2>Other Core Executive Members</h2>
              </div>
              <p className="propose-card-desc">Add additional roles such as Secretary, Treasurer, or Social Media Manager.</p>
              <div className="propose-add-row">
                <div className="propose-field propose-field--inline">
                  <label>STUDENT ID</label>
                  <div className="propose-id-with-name propose-id-with-name--compact">
                    <input
                      type="text"
                      placeholder="9 digits or GUID"
                      value={otherMemberId}
                      onChange={(e) => {
                        setOtherMemberId(e.target.value)
                        if (otherMemberIdError) setOtherMemberIdError('')
                        otherMemberInputBlurSeq.current += 1
                        setOtherMemberInputDisplayName('')
                        setOtherMemberInputNameLoading(false)
                      }}
                      onBlur={onOtherMemberIdBlur}
                      className={otherMemberIdError ? 'propose-input-error' : ''}
                    />
                    {otherMemberInputNameLoading ? (
                      <span className="propose-resolved-name propose-resolved-name--muted">Looking up…</span>
                    ) : otherMemberInputDisplayName ? (
                      <span className="propose-resolved-name">{otherMemberInputDisplayName}</span>
                    ) : null}
                  </div>
                  {otherMemberIdError ? (
                    <span className="propose-field-error" style={{ display: 'block', marginTop: 6 }}>
                      <span className="propose-field-error-icon">!</span> {otherMemberIdError}
                    </span>
                  ) : null}
                </div>
                <div className="propose-field propose-field--inline">
                  <label>POSITION</label>
                  <select value={otherMemberPosition} onChange={(e) => setOtherMemberPosition(e.target.value)}>
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="propose-btn-add" onClick={addOtherMember}>+ Add Member</button>
              </div>
              {otherMembers.length > 0 && (
                <table className="propose-table">
                  <thead>
                    <tr>
                      <th>STUDENT ID</th>
                      <th>NAME</th>
                      <th>ASSIGNED POSITION</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherMembers.map((m, i) => (
                      <tr key={m.rowId || i}>
                        <td>{m.studentId}</td>
                        <td className="propose-table-name">
                          {m.displayName !== undefined ? m.displayName || '—' : '…'}
                        </td>
                        <td><span className="propose-table-position">{m.position}</span></td>
                        <td><button type="button" className="propose-btn-icon" onClick={() => removeOtherMember(i)} aria-label="Remove"><IconTrash /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="propose-actions propose-actions--footer">
                <button type="button" className="propose-btn-secondary" onClick={handleBack}><IconBack /> Back</button>
                <button type="button" className="propose-btn-secondary" onClick={handleSaveDraft}>Save Draft</button>
                <button type="button" className="propose-btn-primary" onClick={handleContinue} disabled={!canContinue}>
                  Continue to Step 3 <IconChevronRight />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="propose-card">
              <div className="propose-section-header">
                <IconDiamond />
                <h2>Club Alignment & Vision</h2>
              </div>
              <p className="propose-card-desc">Describe how your organization aligns with the university&apos;s mission and its future trajectory.</p>
              <div className="propose-field propose-field--hint">
                <div className="propose-field-label-row">
                  <label>Alignment with ADA University Mission <span className="propose-required">*</span></label>
                  <span className="propose-hint-right">MIN 200 WORDS</span>
                </div>
                <textarea placeholder="Describe how your club's goals and activities directly support ADA University's core values and strategic pillars..." value={alignment} onChange={(e) => setAlignment(e.target.value)} rows={5} />
                <span
                  className={`propose-word-count ${
                    alignmentWords >= MIN_ALIGNMENT_WORDS ? 'propose-word-count--ok' : 'propose-word-count--warn'
                  }`}
                >
                  {alignmentWords} / {MIN_ALIGNMENT_WORDS} words required
                  {alignmentWords >= MIN_ALIGNMENT_WORDS ? ' — you can continue' : ''}
                </span>
              </div>
              <div className="propose-field propose-field--hint">
                <div className="propose-field-label-row">
                  <label>Long-term vision (3-5 years) <span className="propose-required">*</span></label>
                  <span className="propose-hint-right">FUTURE SUSTAINABILITY</span>
                </div>
                <textarea placeholder="Detail the expected impact on campus culture and how the club will ensure continuity of leadership over the next 3 to 5 years..." value={vision} onChange={(e) => setVision(e.target.value)} rows={5} />
              </div>

              <div className="propose-section-header propose-section-header--mt">
                <IconShield />
                <h2>Commitment Statement</h2>
              </div>
              <p className="propose-card-desc">By proceeding, you commit to upholding the University&apos;s Code of Conduct, ensuring financial transparency, and submitting semesterly reports of club activities.</p>
              <div className="propose-commit-cards">
                <label className={`propose-commit-card ${commitment === 'yes' ? 'propose-commit-card--active' : ''}`}>
                  <input type="radio" name="commit" value="yes" checked={commitment === 'yes'} onChange={(e) => setCommitment(e.target.value)} />
                  <strong>Yes, I commit</strong>
                  <span>I accept all responsibilities</span>
                </label>
                <label className={`propose-commit-card ${commitment === 'no' ? 'propose-commit-card--active' : ''}`}>
                  <input type="radio" name="commit" value="no" checked={commitment === 'no'} onChange={(e) => setCommitment(e.target.value)} />
                  <strong>No</strong>
                  <span>I am not ready to commit</span>
                </label>
              </div>
              {step3BlockedMessage ? (
                <p className="propose-continue-blocked" role="status">
                  {step3BlockedMessage}
                </p>
              ) : null}
              <div className="propose-actions propose-actions--footer">
                <button type="button" className="propose-btn-secondary" onClick={handleBack}><IconBack /> Back</button>
                <button type="button" className="propose-btn-secondary" onClick={handleSaveDraft}>Save Draft</button>
                <button type="button" className="propose-btn-primary" onClick={handleContinue} disabled={!canContinue}>
                  Continue <IconChevronRight />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="propose-card">
              <h2 className="propose-card-heading">Final Submission Progress</h2>
              <div className="propose-progress-bar">
                <div className="propose-progress-fill" style={{ width: '100%' }} />
              </div>
              <p className="propose-progress-text">Almost there! Your registration form is complete. Please review and submit your proposal.</p>

              <h2 className="propose-card-heading propose-card-heading--mt">Required Documents</h2>
              <p className="propose-card-desc">Provide the final assets needed for your club&apos;s profile and legal recognition.</p>
              <div className="propose-upload-grid">
                <div className="propose-field">
                  <label>Club Logo (PNG/JPG)</label>
                  <label className="propose-upload-zone">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => {
                        const input = e.target
                        const file = input.files?.[0] ?? null
                        setLogoFileError('')
                        if (!file) {
                          setLogoFile(null)
                          return
                        }
                        if (file.size > CLUB_PROPOSAL_MAX_LOGO_BYTES) {
                          setLogoFile(null)
                          setLogoFileError(`Logo must be ${CLUB_PROPOSAL_MAX_LOGO_BYTES / (1024 * 1024)} MB or smaller.`)
                          input.value = ''
                          return
                        }
                        setLogoFile(file)
                      }}
                      className="propose-upload-input"
                    />
                    <IconUploadImage />
                    <span>Click to upload or drag and drop</span>
                    <span className="propose-upload-spec">Recommended size 512x512px (Max 2MB)</span>
                    {logoFile && <span className="propose-upload-filename">{logoFile.name}</span>}
                    {logoFileError ? (
                      <span className="propose-field-error propose-upload-file-error" role="alert">
                        <span className="propose-field-error-icon">!</span> {logoFileError}
                      </span>
                    ) : null}
                  </label>
                </div>
                <div className="propose-field">
                  <label>Club Constitution (PDF)</label>
                  <label className="propose-upload-zone">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const input = e.target
                        const file = input.files?.[0] ?? null
                        setConstitutionFileError('')
                        if (!file) {
                          setConstitutionFile(null)
                          return
                        }
                        if (file.size > CLUB_PROPOSAL_MAX_CONSTITUTION_BYTES) {
                          setConstitutionFile(null)
                          setConstitutionFileError(
                            `Constitution PDF must be ${CLUB_PROPOSAL_MAX_CONSTITUTION_BYTES / (1024 * 1024)} MB or smaller.`
                          )
                          input.value = ''
                          return
                        }
                        setConstitutionFile(file)
                      }}
                      className="propose-upload-input"
                    />
                    <IconUploadDoc />
                    <span>Click to upload or drag and drop</span>
                    <span className="propose-upload-spec">PDF format only (Max 5MB)</span>
                    {constitutionFile && <span className="propose-upload-filename">{constitutionFile.name}</span>}
                    {constitutionFileError ? (
                      <span className="propose-field-error propose-upload-file-error" role="alert">
                        <span className="propose-field-error-icon">!</span> {constitutionFileError}
                      </span>
                    ) : null}
                  </label>
                </div>
              </div>

              <div className="propose-warning-box">
                <IconWarning />
                <div>
                  <strong>Review Before Submission</strong>
                  <p>Please ensure all information provided in previous steps is accurate. Once submitted, your proposal will enter the faculty review process. This typically takes 3-5 business days. You will be notified via your student email once a decision has been made.</p>
                </div>
              </div>
              <div className="propose-actions propose-actions--footer">
                <button type="button" className="propose-btn-secondary" onClick={handleBack}><IconBack /> Back to Previous Step</button>
                <button type="button" className="propose-btn-secondary" onClick={handleSaveDraft}>Save Draft</button>
                <button type="button" className="propose-btn-primary" onClick={handleContinue} disabled={!canContinue || submitting || deadlinePassed}>
                  {submitting ? 'Submitting…' : 'Submit Registration'} <IconChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
        <Sidebar />
      </div>

      <footer className="propose-footer">
        © {new Date().getFullYear()} University Student Engagement Portal. All rights reserved.
      </footer>
    </div>
  )
}

export default ProposeClub
