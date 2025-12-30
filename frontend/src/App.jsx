import { useState, useEffect } from 'react'
import './styles/App.css'
import './styles/glassmorphism.css'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import ResearchPanel from './components/ResearchPanel.jsx'
import TextFileReader from './components/TextFileReader.jsx'

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
      <div className="login-container">
        <div className="login-box">
          <img
            src="/images/logo-quill-with-claim.svg"
            alt="Quill Logo"
            className="login-logo"
            style={{ width: '100%', maxWidth: '500px', margin: '0 auto 1rem' }}
          />
          <p style={{ color: 'var(--secondary-text)' }}>Lädt...</p>
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
      <div className="glass-panel" style={{ margin: '20px', marginBottom: '0' }}>
        <header className="header-top">
          <img
            src="/images/logo-quill-header.svg"
            alt="Quill Logo"
            className="quill-logo"
          />
          <div className="header-right">
            <div className="user-badge">
              <span>👤</span>
              <span>{username}</span>
            </div>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" className="search-input" placeholder="Suchen..." />
            </div>
            <button className="header-button" onClick={() => setShowSettings(!showSettings)}>
              <span>⚙️</span>
              <span>Einstellungen</span>
            </button>
            <button className="header-button" onClick={handleLogout}>
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <nav className="nav-bar">
          <button
            className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Übersicht</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'research' ? 'active' : ''}`}
            onClick={() => setActiveTab('research')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Schreiben (Claude)</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'summarize' ? 'active' : ''}`}
            onClick={() => setActiveTab('summarize')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Recherche (Gemini)</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'correct' ? 'active' : ''}`}
            onClick={() => setActiveTab('correct')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            <span>Umformen (ChatGPT)</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Dateien</span>
          </button>
        </nav>
      </div>

      <main className="content-area">
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {!showSettings && activeTab === 'overview' && <OverviewPanel setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'research' && <ResearchPanel />}
        {!showSettings && activeTab === 'summarize' && <SummarizePanel sharedContent={sharedContent} setSharedContent={setSharedContent} setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'correct' && <CorrectPanel sharedContent={sharedContent} setSharedContent={setSharedContent} setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'gpts' && <GPTsPanel sharedContent={sharedContent} setSharedContent={setSharedContent} setActiveTab={setActiveTab} />}
        {!showSettings && activeTab === 'social' && <SocialMediaPanel sharedContent={sharedContent} setSharedContent={setSharedContent} />}
        {!showSettings && activeTab === 'files' && <NextcloudPanel />}
      </main>

      <footer className="footer">
        <p>
          <strong>Quill</strong> v0.9.0 | Ihre Story. Unser Puls. Aus ihrer Feder.
        </p>
        <p className="footer-links">
          © 2024-2025 Quill by Laurencius ·
          <a href="#changelog" className="footer-link">Changelog</a> ·
          <a href="#roadmap" className="footer-link">Roadmap</a>
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
    <div>
      <h2 className="section-title">
        <span className="section-icon">📁</span>
        <span>Journalismus-Workflow</span>
      </h2>

      <div className="workflow-grid">
        <div className="workflow-card">
          <div className="card-header">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <circle cx="11" cy="13" r="3"/>
                <line x1="13.35" y1="15.35" x2="16" y2="18"/>
              </svg>
            </div>
            <div>
              <h3 className="card-title">Recherche-Dossiers</h3>
              <p className="card-description">Investigative Recherchen verwalten: Personen, Beziehungen und Beweise strukturiert erfassen.</p>
            </div>
          </div>
          <button className="button-primary" onClick={() => setActiveTab('research')}>
            Öffnen <span className="button-arrow">→</span>
          </button>
        </div>

        <div className="workflow-card">
          <div className="card-header">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <h3 className="card-title">Zusammenfassen (Claude)</h3>
              <p className="card-description">Lange Texte, Interviews oder Artikel auf die wichtigsten Punkte reduzieren.</p>
            </div>
          </div>
          <button className="button-primary" onClick={() => setActiveTab('summarize')}>
            Öffnen <span className="button-arrow">→</span>
          </button>
        </div>

        <div className="workflow-card">
          <div className="card-header">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div>
              <h3 className="card-title">Korrigieren (Gemini)</h3>
              <p className="card-description">Rechtschreibung, Grammatik und Stil professionell prüfen und verbessern.</p>
            </div>
          </div>
          <button className="button-primary" onClick={() => setActiveTab('correct')}>
            Öffnen <span className="button-arrow">→</span>
          </button>
        </div>

        <div className="workflow-card">
          <div className="card-header">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <circle cx="12" cy="5" r="2"/>
                <path d="M12 7v4"/>
                <line x1="8" y1="16" x2="8" y2="16"/>
                <line x1="16" y1="16" x2="16" y2="16"/>
              </svg>
            </div>
            <div>
              <h3 className="card-title">MDR GPTs</h3>
              <p className="card-description">Spezialisierte MDR-Assistenten: MINA + Sachsen-Anhalt-Texte.</p>
            </div>
          </div>
          <button className="button-primary" onClick={() => setActiveTab('gpts')}>
            Öffnen <span className="button-arrow">→</span>
          </button>
        </div>

        <div className="workflow-card">
          <div className="card-header">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <div>
              <h3 className="card-title">Social Media</h3>
              <p className="card-description">Automatisch Tweets, Bluesky-Posts und LinkedIn-Beiträge generieren.</p>
            </div>
          </div>
          <button className="button-primary" onClick={() => setActiveTab('social')}>
            Öffnen <span className="button-arrow">→</span>
          </button>
        </div>

        <div className="workflow-card">
          <div className="card-header">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
            </div>
            <div>
              <h3 className="card-title">NextCloud</h3>
              <p className="card-description">Greifen Sie auf Google Drive und Ihren privaten Cloud-Speicher zu.</p>
            </div>
          </div>
          <button className="button-primary" onClick={() => setActiveTab('files')}>
            Öffnen <span className="button-arrow">→</span>
          </button>
        </div>
      </div>

      <div className="tip-box">
        <div className="tip-title">Workflow-Tipp</div>
        <div className="tip-content">
          Texte können zwischen Tools weitergegeben werden:
          <br />
          1. Text korrigieren (Gemini) → 2. Zusammenfassen (Claude) → 3. Social Media generieren
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
        <TextFileReader
          onFileContent={(text, fileName) => {
            setInputText(prev => prev ? `${prev}\n\n--- ${fileName} ---\n${text}` : text)
          }}
        />

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
        <TextFileReader
          onFileContent={(text, fileName) => {
            setInputText(prev => prev ? `${prev}\n\n--- ${fileName} ---\n${text}` : text)
          }}
        />

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

  const handleDirectSend = async (gptKey) => {
    if (!inputText.trim()) {
      alert('Bitte geben Sie zuerst einen Text ein')
      return
    }

    try {
      // Copy text to clipboard
      await navigator.clipboard.writeText(inputText)

      // Open GPT in new tab
      window.open(gpts[gptKey].url, '_blank')

      alert('✅ Text in Zwischenablage kopiert!\n\nFügen Sie ihn im GPT-Chat ein (Strg+V oder Cmd+V)')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('❌ Fehler beim Kopieren. Bitte manuell kopieren.')
    }
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
              <div className="gpt-card-actions">
                <a href={gpt.url} target="_blank" rel="noopener noreferrer" className="gpt-link">
                  🔗 Öffnen
                </a>
                <button
                  className="gpt-send-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDirectSend(key)
                  }}
                  disabled={!inputText.trim()}
                >
                  📤 Text senden
                </button>
              </div>
            </div>
          ))}
        </div>

        <TextFileReader
          onFileContent={(text, fileName) => {
            setInputText(prev => prev ? `${prev}\n\n--- ${fileName} ---\n${text}` : text)
          }}
        />

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
