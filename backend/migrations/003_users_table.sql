-- Migration 003: Users Table for Nextcloud Integration
-- Maps Nextcloud usernames to internal user IDs for AI configs

-- ===== Users Table =====
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL, -- Nextcloud username
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- ===== Indexes =====
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);

-- ===== Comments =====
COMMENT ON TABLE users IS 'Internal user table mapped to Nextcloud users';
COMMENT ON COLUMN users.username IS 'Nextcloud username (unique identifier)';
COMMENT ON COLUMN users.display_name IS 'User display name from Nextcloud';
COMMENT ON COLUMN users.last_login_at IS 'Last successful login timestamp';

-- ===== Updated At Trigger =====
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== Helper Function: Get or Create User =====
CREATE OR REPLACE FUNCTION get_or_create_user(p_username TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_user_id INTEGER;
BEGIN
  -- Try to get existing user
  SELECT id INTO v_user_id FROM users WHERE username = p_username;

  -- If not found, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (username, last_login_at)
    VALUES (p_username, NOW())
    RETURNING id INTO v_user_id;
  ELSE
    -- Update last login
    UPDATE users SET last_login_at = NOW() WHERE id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_user IS 'Get user ID by username, creating user if not exists';

-- ===== Rollback SQL =====
-- DROP FUNCTION IF EXISTS get_or_create_user(TEXT);
-- DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- DROP TABLE IF EXISTS users;
