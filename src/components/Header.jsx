import React, { useEffect, useRef, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useFilter } from '../contexts/FilterContext'
import { logout } from '../auth'
import { getAccessToken } from '../auth/tokenStorage'
import { userHasJwtAdminRole } from '../auth/jwtRoles'
import adaLogo from '../assets/ada-logo.png'
import campusBanner from '../assets/campus-banner.png'
import './Header.css'

const Header = () => {
  const { activeFilter, setActiveFilter } = useFilter()
  const location = useLocation()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const isHomePage = location.pathname === '/'
  const showFilterNav = !isHomePage || !getAccessToken() || userHasJwtAdminRole()

  const handleFilterClick = (filterName) => {
    setActiveFilter(filterName)
  }

  const filters = [
    { name: 'home', label: 'Home' },
    { name: 'academics', label: 'Academics' },
    { name: 'community', label: 'Community' },
    { name: 'account', label: 'My Account' },
    { name: 'work', label: 'Work' }
  ]

  useEffect(() => {
    const handleOutside = (e) => {
      if (!profileMenuRef.current) return
      if (!profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setShowProfileMenu(false)
    navigate('/', { replace: true })
  }

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-left">
          <button className="hamburger-menu" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <Link to="/" className="logo" aria-label="Go to home">
            <img src={adaLogo} alt="ADA University" className="logo-image" />
          </Link>
        </div>
        <div className="header-right">
          <button className="icon-button calendar-icon" aria-label="Calendar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <svg className="checkmark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <button className="icon-button notification-icon" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="notification-badge"></span>
          </button>
          {isHomePage && (
            <div className="profile-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="profile-icon"
                aria-label="Open profile menu"
                onClick={() => setShowProfileMenu((prev) => !prev)}
              >
                Z
              </button>
              {showProfileMenu && (
                <div className="profile-menu">
                  <button type="button" className="profile-menu-item" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="banner-container">
        <div className="banner-image" style={{ backgroundImage: `url(${campusBanner})` }}></div>
        <div className="banner-overlay"></div>
      </div>
      {showFilterNav && (
        <nav className="filter-navbar">
          <div className="filter-nav-links">
            {filters.map((filter) => (
              <button
                key={filter.name}
                className={`nav-link ${activeFilter === filter.name ? 'active' : ''}`}
                onClick={() => handleFilterClick(filter.name)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="view-all-cards">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span>VIEW ALL CARDS</span>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
