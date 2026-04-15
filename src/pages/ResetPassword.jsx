import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import { resetPassword } from '../auth'
import './Login.css'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const defaults = useMemo(
    () => ({
      email: searchParams.get('email') || '',
      token: searchParams.get('token') || '',
    }),
    [searchParams]
  )
  const [email, setEmail] = useState(defaults.email)
  const [token, setToken] = useState(defaults.token)
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await resetPassword(email.trim(), token.trim(), newPassword)
      setMessage('Password reset successfully. You can sign in with your new password.')
      setNewPassword('')
    } catch (err) {
      setError(err.message || 'Reset failed.')
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
        <p className="login-lead">Set a new password using the reset token from your email.</p>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="visually-hidden" htmlFor="reset-email">
            Email
          </label>
          <input
            id="reset-email"
            name="email"
            type="email"
            className="login-field"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="visually-hidden" htmlFor="reset-token">
            Reset token
          </label>
          <input
            id="reset-token"
            name="token"
            type="text"
            className="login-field"
            placeholder="Reset token"
            autoComplete="one-time-code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <label className="visually-hidden" htmlFor="reset-new-password">
            New password
          </label>
          <input
            id="reset-new-password"
            name="newPassword"
            type="password"
            className="login-field"
            placeholder="New password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          {message ? <p className="login-success" role="status">{message}</p> : null}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Saving…' : 'Reset password'}
          </button>
        </form>
        <p className="login-forgot">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
