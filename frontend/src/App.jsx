import { useState } from 'react'
import './styles/App.css'

function App() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📰 Journalism Dashboard</h1>
        <p className="subtitle">Ihre zentrale Arbeitsumgebung für journalistische Arbeit</p>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </button>
        <button
          className={activeTab === 'write' ? 'active' : ''}
          onClick={() => setActiveTab('write')}
        >
          ✍️ Schreiben (Claude)
        </button>
        <button
          className={activeTab === 'research' ? 'active' : ''}
          onClick={() => setActiveTab('research')}
        >
          🔍 Recherche (Gemini)
        </button>
        <button
          className={activeTab === 'transform' ? 'active' : ''}
          onClick={() => setActiveTab('transform')}
        >
          🔄 Umformen (ChatGPT)
        </button>
        <button
          className={activeTab === 'files' ? 'active' : ''}
          onClick={() => setActiveTab('files')}
        >
          📁 Dateien
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'write' && <WritePanel />}
        {activeTab === 'research' && <ResearchPanel />}
        {activeTab === 'transform' && <TransformPanel />}
        {activeTab === 'files' && <FilesPanel />}
      </main>

      <footer className="dashboard-footer">
        <p>Journalism Dashboard v0.1.0 | Powered by Claude, Gemini & ChatGPT</p>
      </footer>
    </div>
  )
}

function OverviewPanel() {
  return (
    <div className="panel">
      <h2>Willkommen im Journalism Dashboard</h2>
      <div className="cards">
        <div className="card">
          <h3>✍️ Artikel schreiben</h3>
          <p>Nutzen Sie Claude AI für kreatives Schreiben, Textüberarbeitung und Artikel-Erstellung.</p>
        </div>
        <div className="card">
          <h3>🔍 Recherche</h3>
          <p>Führen Sie komplexe Recherchen mit Google Gemini durch und analysieren Sie Daten.</p>
        </div>
        <div className="card">
          <h3>🔄 Content umformen</h3>
          <p>Verwenden Sie ChatGPT und GPTs für Übersetzungen, Zusammenfassungen und Umformungen.</p>
        </div>
        <div className="card">
          <h3>📁 Cloud-Zugriff</h3>
          <p>Greifen Sie auf Google Drive und Ihren privaten Cloud-Speicher zu.</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Schnellaktionen</h3>
        <div className="action-buttons">
          <button className="action-btn">Neuer Artikel</button>
          <button className="action-btn">Recherche starten</button>
          <button className="action-btn">Text analysieren</button>
          <button className="action-btn">Datei hochladen</button>
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
          rows={5}
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
          <label>
            <input type="checkbox" defaultChecked /> Web
          </label>
          <label>
            <input type="checkbox" defaultChecked /> Google Drive
          </label>
          <label>
            <input type="checkbox" /> Private Cloud
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
          rows={5}
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
          <button className="storage-tab active">Google Drive</button>
          <button className="storage-tab">Private Cloud</button>
          <button className="storage-tab">Lokal</button>
        </div>

        <div className="file-list">
          <p className="placeholder">Verbinden Sie Ihre Cloud-Speicher in den Einstellungen</p>
        </div>
      </div>
    </div>
  )
}

export default App
