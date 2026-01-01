-- Migration 002: AI Model Configuration System
-- Epic 3: Modulare KI-Steuerung (BYOM - Bring Your Own Model)

-- ===== AI Model Configs Table =====
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL, -- Nextcloud username (single source of truth)
  feature_name TEXT NOT NULL, -- 'transcription', 'summarize', 'correct', 'gpts', 'embedding', 'fact_check'
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
  model_name TEXT NOT NULL, -- 'gpt-4', 'claude-3-opus-20240229', 'gemini-pro'
  api_key_encrypted TEXT, -- User's own API key (AES-256-GCM encrypted)
  settings JSONB DEFAULT '{}', -- {temperature: 0.7, max_tokens: 2000, language: 'de'}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, feature_name)
);

-- ===== Indexes =====
CREATE INDEX idx_ai_configs_username ON ai_model_configs(username);
CREATE INDEX idx_ai_configs_feature ON ai_model_configs(feature_name);
CREATE INDEX idx_ai_configs_active ON ai_model_configs(is_active);

-- ===== Comments =====
COMMENT ON TABLE ai_model_configs IS 'User-specific AI model configurations per feature';
COMMENT ON COLUMN ai_model_configs.feature_name IS 'Feature identifier (transcription, summarize, correct, etc.)';
COMMENT ON COLUMN ai_model_configs.provider IS 'AI provider (openai, anthropic, google)';
COMMENT ON COLUMN ai_model_configs.api_key_encrypted IS 'Encrypted user API key (AES-256-GCM format: iv:authTag:ciphertext)';
COMMENT ON COLUMN ai_model_configs.settings IS 'Model-specific settings (temperature, max_tokens, etc.)';

-- ===== Default Feature Names =====
-- These are the supported feature names in the system:
-- 'transcription' - Audio transcription (Whisper)
-- 'summarize' - Text summarization (Claude/GPT/Gemini)
-- 'correct' - Grammar/spelling correction (Gemini)
-- 'gpts' - MDR GPTs integration (ChatGPT)
-- 'embedding' - Text embeddings for RAG (OpenAI ada-002)
-- 'fact_check' - Fact-checking (future)
-- 'entity_extraction' - Named Entity Recognition (future)

-- ===== Usage Tracking Table (optional) =====
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL, -- Nextcloud username
  feature_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  response_time_ms INTEGER, -- Response time in milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_username ON ai_usage_logs(username);
CREATE INDEX idx_ai_logs_created ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_logs_feature ON ai_usage_logs(feature_name);

COMMENT ON TABLE ai_usage_logs IS 'Track AI API usage for analytics and billing';
COMMENT ON COLUMN ai_usage_logs.response_time_ms IS 'API response time for performance monitoring';

-- ===== Updated At Trigger =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_configs_updated_at
  BEFORE UPDATE ON ai_model_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== Sample Data (Development Only) =====
-- Uncomment for development environment

-- INSERT INTO ai_model_configs (username, feature_name, provider, model_name, settings)
-- VALUES
--   ('admin', 'summarize', 'openai', 'gpt-4', '{"temperature": 0.7, "max_tokens": 2000}'),
--   ('admin', 'correct', 'google', 'gemini-pro', '{"temperature": 0.3, "max_tokens": 1500}'),
--   ('admin', 'transcription', 'openai', 'whisper-1', '{"language": "de"}');

-- ===== Rollback SQL =====
-- DROP TRIGGER IF EXISTS update_ai_configs_updated_at ON ai_model_configs;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS ai_usage_logs;
-- DROP TABLE IF EXISTS ai_model_configs;
