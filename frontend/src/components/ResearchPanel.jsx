import { useState, useEffect } from 'react'
import '../styles/Research.css'
import FileUpload from './FileUpload.jsx'

function ResearchPanel() {
  const [activeView, setActiveView] = useState('dossiers') // dossiers, person-detail
  const [dossiers, setDossiers] = useState([])
  const [selectedDossier, setSelectedDossier] = useState(null)
  const [persons, setPersons] = useState([])
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Modals
  const [showNewDossierModal, setShowNewDossierModal] = useState(false)
  const [showNewPersonModal, setShowNewPersonModal] = useState(false)

  // Load dossiers on mount
  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dossiers', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to load dossiers')
      const data = await response.json()
      setDossiers(data.dossiers || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadDossierDetails = async (dossierId) => {
    try {
      setLoading(true)
      setError(null)

      // Load dossier
      const dossierRes = await fetch(`/api/dossiers/${dossierId}`, {
        credentials: 'include'
      })
      if (!dossierRes.ok) throw new Error('Failed to load dossier')
      const dossierData = await dossierRes.json()
      setSelectedDossier(dossierData.dossier)

      // Load persons
      const personsRes = await fetch(`/api/dossiers/${dossierId}/persons`, {
        credentials: 'include'
      })
      if (!personsRes.ok) throw new Error('Failed to load persons')
      const personsData = await personsRes.json()
      setPersons(personsData.persons || [])

      // Load relationships
      const relsRes = await fetch(`/api/dossiers/${dossierId}/relationships`, {
        credentials: 'include'
      })
      if (!relsRes.ok) throw new Error('Failed to load relationships')
      const relsData = await relsRes.json()
      setRelationships(relsData.relationships || [])

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDossierClick = (dossier) => {
    setSelectedDossier(dossier)
    loadDossierDetails(dossier.id)
  }

  const handleBackToDossiers = () => {
    setSelectedDossier(null)
    setPersons([])
    setRelationships([])
    setSelectedPerson(null)
  }

  const handlePersonClick = async (person) => {
    setSelectedPerson(person)
    setActiveView('person-detail')

    // Load person attributes
    try {
      const response = await fetch(`/api/persons/${person.id}/attributes`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedPerson({ ...person, attributes: data.attributes || [] })
      }
    } catch (err) {
      console.error('Failed to load attributes:', err)
    }
  }

  const handleBackToPersonsList = () => {
    setActiveView('dossiers')
    setSelectedPerson(null)
  }

  if (loading && dossiers.length === 0) {
    return (
      <div className="panel">
        <div className="loading-spinner">⏳ Lädt Recherchen...</div>
      </div>
    )
  }

  // Dossier List View
  if (!selectedDossier) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>📁 Recherche-Dossiers</h2>
          <button className="btn-primary" onClick={() => setShowNewDossierModal(true)}>
            ➕ Neues Dossier
          </button>
        </div>

        {error && <div className="error-banner">❌ {error}</div>}

        <div className="dossiers-grid">
          {dossiers.length === 0 ? (
            <div className="empty-state">
              <p>📂 Noch keine Dossiers vorhanden</p>
              <p className="empty-hint">Erstellen Sie Ihr erstes Recherche-Dossier</p>
            </div>
          ) : (
            dossiers.map(dossier => (
              <DossierCard
                key={dossier.id}
                dossier={dossier}
                onClick={() => handleDossierClick(dossier)}
              />
            ))
          )}
        </div>

        {showNewDossierModal && (
          <NewDossierModal
            onClose={() => setShowNewDossierModal(false)}
            onSuccess={() => {
              setShowNewDossierModal(false)
              loadDossiers()
            }}
          />
        )}
      </div>
    )
  }

  // Person Detail View
  if (activeView === 'person-detail' && selectedPerson) {
    return (
      <PersonDetailView
        person={selectedPerson}
        dossier={selectedDossier}
        onBack={handleBackToPersonsList}
      />
    )
  }

  // Dossier Detail View
  return (
    <div className="panel research-detail">
      <div className="panel-header">
        <button className="back-btn" onClick={handleBackToDossiers}>
          ← Zurück zu Dossiers
        </button>
        <div className="dossier-header-info">
          <h2>📁 {selectedDossier.title}</h2>
          <span className={`status-badge status-${selectedDossier.status}`}>
            {selectedDossier.status}
          </span>
        </div>
      </div>

      {selectedDossier.description && (
        <div className="dossier-description">
          <p>{selectedDossier.description}</p>
        </div>
      )}

      {error && <div className="error-banner">❌ {error}</div>}

      <div className="research-tabs">
        <button
          className={activeView === 'dossiers' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveView('dossiers')}
        >
          👥 Personen ({persons.length})
        </button>
        <button
          className={activeView === 'relationships' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveView('relationships')}
        >
          🔗 Beziehungen ({relationships.length})
        </button>
        <button
          className={activeView === 'files' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveView('files')}
        >
          📎 Dateien
        </button>
        <button
          className={activeView === 'graph' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveView('graph')}
        >
          🕸️ Graph
        </button>
      </div>

      <div className="research-content">
        {activeView === 'dossiers' && (
          <PersonsListView
            persons={persons}
            dossierId={selectedDossier.id}
            onPersonClick={handlePersonClick}
            onRefresh={() => loadDossierDetails(selectedDossier.id)}
          />
        )}

        {activeView === 'relationships' && (
          <RelationshipsView
            relationships={relationships}
            persons={persons}
            dossierId={selectedDossier.id}
            onRefresh={() => loadDossierDetails(selectedDossier.id)}
          />
        )}

        {activeView === 'files' && (
          <FileUpload
            dossierId={selectedDossier.id}
            onUploadSuccess={() => {}}
          />
        )}

        {activeView === 'graph' && (
          <GraphView
            dossierId={selectedDossier.id}
            persons={persons}
            relationships={relationships}
          />
        )}
      </div>
    </div>
  )
}

// ===== Dossier Card Component =====
function DossierCard({ dossier, onClick }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="dossier-card" onClick={onClick}>
      <div className="dossier-card-header">
        <h3>{dossier.title}</h3>
        <span className={`status-badge status-${dossier.status}`}>
          {dossier.status}
        </span>
      </div>
      {dossier.description && (
        <p className="dossier-card-desc">{dossier.description}</p>
      )}
      <div className="dossier-card-footer">
        <span className="dossier-date">📅 {formatDate(dossier.created_at)}</span>
      </div>
    </div>
  )
}

// ===== New Dossier Modal =====
function NewDossierModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description, status })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create dossier')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📁 Neues Dossier erstellen</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-banner">❌ {error}</div>}

          <div className="form-group">
            <label>Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Korruptionsfall Stadtrat"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung der Recherche..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
              <option value="completed">Abgeschlossen</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !title}>
              {submitting ? 'Erstelle...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== Persons List View =====
function PersonsListView({ persons, dossierId, onPersonClick, onRefresh }) {
  const [showNewPersonModal, setShowNewPersonModal] = useState(false)

  return (
    <div className="persons-view">
      <div className="view-header">
        <h3>👥 Personen in diesem Dossier</h3>
        <button className="btn-primary" onClick={() => setShowNewPersonModal(true)}>
          ➕ Person hinzufügen
        </button>
      </div>

      {persons.length === 0 ? (
        <div className="empty-state">
          <p>👤 Noch keine Personen erfasst</p>
          <p className="empty-hint">Fügen Sie Personen zu diesem Dossier hinzu</p>
        </div>
      ) : (
        <div className="persons-grid">
          {persons.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onClick={() => onPersonClick(person)}
            />
          ))}
        </div>
      )}

      {showNewPersonModal && (
        <NewPersonModal
          dossierId={dossierId}
          onClose={() => setShowNewPersonModal(false)}
          onSuccess={() => {
            setShowNewPersonModal(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

// ===== Person Card =====
function PersonCard({ person, onClick }) {
  return (
    <div className="person-card" onClick={onClick}>
      <div className="person-avatar">
        {person.canonical_name.charAt(0).toUpperCase()}
      </div>
      <div className="person-info">
        <h4>{person.canonical_name}</h4>
        {person.aliases && person.aliases.length > 0 && (
          <p className="person-aliases">
            AKA: {person.aliases.join(', ')}
          </p>
        )}
        {person.description && (
          <p className="person-desc">{person.description}</p>
        )}
        <div className="person-meta">
          <span className="confidence-badge" style={{
            background: person.confidence_score >= 0.7 ? '#4caf50' :
                       person.confidence_score >= 0.4 ? '#ff9800' : '#f44336'
          }}>
            {Math.round(person.confidence_score * 100)}% Konfidenz
          </span>
        </div>
      </div>
    </div>
  )
}

// ===== New Person Modal =====
function NewPersonModal({ dossierId, onClose, onSuccess }) {
  const [canonicalName, setCanonicalName] = useState('')
  const [aliases, setAliases] = useState('')
  const [description, setDescription] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(0.5)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dossier_id: dossierId,
          canonical_name: canonicalName,
          aliases: aliases.split(',').map(a => a.trim()).filter(a => a),
          description,
          confidence_score: parseFloat(confidenceScore)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create person')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👤 Neue Person hinzufügen</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-banner">❌ {error}</div>}

          <div className="form-group">
            <label>Kanonischer Name *</label>
            <input
              type="text"
              value={canonicalName}
              onChange={(e) => setCanonicalName(e.target.value)}
              placeholder="z.B. Max Mustermann"
              required
              autoFocus
            />
            <small>Der Hauptname dieser Person</small>
          </div>

          <div className="form-group">
            <label>Aliase</label>
            <input
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="M. Mustermann, Maximilian M. (kommasepariert)"
            />
            <small>Alternative Namen, durch Komma getrennt</small>
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notizen zu dieser Person..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Konfidenz-Score: {Math.round(confidenceScore * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={confidenceScore}
              onChange={(e) => setConfidenceScore(e.target.value)}
            />
            <small>Wie sicher sind Sie über die Identität dieser Person?</small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !canonicalName}>
              {submitting ? 'Erstelle...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== Person Detail View =====
function PersonDetailView({ person, dossier, onBack }) {
  const [attributes, setAttributes] = useState(person.attributes || [])
  const [showNewAttributeModal, setShowNewAttributeModal] = useState(false)

  const loadAttributes = async () => {
    try {
      const response = await fetch(`/api/persons/${person.id}/attributes`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAttributes(data.attributes || [])
      }
    } catch (err) {
      console.error('Failed to load attributes:', err)
    }
  }

  return (
    <div className="person-detail-view">
      <div className="panel-header">
        <button className="back-btn" onClick={onBack}>
          ← Zurück zur Personenliste
        </button>
      </div>

      <div className="person-detail-header">
        <div className="person-avatar-large">
          {person.canonical_name.charAt(0).toUpperCase()}
        </div>
        <div className="person-detail-info">
          <h2>{person.canonical_name}</h2>
          {person.aliases && person.aliases.length > 0 && (
            <p className="aliases-list">
              <strong>Aliase:</strong> {person.aliases.join(', ')}
            </p>
          )}
          {person.description && (
            <p className="person-description">{person.description}</p>
          )}
          <div className="person-badges">
            <span className="confidence-badge">
              {Math.round(person.confidence_score * 100)}% Konfidenz
            </span>
            <span className="dossier-badge">📁 {dossier.title}</span>
          </div>
        </div>
      </div>

      <div className="person-sections">
        <div className="section">
          <div className="section-header">
            <h3>📋 Attribute</h3>
            <button className="btn-primary" onClick={() => setShowNewAttributeModal(true)}>
              ➕ Attribut hinzufügen
            </button>
          </div>

          {attributes.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Attribute erfasst</p>
            </div>
          ) : (
            <div className="attributes-list">
              {attributes.map(attr => (
                <AttributeItem key={attr.id} attribute={attr} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewAttributeModal && (
        <NewAttributeModal
          personId={person.id}
          onClose={() => setShowNewAttributeModal(false)}
          onSuccess={() => {
            setShowNewAttributeModal(false)
            loadAttributes()
          }}
        />
      )}
    </div>
  )
}

// ===== Attribute Item =====
function AttributeItem({ attribute }) {
  const getAttributeIcon = (type) => {
    const icons = {
      email: '📧',
      phone: '📱',
      address: '🏠',
      role: '💼',
      affiliation: '🏢',
      social: '🌐',
      date_of_birth: '🎂'
    }
    return icons[type] || '📄'
  }

  return (
    <div className="attribute-item">
      <div className="attribute-icon">{getAttributeIcon(attribute.attribute_type)}</div>
      <div className="attribute-content">
        <div className="attribute-type">{attribute.attribute_type}</div>
        <div className="attribute-value">{attribute.attribute_value}</div>
        {attribute.notes && <div className="attribute-notes">{attribute.notes}</div>}
        <div className="attribute-meta">
          {attribute.verified && <span className="verified-badge">✓ Verifiziert</span>}
          <span className="confidence-small">
            {Math.round(attribute.confidence_score * 100)}% Konfidenz
          </span>
          {attribute.valid_from && (
            <span className="date-range">
              📅 ab {new Date(attribute.valid_from).toLocaleDateString('de-DE')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== New Attribute Modal =====
function NewAttributeModal({ personId, onClose, onSuccess }) {
  const [attributeType, setAttributeType] = useState('email')
  const [attributeValue, setAttributeValue] = useState('')
  const [notes, setNotes] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(0.5)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const attributeTypes = [
    { value: 'email', label: '📧 E-Mail' },
    { value: 'phone', label: '📱 Telefon' },
    { value: 'address', label: '🏠 Adresse' },
    { value: 'role', label: '💼 Rolle/Position' },
    { value: 'affiliation', label: '🏢 Organisation' },
    { value: 'social', label: '🌐 Social Media' },
    { value: 'date_of_birth', label: '🎂 Geburtsdatum' },
    { value: 'other', label: '📄 Sonstiges' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/persons/${personId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          attribute_type: attributeType,
          attribute_value: attributeValue,
          notes,
          confidence_score: parseFloat(confidenceScore)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create attribute')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 Neues Attribut hinzufügen</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-banner">❌ {error}</div>}

          <div className="form-group">
            <label>Attribut-Typ *</label>
            <select value={attributeType} onChange={(e) => setAttributeType(e.target.value)}>
              {attributeTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Wert *</label>
            <input
              type="text"
              value={attributeValue}
              onChange={(e) => setAttributeValue(e.target.value)}
              placeholder="z.B. max.mustermann@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Konfidenz-Score: {Math.round(confidenceScore * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={confidenceScore}
              onChange={(e) => setConfidenceScore(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !attributeValue}>
              {submitting ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== Relationships View =====
function RelationshipsView({ relationships, persons, dossierId, onRefresh }) {
  const getPersonName = (personId) => {
    const person = persons.find(p => p.id === personId)
    return person ? person.canonical_name : 'Unbekannt'
  }

  return (
    <div className="relationships-view">
      <div className="view-header">
        <h3>🔗 Beziehungen</h3>
      </div>

      {relationships.length === 0 ? (
        <div className="empty-state">
          <p>🔗 Noch keine Beziehungen erfasst</p>
        </div>
      ) : (
        <div className="relationships-list">
          {relationships.map(rel => (
            <div key={rel.id} className="relationship-item">
              <div className="relationship-persons">
                <span className="person-name">{getPersonName(rel.person_a_id)}</span>
                <span className="relationship-arrow">→</span>
                <span className="person-name">{getPersonName(rel.person_b_id)}</span>
              </div>
              <div className="relationship-type">{rel.relationship_type}</div>
              {rel.description && <div className="relationship-desc">{rel.description}</div>}
              <div className="relationship-meta">
                <span className="confidence-small">
                  {Math.round(rel.confidence_score * 100)}% Konfidenz
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Graph View =====
function GraphView({ dossierId, persons, relationships }) {
  return (
    <div className="graph-view">
      <div className="view-header">
        <h3>🕸️ Beziehungsgraph</h3>
      </div>

      <div className="graph-placeholder">
        <p>📊 Graph-Visualisierung</p>
        <p className="graph-hint">
          Diese Ansicht zeigt ein interaktives Netzwerk-Diagramm der Personen und ihrer Beziehungen.
        </p>
        <p className="graph-stats">
          {persons.length} Personen · {relationships.length} Beziehungen
        </p>
        <div className="graph-note">
          💡 <strong>Hinweis:</strong> Graph-Visualisierung mit D3.js oder Cytoscape.js wird in einem zukünftigen Update hinzugefügt.
        </div>
      </div>
    </div>
  )
}

export default ResearchPanel
