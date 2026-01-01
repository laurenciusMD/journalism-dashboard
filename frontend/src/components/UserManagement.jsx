import { useState, useEffect } from 'react'
import './UserManagement.css'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    role: 'autor'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/auth/users', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        setError('Fehler beim Laden der Benutzer')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Load users error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      })

      const data = await response.json()

      if (response.ok) {
        setShowAddUser(false)
        setNewUser({ username: '', displayName: '', email: '', password: '', role: 'autor' })
        loadUsers() // Reload user list
      } else {
        setError(data.message || data.error || 'Fehler beim Erstellen des Benutzers')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Add user error:', err)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
      return
    }

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        loadUsers() // Reload user list
      } else {
        setError('Fehler beim Löschen des Benutzers')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Delete user error:', err)
    }
  }

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'autor' : 'admin'

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        loadUsers() // Reload user list
      } else {
        setError('Fehler beim Ändern der Rolle')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Toggle role error:', err)
    }
  }

  if (loading) {
    return <div className="panel"><p>Lade Benutzer...</p></div>
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>👥 Benutzerverwaltung</h2>
        <button className="btn btn-primary" onClick={() => setShowAddUser(!showAddUser)}>
          {showAddUser ? '✕ Abbrechen' : '➕ Neuer Benutzer'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Add User Form */}
      {showAddUser && (
        <div className="add-user-form">
          <h3>Neuen Benutzer erstellen</h3>
          <form onSubmit={handleAddUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Benutzername *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="username"
                  required
                  minLength={3}
                />
              </div>
              <div className="form-group">
                <label>Anzeigename *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  placeholder="Max Mustermann"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>E-Mail *</label>
                <input
                  type="email"
                  className="form-input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Passwort *</label>
                <input
                  type="password"
                  className="form-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mindestens 8 Zeichen"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Rolle</label>
              <select
                className="form-input"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="autor">✍️ Autor</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              ➕ Benutzer erstellen
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Benutzer</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Erstellt</th>
              <th>Letzter Login</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <span className="user-icon">👤</span>
                    <div>
                      <div className="user-name">{user.display_name}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === 'admin' ? '👑 Admin' : '✍️ Autor'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('de-DE')}</td>
                <td>
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleDateString('de-DE')
                    : '—'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      onClick={() => handleToggleRole(user.id, user.role)}
                      title={user.role === 'admin' ? 'Zu Autor herabstufen' : 'Zu Admin befördern'}
                    >
                      {user.role === 'admin' ? '⬇️' : '⬆️'}
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Benutzer löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <p>Keine Benutzer gefunden</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement
