import { useState, useEffect } from 'react'
import './FilesPanel.css'

function FilesPanel() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files/list', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      } else {
        setError('Fehler beim Laden der Dateien')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Load files error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        loadFiles() // Reload file list
        e.target.value = '' // Reset input
      } else {
        const data = await response.json()
        setError(data.message || 'Fehler beim Hochladen')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await fetch(`/api/files/download/${fileId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Fehler beim Herunterladen')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Download error:', err)
    }
  }

  const handleDelete = async (fileId) => {
    if (!confirm('Möchten Sie diese Datei wirklich löschen?')) {
      return
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        loadFiles() // Reload file list
      } else {
        setError('Fehler beim Löschen')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      console.error('Delete error:', err)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType) => {
    if (!mimeType) return '📄'
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📕'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
    return '📄'
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>📁 Dateien</h2>
          <p className="panel-description">Hochgeladene Dateien und Dokumente</p>
        </div>
        <div className="upload-section">
          <label className="btn btn-primary upload-btn">
            {uploading ? '🔄 Wird hochgeladen...' : '⬆️ Datei hochladen'}
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Lade Dateien...</p>
        </div>
      ) : (
        <div className="files-grid">
          {files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>Keine Dateien vorhanden</h3>
              <p>Laden Sie Ihre erste Datei hoch, um loszulegen</p>
            </div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-icon">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="file-info">
                  <div className="file-name" title={file.original_name}>
                    {file.original_name}
                  </div>
                  <div className="file-meta">
                    <span>{formatFileSize(file.size_bytes)}</span>
                    <span>•</span>
                    <span>{new Date(file.uploaded_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  {file.tags && file.tags.length > 0 && (
                    <div className="file-tags">
                      {file.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="file-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleDownload(file.id, file.original_name)}
                    title="Herunterladen"
                  >
                    ⬇️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(file.id)}
                    title="Löschen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default FilesPanel
