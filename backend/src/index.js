import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { requireAuth } from './middleware/auth.js';
import postgresService from './services/postgresService.js';

// Import routes
import authRouter from './routes/auth.js';
import filesRouter from './routes/files.js';
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

// ===== Public API Routes =====

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Quill API is running',
    version: APP_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: APP_VERSION,
    name: 'Quill - Journalism Research Platform',
    backend: packageJson.version,
    timestamp: new Date().toISOString()
  });
});

// ===== Authentication Routes =====
app.use('/api/auth', authRouter);

// ===== Protected API Routes (require authentication) =====

// File Management Routes
app.use('/api/files', filesRouter);

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

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
async function startServer() {
  try {
    console.log('Initializing PostgreSQL connection...');
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
║   Features:                                          ║
║   ✓ Native User Management                           ║
║   ✓ Native File Storage                              ║
║   ✓ PostgreSQL Database                              ║
║   ✓ Session-based Authentication                     ║
║                                                       ║
║   AI Integration ready:                              ║
║   ✓ Claude AI                                        ║
║   ✓ Google Gemini                                    ║
║   ✓ OpenAI ChatGPT                                   ║
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
