/**
 * Authentication Routes - Native User Management
 * Replaces Nextcloud authentication with bcrypt-based auth
 */

import express from 'express'
import bcrypt from 'bcrypt'
import postgresService from '../services/postgresService.js'

const router = express.Router()

// Salt rounds for bcrypt
const SALT_ROUNDS = 10

/**
 * POST /api/auth/register
 * Register a new user
 *
 * Body:
 * {
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "password": "SecurePassword123",
 *   "role": "editor" // optional, defaults to 'editor'
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'editor' } = req.body

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      })
    }

    // Validate username format (alphanumeric + underscore, 3-50 chars)
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'Username must be 3-50 characters (letters, numbers, underscore only)'
      })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      })
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters long'
      })
    }

    // Validate role
    if (!['admin', 'editor'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be either "admin" or "editor"'
      })
    }

    // Check if username already exists
    const existingUser = await postgresService.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Username taken',
        message: 'This username is already registered'
      })
    }

    // Check if email already exists
    const existingEmail = await postgresService.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        error: 'Email taken',
        message: 'This email is already registered'
      })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user
    const result = await postgresService.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, email, password_hash, role]
    )

    const user = result.rows[0]

    // Auto-login: Create session
    req.session.authenticated = true
    req.session.userId = user.id
    req.session.username = user.username
    req.session.role = user.role

    console.log(`✓ User ${username} registered successfully`)

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    })
  }
})

/**
 * POST /api/auth/login
 * Authenticate user with username/password
 *
 * Body:
 * {
 *   "username": "john_doe",
 *   "password": "SecurePassword123"
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      })
    }

    // Find user
    const result = await postgresService.query(
      `SELECT id, username, email, password_hash, role, created_at
       FROM users
       WHERE username = $1`,
      [username]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }

    const user = result.rows[0]

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }

    // Update last login
    await postgresService.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    )

    // Create session
    req.session.authenticated = true
    req.session.userId = user.id
    req.session.username = user.username
    req.session.role = user.role

    console.log(`✓ User ${username} logged in successfully`)

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    })
  }
})

/**
 * POST /api/auth/logout
 * Destroy user session
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err)
      return res.status(500).json({
        error: 'Logout failed',
        message: err.message
      })
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  })
})

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    if (!req.session?.authenticated || !req.session?.userId) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Please login first'
      })
    }

    const result = await postgresService.query(
      `SELECT id, username, email, role, created_at, last_login_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    )

    if (result.rows.length === 0) {
      // Session is stale, destroy it
      req.session.destroy()
      return res.status(401).json({
        error: 'Session invalid',
        message: 'Please login again'
      })
    }

    const user = result.rows[0]

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        last_login_at: user.last_login_at
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Failed to get user info',
      message: error.message
    })
  }
})

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({
      authenticated: true,
      username: req.session.username,
      role: req.session.role
    })
  } else {
    res.json({
      authenticated: false
    })
  }
})

export default router
