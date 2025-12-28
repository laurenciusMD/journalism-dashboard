import { useState, useEffect } from 'react'
import './styles/App.css'
import Login from './components/Login.jsx'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showSettings, setShowSettings] = useState(false)

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.authenticated) {
        setIsAuthenticated(true)
        setUsername(data.username)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true)
    setUsername(user)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setIsAuthenticated(false)
      setUsername('')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="dashboard loading-screen">
        <div className="loading-spinner">
          <h2>📰 Journalism Dashboard</h2>
          <p>Lädt...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📰 Journalism Dashboard</h1>
            <p className="subtitle">Ihre zentrale Arbeitsumgebung für journalistische Arbeit</p>
          </div>
          <div className="header-actions">
            <span className="username-display">👤 {username}</span>
            <input type="text" className="search-box" placeholder="🔍 Suchen..." />
            <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
              ⚙️ Einstellungen
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Abmelden
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('overview')}
        >
          🏠 Übersicht
        </button>
        <button
          className={activeTab === 'write' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('write')}
        >
          ✍️ Schreiben (Claude)
        </button>
        <button
          className={activeTab === 'research' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('research')}
        >
          🔍 Recherche (Gemini)
        </button>
        <button
          className={activeTab === 'transform' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('transform')}
        >
          🔄 Umformen (ChatGPT)
        </button>
        <button
          className={activeTab === 'files' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('files')}
        >
          📁 Dateien
        </button>
      </nav>

      <main className="dashboard-content">
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {!showSettings && activeTab === 'overview' && <OverviewPanel />}
        {!showSettings && activeTab === 'write' && <WritePanel />}
        {!showSettings && activeTab === 'research' && <ResearchPanel />}
        {!showSettings && activeTab === 'transform' && <TransformPanel />}
        {!showSettings && activeTab === 'files' && <FilesPanel />}
      </main>

      <footer className="dashboard-footer">
        <p>Journalism Dashboard v0.1.0 | Powered by Claude, Gemini & ChatGPT</p>
        <p className="footer-info">
          <a href="#" onClick={() => setShowSettings(true)}>Sachsen-Anhalt</a> ·
          <a href="#privacy"> Extrem rechte gewalt</a> ·
          Gemini & ChatGPT
        </p>
      </footer>
    </div>
  )
}

function SettingsPanel({ onClose }) {
  const [settings, setSettings] = useState({
    anthropicKey: '',
    geminiKey: '',
    openaiKey: '',
    nextcloudUrl: '',
    nextcloudUsername: '',
    nextcloudPassword: '',
    googleClientId: '',
    googleClientSecret: ''
  })

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('journalism-settings', JSON.stringify(settings))
    alert('Einstellungen gespeichert!')
    onClose()
  }

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>⚙️ Einstellungen</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>🤖 KI-Dienste</h3>

            <div className="setting-group">
              <label>Claude AI (Anthropic) API Key</label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={settings.anthropicKey}
                onChange={(e) => setSettings({...settings, anthropicKey: e.target.value})}
              />
              <small>Erhalten Sie Ihren Key bei <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></small>
            </div>

            <div className="setting-group">
              <label>Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIza..."
                value={settings.geminiKey}
                onChange={(e) => setSettings({...settings, geminiKey: e.target.value})}
              />
              <small>Erhalten Sie Ihren Key bei <a href="https://makersuite.google.com" target="_blank">Google AI Studio</a></small>
            </div>

            <div className="setting-group">
              <label>OpenAI API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={settings.openaiKey}
                onChange={(e) => setSettings({...settings, openaiKey: e.target.value})}
              />
              <small>Erhalten Sie Ihren Key bei <a href="https://platform.openai.com" target="_blank">platform.openai.com</a></small>
            </div>
          </section>

          <section className="settings-section">
            <h3>☁️ Cloud-Speicher</h3>

            <div className="setting-group">
              <label>Nextcloud URL</label>
              <input
                type="url"
                placeholder="https://cloud.example.com"
                value={settings.nextcloudUrl}
                onChange={(e) => setSettings({...settings, nextcloudUrl: e.target.value})}
              />
            </div>

            <div className="setting-group">
              <label>Nextcloud Benutzername</label>
              <input
                type="text"
                placeholder="username"
                value={settings.nextcloudUsername}
                onChange={(e) => setSettings({...settings, nextcloudUsername: e.target.value})}
              />
            </div>

            <div className="setting-group">
              <label>Nextcloud Passwort / App-Token</label>
              <input
                type="password"
                placeholder="••••••••"
                value={settings.nextcloudPassword}
                onChange={(e) => setSettings({...settings, nextcloudPassword: e.target.value})}
              />
              <small>Empfohlen: Nutzen Sie ein <a href="#" target="_blank">App-Passwort</a> statt Ihres Haupt-Passworts</small>
            </div>
          </section>

          <section className="settings-section">
            <h3>📁 Google Drive (Optional)</h3>

            <div className="setting-group">
              <label>Google Client ID</label>
              <input
                type="text"
                placeholder="xxxx.apps.googleusercontent.com"
                value={settings.googleClientId}
                onChange={(e) => setSettings({...settings, googleClientId: e.target.value})}
              />
            </div>

            <div className="setting-group">
              <label>Google Client Secret</label>
              <input
                type="password"
                placeholder="GOCSPX-..."
                value={settings.googleClientSecret}
                onChange={(e) => setSettings({...settings, googleClientSecret: e.target.value})}
              />
              <small>Erhalten Sie Credentials bei <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></small>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={handleSave}>💾 Speichern</button>
        </div>
      </div>
    </div>
  )
}

function OverviewPanel() {
  return (
    <div className="panel">
      <h2>Willkommen im Journalism Dashboard</h2>
      <div className="cards-grid">
        <div className="feature-card card-purple">
          <div className="card-icon">✍️</div>
          <h3>Artikel schreiben (Claude AI)</h3>
          <p>Nutzen Sie Claude AI für kreatives Schreiben, Textüberarbeitung und Artikel-Erstellung.</p>
        </div>
        <div className="feature-card card-blue">
          <div className="card-icon">🔍</div>
          <h3>Recherche (Google Gemini)</h3>
          <p>Führen Sie komplexe Recherchen mit Google Gemini durch und analysieren Sie Daten.</p>
        </div>
        <div className="feature-card card-green">
          <div className="card-icon">🔄</div>
          <h3>Content umformen (ChatGPT)</h3>
          <p>Verwenden Sie ChatGPT und GPTs für Übersetzungen, Zusammenfassungen und Umformungen.</p>
        </div>
        <div className="feature-card card-orange">
          <div className="card-icon">📁</div>
          <h3>Cloud-Zugriff (Drive/Cloud)</h3>
          <p>Greifen Sie auf Google Drive und Ihren privaten Cloud-Speicher zu.</p>
        </div>
      </div>

      <div className="quick-actions-section">
        <h3>Schnellaktionen</h3>
        <div className="action-buttons-grid">
          <button className="action-card">
            <span className="action-icon">📝</span>
            <span className="action-label">Neuer Artikel</span>
          </button>
          <button className="action-card">
            <span className="action-icon">🔎</span>
            <span className="action-label">Recherche starten</span>
          </button>
          <button className="action-card">
            <span className="action-icon">📊</span>
            <span className="action-label">Text analysieren</span>
          </button>
          <button className="action-card">
            <span className="action-icon">⬆️</span>
            <span className="action-label">Datei hochladen</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function WritePanel() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')

  return (
    <div className="panel">
      <h2>✍️ Schreiben mit Claude</h2>
      <div className="write-interface">
        <textarea
          className="input-area"
          placeholder="Beschreiben Sie, was Claude für Sie schreiben soll..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
        />
        <button className="generate-btn">Mit Claude generieren</button>

        {result && (
          <div className="result-area">
            <h3>Ergebnis:</h3>
            <div className="result-content">{result}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResearchPanel() {
  return (
    <div className="panel">
      <h2>🔍 Recherche mit Gemini</h2>
      <div className="research-interface">
        <input
          type="text"
          className="search-input"
          placeholder="Recherche-Anfrage eingeben..."
        />
        <button className="search-btn">Recherchieren</button>

        <div className="source-options">
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked /> Web
          </label>
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked /> Google Drive
          </label>
          <label className="checkbox-label">
            <input type="checkbox" /> Nextcloud
          </label>
        </div>
      </div>
    </div>
  )
}

function TransformPanel() {
  return (
    <div className="panel">
      <h2>🔄 Content umformen mit ChatGPT</h2>
      <div className="transform-interface">
        <textarea
          className="input-area"
          placeholder="Text zum Umformen eingeben..."
          rows={8}
        />

        <select className="transform-select">
          <option>Zusammenfassen</option>
          <option>Übersetzen</option>
          <option>Umschreiben</option>
          <option>Erweitern</option>
          <option>Korrekturlesen</option>
        </select>

        <button className="transform-btn">Umformen</button>
      </div>
    </div>
  )
}

function FilesPanel() {
  return (
    <div className="panel">
      <h2>📁 Datei-Management</h2>
      <div className="files-interface">
        <div className="storage-tabs">
          <button className="storage-tab active">Nextcloud</button>
          <button className="storage-tab">Google Drive</button>
          <button className="storage-tab">Lokal</button>
        </div>

        <div className="file-list">
          <p className="placeholder">Verbinden Sie Ihre Cloud-Speicher in den Einstellungen ⚙️</p>
          <p className="placeholder-hint">
            Nextcloud bietet Dateien, Kalender, Kontakte und mehr - alles selbst gehostet!
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
