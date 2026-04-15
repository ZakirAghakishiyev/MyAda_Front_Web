import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'
import { getAccessToken, login } from '../auth'
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

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="login-page">
      <div className="login-page__bg-photo" aria-hidden />
      <div className="login-page__bg" aria-hidden />
      <div className="login-panel">
        <div className="login-logo">
          <img src={adaLogo} alt="ADA University" className="login-logo__img" />
        </div>
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
          <input
            id="login-password"
            name="password"
            type="password"
            className="login-field"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="login-forgot">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
