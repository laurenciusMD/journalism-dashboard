import { useState } from 'react'
import '../styles/Login.css'
import '../styles/glassmorphism.css'

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [useNextcloud, setUseNextcloud] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          useNextcloud
        })
      })

      const data = await response.json()

      if (response.ok) {
        onLoginSuccess(data.username)
      } else {
        setError(data.error || 'Login fehlgeschlagen')
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <img
          src="/images/logo-quill.svg"
          alt="Quill Logo"
          className="login-logo"
        />
        <p className="login-subtitle">
          Ihre zentrale Arbeitsumgebung für investigativen Journalismus
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error" style={{
              padding: '10px',
              marginBottom: '15px',
              background: 'rgba(255, 100, 100, 0.1)',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: 'var(--radius-medium)',
              color: '#d32f2f'
            }}>
              ⚠️ {error}
            </div>
          )}

          <input
            type="text"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Benutzername"
            required
            autoFocus
            disabled={loading}
          />

          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            required
            disabled={loading}
          />

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'var(--secondary-text)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={useNextcloud}
              onChange={(e) => setUseNextcloud(e.target.checked)}
              disabled={loading}
            />
            <span>Mit Nextcloud-Anmeldung</span>
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? '🔄 Anmeldung läuft...' : '🔐 Anmelden'}
          </button>
        </form>

        <div className="login-footer">
          <p style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>
            Version 0.7.0 | © 2024-2025 Laurencius
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
