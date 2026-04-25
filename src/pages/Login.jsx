import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import { getAccessToken, login, forgotPassword } from '../auth'
import './Login.css'

function safeRedirectPath(redirect) {
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/'
  }
  return redirect
}

const Login = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirect'))

  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (getAccessToken()) {
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, redirectTo])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setForgotStatus('')
    setForgotLoading(true)
    try {
      const data = await forgotPassword(forgotEmail.trim())
      setForgotStatus(
        (data && typeof data === 'object' && data.message) ||
          'If this email exists, password reset link sent.'
      )
    } catch (err) {
      setError(err.message || 'Could not send reset instructions.')
    } finally {
      setForgotLoading(false)
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
        {mode === 'signin' ? (
          <>
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <label className="visually-hidden" htmlFor="login-username">
                Username
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                className="login-field"
                placeholder="Username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
              <label className="visually-hidden" htmlFor="login-password">
                Password
              </label>
              <div className="login-field-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-field login-field--with-toggle"
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {error ? (
                <p className="login-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="login-submit login-submit--solid" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="login-forgot">
              <button
                type="button"
                className="login-link-btn"
                onClick={() => {
                  setMode('forgot')
                  setError('')
                  setForgotStatus('')
                  setForgotEmail('')
                }}
              >
                Forgot your password?
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="login-lead">
              Enter the email for your account. If it exists, we will send password reset instructions (same response
              whether or not the email is registered).
            </p>
            <form className="login-form" onSubmit={handleForgotSubmit} noValidate>
              <label className="visually-hidden" htmlFor="login-forgot-email">
                Email
              </label>
              <input
                id="login-forgot-email"
                name="email"
                type="email"
                className="login-field"
                placeholder="Email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
                required
              />
              {error ? (
                <p className="login-error" role="alert">
                  {error}
                </p>
              ) : null}
              {forgotStatus ? (
                <p className="login-success" role="status">
                  {forgotStatus}
                </p>
              ) : null}
              <button type="submit" className="login-submit" disabled={forgotLoading || !forgotEmail.trim()}>
                {forgotLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="login-forgot">
              <button
                type="button"
                className="login-link-btn"
                onClick={() => {
                  setMode('signin')
                  setError('')
                  setForgotStatus('')
                }}
              >
                Back to sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default Login
