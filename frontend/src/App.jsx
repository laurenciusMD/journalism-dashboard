import { useState, useEffect } from 'react'
import './styles/App.css'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import ResearchPanel from './components/ResearchPanel.jsx'
import TextFileReader from './components/TextFileReader.jsx'
import AISettings from './components/AISettings.jsx'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [sharedContent, setSharedContent] = useState('') // Content sharing between panels
  const [showChangelog, setShowChangelog] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)

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
            <div
              className="user-badge"
              onClick={() => window.open('http://localhost:8080/settings/user', '_blank')}
              style={{ cursor: 'pointer' }}
              title="NextCloud Profil öffnen"
            >
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
            <span>Recherche</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'summarize' ? 'active' : ''}`}
            onClick={() => setActiveTab('summarize')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>Zusammenfassen</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'correct' ? 'active' : ''}`}
            onClick={() => setActiveTab('correct')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Korrigieren</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'gpts' ? 'active' : ''}`}
            onClick={() => setActiveTab('gpts')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>MDR GPTs</span>
          </button>
          <button
            className={`nav-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>
            <span>NextCloud</span>
          </button>
        </nav>
      </div>

      <main className="content-area">
        {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
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
          <a href="#" onClick={(e) => { e.preventDefault(); setShowChangelog(true); }} className="footer-link">Changelog</a> ·
          <a href="#" onClick={(e) => { e.preventDefault(); setShowRoadmap(true); }} className="footer-link">Roadmap</a>
        </p>
      </footer>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showRoadmap && <RoadmapModal onClose={() => setShowRoadmap(false)} />}
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
  const nextcloudFeatures = [
    {
      icon: '📁',
      title: 'Dateien verwalten',
      description: 'Laden Sie Dokumente hoch, organisieren Sie Ordner und greifen Sie von überall auf Ihre Dateien zu.',
      url: 'http://localhost:8080/apps/files'
    },
    {
      icon: '📅',
      title: 'Kalender nutzen',
      description: 'Verwalten Sie Termine, Deadlines und koordinieren Sie Events mit Ihrem Team.',
      url: 'http://localhost:8080/apps/calendar'
    },
    {
      icon: '👥',
      title: 'Kontakte speichern',
      description: 'Zentrale Verwaltung Ihrer Kontakte mit Sync-Funktion für alle Geräte.',
      url: 'http://localhost:8080/apps/contacts'
    },
    {
      icon: '📝',
      title: 'Notizen erstellen',
      description: 'Schnelle Notizen, Recherche-Snippets und Ideen direkt in der Cloud speichern.',
      url: 'http://localhost:8080/apps/notes'
    },
    {
      icon: '🖼️',
      title: 'Fotos & Videos',
      description: 'Medien-Archiv für Ihre journalistischen Inhalte mit Vorschau-Funktion.',
      url: 'http://localhost:8080/apps/photos'
    },
    {
      icon: '🔗',
      title: 'Teilen & Kollaboration',
      description: 'Teilen Sie Dateien sicher mit Kollegen und externen Partnern.',
      url: 'http://localhost:8080/apps/files'
    }
  ]

  return (
    <div className="panel">
      <h2>☁️ NextCloud</h2>
      <p className="panel-description">Ihre selbst-gehostete Cloud für Dateien, Kalender und Kontakte</p>

      <div className="nextcloud-info" style={{ marginBottom: '2rem' }}>
        <div className="info-card">
          <h3>🚀 NextCloud läuft!</h3>
          <p>Ihre NextCloud-Instanz ist konfiguriert. Nutzen Sie Ihre Registrierungs-Credentials für den Login.</p>
          <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer" className="nextcloud-btn" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#7FC1CC', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
            ☁️ NextCloud Dashboard öffnen →
          </a>
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem', color: '#1A1833' }}>✨ Verfügbare Features</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {nextcloudFeatures.map((feature, index) => (
          <div
            key={index}
            style={{
              background: '#fff',
              border: '2px solid #E8F4F8',
              borderRadius: '12px',
              padding: '1.5rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => window.open(feature.url, '_blank')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7FC1CC'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(127, 193, 204, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E8F4F8'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
            <h4 style={{ color: '#1A1833', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{feature.title}</h4>
            <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>{feature.description}</p>
            <span style={{ color: '#7FC1CC', fontSize: '0.85rem', fontWeight: '600' }}>Öffnen →</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== CHANGELOG MODAL =====
function ChangelogModal({ onClose }) {
  const changelog = [
    {
      version: '0.9.0',
      date: '30.12.2024',
      changes: [
        'Rebranding zu "Quill" mit neuem Logo und Claim',
        'Professionelles Logo: Lupe + Zahnrad + Federspitze',
        'Claim: "Ihre Story. Unser Puls. Aus ihrer Feder."',
        'File-Upload Funktion für AI-Panels (TXT, MD, PDF, DOC, DOCX)',
        'Navigation unter Logo korrigiert',
        'NextCloud Panel mit interaktiven Feature-Karten',
        'Changelog & Roadmap hinzugefügt'
      ]
    },
    {
      version: '0.8.0',
      date: '29.12.2024',
      changes: [
        'Nextcloud Auto-Repair für config.php implementiert',
        'Cloud-Icon für NextCloud (statt Telefon)',
        '[cite: 11] Label entfernt',
        'Build-Optimierungen und CSS-Fixes'
      ]
    },
    {
      version: '0.6.0',
      date: '28.12.2024',
      changes: [
        'Hypermodern UI mit Glassmorphism-Design',
        'Dismissible Error-Benachrichtigungen',
        'Heating History für Recherche-Dossiers',
        'InfluxDB Integration'
      ]
    },
    {
      version: '0.5.2',
      date: '27.12.2024',
      changes: [
        'Docker Hub automatisches Deployment',
        'Code-Block-Fixes in UI',
        'Executable Service Calls hinzugefügt',
        'GitHub Actions CI/CD Setup'
      ]
    }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#1A1833', margin: 0 }}>📋 Changelog</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>✕</button>
        </div>

        {changelog.map((release, idx) => (
          <div key={idx} style={{
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: idx < changelog.length - 1 ? '1px solid #E8F4F8' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <span style={{
                background: '#7FC1CC',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>v{release.version}</span>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>{release.date}</span>
            </div>
            <ul style={{ marginLeft: '1.25rem', color: '#333' }}>
              {release.changes.map((change, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== ROADMAP MODAL =====
function RoadmapModal({ onClose }) {
  const roadmap = [
    {
      phase: 'Q1 2025 - Foundation',
      status: 'planned',
      features: [
        '🤖 Modulare KI-Steuerung: Wähle dein eigenes Modell (Claude, Gemini, GPT) pro Feature',
        '📰 Portfolio-Tracker: Automatisches MDR-Scraping + Chat mit deinem Archiv (RAG)',
        '📡 News-Radar: Google News Aggregation mit Nextcloud-Integration',
        '🏗️ Infrastruktur: Vector-DB (pgvector), Background Jobs, AI-Router'
      ]
    },
    {
      phase: 'Q2 2025 - Intelligence',
      status: 'planned',
      features: [
        '🎙️ Interview-Vault: Audio-Upload + automatische Transkription (Whisper)',
        '💬 Smart Quotes: Click-to-copy mit Timecodes aus Interviews',
        '📊 Erweiterte RAG: Multi-Source Search (eigenes Archiv + Web)',
        '🔐 Benutzer-Rollen & Permissions für Team-Workflows'
      ]
    },
    {
      phase: 'Q3 2025 - Deep Investigation',
      status: 'planned',
      features: [
        '🕸️ Knowledge Graph: Visualisiere Verbindungen zwischen Personen & Firmen',
        '🏢 North Data Integration: Automatische Handelsregister-Abfragen',
        '✅ Live-Fact-Checking: In-Editor Verifikation mit Ampel-System',
        '🔍 Investigative Queries: "Finde versteckte Verbindungen zwischen X und Y"'
      ]
    },
    {
      phase: 'Future - Innovation',
      status: 'idea',
      features: [
        '📱 Mobile App (React Native) mit Offline-Mode',
        '🔗 Browser-Extension für Quick-Capture',
        '📈 Advanced Analytics: Trend-Erkennung in deinem Archiv',
        '🌐 Multi-Language Support (English, French)',
        '🎨 Integrierte Bildbearbeitung & Media-Management'
      ]
    }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#1A1833', margin: 0 }}>🗺️ Roadmap</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>✕</button>
        </div>

        {roadmap.map((phase, idx) => (
          <div key={idx} style={{
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: idx < roadmap.length - 1 ? '1px solid #E8F4F8' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <span style={{
                background: phase.status === 'planned' ? '#7FC1CC' : '#B8E5E5',
                color: phase.status === 'planned' ? 'white' : '#1A1833',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>{phase.phase}</span>
              <span style={{
                background: phase.status === 'planned' ? '#FFF3CD' : '#E8F4F8',
                color: phase.status === 'planned' ? '#856404' : '#666',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>{phase.status === 'planned' ? 'Geplant' : 'Idee'}</span>
            </div>
            <ul style={{ marginLeft: '1.25rem', color: '#333' }}>
              {phase.features.map((feature, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #7FC1CC' }}>
          <p style={{ color: '#1A1833', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            📋 Detaillierte Architektur-Spezifikation
          </p>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Die vollständige technische Planung (APIs, Datenbank-Schemas, Docker-Architektur) finden Sie in:
          </p>
          <code style={{ background: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#1A1833' }}>
            docs/INVESTIGATIVE_SUITE_ARCHITECTURE.md
          </code>
        </div>

        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '1rem', fontStyle: 'italic' }}>
          💡 Feature-Wünsche? Erstellen Sie ein Issue auf GitHub!
        </p>
      </div>
    </div>
  )
}

export default App
