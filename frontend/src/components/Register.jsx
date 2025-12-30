import { useState } from 'react'
import './Register.css'
import '../styles/glassmorphism.css'

function Register({ onRegisterSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username || !password) {
      setError('Benutzername und Passwort sind erforderlich')
      return
    }

    if (username.length < 3) {
      setError('Benutzername muss mindestens 3 Zeichen lang sein')
      return
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          email: email || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Registration successful - user is auto-logged in
        onRegisterSuccess(data.user.username)
      } else {
        setError(data.message || data.error || 'Registrierung fehlgeschlagen')
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="register-box">
        <div className="register-header">
          <img
            src="/images/logo-quill-with-claim.svg"
            alt="Quill Logo"
            className="register-logo"
            style={{ width: '100%', maxWidth: '500px', margin: '0 auto 1rem' }}
          />
          <h2>Ersteinrichtung</h2>
          <p className="register-subtitle">
            Erstellen Sie Ihren Account für Dashboard & Nextcloud
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              background: 'rgba(255, 100, 100, 0.1)',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: 'var(--radius-medium)',
              color: '#d32f2f',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <input
            type="text"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Benutzername (mind. 3 Zeichen)"
            autoComplete="username"
            autoFocus
            required
            minLength={3}
          />

          <input
            type="email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail (optional)"
            autoComplete="email"
          />

          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort (mind. 8 Zeichen)"
            autoComplete="new-password"
            required
            minLength={8}
          />

          <input
            type="password"
            className="login-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort bestätigen"
            autoComplete="new-password"
            required
            minLength={8}
          />

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? '🔄 Erstelle Account...' : '🚀 Account erstellen'}
          </button>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(100, 150, 255, 0.1)',
            border: '1px solid rgba(100, 150, 255, 0.2)',
            borderRadius: 'var(--radius-medium)',
            fontSize: '13px',
            color: 'var(--secondary-text)',
            lineHeight: '1.6'
          }}>
            <p><strong>ℹ️ Single Sign-On:</strong></p>
            <p>Ihr Account wird automatisch in beiden Systemen erstellt:</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>📰 Dashboard (dieser Service)</li>
              <li>☁️ Nextcloud (Cloud-Speicher)</li>
            </ul>
          </div>
        </form>

        <div className="login-footer">
          <p style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>
            Version 0.8.0 | © 2024-2025 Laurencius
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
