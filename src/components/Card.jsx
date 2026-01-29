import React from 'react'
import './Card.css'

const Card = ({ title, children, buttons = [], centerButtons = false }) => {
  const hasManyButtons = buttons.length > 3

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        <div className="card-header-icons">
          <svg className="padlock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
      </div>
      <div className="card-content">
        {children}
        {buttons.length > 0 && (
          <div
            className={
              `card-buttons${centerButtons ? ' card-buttons--centered' : ''}` +
              (hasManyButtons ? ' card-buttons--scroll' : '')
            }
          >
            {buttons.map((button, index) => (
              <button
                key={index}
                className="card-button"
                onClick={button.onClick}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Card
