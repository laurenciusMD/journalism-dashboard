/**
 * File Management Routes - Native File Storage
 * Upload, list, download, and manage files with tagging support
 */

import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import postgresService from '../services/postgresService.js'

const router = express.Router()

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '../../uploads')

// Ensure upload directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true })

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const basename = path.basename(file.originalname, ext)
    const sanitized = basename.replace(/[^a-zA-Z0-9_-]/g, '_')
    cb(null, sanitized + '-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Allow all file types for now (can restrict later)
    cb(null, true)
  }
})

/**
 * Auth middleware - Require authentication
 */
function requireAuth(req, res, next) {
  if (!req.session?.authenticated || !req.session?.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login first'
    })
  }
  next()
}

/**
 * POST /api/files/upload
 * Upload a file
 *
 * Multipart form data:
 * - file: The file to upload
 * - tags: Optional comma-separated tags (e.g., "document,investigation,2024")
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select a file to upload'
      })
    }

    const userId = req.session.userId
    const { tags = '' } = req.body

    // Parse tags
    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    // Store file info in database
    const result = await postgresService.query(
      `INSERT INTO files (user_id, filename, original_name, mime_type, size_bytes, path, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, filename, original_name, mime_type, size_bytes, tags, uploaded_at`,
      [
        userId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        path.relative(path.join(__dirname, '../..'), req.file.path),
        tagsArray
      ]
    )

    const fileRecord = result.rows[0]

    console.log(`✓ File uploaded: ${fileRecord.original_name} by user ${userId}`)

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        filename: fileRecord.original_name,
        mime_type: fileRecord.mime_type,
        size_bytes: fileRecord.size_bytes,
        size_mb: (fileRecord.size_bytes / (1024 * 1024)).toFixed(2),
        tags: fileRecord.tags,
        uploaded_at: fileRecord.uploaded_at
      }
    })
  } catch (error) {
    console.error('Upload error:', error)

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError)
      }
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    })
  }
})

/**
 * GET /api/files
 * List all files for the current user
 *
 * Query params:
 * - tag: Filter by tag (optional)
 * - search: Search in filename (optional)
 * - limit: Number of files to return (default: 100)
 * - offset: Pagination offset (default: 0)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const { tag, search, limit = 100, offset = 0 } = req.query

    let queryText = `
      SELECT id, filename, original_name, mime_type, size_bytes, tags, uploaded_at
      FROM files
      WHERE user_id = $1
    `
    const params = [userId]
    let paramIndex = 2

    // Filter by tag
    if (tag) {
      queryText += ` AND $${paramIndex} = ANY(tags)`
      params.push(tag)
      paramIndex++
    }

    // Search in filename
    if (search) {
      queryText += ` AND original_name ILIKE $${paramIndex}`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Order and pagination
    queryText += ` ORDER BY uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(parseInt(limit), parseInt(offset))

    const result = await postgresService.query(queryText, params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM files WHERE user_id = $1'
    const countParams = [userId]
    let countParamIndex = 2

    if (tag) {
      countQuery += ` AND $${countParamIndex} = ANY(tags)`
      countParams.push(tag)
      countParamIndex++
    }

    if (search) {
      countQuery += ` AND original_name ILIKE $${countParamIndex}`
      countParams.push(`%${search}%`)
    }

    const countResult = await postgresService.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    // Format files
    const files = result.rows.map(file => ({
      id: file.id,
      filename: file.original_name,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      size_mb: (file.size_bytes / (1024 * 1024)).toFixed(2),
      tags: file.tags,
      uploaded_at: file.uploaded_at
    }))

    res.json({
      success: true,
      files: files,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + files.length < total
      }
    })
  } catch (error) {
    console.error('List files error:', error)
    res.status(500).json({
      error: 'Failed to list files',
      message: error.message
    })
  }
})

/**
 * GET /api/files/download/:id
 * Download a file by ID
 */
router.get('/download/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const fileId = req.params.id

    // Get file info
    const result = await postgresService.query(
      `SELECT filename, original_name, mime_type, path
       FROM files
       WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'File not found',
        message: 'File does not exist or you do not have permission to access it'
      })
    }

    const file = result.rows[0]
    const filePath = path.join(__dirname, '../..', file.path)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch (err) {
      console.error('File not found on disk:', filePath)
      return res.status(404).json({
        error: 'File not found on disk',
        message: 'The file record exists but the file is missing'
      })
    }

    // Set headers and send file
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`)

    res.sendFile(filePath)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({
      error: 'Download failed',
      message: error.message
    })
  }
})

/**
 * DELETE /api/files/:id
 * Delete a file
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const fileId = req.params.id

    // Get file info
    const result = await postgresService.query(
      `SELECT filename, path
       FROM files
       WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'File not found',
        message: 'File does not exist or you do not have permission to delete it'
      })
    }

    const file = result.rows[0]
    const filePath = path.join(__dirname, '../..', file.path)

    // Delete from database
    await postgresService.query(
      'DELETE FROM files WHERE id = $1 AND user_id = $2',
      [fileId, userId]
    )

    // Delete from disk
    try {
      await fs.unlink(filePath)
      console.log(`✓ File deleted: ${file.filename} by user ${userId}`)
    } catch (err) {
      console.warn('File not found on disk, but removed from database:', filePath)
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({
      error: 'Delete failed',
      message: error.message
    })
  }
})

/**
 * PUT /api/files/:id/tags
 * Update file tags
 *
 * Body:
 * {
 *   "tags": ["document", "investigation", "2024"]
 * }
 */
router.put('/:id/tags', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const fileId = req.params.id
    const { tags } = req.body

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        error: 'Invalid tags',
        message: 'Tags must be an array'
      })
    }

    // Sanitize tags
    const sanitizedTags = tags
      .map(t => String(t).trim())
      .filter(t => t.length > 0)

    // Update tags
    const result = await postgresService.query(
      `UPDATE files
       SET tags = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, original_name, tags`,
      [sanitizedTags, fileId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'File not found',
        message: 'File does not exist or you do not have permission to update it'
      })
    }

    const file = result.rows[0]

    console.log(`✓ File tags updated: ${file.original_name}`)

    res.json({
      success: true,
      message: 'Tags updated successfully',
      file: {
        id: file.id,
        filename: file.original_name,
        tags: file.tags
      }
    })
  } catch (error) {
    console.error('Update tags error:', error)
    res.status(500).json({
      error: 'Failed to update tags',
      message: error.message
    })
  }
})

export default router
