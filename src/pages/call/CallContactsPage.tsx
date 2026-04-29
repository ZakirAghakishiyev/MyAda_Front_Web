import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCallContactsByRole } from '../../api/supportApi'
import { useCallHub } from '../../call/useCallHub'
import './CallContactsPage.css'

type CallRole =
  | 'instructor'
  | 'tech_staff'
  | 'student_services'
  | 'it_staff'
  | 'dispatcher'

type RoleContact = {
  id: string
  name: string
  email: string | null
  role: string
}

const ROLE_TABS: { id: CallRole; label: string; eyebrow: string; description: string }[] = [
  {
    id: 'instructor',
    label: 'Instructors',
    eyebrow: 'Academic',
    description: 'Reach faculty and instructors directly from the role-based auth directory.',
  },
  {
    id: 'tech_staff',
    label: 'Tech Staff',
    eyebrow: 'Facilities',
    description: 'Browse technical facilities staff members and call the right person quickly.',
  },
  {
    id: 'student_services',
    label: 'Student Services',
    eyebrow: 'Student Support',
    description: 'Find student-services contacts grouped in one focused view.',
  },
  {
    id: 'it_staff',
    label: 'IT Staff',
    eyebrow: 'Technology',
    description: 'Open the IT contact list sourced from the users-by-role gateway endpoint.',
  },
  {
    id: 'dispatcher',
    label: 'Dispatchers',
    eyebrow: 'Operations',
    description: 'Review dispatchers and start a call without leaving the contacts workspace.',
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
          <div className="ccp-contact-id">User ID: {contact.id}</div>
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
          setItems(rows)
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
  }, [activeRole])

  const handleCall = async (contact: RoleContact) => {
    setCallingUserId(contact.id)
    setActionMessage(null)
    try {
      await requestCall(contact.id)
      setActionMessage(`Call request sent to ${contact.name || contact.id}.`)
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
            Role-filtered contacts sourced from <strong>/api/auth/users-by-role/{activeRole}</strong>. Switch tabs to load only that role, then place a call beside any contact.
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

      <section className="ccp-summary-grid">
        <article className="ccp-summary-card">
          <span className="ccp-summary-label">Selected role</span>
          <strong className="ccp-summary-value">{activeTab.label}</strong>
          <p>{activeTab.eyebrow}</p>
        </article>
        <article className="ccp-summary-card">
          <span className="ccp-summary-label">Directory count</span>
          <strong className="ccp-summary-value">{loading ? '...' : items.length}</strong>
          <p>{activeTab.description}</p>
        </article>
        <article className="ccp-summary-card">
          <span className="ccp-summary-label">Endpoint</span>
          <strong className="ccp-summary-value ccp-summary-value--small">users-by-role/{activeRole}</strong>
          <p>Loaded through the auth gateway directory endpoint.</p>
        </article>
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
              key={`${activeRole}-${contact.id}`}
              contact={contact}
              isCalling={callingUserId === contact.id}
              onCall={handleCall}
            />
          ))}
        </section>
      ) : null}
    </div>
  )
}

export default CallContactsPage
