import { useState } from 'react'
import './UserSettings.css'

function UserSettings({ username, userRole, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Alle Felder sind erforderlich')
      return
    }

    if (newPassword.length < 8) {
      setError('Neues Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Passwort erfolgreich geändert')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.message || data.error || 'Fehler beim Ändern des Passworts')
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
      console.error('Password change error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Benutzereinstellungen</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* User Info */}
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Benutzername:</span>
              <span className="info-value">{username}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Rolle:</span>
              <span className="info-value badge-{userRole}">{userRole === 'admin' ? '👑 Admin' : '✍️ Autor'}</span>
            </div>
          </div>

          {/* Password Change Form */}
          <div className="settings-section">
            <h3>🔐 Passwort ändern</h3>
            <form onSubmit={handlePasswordChange}>
              {error && (
                <div className="message error-message">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="message success-message">
                  ✅ {success}
                </div>
              )}

              <div className="form-group">
                <label>Aktuelles Passwort</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Aktuelles Passwort"
                  autoComplete="current-password"
                />
              </div>

              <div className="form-group">
                <label>Neues Passwort</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Neues Passwort (mind. 8 Zeichen)"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label>Passwort bestätigen</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Neues Passwort bestätigen"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '🔄 Wird gespeichert...' : '💾 Passwort ändern'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
