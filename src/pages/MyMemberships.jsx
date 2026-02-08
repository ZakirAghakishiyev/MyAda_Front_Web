import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockMemberships } from '../data/clubsData'
import { getClubById } from '../data/clubsData'
import './MyMemberships.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
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
    <div className="mm-page">
      <header className="mm-header">
        <button type="button" className="mm-back" onClick={() => navigate('/clubs')} aria-label="Back">
          <IconBack />
        </button>
        <div className="mm-header-title">
          <h1>My Memberships</h1>
          <span className="mm-subtitle">Track all your club memberships</span>
        </div>
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

      <div className="mm-list">
        {filtered.length > 0 ? (
          filtered.map((m) => {
            const club = getClubById(m.clubId)
            const roleLabel = m.role && m.memberSince ? `${m.role} Since ${m.memberSince}` : m.memberSince ? `Member Since ${m.memberSince}` : m.role || '—'
            return (
              <article key={`${m.clubId}-${m.status}`} className="mm-card">
                <div className="mm-card-avatar" />
                <div className="mm-card-body">
                  <h2 className="mm-card-name">{m.clubName}</h2>
                  <p className="mm-card-role">{roleLabel}</p>
                  {m.status === 'Active' && (
                    <p className="mm-card-status">
                      <IconCheck />
                      Active Member
                    </p>
                  )}
                  {m.status === 'Pending' && (
                    <p className="mm-card-status mm-card-status--pending">Pending</p>
                  )}
                  {m.status === 'Declined' && (
                    <p className="mm-card-status mm-card-status--declined">Declined</p>
                  )}
                  <div className="mm-card-actions">
                    {club && (
                      <button
                        type="button"
                        className="mm-btn-view"
                        onClick={() => navigate(`/clubs/${m.clubId}`)}
                      >
                        View Club
                      </button>
                    )}
                    <button type="button" className="mm-btn-mail" aria-label="Contact">
                      <IconMail />
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <p className="mm-empty">No memberships in this category.</p>
        )}
      </div>
    </div>
  )
}

export default MyMemberships
