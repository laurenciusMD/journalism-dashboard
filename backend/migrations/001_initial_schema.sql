-- Journalism Dashboard - Initial Database Schema
-- Person-centric investigation database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- ===== CORE TABLES =====

-- Dossiers (Investigation Cases)
CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- active, archived, closed
  created_by UUID, -- References users table in SQLite (external)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for status queries
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_created_at ON dossiers(created_at DESC);

-- ===== PERSON MANAGEMENT =====

-- Persons (Canonical Entities)
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  canonical_name TEXT NOT NULL,
  aliases TEXT[], -- Array of alternative names
  description TEXT,
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  merged_from UUID[], -- Array of person IDs that were merged into this one
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for person queries
CREATE INDEX idx_persons_dossier ON persons(dossier_id);
CREATE INDEX idx_persons_name ON persons USING gin(canonical_name gin_trgm_ops);
CREATE INDEX idx_persons_aliases ON persons USING gin(aliases);

-- Person Attributes (with Evidence Linking)
CREATE TABLE person_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  attribute_type TEXT NOT NULL, -- email, phone, address, role, affiliation, etc.
  attribute_value TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  valid_from DATE,
  valid_to DATE,
  source_type TEXT, -- osint, manual, document, interview
  evidence_refs UUID[], -- Links to evidence_items
  notes TEXT,
  created_by UUID, -- External reference to users
  created_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT false
);

-- Create indexes for attribute queries
CREATE INDEX idx_person_attributes_person ON person_attributes(person_id);
CREATE INDEX idx_person_attributes_type ON person_attributes(attribute_type);
CREATE INDEX idx_person_attributes_verified ON person_attributes(verified);

-- Person Relationships
CREATE TABLE person_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  person_a_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  person_b_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- colleague, family, business_partner, adversary
  description TEXT,
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_refs UUID[],
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicate relationships
  CONSTRAINT unique_relationship UNIQUE (person_a_id, person_b_id, relationship_type),
  -- Ensure person_a and person_b are different
  CONSTRAINT different_persons CHECK (person_a_id != person_b_id)
);

-- Create indexes for relationship queries
CREATE INDEX idx_relationships_dossier ON person_relationships(dossier_id);
CREATE INDEX idx_relationships_person_a ON person_relationships(person_a_id);
CREATE INDEX idx_relationships_person_b ON person_relationships(person_b_id);
CREATE INDEX idx_relationships_type ON person_relationships(relationship_type);

-- ===== MEDIA MANAGEMENT =====

-- Media Assets (Images, Videos, Audio)
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  sha256 TEXT UNIQUE NOT NULL, -- For deduplication
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- For video/audio

  -- EXIF/Metadata
  captured_at TIMESTAMP,
  camera_model TEXT,
  gps_latitude FLOAT,
  gps_longitude FLOAT,
  metadata JSONB, -- Complete EXIF data

  -- Provenance
  source_url TEXT,
  uploaded_by UUID, -- External reference to users
  upload_method TEXT, -- url_download, manual_upload, osint_tool
  uploaded_at TIMESTAMP DEFAULT NOW(),

  -- Organization
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for media queries
CREATE INDEX idx_media_dossier ON media_assets(dossier_id);
CREATE INDEX idx_media_type ON media_assets(file_type);
CREATE INDEX idx_media_sha256 ON media_assets(sha256);
CREATE INDEX idx_media_captured_at ON media_assets(captured_at);
CREATE INDEX idx_media_tags ON media_assets USING gin(tags);

-- Detected Faces (Detection, NOT Recognition)
CREATE TABLE detected_faces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,

  -- Bounding Box (coordinates in pixels)
  bbox_x INTEGER NOT NULL,
  bbox_y INTEGER NOT NULL,
  bbox_width INTEGER NOT NULL,
  bbox_height INTEGER NOT NULL,

  -- Detection Quality
  detection_confidence FLOAT CHECK (detection_confidence >= 0 AND detection_confidence <= 1),
  face_quality_score FLOAT CHECK (face_quality_score >= 0 AND face_quality_score <= 1),

  -- Face Crop (for review)
  crop_file_path TEXT,

  -- Status
  reviewed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for face queries
CREATE INDEX idx_faces_media ON detected_faces(media_asset_id);
CREATE INDEX idx_faces_reviewed ON detected_faces(reviewed);
CREATE INDEX idx_faces_quality ON detected_faces(face_quality_score DESC);

-- Face Annotations (Manual Face-to-Person Tagging)
CREATE TABLE face_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  detected_face_id UUID REFERENCES detected_faces(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,

  -- Metadata
  annotated_by UUID NOT NULL, -- External reference to users
  annotated_at TIMESTAMP DEFAULT NOW(),
  confidence TEXT CHECK (confidence IN ('certain', 'probable', 'uncertain')),
  notes TEXT,

  -- Prevent duplicate annotations
  CONSTRAINT unique_face_annotation UNIQUE (detected_face_id, person_id)
);

-- Create indexes for annotation queries
CREATE INDEX idx_annotations_face ON face_annotations(detected_face_id);
CREATE INDEX idx_annotations_person ON face_annotations(person_id);

-- Person-Media Linking (also without Face Detection)
CREATE TABLE person_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,

  -- Context
  appears_in_media BOOLEAN DEFAULT true,
  context TEXT, -- "Press conference 2023", "Meeting in Hamburg"
  timestamp_in_media INTEGER, -- Second in video where person appears

  -- Source
  tagged_by UUID, -- External reference to users
  tagged_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_person_media UNIQUE (person_id, media_asset_id)
);

-- Create indexes for person-media linking
CREATE INDEX idx_person_media_person ON person_media(person_id);
CREATE INDEX idx_person_media_media ON person_media(media_asset_id);

-- ===== OSINT & EVIDENCE =====

-- OSINT Tool Runs
CREATE TABLE tool_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL, -- theHarvester, SpiderFoot, Shodan
  tool_version TEXT,
  target TEXT NOT NULL,
  params JSONB,
  user_id UUID, -- External reference to users
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  exit_code INTEGER,
  raw_output_path TEXT,
  parsed_output JSONB,
  evidence_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for tool run queries
CREATE INDEX idx_tool_runs_dossier ON tool_runs(dossier_id);
CREATE INDEX idx_tool_runs_status ON tool_runs(status);
CREATE INDEX idx_tool_runs_tool ON tool_runs(tool_id);

-- Evidence Items
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  tool_run_id UUID REFERENCES tool_runs(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- email, domain, ip, breach, document
  value TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  sha256 TEXT, -- Hash of raw value
  retrieved_at TIMESTAMP NOT NULL,
  source_url TEXT,
  provenance TEXT, -- "SpiderFoot v4.0 via API on 2024-01-15"
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for evidence queries
CREATE INDEX idx_evidence_dossier ON evidence_items(dossier_id);
CREATE INDEX idx_evidence_type ON evidence_items(type);
CREATE INDEX idx_evidence_verified ON evidence_items(verified);

-- OSINT Findings (Inbox for Review)
CREATE TABLE osint_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  tool_run_id UUID REFERENCES tool_runs(id) ON DELETE SET NULL,

  -- What was found
  finding_type TEXT NOT NULL,
  finding_value TEXT NOT NULL,
  finding_context TEXT,

  -- Suggested mapping
  suggested_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'merged')),
  reviewed_by UUID, -- External reference to users
  reviewed_at TIMESTAMP,

  -- If accepted, link to created attribute
  person_attribute_id UUID REFERENCES person_attributes(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for findings queries
CREATE INDEX idx_findings_dossier ON osint_findings(dossier_id);
CREATE INDEX idx_findings_status ON osint_findings(status);
CREATE INDEX idx_findings_suggested_person ON osint_findings(suggested_person_id);

-- Person Merge Log (Deduplication History)
CREATE TABLE person_merge_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  primary_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  merged_person_id UUID NOT NULL, -- Was removed (ID kept in merged_from array)
  reason TEXT,
  merged_by UUID, -- External reference to users
  merged_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for merge log
CREATE INDEX idx_merge_log_dossier ON person_merge_log(dossier_id);
CREATE INDEX idx_merge_log_primary ON person_merge_log(primary_person_id);

-- ===== SOURCES & EVENTS =====

-- Sources (from OSINT section of roadmap)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  type TEXT, -- web, document, interview, database
  url TEXT,
  title TEXT,
  author TEXT,
  published_at TIMESTAMP,
  retrieved_at TIMESTAMP NOT NULL,
  trustworthiness_score INTEGER CHECK (trustworthiness_score >= 1 AND trustworthiness_score <= 5),
  access_method TEXT, -- public, archive, foi_request
  notes TEXT,
  file_path TEXT,
  file_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for sources
CREATE INDEX idx_sources_dossier ON sources(dossier_id);
CREATE INDEX idx_sources_type ON sources(type);

-- Events (for timeline)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  event_date_precision TEXT CHECK (event_date_precision IN ('exact', 'month', 'year', 'circa')),
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  evidence TEXT[], -- Array of evidence IDs
  confidence TEXT CHECK (confidence IN ('confirmed', 'alleged', 'disputed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for events
CREATE INDEX idx_events_dossier ON events(dossier_id);
CREATE INDEX idx_events_date ON events(event_date);

-- ===== AUDIT LOG =====

-- Audit Log (for legal compliance and traceability)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID,
  user_id UUID, -- External reference to users
  action TEXT NOT NULL, -- tool_run, entity_created, evidence_added, etc.
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX idx_audit_dossier ON audit_log(dossier_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_action ON audit_log(action);

-- ===== TRIGGERS =====

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_dossiers_updated_at BEFORE UPDATE ON dossiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== INITIAL DATA =====

-- No initial data - will be created via API

COMMENT ON DATABASE journalism IS 'Journalism Dashboard - Investigation database for persons, media, and evidence management';
