import { useState, useEffect } from 'react'
import '../styles/AISettings.css'

/**
 * AI Settings Panel - Epic 3: Modulare KI-Steuerung
 * Allows users to configure different AI models for different features
 */
export default function AISettings({ onClose }) {
  const [activeTab, setActiveTab] = useState('models')
  const [availableModels, setAvailableModels] = useState(null)
  const [userConfigs, setUserConfigs] = useState([])
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Feature configuration state
  const [editingFeature, setEditingFeature] = useState(null)
  const [configForm, setConfigForm] = useState({
    provider: 'openai',
    model: '',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2000
  })

  const features = [
    {
      id: 'summarize',
      name: 'Zusammenfassen',
      icon: '📊',
      description: 'AI-Modell für Text-Zusammenfassung',
      defaultProvider: 'anthropic',
      defaultModel: 'claude-3-sonnet-20240229'
    },
    {
      id: 'correct',
      name: 'Korrigieren',
      icon: '✅',
      description: 'AI-Modell für Rechtschreibung & Grammatik',
      defaultProvider: 'google',
      defaultModel: 'gemini-pro'
    },
    {
      id: 'transcription',
      name: 'Transkription',
      icon: '🎙️',
      description: 'Audio-zu-Text (Whisper)',
      defaultProvider: 'openai',
      defaultModel: 'whisper-1'
    },
    {
      id: 'embedding',
      name: 'Embeddings',
      icon: '🔍',
      description: 'Vektorisierung für Suche',
      defaultProvider: 'openai',
      defaultModel: 'text-embedding-ada-002'
    }
  ]

  useEffect(() => {
    loadAISettings()
  }, [])

  const loadAISettings = async () => {
    try {
      setLoading(true)

      // Load available models
      const modelsRes = await fetch('/api/v2/ai/models', {
        credentials: 'include'
      })
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json()
        setAvailableModels(modelsData)
      }

      // Load user configurations
      const configRes = await fetch('/api/v2/ai/config', {
        credentials: 'include'
      })
      if (configRes.ok) {
        const configData = await configRes.json()
        setUserConfigs(configData.configs || [])
      }

      // Load usage statistics
      const usageRes = await fetch('/api/v2/ai/usage?days=30', {
        credentials: 'include'
      })
      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData)
      }
    } catch (err) {
      setError('Fehler beim Laden der AI-Einstellungen: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditFeature = (feature) => {
    const existingConfig = userConfigs.find(c => c.feature_name === feature.id)

    if (existingConfig) {
      setConfigForm({
        provider: existingConfig.provider,
        model: existingConfig.model_name,
        apiKey: '', // Don't show encrypted key
        temperature: existingConfig.settings?.temperature || 0.7,
        maxTokens: existingConfig.settings?.max_tokens || 2000
      })
    } else {
      setConfigForm({
        provider: feature.defaultProvider,
        model: feature.defaultModel,
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2000
      })
    }

    setEditingFeature(feature)
  }

  const handleSaveConfig = async () => {
    try {
      const response = await fetch(`/api/v2/ai/config/${editingFeature.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          provider: configForm.provider,
          model: configForm.model,
          apiKey: configForm.apiKey || undefined,
          settings: {
            temperature: parseFloat(configForm.temperature),
            max_tokens: parseInt(configForm.maxTokens)
          }
        })
      })

      if (response.ok) {
        alert('✅ Konfiguration gespeichert!')
        setEditingFeature(null)
        loadAISettings()
      } else {
        const data = await response.json()
        alert('❌ Fehler: ' + (data.error || 'Speichern fehlgeschlagen'))
      }
    } catch (err) {
      alert('❌ Fehler: ' + err.message)
    }
  }

  const handleDeleteConfig = async (featureName) => {
    if (!confirm(`Konfiguration für "${featureName}" löschen? Das System nutzt dann die Standard-API-Keys.`)) {
      return
    }

    try {
      const response = await fetch(`/api/v2/ai/config/${featureName}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('✅ Konfiguration gelöscht')
        loadAISettings()
      } else {
        alert('❌ Fehler beim Löschen')
      }
    } catch (err) {
      alert('❌ Fehler: ' + err.message)
    }
  }

  const handleTestKey = async () => {
    if (!configForm.apiKey) {
      alert('Bitte geben Sie einen API-Key ein')
      return
    }

    try {
      const response = await fetch('/api/v2/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          provider: configForm.provider,
          apiKey: configForm.apiKey
        })
      })

      const data = await response.json()

      if (data.valid) {
        alert('✅ API-Key ist gültig!')
      } else {
        alert('❌ API-Key ungültig: ' + (data.message || 'Unbekannter Fehler'))
      }
    } catch (err) {
      alert('❌ Test fehlgeschlagen: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="settings-overlay">
        <div className="ai-settings-panel">
          <div className="settings-header">
            <h2>🤖 AI-Einstellungen</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="loading-state">
            <p>Lädt AI-Konfiguration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-overlay">
      <div className="ai-settings-panel">
        <div className="settings-header">
          <h2>🤖 AI-Einstellungen</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            📊 Modelle konfigurieren
          </button>
          <button
            className={`tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            📈 Nutzungsstatistik
          </button>
          <button
            className={`tab-btn ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            ℹ️ Hilfe
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'models' && (
            <div className="models-tab">
              <div className="info-box">
                <h3>🎯 BYOM - Bring Your Own Model</h3>
                <p>Konfigurieren Sie für jede Funktion ein eigenes AI-Modell. Sie können eigene API-Keys hinterlegen oder die System-Keys nutzen.</p>
              </div>

              <div className="features-grid">
                {features.map(feature => {
                  const config = userConfigs.find(c => c.feature_name === feature.id)
                  const isConfigured = !!config

                  return (
                    <div key={feature.id} className={`feature-card ${isConfigured ? 'configured' : ''}`}>
                      <div className="feature-header">
                        <span className="feature-icon">{feature.icon}</span>
                        <div className="feature-info">
                          <h4>{feature.name}</h4>
                          <p>{feature.description}</p>
                        </div>
                      </div>

                      {isConfigured ? (
                        <div className="feature-config">
                          <div className="config-row">
                            <span className="label">Provider:</span>
                            <span className="value">{config.provider}</span>
                          </div>
                          <div className="config-row">
                            <span className="label">Modell:</span>
                            <span className="value">{config.model_name}</span>
                          </div>
                          <div className="config-row">
                            <span className="label">API-Key:</span>
                            <span className="value">
                              {config.api_key_encrypted ? '🔒 Eigener Key' : '🔑 System-Key'}
                            </span>
                          </div>
                          <div className="config-actions">
                            <button
                              className="btn-edit"
                              onClick={() => handleEditFeature(feature)}
                            >
                              ✏️ Bearbeiten
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteConfig(feature.id)}
                            >
                              🗑️ Löschen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="feature-default">
                          <p>📦 Standard: {feature.defaultProvider} / {feature.defaultModel}</p>
                          <button
                            className="btn-configure"
                            onClick={() => handleEditFeature(feature)}
                          >
                            ⚙️ Konfigurieren
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="usage-tab">
              <h3>📈 Nutzungsstatistik (letzte 30 Tage)</h3>

              {usage ? (
                <>
                  <div className="usage-summary">
                    <div className="stat-card">
                      <div className="stat-value">{usage.totalTokens?.toLocaleString() || 0}</div>
                      <div className="stat-label">Total Tokens</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">~${(usage.totalCost || 0).toFixed(2)}</div>
                      <div className="stat-label">Geschätzte Kosten</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{Object.keys(usage.byFeature || {}).length}</div>
                      <div className="stat-label">Genutzte Features</div>
                    </div>
                  </div>

                  {usage.byFeature && Object.keys(usage.byFeature).length > 0 ? (
                    <div className="feature-usage-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>Aufrufe</th>
                            <th>Tokens</th>
                            <th>Ø Antwortzeit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(usage.byFeature).map(([feature, stats]) => (
                            <tr key={feature}>
                              <td>{feature}</td>
                              <td>{stats.calls || 0}</td>
                              <td>{(stats.tokens || 0).toLocaleString()}</td>
                              <td>{stats.avgResponseTime ? `${stats.avgResponseTime}ms` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">Noch keine Nutzungsdaten vorhanden.</p>
                  )}
                </>
              ) : (
                <p className="no-data">Laden...</p>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="help-tab">
              <h3>ℹ️ Hilfe & Dokumentation</h3>

              <div className="help-section">
                <h4>🔑 API-Keys erhalten</h4>
                <ul>
                  <li>
                    <strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
                  </li>
                  <li>
                    <strong>Anthropic (Claude):</strong> <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>
                  </li>
                  <li>
                    <strong>Google (Gemini):</strong> <a href="https://makersuite.google.com" target="_blank" rel="noopener noreferrer">makersuite.google.com</a> (kostenlos)
                  </li>
                </ul>
              </div>

              <div className="help-section">
                <h4>🔒 Sicherheit</h4>
                <p>Ihre API-Keys werden verschlüsselt (AES-256-GCM) in der Datenbank gespeichert. Nur Sie haben Zugriff auf Ihre Keys.</p>
              </div>

              <div className="help-section">
                <h4>💰 Kosten-Übersicht</h4>
                <table className="cost-table">
                  <thead>
                    <tr>
                      <th>Modell</th>
                      <th>Kosten pro 1K Tokens</th>
                      <th>Empfehlung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>GPT-4</td>
                      <td>$0.03 (in) / $0.06 (out)</td>
                      <td>Premium Qualität</td>
                    </tr>
                    <tr>
                      <td>GPT-3.5 Turbo</td>
                      <td>$0.001 (in) / $0.002 (out)</td>
                      <td>Schnell & günstig</td>
                    </tr>
                    <tr>
                      <td>Claude Opus</td>
                      <td>$0.015 (in) / $0.075 (out)</td>
                      <td>Beste Analyse</td>
                    </tr>
                    <tr>
                      <td>Claude Sonnet</td>
                      <td>$0.003 (in) / $0.015 (out)</td>
                      <td>Balanced</td>
                    </tr>
                    <tr>
                      <td>Claude Haiku</td>
                      <td>$0.00025 (in) / $0.00125 (out)</td>
                      <td>Ultra-schnell</td>
                    </tr>
                    <tr>
                      <td>Gemini Pro</td>
                      <td>Kostenlos (begrenzt)</td>
                      <td>Budget-Option</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="help-section">
                <h4>📖 Weitere Informationen</h4>
                <p>Vollständige Dokumentation: <code>backend/src/services/ai/README.md</code></p>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>Schließen</button>
        </div>
      </div>

      {/* Edit Feature Modal */}
      {editingFeature && (
        <div className="modal-overlay" onClick={() => setEditingFeature(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFeature.icon} {editingFeature.name} konfigurieren</h3>
              <button className="close-btn" onClick={() => setEditingFeature(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Provider:</label>
                <select
                  value={configForm.provider}
                  onChange={(e) => setConfigForm({...configForm, provider: e.target.value})}
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="google">Google (Gemini)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Modell:</label>
                {availableModels && availableModels[configForm.provider] ? (
                  <select
                    value={configForm.model}
                    onChange={(e) => setConfigForm({...configForm, model: e.target.value})}
                  >
                    {availableModels[configForm.provider].map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.pricing})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={configForm.model}
                    onChange={(e) => setConfigForm({...configForm, model: e.target.value})}
                    placeholder="z.B. gpt-4"
                  />
                )}
              </div>

              <div className="form-group">
                <label>API-Key (optional - leer lassen für System-Key):</label>
                <div className="input-with-button">
                  <input
                    type="password"
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm({...configForm, apiKey: e.target.value})}
                    placeholder="sk-..."
                  />
                  <button
                    className="btn-test"
                    onClick={handleTestKey}
                    disabled={!configForm.apiKey}
                  >
                    🧪 Testen
                  </button>
                </div>
                <small>Verschlüsselte Speicherung (AES-256-GCM)</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Temperature (0-1):</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={configForm.temperature}
                    onChange={(e) => setConfigForm({...configForm, temperature: e.target.value})}
                  />
                  <small>Höher = kreativer</small>
                </div>

                <div className="form-group">
                  <label>Max Tokens:</label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={configForm.maxTokens}
                    onChange={(e) => setConfigForm({...configForm, maxTokens: e.target.value})}
                  />
                  <small>Max. Antwortlänge</small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingFeature(null)}>
                Abbrechen
              </button>
              <button className="btn-primary" onClick={handleSaveConfig}>
                💾 Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
