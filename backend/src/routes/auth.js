/**
 * Authentication Routes - Native User Management
 * Replaces Nextcloud authentication with bcrypt-based auth
 */

import express from 'express'
import bcrypt from 'bcrypt'
import postgresService from '../services/postgresService.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Salt rounds for bcrypt
const SALT_ROUNDS = 10

/**
 * GET /api/auth/needs-setup
 * Check if initial setup is needed (no users exist)
 */
router.get('/needs-setup', async (req, res) => {
  try {
    const result = await postgresService.query(
      'SELECT COUNT(*) as count FROM users'
    )

    const userCount = parseInt(result.rows[0].count)
    const needsSetup = userCount === 0

    res.json({
      needsSetup: needsSetup,
      message: needsSetup
        ? 'No users found. Please create an initial admin account.'
        : 'System is already set up.'
    })
  } catch (error) {
    console.error('Needs setup check error:', error)
    // If table doesn't exist yet, assume setup is needed
    res.json({
      needsSetup: true,
      message: 'Database not initialized. Please create an initial admin account.'
    })
  }
})

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
    let { username, displayName, email, password, role } = req.body

    // Validate required fields
    if (!username || !displayName || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username, display name, email, and password are required'
      })
    }

    // Check if this is the first user (initial setup)
    const countResult = await postgresService.query(
      'SELECT COUNT(*) as count FROM users'
    )
    const userCount = parseInt(countResult.rows[0].count)
    const isFirstUser = userCount === 0

    // First user is automatically admin, others default to 'autor'
    if (isFirstUser) {
      role = 'admin'
      console.log('🎯 Creating first user as admin')
    } else if (!role) {
      role = 'autor'
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
    if (!['admin', 'autor'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be either "admin" or "autor"'
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
      `INSERT INTO users (username, display_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, display_name, email, role, created_at`,
      [username, displayName, email, password_hash, role]
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
        displayName: user.display_name,
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
      `SELECT id, username, display_name, email, password_hash, role, created_at
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
        displayName: user.display_name,
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
      `SELECT id, username, display_name, email, role, created_at, last_login_at
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
        displayName: user.display_name,
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

// ===== User Management Routes (Admin only) =====

/**
 * Middleware: Require admin role
 */
function requireAdmin(req, res, next) {
  if (!req.session?.authenticated || req.session?.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    })
  }
  next()
}

/**
 * GET /api/auth/users
 * List all users (Admin only)
 *
 * Query params:
 * - role: Filter by role (optional)
 * - search: Search in username/email (optional)
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { role, search } = req.query

    let queryText = `
      SELECT id, username, display_name, email, role, created_at, last_login_at
      FROM users
      WHERE 1=1
    `
    const params = []
    let paramIndex = 1

    if (role) {
      queryText += ` AND role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    if (search) {
      queryText += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    queryText += ' ORDER BY created_at DESC'

    const result = await postgresService.query(queryText, params)

    res.json({
      success: true,
      users: result.rows.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        last_login_at: user.last_login_at
      }))
    })
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({
      error: 'Failed to list users',
      message: error.message
    })
  }
})

/**
 * GET /api/auth/users/:id
 * Get specific user (Admin only)
 */
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    const result = await postgresService.query(
      `SELECT id, username, display_name, email, role, created_at, updated_at, last_login_at
       FROM users
       WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user with this ID exists'
      })
    }

    const user = result.rows[0]

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    })
  }
})

/**
 * PUT /api/auth/users/:id
 * Update user (Admin only)
 *
 * Body:
 * {
 *   "displayName": "New Name",
 *   "email": "new@email.com",
 *   "role": "autor"
 * }
 */
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id
    const { displayName, email, role } = req.body

    // Build update query dynamically
    const updates = []
    const params = []
    let paramIndex = 1

    if (displayName !== undefined) {
      updates.push(`display_name = $${paramIndex}`)
      params.push(displayName)
      paramIndex++
    }

    if (email !== undefined) {
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          error: 'Invalid email',
          message: 'Please provide a valid email address'
        })
      }
      updates.push(`email = $${paramIndex}`)
      params.push(email)
      paramIndex++
    }

    if (role !== undefined) {
      // Validate role
      if (!['admin', 'autor'].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: 'Role must be either "admin" or "autor"'
        })
      }
      updates.push(`role = $${paramIndex}`)
      params.push(role)
      paramIndex++
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Provide at least one field to update'
      })
    }

    updates.push(`updated_at = NOW()`)
    params.push(userId)

    const queryText = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, display_name, email, role, updated_at
    `

    const result = await postgresService.query(queryText, params)

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user with this ID exists'
      })
    }

    const user = result.rows[0]

    console.log(`✓ User ${user.username} updated by admin`)

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        updated_at: user.updated_at
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    })
  }
})

/**
 * DELETE /api/auth/users/:id
 * Delete user (Admin only)
 * Note: Cannot delete yourself
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    // Prevent self-deletion
    if (parseInt(userId) === req.session.userId) {
      return res.status(400).json({
        error: 'Cannot delete yourself',
        message: 'You cannot delete your own account'
      })
    }

    const result = await postgresService.query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user with this ID exists'
      })
    }

    const deletedUsername = result.rows[0].username

    console.log(`✓ User ${deletedUsername} deleted by admin`)

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    })
  }
})

/**
 * POST /api/auth/change-password
 * Change user's password
 *
 * Body:
 * {
 *   "currentPassword": "OldPassword123",
 *   "newPassword": "NewPassword456"
 * }
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'Current password and new password are required'
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'New password must be at least 8 characters long'
      })
    }

    // Get current user
    const userResult = await postgresService.query(
      'SELECT id, password_hash FROM users WHERE username = $1',
      [req.session.user.username]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      })
    }

    const user = userResult.rows[0]

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update password
    await postgresService.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, user.id]
    )

    console.log(`✓ Password changed for user: ${req.session.user.username}`)

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      error: 'Failed to change password',
      message: error.message
    })
  }
})

export default router
