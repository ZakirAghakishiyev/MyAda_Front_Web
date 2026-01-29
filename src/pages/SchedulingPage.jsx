import React from 'react'
import { useNavigate } from 'react-router-dom'
import './SchedulingPage.css'

const SchedulingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="scheduling-page">
      <div className="page-container">
        <h1>Scheduling and Room Allocation</h1>
        <p>This page will be implemented with API integration in the future.</p>
        <button className="back-button" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default SchedulingPage
