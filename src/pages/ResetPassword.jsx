import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import { resetPassword } from '../auth'
import './Login.css'

const EyeOpen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeClosed = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const RESET_TOKEN_KEY = 'sdp:password-reset-token'
const RESET_FROM_LINK_KEY = 'sdp:password-reset-from-email-link'

function readTokenFromUrl() {
  if (typeof window === 'undefined') return ''
  try {
    return new URLSearchParams(window.location.search).get('token') || ''
  } catch {
    return ''
  }
}

function readStoredResetToken() {
  try {
    if (sessionStorage.getItem(RESET_FROM_LINK_KEY) !== '1') return ''
    return sessionStorage.getItem(RESET_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function initialTokenState() {
  return readTokenFromUrl() || readStoredResetToken()
}

function initialTokenFromLink() {
  return Boolean(readTokenFromUrl()) || Boolean(readStoredResetToken())
}

const ResetPassword = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaults = useMemo(
    () => ({
      email: searchParams.get('email') || '',
    }),
    [searchParams]
  )

  const [email, setEmail] = useState(defaults.email)
  const [token, setToken] = useState(initialTokenState)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  /** When true, reset code came from the email link — do not show a token field. */
  const [tokenFromLink, setTokenFromLink] = useState(initialTokenFromLink)
  const [showResetToken, setShowResetToken] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const t = searchParams.get('token')
    if (t) {
      setToken(t)
      setTokenFromLink(true)
      try {
        sessionStorage.setItem(RESET_TOKEN_KEY, t)
        sessionStorage.setItem(RESET_FROM_LINK_KEY, '1')
      } catch {
        /* ignore */
      }
      const next = new URLSearchParams(searchParams)
      next.delete('token')
      setSearchParams(next, { replace: true })
      return
    }
    try {
      const fromLink = sessionStorage.getItem(RESET_FROM_LINK_KEY) === '1'
      const cached = sessionStorage.getItem(RESET_TOKEN_KEY)
      if (cached && fromLink) {
        setToken(cached)
        setTokenFromLink(true)
      }
    } catch {
      /* ignore */
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const e = searchParams.get('email')
    if (e) setEmail(e)
  }, [searchParams])

  const emailLocked =
    Boolean(searchParams.get('email')?.trim()) || (Boolean(tokenFromLink) && Boolean(email.trim()))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!newPassword.trim()) {
      setError('Enter a new password.')
      return
    }
    if (!confirmPassword.trim()) {
      setError('Confirm your new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim(), token.trim(), newPassword)
      setMessage('Password reset successfully. You can sign in with your new password.')
      setNewPassword('')
      setConfirmPassword('')
      try {
        sessionStorage.removeItem(RESET_TOKEN_KEY)
        sessionStorage.removeItem(RESET_FROM_LINK_KEY)
      } catch {
        /* ignore */
      }
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
        <p className="login-lead">
          {tokenFromLink
            ? 'Your reset link is active. Enter a new password below.'
            : 'Set a new password using the reset code from your email.'}
        </p>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="visually-hidden" htmlFor="reset-email">
            Email
          </label>
          <input
            id="reset-email"
            name="email"
            type="email"
            className={`login-field${emailLocked ? ' login-field--readonly' : ''}`}
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={emailLocked}
            title={emailLocked ? 'This email is tied to your reset link and cannot be changed here.' : undefined}
            aria-readonly={emailLocked ? true : undefined}
            required
          />
          {!tokenFromLink ? (
            <>
              <label className="visually-hidden" htmlFor="reset-token">
                Reset code
              </label>
              <div className="login-field-wrap">
                <input
                  id="reset-token"
                  name="token"
                  type={showResetToken ? 'text' : 'password'}
                  className="login-field login-field--with-toggle login-field--reset-token"
                  placeholder="Reset code from email"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowResetToken((v) => !v)}
                  disabled={loading}
                  aria-label={showResetToken ? 'Hide reset code' : 'Show reset code'}
                  aria-pressed={showResetToken}
                >
                  {showResetToken ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </>
          ) : null}
          <label className="visually-hidden" htmlFor="reset-new-password">
            New password
          </label>
          <div className="login-field-wrap">
            <input
              id="reset-new-password"
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              className="login-field login-field--with-toggle"
              placeholder="New password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowNewPassword((v) => !v)}
              disabled={loading}
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              aria-pressed={showNewPassword}
            >
              {showNewPassword ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
          <label className="visually-hidden" htmlFor="reset-confirm-password">
            Confirm new password
          </label>
          <div className="login-field-wrap">
            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className="login-field login-field--with-toggle"
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              disabled={loading}
              aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          {message ? <p className="login-success" role="status">{message}</p> : null}
          <button
            type="submit"
            className="login-submit login-submit--solid"
            disabled={
              loading ||
              !email.trim() ||
              !token.trim() ||
              !newPassword.trim() ||
              !confirmPassword.trim() ||
              newPassword !== confirmPassword
            }
          >
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
