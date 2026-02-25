import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './ProposeClub.css'

const STEPS = 4
const STEP_LABELS = ['DETAILS', 'LEADERSHIP', 'FACULTY', 'REVIEW']
const DESC_MAX = 500
const MIN_ALIGNMENT_WORDS = 200
const POSITION_OPTIONS = ['Select Position', 'Secretary', 'Treasurer', 'Social Media Manager', 'Event Coordinator', 'Outreach Officer', 'Other']

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
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const countWords = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length

const ProposeClub = () => {
  const navigate = useNavigate()
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
  const [otherMemberId, setOtherMemberId] = useState('')
  const [otherMemberPosition, setOtherMemberPosition] = useState('')
  const [otherMembers, setOtherMembers] = useState([])
  const [alignment, setAlignment] = useState('')
  const [vision, setVision] = useState('')
  const [commitment, setCommitment] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [constitutionFile, setConstitutionFile] = useState(null)

  const handleBack = () => {
    if (step === 1) navigate('/clubs')
    else setStep((s) => s - 1)
  }

  const validatePresidentId = (val) => {
    if (!val) return ''
    return /^\d{8}$/.test(val) ? '' : 'Student ID must be 8 digits'
  }
  const validateVpId = (val) => {
    if (!val) return ''
    return /^\d{8}$/.test(val) ? '' : 'Student ID must be 8 digits'
  }

  const onPresidentBlur = () => setPresidentError(validatePresidentId(presidentId))
  const onVpBlur = () => {
    setVpError(validateVpId(vicePresidentId))
    if (vicePresidentId && /^\d{8}$/.test(vicePresidentId)) setVpStatus('Waitlisted for verification')
    else setVpStatus('')
  }

  const addOtherMember = () => {
    const id = otherMemberId.trim()
    const pos = otherMemberPosition && otherMemberPosition !== 'Select Position' ? otherMemberPosition : null
    if (!id || !pos) return
    setOtherMembers((prev) => [...prev, { studentId: id, position: pos }])
    setOtherMemberId('')
    setOtherMemberPosition('')
  }
  const removeOtherMember = (index) => setOtherMembers((prev) => prev.filter((_, i) => i !== index))

  const canContinueStep1 = clubName.trim() && shortDesc.trim() && uniqueDesc.trim() && goals.trim() && activities.trim()
  const canContinueStep2 = presidentId.trim() && vicePresidentId.trim() && !validatePresidentId(presidentId) && !validateVpId(vicePresidentId)
  const alignmentWords = countWords(alignment)
  const canContinueStep3 = alignment.trim() && vision.trim() && commitment === 'yes' && alignmentWords >= MIN_ALIGNMENT_WORDS
  const canContinueStep4 = logoFile && constitutionFile

  const canContinue =
    (step === 1 && canContinueStep1) ||
    (step === 2 && canContinueStep2) ||
    (step === 3 && canContinueStep3) ||
    (step === 4 && canContinueStep4)

  const handleContinue = () => {
    if (step < STEPS) setStep((s) => s + 1)
    else {
      // Submit placeholder
      navigate('/clubs')
    }
  }

  const progressPct = (step / STEPS) * 100

  const Sidebar = () => (
    <aside className="propose-sidebar">
      <div className="propose-sidebar-panel propose-sidebar-panel--blue">
        <IconInfo />
        <div>
          <strong>Eligibility Requirements</strong>
          <ul>
            <li>Minimum of 10 currently enrolled student members required.</li>
            <li>Founding members must maintain a minimum 2.5 cumulative GPA.</li>
            <li>Club constitution must align with university anti-discrimination policies.</li>
            <li>A full-time faculty or staff advisor is mandatory.</li>
          </ul>
          <a href="#handbook" className="propose-sidebar-link">VIEW FULL HANDBOOK</a>
        </div>
      </div>
      <div className="propose-sidebar-panel propose-sidebar-panel--yellow">
        <IconWarning />
        <div>
          <strong>Submission Deadline</strong>
          <p>For Fall Semester recognition, all applications must be submitted by:</p>
          <p className="propose-sidebar-deadline">Friday, October 27th, 2023</p>
          <p className="propose-sidebar-note">Applications submitted after this date will be considered for the Spring Semester cycle.</p>
        </div>
      </div>
      <div className="propose-sidebar-panel propose-sidebar-panel--blue">
        <div>
          <strong>Need Help?</strong>
          <p>Our student engagement team is here to assist you with the registration process.</p>
          <button type="button" className="propose-sidebar-btn">Chat with an Advisor</button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="propose-page">
      <header className="propose-header">
        <div className="propose-header-inner">
          <Link to="/" className="propose-logo">Campus Organizations</Link>
          <nav className="propose-nav">
            <Link to="/clubs">Dashboard</Link>
            <Link to="/clubs/propose" className="propose-nav-active">Register Club</Link>
            <Link to="/clubs/my-memberships">My Clubs</Link>
            <Link to="/clubs/vacancies">Resources</Link>
          </nav>
          <div className="propose-header-actions">
            <button type="button" className="propose-icon-btn" aria-label="Notifications"><IconBell /></button>
            <button type="button" className="propose-avatar" aria-label="Profile" />
          </div>
        </div>
      </header>

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
                <button type="button" className="propose-btn-secondary">Save as Draft</button>
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
                <input type="text" placeholder="e.g. 12345678" value={presidentId} onChange={(e) => setPresidentId(e.target.value)} onBlur={onPresidentBlur} className={presidentError ? 'propose-input-error' : ''} />
                {presidentError && <span className="propose-field-error"><span className="propose-field-error-icon">!</span> {presidentError}</span>}
              </div>
              <div className="propose-field">
                <label>Vice President Student ID <span className="propose-required">*</span></label>
                <input type="text" placeholder="e.g. 87654321" value={vicePresidentId} onChange={(e) => setVicePresidentId(e.target.value)} onBlur={onVpBlur} className={vpError ? 'propose-input-error' : ''} />
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
                  <input type="text" placeholder="ID Number" value={otherMemberId} onChange={(e) => setOtherMemberId(e.target.value)} />
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
                      <th>ASSIGNED POSITION</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherMembers.map((m, i) => (
                      <tr key={i}>
                        <td>{m.studentId}</td>
                        <td><span className="propose-table-position">{m.position}</span></td>
                        <td><button type="button" className="propose-btn-icon" onClick={() => removeOtherMember(i)} aria-label="Remove"><IconTrash /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="propose-actions propose-actions--footer">
                <button type="button" className="propose-btn-secondary" onClick={handleBack}><IconBack /> Back</button>
                <span className="propose-autosave">Auto-saving progress...</span>
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
                {alignment.trim() && <span className="propose-word-count">{alignmentWords} words</span>}
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
              <div className="propose-actions propose-actions--footer">
                <button type="button" className="propose-btn-secondary" onClick={handleBack}><IconBack /> Back</button>
                <span className="propose-next-hint">Next: Final Review &amp; Submission</span>
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
                    <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="propose-upload-input" />
                    <IconUploadImage />
                    <span>Click to upload or drag and drop</span>
                    <span className="propose-upload-spec">Recommended size 512x512px (Max 2MB)</span>
                    {logoFile && <span className="propose-upload-filename">{logoFile.name}</span>}
                  </label>
                </div>
                <div className="propose-field">
                  <label>Club Constitution (PDF)</label>
                  <label className="propose-upload-zone">
                    <input type="file" accept=".pdf" onChange={(e) => setConstitutionFile(e.target.files?.[0] ?? null)} className="propose-upload-input" />
                    <IconUploadDoc />
                    <span>Click to upload or drag and drop</span>
                    <span className="propose-upload-spec">PDF format only (Max 5MB)</span>
                    {constitutionFile && <span className="propose-upload-filename">{constitutionFile.name}</span>}
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
                <button type="button" className="propose-btn-primary" onClick={handleContinue} disabled={!canContinue}>
                  Submit Registration <IconChevronRight />
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
