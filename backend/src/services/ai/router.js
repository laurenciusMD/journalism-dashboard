import OpenAIAdapter from './adapters/openai.js'
import AnthropicAdapter from './adapters/anthropic.js'
import GoogleAdapter from './adapters/google.js'
import { decrypt } from './encryption.js'
import { query } from '../postgresService.js'

/**
 * AI Router Service
 * Routes AI requests to the appropriate provider based on user configuration
 */
export class AIRouter {
  constructor() {
    this.systemKeys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY
    }
  }

  /**
   * Get user's AI configuration for a specific feature
   * @param {number} userId - User ID
   * @param {string} featureName - Feature name (e.g., 'transcription', 'summarize')
   * @returns {Promise<object|null>} Configuration or null if not set
   */
  async getUserConfig(userId, featureName) {
    const result = await query(
      `SELECT * FROM ai_model_configs
       WHERE user_id = $1 AND feature_name = $2 AND is_active = true`,
      [userId, featureName]
    )

    return result.rows[0] || null
  }

  /**
   * Get API key for provider (user's key or system fallback)
   * @param {string} provider - Provider name ('openai', 'anthropic', 'google')
   * @param {object|null} userConfig - User configuration
   * @returns {string} API key
   */
  async getApiKey(provider, userConfig) {
    // 1. Try user's encrypted API key
    if (userConfig?.api_key_encrypted) {
      try {
        return decrypt(userConfig.api_key_encrypted)
      } catch (error) {
        console.error('Failed to decrypt user API key:', error)
        // Fall through to system key
      }
    }

    // 2. Fallback to system API key
    const systemKey = this.systemKeys[provider]
    if (!systemKey) {
      throw new Error(`No API key available for provider: ${provider}`)
    }

    return systemKey
  }

  /**
   * Create adapter instance for provider
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key
   * @returns {object} Adapter instance
   */
  createAdapter(provider, apiKey) {
    switch (provider) {
      case 'openai':
        return new OpenAIAdapter(apiKey)
      case 'anthropic':
        return new AnthropicAdapter(apiKey)
      case 'google':
        return new GoogleAdapter(apiKey)
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * Route a chat request to the appropriate provider
   * @param {number} userId - User ID
   * @param {string} featureName - Feature name
   * @param {string} prompt - User prompt
   * @param {object} options - Additional options
   * @returns {Promise<object>} Response from AI provider
   */
  async chat(userId, featureName, prompt, options = {}) {
    // Get user configuration
    const config = await this.getUserConfig(userId, featureName)

    // Determine provider and model
    const provider = config?.provider || 'openai'
    const model = config?.model_name || this.getDefaultModel(provider, featureName)

    // Get API key
    const apiKey = await this.getApiKey(provider, config)

    // Create adapter
    const adapter = this.createAdapter(provider, apiKey)

    // Merge settings
    const settings = {
      model: model,
      temperature: config?.settings?.temperature || 0.7,
      maxTokens: config?.settings?.max_tokens || 2000,
      ...options
    }

    // Execute request
    return await adapter.chat(settings, prompt)
  }

  /**
   * Route an embedding request
   * @param {number} userId - User ID
   * @param {string} text - Text to embed
   * @returns {Promise<object>} Embedding vector
   */
  async embed(userId, text) {
    const featureName = 'embedding'
    const config = await this.getUserConfig(userId, featureName)
    const provider = config?.provider || 'openai'

    const apiKey = await this.getApiKey(provider, config)
    const adapter = this.createAdapter(provider, apiKey)

    if (provider !== 'openai') {
      throw new Error('Currently only OpenAI embeddings are supported')
    }

    return await adapter.embed(text)
  }

  /**
   * Route a transcription request
   * @param {number} userId - User ID
   * @param {string} audioFilePath - Path to audio file
   * @param {object} options - Transcription options
   * @returns {Promise<object>} Transcript
   */
  async transcribe(userId, audioFilePath, options = {}) {
    const featureName = 'transcription'
    const config = await this.getUserConfig(userId, featureName)
    const provider = config?.provider || 'openai'

    const apiKey = await this.getApiKey(provider, config)
    const adapter = this.createAdapter(provider, apiKey)

    if (provider !== 'openai') {
      throw new Error('Currently only OpenAI Whisper is supported for transcription')
    }

    const settings = {
      language: config?.settings?.language || 'de',
      ...options
    }

    return await adapter.transcribe(audioFilePath, settings)
  }

  /**
   * Test API key validity for a provider
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  async testApiKey(provider, apiKey) {
    try {
      const adapter = this.createAdapter(provider, apiKey)
      return await adapter.testConnection()
    } catch (error) {
      console.error('API key test failed:', error)
      return false
    }
  }

  /**
   * Get default model for a feature
   * @param {string} provider - Provider name
   * @param {string} featureName - Feature name
   * @returns {string} Model name
   */
  getDefaultModel(provider, featureName) {
    const defaults = {
      openai: {
        summarize: 'gpt-4',
        correct: 'gpt-3.5-turbo',
        transcription: 'whisper-1',
        embedding: 'text-embedding-ada-002'
      },
      anthropic: {
        summarize: 'claude-3-sonnet-20240229',
        correct: 'claude-3-haiku-20240307'
      },
      google: {
        summarize: 'gemini-pro',
        correct: 'gemini-pro'
      }
    }

    return defaults[provider]?.[featureName] || defaults[provider]?.summarize
  }

  /**
   * Get all available models for all providers
   * @returns {Promise<object>} Models grouped by provider
   */
  async getAvailableModels() {
    const models = {
      openai: [
        { id: 'gpt-4', name: 'GPT-4', contextWindow: 8192, pricing: 'high' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, pricing: 'high' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16384, pricing: 'low' },
        { id: 'whisper-1', name: 'Whisper', type: 'transcription', pricing: 'low' }
      ],
      anthropic: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, pricing: 'high' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', contextWindow: 200000, pricing: 'medium' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextWindow: 200000, pricing: 'low' }
      ],
      google: [
        { id: 'gemini-pro', name: 'Gemini Pro', contextWindow: 32768, pricing: 'free-tier' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000, pricing: 'paid' }
      ]
    }

    return models
  }
}

// Singleton instance
export const aiRouter = new AIRouter()
