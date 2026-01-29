import React from 'react'
import { useNavigate } from 'react-router-dom'
import './LostAndFound.css'

const mockItems = [
  {
    id: 1,
    title: 'Student ID Card',
    location: 'Cafeteria - Near Entrance',
    category: 'Documents',
    status: 'Active',
    daysAgo: 79,
    description: 'ADA University student ID card. Found on table near main entrance.'
  },
  {
    id: 2,
    title: 'Navy Blue Jacket',
    location: 'Sports Complex - Locker Room',
    category: 'Clothing',
    status: 'Active',
    daysAgo: 80,
    description: 'Navy blue jacket with ADA logo on left chest.'
  }
]

const LostAndFoundList = () => {
  const navigate = useNavigate()

  const totalCount = mockItems.length
  const activeCount = mockItems.filter(item => item.status === 'Active').length
  const pendingCount = mockItems.filter(item => item.status === 'Pending').length

  return (
    <div className="lf-page">
      <header className="lf-header">
        <button className="lf-icon-button" onClick={() => navigate('/')}>
          <span className="lf-back-arrow">←</span>
        </button>
        <div className="lf-header-title">
          <h1>Lost &amp; Found</h1>
          <span className="lf-subtitle">ADA University Campus</span>
        </div>
        <div className="lf-header-actions">
          <button className="lf-icon-button" aria-label="Settings">
            ⚙
          </button>
          <button className="lf-icon-button lf-bell-button" aria-label="Notifications">
            🔔
            <span className="lf-bell-dot" />
          </button>
        </div>
      </header>

      <div className="lf-tabs">
        <div className="lf-tab lf-tab--total">
          <span>Total</span>
          <span className="lf-tab-count">{totalCount}</span>
        </div>
        <div className="lf-tab lf-tab--active">
          <span>Active</span>
          <span className="lf-tab-count">{activeCount}</span>
        </div>
        <div className="lf-tab lf-tab--pending">
          <span>Pending</span>
          <span className="lf-tab-count">{pendingCount}</span>
        </div>
      </div>

      <div className="lf-search-bar">
        <input
          type="text"
          placeholder="Search by item, location, or description"
          className="lf-search-input"
        />
        <button className="lf-icon-button" aria-label="Filter">
          ⛃
        </button>
      </div>

      <div className="lf-list">
        {mockItems.map(item => (
          <article key={item.id} className="lf-card">
            <div className="lf-card-image-placeholder" />
            <div className="lf-card-body">
              <div className="lf-card-header-row">
                <h2 className="lf-card-title">{item.title}</h2>
                <span className="lf-chevron">›</span>
              </div>
              <div className="lf-card-meta">
                <div className="lf-meta-row">
                  <span className="lf-meta-icon">📍</span>
                  <span className="lf-meta-text">{item.location}</span>
                </div>
                <div className="lf-meta-row">
                  <span className="lf-meta-icon">📁</span>
                  <span className="lf-meta-text">{item.category}</span>
                </div>
              </div>
              <div className="lf-card-status-row">
                <span className={`lf-status-badge lf-status-badge--${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
                <span className="lf-days-ago">📅 {item.daysAgo} days ago</span>
              </div>
              <p className="lf-description">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default LostAndFoundList

