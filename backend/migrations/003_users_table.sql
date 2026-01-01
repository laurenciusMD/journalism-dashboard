-- Migration 003: User Management System
-- Native user authentication (replaces Nextcloud)

-- ===== Users Table =====
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'editor', -- 'admin', 'editor'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- ===== Indexes =====
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ===== Comments =====
COMMENT ON TABLE users IS 'Native user management system (replaces Nextcloud)';
COMMENT ON COLUMN users.username IS 'Unique username for login';
COMMENT ON COLUMN users.password_hash IS 'bcrypt password hash';
COMMENT ON COLUMN users.role IS 'User role: admin or editor';

-- ===== Updated At Trigger =====
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== Rollback SQL =====
-- DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- DROP TABLE IF EXISTS users;
