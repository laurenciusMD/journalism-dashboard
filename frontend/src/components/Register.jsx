import { useState } from 'react'
import './Register.css'

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
    <div className="register-container">
      <div className="register-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

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
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Benutzername</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="IhrBenutzername"
              autoComplete="username"
              autoFocus
              required
              minLength={3}
            />
            <small>Mindestens 3 Zeichen. Wird für Dashboard & Nextcloud verwendet.</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">E-Mail (optional)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@email.de"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <small>Mindestens 8 Zeichen. Gilt für beide Systeme.</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Erstelle Account...
              </>
            ) : (
              <>
                🚀 Account erstellen & Einloggen
              </>
            )}
          </button>

          <div className="register-info">
            <p className="info-box">
              ℹ️ <strong>Single Sign-On:</strong><br />
              Ihr Account wird automatisch in beiden Systemen erstellt:
            </p>
            <ul>
              <li>📰 <strong>Dashboard</strong> (dieser Service)</li>
              <li>☁️ <strong>Nextcloud</strong> (Cloud-Speicher)</li>
            </ul>
            <p className="info-box">
              Nach der Registrierung werden Sie automatisch eingeloggt.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
