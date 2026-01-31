import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './SchedulingPage.css'

const ComingSoonPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const title = location.state?.title || 'This Feature'

  return (
    <div className="scheduling-page">
      <div className="page-container">
        <h1>{title}</h1>
        <p>This page will be implemented with API integration in the future.</p>
        <button className="back-button" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default ComingSoonPage
