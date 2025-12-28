import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

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

// Cloud Storage Routes - WebDAV (Private Cloud)
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
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
║   📰 Journalism Dashboard API Server                 ║
║                                                       ║
║   🚀 Server running on http://localhost:${PORT}       ║
║   🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}      ║
║                                                       ║
║   Ready to connect with:                             ║
║   ✓ Claude AI                                        ║
║   ✓ Google Gemini                                    ║
║   ✓ OpenAI ChatGPT                                   ║
║   ✓ Google Drive                                     ║
║   ✓ Private Cloud (WebDAV)                           ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
