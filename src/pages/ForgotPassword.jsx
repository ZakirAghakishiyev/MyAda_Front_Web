import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import { forgotPassword } from '../auth'
import './Login.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatus(null)
    setLoading(true)
    try {
      const data = await forgotPassword(email.trim())
      setStatus(data.message || 'If this email exists, password reset link sent.')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__bg-photo" aria-hidden />
      <div className="login-page__bg" aria-hidden />
      <div className="login-panel">
        <div className="login-logo">
          <img src={adaLogo} alt="ADA University" className="login-logo__img" />
        </div>
        <p className="login-lead">Forgot your password? Enter your email and we will send reset instructions if the account exists.</p>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="visually-hidden" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            className="login-field"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          {status ? <p className="login-success" role="status">{status}</p> : null}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <p className="login-forgot">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
