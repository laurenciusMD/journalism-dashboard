import { useState } from 'react'

function TextFileReader({ onFileContent }) {
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)

  const extractTextFromFile = async (file) => {
    setProcessing(true)
    try {
      const fileType = file.type
      const fileName = file.name.toLowerCase()

      // Handle text-based files
      if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const text = await file.text()
        onFileContent(text, file.name)
        return
      }

      // Handle PDF (basic text extraction - may not work for all PDFs)
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const text = await extractPDFText(arrayBuffer)
        onFileContent(text || `[PDF-Datei: ${file.name}]\nHinweis: Automatische PDF-Textextraktion nicht verfügbar. Bitte Text manuell kopieren.`, file.name)
        return
      }

      // Handle Word documents
      if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
          fileType === 'application/msword' ||
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        onFileContent(`[Word-Dokument: ${file.name}]\nHinweis: Automatische Word-Textextraktion nicht verfügbar. Bitte Text manuell kopieren.`, file.name)
        return
      }

      // Unsupported file type
      alert(`Dateityp nicht unterstützt: ${file.type || 'unbekannt'}`)
    } catch (err) {
      console.error('File processing error:', err)
      alert(`Fehler beim Verarbeiten der Datei: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  // Basic PDF text extraction (limited functionality)
  const extractPDFText = async (arrayBuffer) => {
    try {
      const uint8Array = new Uint8Array(arrayBuffer)
      const text = new TextDecoder('utf-8').decode(uint8Array)
      return text
    } catch {
      return null
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      extractTextFromFile(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
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

    const file = e.dataTransfer.files[0]
    if (file) {
      extractTextFromFile(file)
    }
  }

  return (
    <div
      className={`text-file-reader ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        border: '2px dashed #7FC1CC',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        textAlign: 'center',
        background: dragActive ? 'rgba(127, 193, 204, 0.1)' : '#f9f9f9',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {processing ? '⏳' : '📎'}
      </div>
      <p style={{ margin: '0.5rem 0', color: '#333', fontSize: '0.95rem' }}>
        {processing ? 'Datei wird verarbeitet...' : (
          <>
            Datei hierher ziehen oder{' '}
            <label htmlFor="text-file-input" style={{ color: '#7FC1CC', cursor: 'pointer', textDecoration: 'underline' }}>
              durchsuchen
            </label>
          </>
        )}
      </p>
      <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.85rem' }}>
        Unterstützt: TXT, MD, PDF, DOC, DOCX
      </p>
      <input
        id="text-file-input"
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".txt,.md,.pdf,.doc,.docx,text/*"
        disabled={processing}
      />
    </div>
  )
}

export default TextFileReader
