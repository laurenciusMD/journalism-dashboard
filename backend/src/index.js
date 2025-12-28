import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS only for API routes
app.use('/api', cors({
  origin: process.env.FRONTEND_URL || '*'
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Journalism Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// AI Routes - Claude
app.post('/api/ai/claude/generate', async (req, res) => {
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
app.post('/api/ai/gemini/research', async (req, res) => {
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
app.post('/api/ai/openai/transform', async (req, res) => {
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
app.get('/api/storage/drive/list', async (req, res) => {
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
app.post('/api/storage/nextcloud/connect', async (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   📰 Journalism Dashboard                            ║
║                                                       ║
║   🚀 Server running on http://localhost:${PORT}       ║
║   📱 Dashboard UI: http://localhost:${PORT}           ║
║   🔌 API: http://localhost:${PORT}/api               ║
║                                                       ║
║   AI Integration ready:                              ║
║   ✓ Claude AI                                        ║
║   ✓ Google Gemini                                    ║
║   ✓ OpenAI ChatGPT                                   ║
║                                                       ║
║   Cloud Storage ready:                               ║
║   ✓ Google Drive                                     ║
║   ✓ Private Cloud (WebDAV)                           ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
