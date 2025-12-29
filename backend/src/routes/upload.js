/**
 * Upload Routes - File upload for dossiers and media
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import postgresService from '../services/postgresService.js';

const router = express.Router();

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Ensure upload directory exists
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/evidence';

// Configure multer storage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const dossierId = req.params.dossierId || 'general';
    const uploadPath = path.join(UPLOADS_DIR, dossierId);

    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${hash}${ext}`);
  }
});

// File filter - allow images, videos, documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|avi|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: images, videos, PDFs, documents'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: fileFilter
});

/**
 * POST /api/upload/dossier/:dossierId
 * Upload files to a dossier
 */
router.post('/dossier/:dossierId', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const { dossierId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify dossier exists
    const dossier = await postgresService.getDossier(dossierId);
    if (!dossier) {
      // Clean up uploaded files
      for (const file of files) {
        await fs.unlink(file.path).catch(() => {});
      }
      return res.status(404).json({ error: 'Dossier not found' });
    }

    // Create media asset records for each file
    const mediaAssets = [];
    for (const file of files) {
      // Calculate SHA256 hash
      const fileBuffer = await fs.readFile(file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const mediaAsset = {
        dossier_id: dossierId,
        file_type: file.mimetype.startsWith('image/') ? 'image' :
                   file.mimetype.startsWith('video/') ? 'video' : 'document',
        file_path: file.path,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        sha256: hash,
        uploaded_by: req.session.userId,
        upload_method: 'manual_upload'
      };

      // Insert into database
      const result = await postgresService.query(
        `INSERT INTO media_assets
         (dossier_id, file_type, file_path, file_name, file_size, mime_type, sha256, uploaded_by, upload_method, uploaded_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          mediaAsset.dossier_id,
          mediaAsset.file_type,
          mediaAsset.file_path,
          mediaAsset.file_name,
          mediaAsset.file_size,
          mediaAsset.mime_type,
          mediaAsset.sha256,
          mediaAsset.uploaded_by,
          mediaAsset.upload_method
        ]
      );

      mediaAssets.push(result.rows[0]);
    }

    res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      media_assets: mediaAssets
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    res.status(500).json({ error: error.message || 'Failed to upload files' });
  }
});

/**
 * GET /api/upload/dossier/:dossierId/files
 * List all uploaded files for a dossier
 */
router.get('/dossier/:dossierId/files', requireAuth, async (req, res) => {
  try {
    const { dossierId } = req.params;

    const result = await postgresService.query(
      `SELECT id, file_type, file_name, file_size, mime_type, sha256, uploaded_at, upload_method
       FROM media_assets
       WHERE dossier_id = $1
       ORDER BY uploaded_at DESC`,
      [dossierId]
    );

    res.json({
      files: result.rows
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * DELETE /api/upload/file/:fileId
 * Delete an uploaded file
 */
router.delete('/file/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file info
    const result = await postgresService.query(
      'SELECT file_path FROM media_assets WHERE id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = result.rows[0].file_path;

    // Delete from database
    await postgresService.query('DELETE FROM media_assets WHERE id = $1', [fileId]);

    // Delete physical file
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete physical file:', error);
    }

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
