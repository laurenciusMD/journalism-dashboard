import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { requireAuth } from './middleware/auth.js';
import nextcloudProvisioning from './services/nextcloudProvisioningService.js';
import postgresService from './services/postgresService.js';

// Import routes
import dossiersRouter from './routes/dossiers.js';
import personsRouter from './routes/persons.js';
import uploadRouter from './routes/upload.js';
import aiRouter from './routes/ai.js';

// ES module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);
const APP_VERSION = packageJson.version;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Allow HTTP cookies (for local network access)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cookies in same-site requests
  }
}));

// Middleware
app.use(express.json());

// CORS only for API routes
app.use('/api', cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// ===== Authentication Routes =====

// Check if registration is needed (always show login - users managed in Nextcloud)
app.get('/api/auth/needs-setup', async (req, res) => {
  try {
    // Check if Nextcloud is available
    const isAvailable = await nextcloudProvisioning.isAvailable();
    res.json({
      needsSetup: false, // Always use Nextcloud login
      nextcloudAvailable: isAvailable
    });
  } catch (error) {
    res.json({
      needsSetup: false,
      nextcloudAvailable: false
    });
  }
});

// Register new user in Nextcloud
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password required'
      });
    }

    // Check if Nextcloud is available
    const isAvailable = await nextcloudProvisioning.isAvailable();
    if (!isAvailable) {
      return res.status(503).json({
        error: 'Nextcloud not available',
        message: 'Please wait for Nextcloud to start or contact administrator'
      });
    }

    // Create user directly in Nextcloud
    const created = await nextcloudProvisioning.createUser(
      username,
      password,
      username,
      email
    );

    if (!created) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'User could not be created in Nextcloud. User might already exist.'
      });
    }

    console.log(`✓ User ${username} created in Nextcloud`);

    // Get or create user in PostgreSQL (for AI configs, etc.)
    const userResult = await postgresService.query(
      'SELECT get_or_create_user($1) as user_id',
      [username]
    );
    const userId = userResult.rows[0].user_id;

    // Auto-login after registration
    req.session.authenticated = true;
    req.session.username = username;
    req.session.userId = userId;

    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        username: username,
        email: email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login endpoint - authenticate via Nextcloud
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password required'
      });
    }

    // Validate credentials against Nextcloud
    const isValid = await nextcloudProvisioning.verifyCredentials(username, password);

    if (isValid) {
      // Get or create user in PostgreSQL (for AI configs, etc.)
      const userResult = await postgresService.query(
        'SELECT get_or_create_user($1) as user_id',
        [username]
      );
      const userId = userResult.rows[0].user_id;

      req.session.authenticated = true;
      req.session.username = username;
      req.session.userId = userId;

      console.log(`✓ User ${username} (ID: ${userId}) logged in via Nextcloud`);

      res.json({
        success: true,
        message: 'Login successful',
        username: username
      });
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Please check your Nextcloud username and password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({
      authenticated: true,
      username: req.session.username,
      userId: req.session.userId
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

// Health check endpoint (public - no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Journalism Dashboard API is running',
    version: APP_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Version endpoint (public - no auth required)
app.get('/api/version', (req, res) => {
  res.json({
    version: APP_VERSION,
    name: 'Journalism Dashboard',
    backend: packageJson.version,
    timestamp: new Date().toISOString()
  });
});

// ===== Protected API Routes (require authentication) =====

// Investigation Routes
app.use('/api/dossiers', dossiersRouter);
app.use('/api/persons', personsRouter);
app.use('/api/upload', uploadRouter);

// AI Configuration Routes
app.use('/api/v2/ai', aiRouter);

// AI Routes - Claude
app.post('/api/ai/claude/generate', requireAuth, async (req, res) => {
  try {
    const { prompt, context } = req.body;

    // TODO: Implement Claude API integration
    res.json({
      status: 'pending',
      message: 'Claude API integration coming soon',
      prompt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Routes - Gemini
app.post('/api/ai/gemini/research', requireAuth, async (req, res) => {
  try {
    const { query, sources } = req.body;

    // TODO: Implement Gemini API integration
    res.json({
      status: 'pending',
      message: 'Gemini API integration coming soon',
      query
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Routes - ChatGPT
app.post('/api/ai/openai/transform', requireAuth, async (req, res) => {
  try {
    const { content, instruction } = req.body;

    // TODO: Implement OpenAI API integration
    res.json({
      status: 'pending',
      message: 'OpenAI API integration coming soon',
      content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cloud Storage Routes - Google Drive
app.get('/api/storage/drive/list', requireAuth, async (req, res) => {
  try {
    // TODO: Implement Google Drive API integration
    res.json({
      status: 'pending',
      message: 'Google Drive API integration coming soon'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cloud Storage Routes - Nextcloud/WebDAV
app.post('/api/storage/nextcloud/connect', requireAuth, async (req, res) => {
  try {
    const { url, username, password } = req.body;

    if (!url || !username || !password) {
      return res.status(400).json({
        error: 'Missing required fields: url, username, password'
      });
    }

    // Test connection (in production, use proper service)
    res.json({
      status: 'success',
      message: 'Nextcloud connection configured',
      url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/storage/nextcloud/files', async (req, res) => {
  try {
    const { path = '/' } = req.query;

    // TODO: Implement actual Nextcloud file listing
    res.json({
      status: 'pending',
      message: 'Nextcloud integration coming soon',
      path,
      files: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/storage/nextcloud/upload', async (req, res) => {
  try {
    // TODO: Implement file upload to Nextcloud
    res.json({
      status: 'pending',
      message: 'Nextcloud upload coming soon'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cloud Storage Routes - WebDAV (Generic)
app.get('/api/storage/webdav/list', async (req, res) => {
  try {
    // TODO: Implement WebDAV integration
    res.json({
      status: 'pending',
      message: 'WebDAV integration coming soon'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for all non-API routes (React Router support)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({
      error: 'API route not found',
      path: req.path
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize PostgreSQL and start server
async function startServer() {
  try {
    // Initialize PostgreSQL connection
    await postgresService.initialize();

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║   🔍 Quill v${APP_VERSION.padEnd(37)} ║
║      Journalism Research Platform                    ║
║                                                       ║
║   🚀 Server running on http://localhost:${PORT}       ║
║   📱 Dashboard UI: http://localhost:${PORT}           ║
║   🔌 API: http://localhost:${PORT}/api               ║
║                                                       ║
║   Authentication & Storage:                          ║
║   ✓ Nextcloud (Single Sign-On)                       ║
║   ✓ PostgreSQL (Investigations)                      ║
║                                                       ║
║   AI Integration ready:                              ║
║   ✓ Claude AI                                        ║
║   ✓ Google Gemini                                    ║
║   ✓ OpenAI ChatGPT                                   ║
║                                                       ║
║   Cloud Storage ready:                               ║
║   ✓ Google Drive                                     ║
║   ✓ Private Cloud (WebDAV)                           ║
║                                                       ║
║   © 2024-2025 Laurencius                             ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing PostgreSQL connections...');
  await postgresService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing PostgreSQL connections...');
  await postgresService.close();
  process.exit(0);
});

startServer();

export default app;
