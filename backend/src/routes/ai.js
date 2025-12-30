/**
 * AI Configuration Routes - Epic 3: Modulare KI-Steuerung
 * Manage user AI model configurations and API keys
 */

import express from 'express'
import { query } from '../services/postgresService.js'
import { encrypt, decrypt } from '../services/ai/encryption.js'
import { aiRouter } from '../services/ai/router.js'

const router = express.Router()

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

/**
 * GET /api/v2/ai/models
 * Get available AI models for all providers
 */
router.get('/models', requireAuth, async (req, res) => {
  try {
    const models = await aiRouter.getAvailableModels()

    res.json({
      success: true,
      models: models
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    res.status(500).json({
      error: 'Failed to fetch models',
      details: error.message
    })
  }
})

/**
 * GET /api/v2/ai/config
 * Get user's AI configuration for all features
 */
router.get('/config', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId

    const result = await query(
      `SELECT id, feature_name, provider, model_name, settings, is_active, created_at, updated_at
       FROM ai_model_configs
       WHERE user_id = $1
       ORDER BY feature_name`,
      [userId]
    )

    res.json({
      success: true,
      configs: result.rows
    })
  } catch (error) {
    console.error('Error fetching AI config:', error)
    res.status(500).json({
      error: 'Failed to fetch AI configuration',
      details: error.message
    })
  }
})

/**
 * GET /api/v2/ai/config/:feature
 * Get user's AI configuration for a specific feature
 */
router.get('/config/:feature', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const featureName = req.params.feature

    const result = await query(
      `SELECT id, feature_name, provider, model_name, settings, is_active, created_at, updated_at
       FROM ai_model_configs
       WHERE user_id = $1 AND feature_name = $2`,
      [userId, featureName]
    )

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        config: null,
        message: 'No configuration found for this feature'
      })
    }

    res.json({
      success: true,
      config: result.rows[0]
    })
  } catch (error) {
    console.error('Error fetching feature config:', error)
    res.status(500).json({
      error: 'Failed to fetch feature configuration',
      details: error.message
    })
  }
})

/**
 * PUT /api/v2/ai/config/:feature
 * Update or create AI configuration for a feature
 *
 * Body:
 * {
 *   "provider": "openai",
 *   "model": "gpt-4",
 *   "apiKey": "sk-...", // optional, if user wants to use own key
 *   "settings": {
 *     "temperature": 0.7,
 *     "max_tokens": 2000
 *   }
 * }
 */
router.put('/config/:feature', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const featureName = req.params.feature
    const { provider, model, apiKey, settings } = req.body

    // Validate required fields
    if (!provider || !model) {
      return res.status(400).json({
        error: 'Provider and model are required'
      })
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'google']
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      })
    }

    // Validate feature name
    const validFeatures = [
      'transcription',
      'summarize',
      'correct',
      'gpts',
      'embedding',
      'fact_check',
      'entity_extraction'
    ]
    if (!validFeatures.includes(featureName)) {
      return res.status(400).json({
        error: `Invalid feature name. Must be one of: ${validFeatures.join(', ')}`
      })
    }

    // Encrypt API key if provided
    let encryptedKey = null
    if (apiKey) {
      encryptedKey = encrypt(apiKey)
    }

    // Upsert configuration
    const result = await query(
      `INSERT INTO ai_model_configs (user_id, feature_name, provider, model_name, api_key_encrypted, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, feature_name)
       DO UPDATE SET
         provider = EXCLUDED.provider,
         model_name = EXCLUDED.model_name,
         api_key_encrypted = COALESCE(EXCLUDED.api_key_encrypted, ai_model_configs.api_key_encrypted),
         settings = EXCLUDED.settings,
         updated_at = NOW()
       RETURNING id, feature_name, provider, model_name, settings, is_active, created_at, updated_at`,
      [userId, featureName, provider, model, encryptedKey, JSON.stringify(settings || {})]
    )

    res.json({
      success: true,
      config: result.rows[0],
      message: 'Configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating AI config:', error)
    res.status(500).json({
      error: 'Failed to update configuration',
      details: error.message
    })
  }
})

/**
 * DELETE /api/v2/ai/config/:feature
 * Delete AI configuration for a feature (will use system defaults)
 */
router.delete('/config/:feature', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const featureName = req.params.feature

    await query(
      `DELETE FROM ai_model_configs
       WHERE user_id = $1 AND feature_name = $2`,
      [userId, featureName]
    )

    res.json({
      success: true,
      message: 'Configuration deleted. System defaults will be used.'
    })
  } catch (error) {
    console.error('Error deleting AI config:', error)
    res.status(500).json({
      error: 'Failed to delete configuration',
      details: error.message
    })
  }
})

/**
 * POST /api/v2/ai/test
 * Test API key validity for a provider
 *
 * Body:
 * {
 *   "provider": "openai",
 *   "apiKey": "sk-..."
 * }
 */
router.post('/test', requireAuth, async (req, res) => {
  try {
    const { provider, apiKey } = req.body

    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'Provider and apiKey are required'
      })
    }

    const isValid = await aiRouter.testApiKey(provider, apiKey)

    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'API key is valid' : 'API key is invalid'
    })
  } catch (error) {
    console.error('Error testing API key:', error)
    res.status(500).json({
      error: 'Failed to test API key',
      details: error.message,
      valid: false
    })
  }
})

/**
 * GET /api/v2/ai/usage
 * Get usage statistics for user
 *
 * Query params:
 * - feature: Filter by feature name (optional)
 * - days: Number of days to look back (default: 30)
 */
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const feature = req.query.feature
    const days = parseInt(req.query.days || '30')

    let queryText = `
      SELECT
        feature_name,
        provider,
        model_name,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(total_tokens) as total_tokens,
        AVG(response_time_ms) as avg_response_time_ms,
        COUNT(*) as request_count,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as error_count
      FROM ai_usage_logs
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '${days} days'
    `

    const params = [userId]

    if (feature) {
      queryText += ' AND feature_name = $2'
      params.push(feature)
    }

    queryText += ' GROUP BY feature_name, provider, model_name ORDER BY total_tokens DESC'

    const result = await query(queryText, params)

    res.json({
      success: true,
      usage: result.rows,
      period_days: days
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      details: error.message
    })
  }
})

export default router
