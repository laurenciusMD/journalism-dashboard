import { useState } from 'react'
import '../styles/FileUpload.css'

function FileUpload({ dossierId, onUploadSuccess }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  // Load uploaded files
  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/upload/dossier/${dossierId}/files`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to load files')

      const data = await response.json()
      setUploadedFiles(data.files || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load files on mount
  useState(() => {
    loadFiles()
  }, [dossierId])

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...droppedFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`/api/upload/dossier/${dossierId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()

      setFiles([])
      await loadFiles()

      if (onUploadSuccess) {
        onUploadSuccess(data.media_assets)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId) => {
    if (!confirm('Datei wirklich löschen?')) return

    try {
      const response = await fetch(`/api/upload/file/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to delete file')

      await loadFiles()
    } catch (err) {
      setError(err.message)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="file-upload-container">
      <h3>📎 Dateien & Beweise</h3>

      {error && <div className="error-banner">❌ {error}</div>}

      {/* Upload Area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📁</div>
        <p className="upload-text">
          Dateien hierher ziehen oder{' '}
          <label htmlFor="file-input" className="file-input-label">
            durchsuchen
          </label>
        </p>
        <p className="upload-hint">
          Unterstützt: Bilder, Videos, PDFs, Dokumente (max. 100MB)
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileChange}
          className="file-input-hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="selected-files">
          <h4>Ausgewählte Dateien ({files.length})</h4>
          <div className="files-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  className="remove-file-btn"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="upload-actions">
            <button
              className="btn-secondary"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Alle entfernen
            </button>
            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? '⏳ Hochladen...' : `📤 ${files.length} Datei(en) hochladen`}
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      <div className="uploaded-files">
        <h4>Hochgeladene Dateien ({uploadedFiles.length})</h4>
        {loading ? (
          <div className="loading-spinner">⏳ Lädt Dateien...</div>
        ) : uploadedFiles.length === 0 ? (
          <div className="empty-state">
            <p>📂 Noch keine Dateien hochgeladen</p>
          </div>
        ) : (
          <div className="files-grid">
            {uploadedFiles.map(file => (
              <div key={file.id} className="uploaded-file-card">
                <div className="file-icon">
                  {file.file_type === 'image' ? '🖼️' :
                   file.file_type === 'video' ? '🎥' : '📄'}
                </div>
                <div className="file-details">
                  <div className="file-name">{file.file_name}</div>
                  <div className="file-meta">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploaded_at)}</span>
                  </div>
                  <div className="file-hash" title={file.sha256}>
                    SHA256: {file.sha256.substring(0, 16)}...
                  </div>
                </div>
                <button
                  className="delete-file-btn"
                  onClick={() => handleDelete(file.id)}
                  title="Datei löschen"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload
