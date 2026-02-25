import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockMemberships } from '../data/clubsData'
import { getClubById } from '../data/clubsData'
import './ClubsList.css'
import './MyMemberships.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconChevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const MyMemberships = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('active')

  const filtered = useMemo(() => {
    if (tab === 'active') return mockMemberships.filter((m) => m.status === 'Active')
    if (tab === 'pending') return mockMemberships.filter((m) => m.status === 'Pending')
    if (tab === 'declined') return mockMemberships.filter((m) => m.status === 'Declined')
    return mockMemberships
  }, [tab])

  const activeCount = mockMemberships.filter((m) => m.status === 'Active').length
  const pendingCount = mockMemberships.filter((m) => m.status === 'Pending').length
  const declinedCount = mockMemberships.filter((m) => m.status === 'Declined').length

  return (
    <div className="clubs-page">
      <header className="clubs-header">
        <button type="button" className="clubs-back" onClick={() => navigate('/clubs')} aria-label="Back to clubs">
          <IconBack />
        </button>
        <div className="clubs-header-title">
          <h1>My Memberships</h1>
          <span className="clubs-subtitle">{filtered.length} {tab === 'active' ? 'active' : tab === 'pending' ? 'pending' : 'declined'} membership{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          type="button"
          className="clubs-vacancies-btn"
          onClick={() => navigate('/clubs')}
        >
          Discover Clubs
        </button>
      </header>

      <div className="mm-tabs">
        <button
          type="button"
          className={`mm-tab ${tab === 'active' ? 'mm-tab--active' : ''}`}
          onClick={() => setTab('active')}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          className={`mm-tab ${tab === 'pending' ? 'mm-tab--active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          className={`mm-tab ${tab === 'declined' ? 'mm-tab--active' : ''}`}
          onClick={() => setTab('declined')}
        >
          Declined ({declinedCount})
        </button>
      </div>

      <div className="clubs-grid">
        {filtered.length > 0 ? (
          filtered.map((m) => {
            const club = getClubById(m.clubId)
            const roleLabel = m.role && m.memberSince ? `${m.role} · Since ${m.memberSince}` : m.memberSince ? `Member since ${m.memberSince}` : m.role || 'Member'
            return (
              <article
                key={`${m.clubId}-${m.status}`}
                className="clubs-card"
                onClick={() => club && navigate(`/clubs/${m.clubId}`)}
                onKeyDown={(e) => club && e.key === 'Enter' && navigate(`/clubs/${m.clubId}`)}
                role="button"
                tabIndex={0}
              >
                <div
                  className="clubs-card-media"
                  style={club?.image ? { backgroundImage: `url(${club.image})` } : undefined}
                >
                  <span className="clubs-card-tag">{club?.category ?? 'Club'}</span>
                  <span className={`mm-card-status-badge mm-card-status-badge--${m.status.toLowerCase()}`}>
                    {m.status}
                  </span>
                </div>
                <div className="clubs-card-body">
                  <h2 className="clubs-card-name">{m.clubName}</h2>
                  <p className="clubs-card-description mm-card-role">{roleLabel}</p>
                  <div className="clubs-card-footer">
                    {club && (
                      <span className="clubs-card-members">
                        <IconPerson />
                        {club.members} members
                      </span>
                    )}
                    {!club && <span />}
                    <button
                      type="button"
                      className="clubs-card-cta"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (club) navigate(`/clubs/${m.clubId}`)
                      }}
                    >
                      View Details
                      <span className="clubs-card-cta-icon">
                        <IconChevron />
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <p className="clubs-empty">No memberships in this category.</p>
        )}
      </div>
    </div>
  )
}

export default MyMemberships
