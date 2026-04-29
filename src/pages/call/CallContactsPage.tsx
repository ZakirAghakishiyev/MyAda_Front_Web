import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCallContactsByRole } from '../../api/supportApi'
import { useCallHub } from '../../call/useCallHub'
import { getJwtUserId } from '../../auth/jwtRoles'
import './CallContactsPage.css'

type CallRole =
  | 'instructor'
  | 'tech_staff'
  | 'student_services'
  | 'it_staff'
  | 'dispatcher'

type RoleContact = {
  id: string
  targetUserId: string
  name: string
  email: string | null
  role: string
}

const ROLE_TABS: { id: CallRole; label: string; eyebrow: string; description: string }[] = [
  {
    id: 'instructor',
    label: 'Instructors',
    eyebrow: 'Academic',
    description: 'Reach faculty members and instructors from one curated academic contact space.',
  },
  {
    id: 'tech_staff',
    label: 'Tech Staff',
    eyebrow: 'Facilities',
    description: 'Connect with facilities and technical operations staff when hands-on support is needed.',
  },
  {
    id: 'student_services',
    label: 'Student Services',
    eyebrow: 'Student Support',
    description: 'Keep student-support communication focused, fast, and easy to navigate.',
  },
  {
    id: 'it_staff',
    label: 'IT Staff',
    eyebrow: 'Technology',
    description: 'Browse the technology support team and place calls without leaving the directory.',
  },
  {
    id: 'dispatcher',
    label: 'Dispatchers',
    eyebrow: 'Operations',
    description: 'Reach operations coordinators quickly when you need immediate call routing support.',
  },
]

function hubStatusLabel(phase: string) {
  switch (phase) {
    case 'connected':
      return 'Ready for calls'
    case 'connecting':
      return 'Connecting to call hub'
    case 'in-call':
      return 'Currently in call'
    case 'ringing':
    case 'incoming':
    case 'accepted':
      return 'Call in progress'
    case 'auth-expired':
      return 'Session needs refresh'
    default:
      return 'Available on demand'
  }
}

function hubStatusClass(phase: string) {
  if (phase === 'connected' || phase === 'in-call' || phase === 'accepted') {
    return 'ccp-status-pill ccp-status-pill--ready'
  }
  if (phase === 'connecting' || phase === 'ringing' || phase === 'incoming') {
    return 'ccp-status-pill ccp-status-pill--pending'
  }
  if (phase === 'error' || phase === 'auth-expired') {
    return 'ccp-status-pill ccp-status-pill--danger'
  }
  return 'ccp-status-pill'
}

function ContactRow({
  contact,
  isCalling,
  onCall,
}: {
  contact: RoleContact
  isCalling: boolean
  onCall: (contact: RoleContact) => Promise<void>
}) {
  return (
    <article className="ccp-contact-card">
      <div className="ccp-contact-main">
        <div className="ccp-contact-avatar" aria-hidden="true">
          {String(contact.name || '?')
            .trim()
            .slice(0, 1)
            .toUpperCase()}
        </div>
        <div className="ccp-contact-copy">
          <div className="ccp-contact-headline">
            <h3>{contact.name || 'Unnamed user'}</h3>
            <span className="ccp-contact-role">{contact.role.replace(/_/g, ' ')}</span>
          </div>
          <p>{contact.email || 'No email provided by the directory.'}</p>
        </div>
      </div>
      <div className="ccp-contact-actions">
        <button type="button" className="ccp-call-btn" disabled={isCalling} onClick={() => void onCall(contact)}>
          {isCalling ? 'Calling...' : 'Call'}
        </button>
      </div>
    </article>
  )
}

const CallContactsPage: React.FC = () => {
  const currentUserId = String(getJwtUserId() || '').trim().toLowerCase()
  const [activeRole, setActiveRole] = useState<CallRole>('instructor')
  const [items, setItems] = useState<RoleContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [callingUserId, setCallingUserId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const { phase, error: callError, requestCall } = useCallHub()

  const activeTab = useMemo(
    () => ROLE_TABS.find((tab) => tab.id === activeRole) || ROLE_TABS[0],
    [activeRole]
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setActionMessage(null)

    ;(async () => {
      try {
        const rows = await getCallContactsByRole(activeRole)
        if (!cancelled) {
          setItems(
            rows.filter((row) => String(row?.targetUserId || '').trim().toLowerCase() !== currentUserId)
          )
        }
      } catch (err: any) {
        if (!cancelled) {
          setItems([])
          setError(err?.message || 'Could not load contacts for this role.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeRole, currentUserId])

  const handleCall = async (contact: RoleContact) => {
    setCallingUserId(contact.targetUserId)
    setActionMessage(null)
    try {
      await requestCall(contact.targetUserId)
      setActionMessage(`Call request sent to ${contact.name || contact.targetUserId}.`)
    } catch {
      setActionMessage(null)
    } finally {
      setCallingUserId(null)
    }
  }

  return (
    <div className="ccp-page">
      <section className="ccp-hero">
        <div>
          <p className="ccp-kicker">Communication Directory</p>
          <h1>Call Contacts</h1>
          <p className="ccp-subtitle">
            Browse people by team, move between roles instantly, and start a voice call from a clean, focused contact workspace.
          </p>
        </div>
        <div className="ccp-hero-side">
          <span className={hubStatusClass(phase)}>{hubStatusLabel(phase)}</span>
          <div className="ccp-hero-links">
            <Link to="/calls/history">Call history</Link>
            <Link to="/">Home</Link>
          </div>
        </div>
      </section>

      <div className="ccp-tabs" role="tablist" aria-label="Call contacts by role">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeRole === tab.id}
            className={`ccp-tab ${activeRole === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveRole(tab.id)}
          >
            <span className="ccp-tab-eyebrow">{tab.eyebrow}</span>
            <span className="ccp-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <section className="ccp-section-bar" aria-label="Selected contact group summary">
        <div className="ccp-section-copy">
          <p className="ccp-section-eyebrow">{activeTab.eyebrow}</p>
          <h2>{activeTab.label}</h2>
          <p>{activeTab.description}</p>
        </div>
        <div className="ccp-section-stat">
          <span>Contacts</span>
          <strong>{loading ? '...' : items.length}</strong>
        </div>
      </section>

      {actionMessage ? <div className="ccp-banner ccp-banner--success">{actionMessage}</div> : null}
      {callError ? <div className="ccp-banner ccp-banner--error">{callError}</div> : null}
      {error ? <div className="ccp-banner ccp-banner--error">{error}</div> : null}

      {loading ? <div className="ccp-empty-state">Loading contacts for {activeTab.label.toLowerCase()}...</div> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="ccp-empty-state">
          No contacts were returned for <strong>{activeTab.label}</strong>.
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <section className="ccp-contact-list">
          {items.map((contact) => (
            <ContactRow
              key={`${activeRole}-${contact.targetUserId}`}
              contact={contact}
              isCalling={callingUserId === contact.targetUserId}
              onCall={handleCall}
            />
          ))}
        </section>
      ) : null}
    </div>
  )
}

export default CallContactsPage
