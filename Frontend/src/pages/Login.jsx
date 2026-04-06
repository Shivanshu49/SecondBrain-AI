import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider.jsx'
import FloatingElements from '../components/FloatingElements.jsx'
import '../styles/auth.css'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signup, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignup) {
        await signup(name.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-card-dot dot-red"></span>
          <span className="auth-card-dot dot-yellow"></span>
          <span className="auth-card-dot dot-green"></span>
          <span className="auth-card-label">{isSignup ? 'SIGN UP' : 'LOG IN'}</span>
        </div>

        <div className="auth-card-body">
          <h1 className="auth-title">
            {isSignup ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
          </h1>
          <p className="auth-subtitle">
            {isSignup
              ? 'Join SecondBrain AI — your AI-powered productivity engine.'
              : 'Sign in to your SecondBrain AI dashboard.'}
          </p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-name">NAME</label>
                <input
                  id="auth-name"
                  type="text"
                  className="auth-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">EMAIL</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">PASSWORD</label>
              <input
                id="auth-password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? '⏳ PROCESSING…'
                : isSignup
                  ? '→ CREATE ACCOUNT'
                  : '→ LOG IN'}
            </button>
          </form>

          <div className="auth-toggle">
            {isSignup ? (
              <p>Already have an account?{' '}
                <button type="button" className="auth-toggle-btn" onClick={() => { setIsSignup(false); setError(null) }}>
                  Log In
                </button>
              </p>
            ) : (
              <p>Don't have an account?{' '}
                <button type="button" className="auth-toggle-btn" onClick={() => { setIsSignup(true); setError(null) }}>
                  Sign Up
                </button>
              </p>
            )}
          </div>

          <div className="auth-legal">
            By continuing, you agree to our{' '}
            <Link to="/terms">Terms</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </div>
        </div>
      </div>

      <FloatingElements items={['SECURE', 'ENCRYPTED', 'PRIVATE']} />
    </main>
  )
}
