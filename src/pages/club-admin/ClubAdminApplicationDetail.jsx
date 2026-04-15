import React, { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './ClubAdmin.css'

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
)
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
)
const IconChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
)
const IconChevronUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
)
const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
)
const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
)
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
)

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ExpandableText({ label, text, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [text])
  if (text == null || text === '') return null
  const isLong = text.length > 200
  const displayText = isLong && !expanded ? `${text.slice(0, 200)}…` : text
  return (
    <div className="club-admin-answer-block">
      <div className="club-admin-answer-block-header">
        <span className="club-admin-answer-block-label">{label}</span>
        <div className="club-admin-answer-block-actions">
          <button type="button" className="club-admin-btn-text" onClick={copy} title="Copy">
            <IconCopy /> {copied ? 'Copied' : 'Copy'}
          </button>
          {isLong && (
            <button type="button" className="club-admin-btn-text" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <><IconChevronUp /> Collapse</> : <><IconChevronDown /> Expand</>}
            </button>
          )}
        </div>
      </div>
      <p className="club-admin-answer-block-text">{displayText}</p>
    </div>
  )
}

const ClubAdminApplicationDetail = ({
  application,
  type,
  onClose,
  onApprove,
  onDisapprove,
  onCallForInterview,
  onAddNote
}) => {
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  if (!application) return null

  const isJob = type === 'job'
  const app = application
  const name = app.name ?? app.applicantName?.split(' ')[0] ?? ''
  const surname = app.surname ?? app.applicantName?.split(' ').slice(1).join(' ') ?? ''
  const fullName = [name, surname].filter(Boolean).join(' ') || app.applicantName || 'Applicant'
  const positionApplied = app.positionApplied ?? app.roleType ?? '—'
  const dateApplied = app.dateApplied ?? app.appliedOn ?? '—'
  const answers = app.answers ?? {}
  const files = Array.isArray(app.files) ? app.files : []
  const canAct = app.status === 'Pending' || app.status === 'Reviewing'

  const handleApprove = () => onApprove(app.id, type)
  const handleDisapprove = () => onDisapprove(app.id, type)
  const handleAddNote = () => {
    const text = newNote.trim()
    if (!text || !onAddNote) return
    setSavingNote(true)
    onAddNote(app.id, type, text)
    setNewNote('')
    setSavingNote(false)
  }

  const statusBadgeClass =
    app.status === 'Approved'
      ? 'club-admin-pill--approved'
      : app.status === 'Rejected'
        ? 'club-admin-pill--rejected'
        : 'club-admin-pill--pending'

  const content = (
    <div
      className="club-admin-popup-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-detail-title"
    >
      <div className="club-admin-detail-popup" onClick={(e) => e.stopPropagation()}>
        <div className="club-admin-popup-header">
          <h2 id="application-detail-title">
            {isJob ? 'Job Application' : 'Membership Application'} — {fullName}
          </h2>
          <button type="button" className="club-admin-popup-close" onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>
        <div className="club-admin-popup-body club-admin-detail-body">
          {/* Applicant Information */}
          <section className="club-admin-detail-card">
            <h3 className="club-admin-detail-card-title">Applicant Information</h3>
            <div className="club-admin-detail-applicant">
              <div className="club-admin-detail-avatar" aria-hidden="true" />
              <div className="club-admin-detail-applicant-fields">
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Name & Surname</span>
                  <span className="club-admin-detail-value">{fullName}</span>
                </div>
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Student ID</span>
                  <span className="club-admin-detail-value">{app.studentId ?? '—'}</span>
                </div>
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Email</span>
                  <a href={`mailto:${app.email}`} className="club-admin-detail-value">{app.email ?? '—'}</a>
                </div>
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Major</span>
                  <span className="club-admin-detail-value">{app.major ?? app.department ?? '—'}</span>
                </div>
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Graduation Year</span>
                  <span className="club-admin-detail-value">{app.graduationYear ?? app.year ?? '—'}</span>
                </div>
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Position Applied</span>
                  <span className="club-admin-detail-value">{positionApplied}</span>
                </div>
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Date Applied</span>
                  <span className="club-admin-detail-value">{dateApplied}</span>
                </div>
                <div className="club-admin-detail-row">
                  <span className="club-admin-detail-label">Current Status</span>
                  <span className={`club-admin-pill ${statusBadgeClass}`}>{app.status}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Application Answers */}
          <section className="club-admin-detail-card">
            <h3 className="club-admin-detail-card-title">Application Answers</h3>
            {isJob ? (
              <>
                <ExpandableText label="Purpose of Application" text={answers.purposeOfApplication} />
                {Array.isArray(answers.additionalAnswers) &&
                  answers.additionalAnswers.map((item, i) => (
                    <div key={i} className="club-admin-answer-block">
                      <span className="club-admin-answer-block-label">{item.question}</span>
                      <p className="club-admin-answer-block-text">{item.answer}</p>
                    </div>
                  ))}
              </>
            ) : (
              <>
                <ExpandableText label="Letter of Purpose" text={answers.letterOfPurpose} defaultExpanded={false} />
                {answers.previousExperience && (
                  <div className="club-admin-answer-block">
                    <span className="club-admin-answer-block-label">Previous Experience / Portfolio Links</span>
                    <p className="club-admin-answer-block-text">
                      {answers.previousExperience.split(/\s*[,;\s]\s*/).map((part, i) => {
                        const isUrl = /^https?:\/\//i.test(part)
                        return isUrl ? (
                          <React.Fragment key={i}><a href={part} target="_blank" rel="noopener noreferrer" className="club-admin-detail-link">{part}</a>{' '}</React.Fragment>
                        ) : (
                          <span key={i}>{part} </span>
                        )
                      })}
                    </p>
                  </div>
                )}
                {answers.portfolioDescription && (
                  <ExpandableText label="Portfolio description" text={answers.portfolioDescription} />
                )}
              </>
            )}
            {!isJob && !answers.letterOfPurpose && !answers.previousExperience && !answers.portfolioDescription && (
              <p className="club-admin-detail-muted">No answers provided.</p>
            )}
            {isJob && !answers.purposeOfApplication && !(answers.additionalAnswers?.length) && (
              <p className="club-admin-detail-muted">No answers provided.</p>
            )}
          </section>

          {/* Uploaded Files */}
          {isJob && (
            <section className="club-admin-detail-card">
              <h3 className="club-admin-detail-card-title">Uploaded Files</h3>
              {files.length === 0 ? (
                <p className="club-admin-detail-muted">No files uploaded.</p>
              ) : (
                <div className="club-admin-detail-files">
                  {files.map((file) => (
                    <div key={file.id ?? file.name} className="club-admin-detail-file">
                      <div className="club-admin-detail-file-preview">
                        {file.type?.startsWith('image/') ? (
                          <img src={file.url || '#'} alt="" className="club-admin-detail-file-img" onError={(e) => { e.target.style.display = 'none' }} />
                        ) : file.type === 'application/pdf' ? (
                          <iframe title={file.name} src={file.url} className="club-admin-detail-file-iframe" />
                        ) : (
                          <div className="club-admin-detail-file-placeholder"><IconFile /></div>
                        )}
                      </div>
                      <div className="club-admin-detail-file-info">
                        <span className="club-admin-detail-file-name">{file.name}</span>
                        <span className="club-admin-detail-file-meta">
                          {file.type ?? 'File'} · {formatFileSize(file.size ?? 0)} · {file.uploadedAt ?? '—'}
                        </span>
                        <a href={file.url} download={file.name} className="club-admin-btn-text club-admin-detail-file-download">
                          <IconDownload /> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Admin Actions */}
          <section className="club-admin-detail-card club-admin-detail-actions-card">
            <h3 className="club-admin-detail-card-title">Admin Actions</h3>
            <div className="club-admin-detail-status-badge-wrap">
              <span className="club-admin-detail-label">Status</span>
              <span className={`club-admin-pill ${statusBadgeClass}`} id="detail-status-badge">{app.status}</span>
            </div>
            {canAct && (
              <div className="club-admin-detail-buttons">
                <button type="button" className="club-admin-btn-primary" onClick={handleApprove}><IconCheck /> Approve</button>
                <button type="button" className="club-admin-btn-danger" onClick={handleDisapprove}><IconX /> Reject</button>
                {isJob && (
                  <button type="button" className="club-admin-btn-secondary" onClick={() => onCallForInterview?.(app.id, type)}><IconCalendar /> Call for interview</button>
                )}
              </div>
            )}
            <div className="club-admin-detail-note-section">
              <label className="club-admin-detail-note-label">Add Admin Note</label>
              <textarea
                className="club-admin-detail-note-input"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note for the applicant or other admins..."
                rows={3}
              />
              <button
                type="button"
                className="club-admin-btn-primary club-admin-detail-note-save"
                onClick={handleAddNote}
                disabled={!newNote.trim() || savingNote}
              >
                {savingNote ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </section>
        </div>
        <div className="club-admin-popup-footer">
          <button type="button" className="club-admin-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default ClubAdminApplicationDetail
