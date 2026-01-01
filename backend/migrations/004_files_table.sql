-- Migration 004: File Management System
-- Native file storage with tagging support

-- ===== Enable UUID extension (if not already enabled) =====
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== Files Table =====
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL, -- Sanitized filename for storage
  original_name VARCHAR(255) NOT NULL, -- Original uploaded filename
  mime_type VARCHAR(100),
  size_bytes BIGINT, -- File size in bytes
  path VARCHAR(500) NOT NULL, -- Relative path in Docker volume
  tags TEXT[] DEFAULT '{}', -- Array of tags for categorization
  metadata JSONB DEFAULT '{}', -- Additional metadata (width, height, duration, etc.)
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Indexes =====
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at DESC);
CREATE INDEX idx_files_mime_type ON files(mime_type);
CREATE INDEX idx_files_tags ON files USING GIN(tags); -- GIN index for array operations

-- ===== Comments =====
COMMENT ON TABLE files IS 'Native file storage system with tagging';
COMMENT ON COLUMN files.id IS 'UUID for secure download links';
COMMENT ON COLUMN files.filename IS 'Sanitized filename on disk';
COMMENT ON COLUMN files.original_name IS 'Original filename from upload';
COMMENT ON COLUMN files.size_bytes IS 'File size in bytes';
COMMENT ON COLUMN files.path IS 'Relative path in upload volume';
COMMENT ON COLUMN files.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN files.metadata IS 'Additional file metadata (dimensions, duration, etc.)';

-- ===== Rollback SQL =====
-- DROP TABLE IF EXISTS files;
