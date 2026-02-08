import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getClubById } from '../data/clubsData'
import './ClubDetail.css'

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconPerson = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const ClubDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const club = getClubById(id)

  if (!club) {
    return (
      <div className="club-detail-overlay" onClick={() => navigate(-1)}>
        <div className="club-detail-popup" onClick={(e) => e.stopPropagation()}>
          <p>Club not found.</p>
          <button type="button" className="club-detail-back-btn" onClick={() => navigate(-1)}>
            Back to Clubs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="club-detail-overlay"
      onClick={(e) => e.target === e.currentTarget && navigate(-1)}
      role="dialog"
      aria-modal="true"
    >
      <div className="club-detail-popup" onClick={(e) => e.stopPropagation()}>
      <div className="club-detail-page">
      <div className="club-detail-container">
        <header className="club-detail-header">
          <button type="button" className="club-detail-back" onClick={() => navigate(-1)} aria-label="Back">
            <IconBack />
          </button>
        </header>

        <div className="club-detail-hero">
          <div className="club-detail-avatar" />
          <div className="club-detail-hero-meta">
            <span className={`club-detail-badge club-detail-badge--${club.status.toLowerCase()}`}>
              {club.status}
            </span>
            <span className="club-detail-members">
              <IconPerson />
              {club.members} members
            </span>
          </div>
          <h1 className="club-detail-name">{club.name}</h1>
          <div className="club-detail-tags">
            <span className="club-detail-tag club-detail-tag--primary">{club.category}</span>
            {club.tags.filter((t) => t !== club.category).map((tag) => (
              <span key={tag} className="club-detail-tag">{tag}</span>
            ))}
          </div>
        </div>

        <section className="club-detail-card">
          <h2 className="club-detail-card-title">About</h2>
          <p className="club-detail-about">{club.about}</p>
        </section>

        <section className="club-detail-card">
          <h2 className="club-detail-card-title">Club Officers</h2>
          <div className="club-detail-officers">
            {club.officers.map((o, i) => (
              <div key={i} className="club-detail-officer">
                <div className="club-detail-officer-avatar" />
                <div>
                  <p className="club-detail-officer-name">{o.name}</p>
                  <p className="club-detail-officer-role">{o.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="club-detail-card">
          <h2 className="club-detail-card-title">Contact</h2>
          <div className="club-detail-contact">
            <span className="club-detail-contact-row">
              <IconMail />
              <a href={`mailto:${club.email}`}>{club.email}</a>
            </span>
            <span className="club-detail-contact-row">
              <IconPhone />
              <a href={`tel:${club.phone}`}>{club.phone}</a>
            </span>
          </div>
        </section>

        <button type="button" className="club-detail-join" onClick={() => navigate(`/clubs/${id}/join`)}>
          Join Club
        </button>
      </div>
      </div>
      </div>
    </div>
  )
}

export default ClubDetail
