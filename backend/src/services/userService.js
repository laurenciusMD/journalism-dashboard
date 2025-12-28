import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - use /app/data for Docker persistence
const dbDir = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'users.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// User service functions
export const userService = {
  /**
   * Check if any user exists in the database
   * @returns {boolean}
   */
  hasAnyUser() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get();
    return result.count > 0;
  },

  /**
   * Create a new user
   * @param {string} username
   * @param {string} password
   * @param {string} email
   * @returns {object} Created user (without password)
   */
  async createUser(username, password, email = null) {
    // Validate input
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingUser = this.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const stmt = db.prepare(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)'
    );

    try {
      const result = stmt.run(username, passwordHash, email);

      return {
        id: result.lastInsertRowid,
        username,
        email,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Username already exists');
      }
      throw error;
    }
  },

  /**
   * Find user by username
   * @param {string} username
   * @returns {object|null}
   */
  findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },

  /**
   * Verify user credentials
   * @param {string} username
   * @param {string} password
   * @returns {Promise<object|null>} User object (without password) or null
   */
  async verifyCredentials(username, password) {
    const user = this.findByUsername(username);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Get user by ID
   * @param {number} id
   * @returns {object|null}
   */
  findById(id) {
    const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Update user password
   * @param {string} username
   * @param {string} newPassword
   * @returns {boolean}
   */
  async updatePassword(username, newPassword) {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const stmt = db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
    );

    const result = stmt.run(passwordHash, username);
    return result.changes > 0;
  },

  /**
   * Get total user count
   * @returns {number}
   */
  getUserCount() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get();
    return result.count;
  }
};

export default userService;
