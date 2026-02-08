import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProposeClub.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const STEPS = 4
const DESC_MAX = 500

const ProposeClub = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  // Step 1
  const [clubName, setClubName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [uniqueDesc, setUniqueDesc] = useState('')
  const [goals, setGoals] = useState('')
  const [activities, setActivities] = useState('')
  // Step 2 – only Student IDs
  const [presidentId, setPresidentId] = useState('')
  const [vicePresidentId, setVicePresidentId] = useState('')
  const [otherMembers, setOtherMembers] = useState('')
  // Step 3
  const [alignment, setAlignment] = useState('')
  const [vision, setVision] = useState('')
  const [commits, setCommits] = useState('')
  // Step 4
  const [logoFile, setLogoFile] = useState(null)
  const [constitutionFile, setConstitutionFile] = useState(null)

  const handleBack = () => {
    if (step === 1) navigate(-1)
    else setStep((s) => s - 1)
  }

  const handleContinue = () => {
    if (step < STEPS) setStep((s) => s + 1)
    else {
      // Submit – placeholder
      navigate(-1)
    }
  }

  const canContinueStep1 = clubName.trim() && shortDesc.trim() && uniqueDesc.trim() && goals.trim() && activities.trim()
  const canContinueStep2 = presidentId.trim() && vicePresidentId.trim()
  const canContinueStep3 = alignment.trim() && vision.trim() && commits === 'yes'
  const canContinueStep4 = logoFile && constitutionFile

  const canContinue =
    (step === 1 && canContinueStep1) ||
    (step === 2 && canContinueStep2) ||
    (step === 3 && canContinueStep3) ||
    (step === 4 && canContinueStep4)

  return (
    <div
      className="propose-club-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="propose-club-title"
    >
      <div className="propose-club-popup" onClick={(e) => e.stopPropagation()}>
        <header className="propose-club-header">
          <button type="button" className="propose-club-back" onClick={handleBack} aria-label="Back">
            <IconBack />
          </button>
          <h1 id="propose-club-title" className="propose-club-title">New Club Registration - Step {step} of {STEPS}</h1>
        </header>
        <div className="propose-club-progress">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`propose-club-progress-dot ${i <= step ? 'propose-club-progress-dot--active' : ''}`} aria-hidden="true" />
          ))}
        </div>

        <div className="propose-club-body">
          {step === 1 && (
            <>
              <div className="propose-club-info propose-club-info--blue">
                <IconInfo />
                <div>
                  <strong>Eligibility Requirements</strong>
                  <ul>
                    <li>Only currently enrolled, active students can propose a new club</li>
                    <li>Good academic standing required (no Honor Code violations)</li>
                    <li>Minimum 2 core leaders (President &amp; Vice President)</li>
                    <li>Review existing clubs before applying</li>
                  </ul>
                </div>
              </div>
              <div className="propose-club-info propose-club-info--orange">
                <IconWarning />
                <div>
                  <strong>Submission Deadline</strong>
                  <p>Applications must be submitted by <strong>September 30</strong>. Late submissions will not be considered.</p>
                </div>
              </div>

              <div className="propose-club-field">
                <label className="propose-club-label">1. Proposed Club Name <span className="propose-club-required">*</span></label>
                <input
                  type="text"
                  className="propose-club-input"
                  placeholder="Enter your club name"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  aria-required="true"
                />
              </div>
              <div className="propose-club-field">
                <label className="propose-club-label">2. Short Description of the Club <span className="propose-club-required">*</span></label>
                <textarea
                  className="propose-club-textarea"
                  placeholder="Describe your club's mission, purpose, and focus areas..."
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value.slice(0, DESC_MAX))}
                  rows={4}
                  aria-required="true"
                />
                <span className="propose-club-char">{shortDesc.length}/{DESC_MAX}</span>
              </div>
              <div className="propose-club-field">
                <label className="propose-club-label">3. What makes this club unique? <span className="propose-club-required">*</span></label>
                <span className="propose-club-sublabel">Compared to existing clubs</span>
                <textarea
                  className="propose-club-textarea"
                  placeholder="Explain what makes your club different from existing clubs..."
                  value={uniqueDesc}
                  onChange={(e) => setUniqueDesc(e.target.value)}
                  rows={4}
                  aria-required="true"
                />
              </div>
              <div className="propose-club-field">
                <label className="propose-club-label">4. Main goals and objectives <span className="propose-club-required">*</span></label>
                <span className="propose-club-sublabel">For this academic year (provide at least 3)</span>
                <textarea
                  className="propose-club-textarea"
                  placeholder="1. Goal one&#10;2. Goal two&#10;3. Goal three"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={4}
                  aria-required="true"
                />
              </div>
              <div className="propose-club-field">
                <label className="propose-club-label">5. Proposed activities/events <span className="propose-club-required">*</span></label>
                <span className="propose-club-sublabel">Give specific examples</span>
                <textarea
                  className="propose-club-textarea"
                  placeholder="Example: Monthly workshops, guest speaker series, hackathons..."
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  rows={4}
                  aria-required="true"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="propose-club-section">
                <h2 className="propose-club-section-title">President Information</h2>
                <div className="propose-club-field propose-club-field--num">
                  <span className="propose-club-num">6</span>
                  <div className="propose-club-field-inner">
                    <label className="propose-club-label">Student ID of President <span className="propose-club-required">*</span></label>
                    <input
                      type="text"
                      className="propose-club-input"
                      placeholder="Enter student ID"
                      value={presidentId}
                      onChange={(e) => setPresidentId(e.target.value)}
                      aria-required="true"
                    />
                  </div>
                </div>
              </div>
              <div className="propose-club-section">
                <h2 className="propose-club-section-title">Vice President Information</h2>
                <div className="propose-club-field propose-club-field--num">
                  <span className="propose-club-num">9</span>
                  <div className="propose-club-field-inner">
                    <label className="propose-club-label">Student ID of Vice-President <span className="propose-club-required">*</span></label>
                    <input
                      type="text"
                      className="propose-club-input"
                      placeholder="Enter student ID"
                      value={vicePresidentId}
                      onChange={(e) => setVicePresidentId(e.target.value)}
                      aria-required="true"
                    />
                  </div>
                </div>
              </div>
              <div className="propose-club-section">
                <h2 className="propose-club-section-title">Other Core Executive Members</h2>
                <p className="propose-club-sublabel">List additional founding members (optional). Format: Student ID - Position</p>
                <div className="propose-club-field propose-club-field--num">
                  <span className="propose-club-num">10</span>
                  <div className="propose-club-field-inner">
                    <textarea
                      className="propose-club-textarea"
                      placeholder="Student ID - Position&#10;Student ID - Position"
                      value={otherMembers}
                      onChange={(e) => setOtherMembers(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="propose-club-field propose-club-field--num">
                <span className="propose-club-num">11</span>
                <div className="propose-club-field-inner">
                  <label className="propose-club-label">How does this club align with ADA University&apos;s mission and values? <span className="propose-club-required">*</span></label>
                  <textarea
                    className="propose-club-textarea"
                    placeholder="Explain how your club supports ADA's educational mission and core values..."
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    rows={4}
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="propose-club-field propose-club-field--num">
                <span className="propose-club-num">12</span>
                <div className="propose-club-field-inner">
                  <label className="propose-club-label">What is the long-term vision of the club? <span className="propose-club-required">*</span></label>
                  <textarea
                    className="propose-club-textarea"
                    placeholder="Describe your club's vision for the next 3-5 years..."
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    rows={4}
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="propose-club-field propose-club-field--num">
                <span className="propose-club-num">13</span>
                <div className="propose-club-field-inner">
                  <label className="propose-club-label">Do you commit to following ADA&apos;s Honor Code, Code of Conduct, and Student Club Policy regulations?</label>
                  <div className="propose-club-radio-group">
                    <label className="propose-club-radio">
                      <input type="radio" name="commit" value="yes" checked={commits === 'yes'} onChange={(e) => setCommits(e.target.value)} />
                      <span>Yes, I commit</span>
                    </label>
                    <label className="propose-club-radio">
                      <input type="radio" name="commit" value="no" checked={commits === 'no'} onChange={(e) => setCommits(e.target.value)} />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="propose-club-info propose-club-info--blue">
                <IconInfo />
                <div>
                  <strong>Required Documents</strong>
                  <p>Please upload your club logo and constitution document to complete your application.</p>
                </div>
              </div>
              <div className="propose-club-field">
                <label className="propose-club-label">Club Logo <span className="propose-club-required">*</span></label>
                <label className="propose-club-upload propose-club-upload--image">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    className="propose-club-upload-input"
                  />
                  <IconUploadImage />
                  <span className="propose-club-upload-text">Upload Club Logo</span>
                  <span className="propose-club-upload-hint">PNG or JPG, Min: 200x200px</span>
                  {logoFile && <span className="propose-club-upload-filename">{logoFile.name}</span>}
                </label>
              </div>
              <div className="propose-club-field">
                <label className="propose-club-label">Club Constitution <span className="propose-club-required">*</span></label>
                <p className="propose-club-sublabel">Upload a PDF document outlining your club&apos;s structure, bylaws, and operating procedures</p>
                <label className="propose-club-upload propose-club-upload--doc">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setConstitutionFile(e.target.files?.[0] ?? null)}
                    className="propose-club-upload-input"
                  />
                  <IconUploadDoc />
                  <span className="propose-club-upload-text">Upload Constitution (PDF)</span>
                  <span className="propose-club-upload-hint">Max file size: 10MB</span>
                  {constitutionFile && <span className="propose-club-upload-filename">{constitutionFile.name}</span>}
                </label>
              </div>
              <div className="propose-club-info propose-club-info--orange">
                <IconWarning />
                <div>
                  <strong>Review Before Submission</strong>
                  <p>Please ensure all information is accurate. The Office of Student Services will contact you if any clarifications are needed.</p>
                </div>
              </div>
            </>
          )}

          <div className="propose-club-actions">
            <button
              type="button"
              className="propose-club-btn-continue"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              {step < STEPS ? (
                <>Continue <IconChevronRight /></>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposeClub
