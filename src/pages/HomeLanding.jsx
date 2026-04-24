import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import campusBanner from '../assets/campus-banner.png'
import './HomeLanding.css'

const HomeLanding = () => {
  const navigate = useNavigate()

  return (
    <div className="home-landing">
      <div className="home-landing__banner" style={{ backgroundImage: `url(${campusBanner})` }} aria-hidden />
      <div className="home-landing__overlay" />
      <div className="home-landing__content">
        <img src={adaLogo} alt="ADA University" className="home-landing__logo" />
        <h1 className="home-landing__title">Welcome to the ADA University portal</h1>
        <p className="home-landing__lead">Sign in to see your courses, support, clubs, and campus services.</p>
        <div className="home-landing__actions">
          <button type="button" className="home-landing__primary" onClick={() => navigate('/login?redirect=/')}>
            Sign in
          </button>
          <Link to="/forgot-password" className="home-landing__link">
            Forgot password
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomeLanding
