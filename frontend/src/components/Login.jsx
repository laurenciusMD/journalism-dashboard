import { useState } from 'react'
import '../styles/Login.css'

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
        <div className="login-header">
          <h1>📰 Journalism Dashboard</h1>
          <p className="login-subtitle">Ihre zentrale Arbeitsumgebung</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
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
              placeholder="Ihr Benutzername"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ihr Passwort"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group-checkbox">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={useNextcloud}
                onChange={(e) => setUseNextcloud(e.target.checked)}
                disabled={loading}
              />
              <span>Mit Nextcloud-Anmeldung</span>
            </label>
            <small>Verwenden Sie Ihre Nextcloud-Zugangsdaten</small>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? '🔄 Anmeldung läuft...' : '🔐 Anmelden'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <small>
              💡 <strong>Hinweis:</strong> Verwenden Sie die Anmeldedaten, die in den
              Docker-Umgebungsvariablen konfiguriert sind.
            </small>
          </p>
          <p className="login-version">Version 0.2.0</p>
        </div>
      </div>

      <div className="login-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>
    </div>
  )
}

export default Login
