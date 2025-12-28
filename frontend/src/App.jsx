import { useState, useEffect } from 'react'
import './styles/App.css'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [sharedContent, setSharedContent] = useState('') // Content sharing between panels

  // Check auth status and setup requirements on mount
  useEffect(() => {
    checkSetupAndAuth()
  }, [])

  const checkSetupAndAuth = async () => {
    try {
      // First, check if setup is needed
      const setupResponse = await fetch('/api/auth/needs-setup', {
        credentials: 'include'
      })
      const setupData = await setupResponse.json()
      setNeedsSetup(setupData.needsSetup)

      // If setup is not needed, check auth status
      if (!setupData.needsSetup) {
        const authResponse = await fetch('/api/auth/status', {
          credentials: 'include'
        })
        const authData = await authResponse.json()

        if (authData.authenticated) {
          setIsAuthenticated(true)
          setUsername(authData.username)
        }
      }
    } catch (err) {
      console.error('Setup/Auth check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSuccess = (user) => {
    setIsAuthenticated(true)
    setUsername(user)
    setNeedsSetup(false)
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
    // Show registration page if no users exist
    if (needsSetup) {
      return <Register onRegisterSuccess={handleRegisterSuccess} />
    }

    // Show login page if users exist
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
          className={activeTab === 'summarize' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('summarize')}
        >
          📊 Zusammenfassen (Claude)
        </button>
        <button
          className={activeTab === 'correct' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('correct')}
        >
          ✅ Korrigieren (Gemini)
        </button>
        <button
          className={activeTab === 'gpts' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('gpts')}
        >
          🤖 MDR GPTs
        </button>
        <button
          className={activeTab === 'social' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('social')}
        >
          📱 Social Media
        </button>
        <button
          className={activeTab === 'files' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('files')}
        >
          ☁️ Nextcloud
        </button>
      </nav>

      <main className="dashboard-content">
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {!showSettings && activeTab === 'overview' && <OverviewPanel setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'summarize' && <SummarizePanel sharedContent={sharedContent} setSharedContent={setSharedContent} setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'correct' && <CorrectPanel sharedContent={sharedContent} setSharedContent={setSharedContent} setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'gpts' && <GPTsPanel sharedContent={sharedContent} setSharedContent={setSharedContent} setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'social' && <SocialMediaPanel sharedContent={sharedContent} setSharedContent={setSharedContent} />}
        {!showSettings && activeTab === 'files' && <NextcloudPanel />}
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
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('journalism-settings')
    return saved ? JSON.parse(saved) : {
      anthropicKey: '',
      geminiKey: '',
      openaiKey: ''
    }
  })

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('journalism-settings', JSON.stringify(settings))
    alert('✅ Einstellungen gespeichert!')
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
            <h3>ℹ️ Info</h3>
            <div className="info-box">
              <p><strong>☁️ Nextcloud:</strong> Bereits konfiguriert! Läuft auf <a href="http://localhost:8080" target="_blank">http://localhost:8080</a></p>
              <p>Nutzen Sie Ihre Registrierungs-Credentials für den Zugriff.</p>
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

function OverviewPanel({ setActiveTab }) {
  return (
    <div className="panel">
      <h2>📰 Journalismus-Workflow</h2>
      <p className="panel-description">Ihr KI-gestützter Workflow für professionellen Journalismus</p>

      <div className="cards-grid">
        <div className="feature-card card-purple" onClick={() => setActiveTab('summarize')}>
          <div className="card-icon">📊</div>
          <h3>Zusammenfassen (Claude)</h3>
          <p>Lange Texte, Interviews oder Artikel auf die wichtigsten Punkte reduzieren.</p>
          <button className="card-btn">Öffnen →</button>
        </div>
        <div className="feature-card card-blue" onClick={() => setActiveTab('correct')}>
          <div className="card-icon">✅</div>
          <h3>Korrigieren (Gemini)</h3>
          <p>Rechtschreibung, Grammatik und Stil professionell prüfen und verbessern.</p>
          <button className="card-btn">Öffnen →</button>
        </div>
        <div className="feature-card card-green" onClick={() => setActiveTab('gpts')}>
          <div className="card-icon">🤖</div>
          <h3>MDR GPTs</h3>
          <p>Spezialisierte MDR-Assistenten: MINA + Sachsen-Anhalt-Texte.</p>
          <button className="card-btn">Öffnen →</button>
        </div>
        <div className="feature-card card-orange" onClick={() => setActiveTab('social')}>
          <div className="card-icon">📱</div>
          <h3>Social Media</h3>
          <p>Automatisch Tweets, Bluesky-Posts und LinkedIn-Beiträge generieren.</p>
          <button className="card-btn">Öffnen →</button>
        </div>
      </div>

      <div className="workflow-info">
        <h3>💡 Workflow-Tipp</h3>
        <p>Texte können zwischen Tools weitergegeben werden:</p>
        <div className="workflow-steps">
          <span>1. Text korrigieren (Gemini)</span> →
          <span>2. Zusammenfassen (Claude)</span> →
          <span>3. Social Media generieren</span>
        </div>
      </div>
    </div>
  )
}

// ===== CLAUDE: Zusammenfassen =====
function SummarizePanel({ sharedContent, setSharedContent, setActiveTab }) {
  const [inputText, setInputText] = useState(sharedContent || '')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSummarize = async () => {
    setLoading(true)
    // TODO: API integration
    setTimeout(() => {
      setSummary('[Demo] Dies ist eine automatisch generierte Zusammenfassung...')
      setLoading(false)
    }, 1500)
  }

  const handleShare = (tab) => {
    setSharedContent(summary || inputText)
    setActiveTab(tab)
  }

  return (
    <div className="panel">
      <h2>📊 Zusammenfassen mit Claude</h2>
      <p className="panel-description">Lange Texte auf die wichtigsten Punkte reduzieren</p>

      <div className="tool-interface">
        <label>Eingabetext:</label>
        <textarea
          className="input-area"
          placeholder="Fügen Sie hier den Text ein, der zusammengefasst werden soll..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={10}
        />

        <button className="primary-btn" onClick={handleSummarize} disabled={!inputText || loading}>
          {loading ? '⏳ Zusammenfassen...' : '📊 Mit Claude zusammenfassen'}
        </button>

        {summary && (
          <div className="result-section">
            <label>Zusammenfassung:</label>
            <div className="result-content">{summary}</div>

            <div className="action-buttons">
              <button className="secondary-btn" onClick={() => navigator.clipboard.writeText(summary)}>
                📋 Kopieren
              </button>
              <button className="secondary-btn" onClick={() => handleShare('social')}>
                📱 Zu Social Media →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== GEMINI: Korrigieren =====
function CorrectPanel({ sharedContent, setSharedContent, setActiveTab }) {
  const [inputText, setInputText] = useState(sharedContent || '')
  const [correctedText, setCorrectedText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  const handleCorrect = async () => {
    setLoading(true)
    // TODO: API integration
    setTimeout(() => {
      setCorrectedText(inputText) // Demo
      setSuggestions([
        { type: 'Rechtschreibung', text: '3 Korrekturen vorgenommen' },
        { type: 'Grammatik', text: '2 Verbesserungen' },
        { type: 'Stil', text: '1 Stilvorschlag' }
      ])
      setLoading(false)
    }, 1500)
  }

  const handleShare = (tab) => {
    setSharedContent(correctedText || inputText)
    setActiveTab(tab)
  }

  return (
    <div className="panel">
      <h2>✅ Korrigieren mit Gemini</h2>
      <p className="panel-description">Rechtschreibung, Grammatik und Stil professionell prüfen</p>

      <div className="tool-interface">
        <label>Text zum Korrigieren:</label>
        <textarea
          className="input-area"
          placeholder="Fügen Sie hier Ihren Text ein..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={10}
        />

        <button className="primary-btn" onClick={handleCorrect} disabled={!inputText || loading}>
          {loading ? '⏳ Korrigiere...' : '✅ Mit Gemini korrigieren'}
        </button>

        {correctedText && (
          <div className="result-section">
            <label>Korrigierter Text:</label>
            <div className="result-content">{correctedText}</div>

            {suggestions.length > 0 && (
              <div className="suggestions-list">
                <h4>Vorgenommene Korrekturen:</h4>
                {suggestions.map((s, i) => (
                  <div key={i} className="suggestion-item">
                    <strong>{s.type}:</strong> {s.text}
                  </div>
                ))}
              </div>
            )}

            <div className="action-buttons">
              <button className="secondary-btn" onClick={() => navigator.clipboard.writeText(correctedText)}>
                📋 Kopieren
              </button>
              <button className="secondary-btn" onClick={() => handleShare('summarize')}>
                📊 Zusammenfassen →
              </button>
              <button className="secondary-btn" onClick={() => handleShare('social')}>
                📱 Zu Social Media →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== CHATGPT: MDR GPTs =====
function GPTsPanel({ sharedContent, setSharedContent, setActiveTab }) {
  const [inputText, setInputText] = useState(sharedContent || '')
  const [selectedGPT, setSelectedGPT] = useState('mina')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const gpts = {
    mina: {
      name: 'MDR MINA Assistant',
      description: 'Spezialisiert auf MDR-Inhalte und Formatierung',
      url: 'https://chatgpt.com/g/g-aDuK4wt11-mdr-mina-assistant'
    },
    sachsenAnhalt: {
      name: 'Texte für MDR Sachsen-Anhalt',
      description: 'Optimiert für regionale MDR-Berichterstattung',
      url: 'https://chatgpt.com/g/g-PrYZp9eFz-texte-fur-mdr-sachsen-anhalt'
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    // TODO: API integration with GPT
    setTimeout(() => {
      setResult('[Demo] GPT-generierter Text...')
      setLoading(false)
    }, 1500)
  }

  const handleShare = (tab) => {
    setSharedContent(result || inputText)
    setActiveTab(tab)
  }

  return (
    <div className="panel">
      <h2>🤖 MDR GPTs</h2>
      <p className="panel-description">Spezialisierte Assistenten für MDR-Content</p>

      <div className="tool-interface">
        <label>GPT auswählen:</label>
        <div className="gpt-selector">
          {Object.entries(gpts).map(([key, gpt]) => (
            <div
              key={key}
              className={`gpt-card ${selectedGPT === key ? 'selected' : ''}`}
              onClick={() => setSelectedGPT(key)}
            >
              <h4>{gpt.name}</h4>
              <p>{gpt.description}</p>
              <a href={gpt.url} target="_blank" rel="noopener noreferrer" className="gpt-link">
                🔗 In ChatGPT öffnen
              </a>
            </div>
          ))}
        </div>

        <label>Eingabe:</label>
        <textarea
          className="input-area"
          placeholder="Beschreiben Sie, was der GPT für Sie tun soll..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={8}
        />

        <button className="primary-btn" onClick={handleGenerate} disabled={!inputText || loading}>
          {loading ? '⏳ Generiere...' : `🤖 Mit ${gpts[selectedGPT].name} generieren`}
        </button>

        {result && (
          <div className="result-section">
            <label>Ergebnis:</label>
            <div className="result-content">{result}</div>

            <div className="action-buttons">
              <button className="secondary-btn" onClick={() => navigator.clipboard.writeText(result)}>
                📋 Kopieren
              </button>
              <button className="secondary-btn" onClick={() => handleShare('correct')}>
                ✅ Korrigieren →
              </button>
              <button className="secondary-btn" onClick={() => handleShare('social')}>
                📱 Zu Social Media →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== SOCIAL MEDIA: Generator =====
function SocialMediaPanel({ sharedContent, setSharedContent }) {
  const [inputText, setInputText] = useState(sharedContent || '')
  const [results, setResults] = useState({ twitter: '', bluesky: '', linkedin: '' })
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    // TODO: API integration
    setTimeout(() => {
      setResults({
        twitter: '[Demo Tweet] Kurze Zusammenfassung für Twitter (280 Zeichen)...',
        bluesky: '[Demo Bluesky] Etwas längerer Post für Bluesky...',
        linkedin: '[Demo LinkedIn] Professioneller Post für LinkedIn mit Kontext und Call-to-Action...'
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="panel">
      <h2>📱 Social Media Generator</h2>
      <p className="panel-description">Automatisch Tweets, Bluesky-Posts und LinkedIn-Beiträge erstellen</p>

      <div className="tool-interface">
        <label>Quelltext / Artikel:</label>
        <textarea
          className="input-area"
          placeholder="Fügen Sie hier Ihren Artikel oder Text ein..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={8}
        />

        <button className="primary-btn" onClick={handleGenerate} disabled={!inputText || loading}>
          {loading ? '⏳ Generiere Social Media Posts...' : '📱 Alle Plattformen generieren'}
        </button>

        {results.twitter && (
          <div className="social-results">
            {/* Twitter */}
            <div className="social-result-card">
              <div className="social-header">
                <h4>🐦 Twitter / X</h4>
                <span className="char-count">{results.twitter.length}/280</span>
              </div>
              <div className="social-content">{results.twitter}</div>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(results.twitter)}>
                📋 Kopieren
              </button>
            </div>

            {/* Bluesky */}
            <div className="social-result-card">
              <div className="social-header">
                <h4>🦋 Bluesky</h4>
                <span className="char-count">{results.bluesky.length}/300</span>
              </div>
              <div className="social-content">{results.bluesky}</div>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(results.bluesky)}>
                📋 Kopieren
              </button>
            </div>

            {/* LinkedIn */}
            <div className="social-result-card">
              <div className="social-header">
                <h4>💼 LinkedIn</h4>
                <span className="char-count">{results.linkedin.length} Zeichen</span>
              </div>
              <div className="social-content">{results.linkedin}</div>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(results.linkedin)}>
                📋 Kopieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== NEXTCLOUD: Dateien =====
function NextcloudPanel() {
  return (
    <div className="panel">
      <h2>☁️ Nextcloud</h2>
      <p className="panel-description">Ihre selbst-gehostete Cloud für Dateien, Kalender und Kontakte</p>

      <div className="nextcloud-info">
        <div className="info-card">
          <h3>🚀 Nextcloud läuft!</h3>
          <p>Ihre Nextcloud-Instanz ist bereits konfiguriert und läuft.</p>

          <div className="nextcloud-access">
            <p><strong>Zugriff:</strong></p>
            <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer" className="nextcloud-btn">
              ☁️ Nextcloud öffnen →
            </a>
          </div>

          <div className="nextcloud-credentials">
            <p><strong>Login:</strong> Nutzen Sie Ihre Registrierungs-Credentials</p>
            <ul>
              <li>📁 Dateien verwalten</li>
              <li>📅 Kalender nutzen</li>
              <li>👥 Kontakte speichern</li>
              <li>📝 Notizen erstellen</li>
            </ul>
          </div>
        </div>

        <div className="nextcloud-features">
          <h4>✨ Verfügbare Features:</h4>
          <div className="feature-grid">
            <div className="feature-item">📄 Dateien & Ordner</div>
            <div className="feature-item">🖼️ Fotos & Videos</div>
            <div className="feature-item">📅 Kalender</div>
            <div className="feature-item">👤 Kontakte</div>
            <div className="feature-item">📝 Notes</div>
            <div className="feature-item">🔗 Teilen & Kollaboration</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
