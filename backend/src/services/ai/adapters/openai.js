import OpenAI from 'openai'

/**
 * OpenAI API Adapter
 * Supports: GPT-4, GPT-3.5, Whisper, DALL-E, Embeddings
 */
export class OpenAIAdapter {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }

    this.client = new OpenAI({
      apiKey: apiKey
    })

    this.provider = 'openai'
  }

  /**
   * Chat completion (GPT-4, GPT-3.5-turbo)
   * @param {object} config - Model configuration
   * @param {string} prompt - User prompt
   * @returns {Promise<object>} Response with text and metadata
   */
  async chat(config, prompt) {
    const { model = 'gpt-4', temperature = 0.7, maxTokens = 2000 } = config

    const response = await this.client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens
    })

    return {
      text: response.choices[0].message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      model: response.model,
      provider: this.provider
    }
  }

  /**
   * Generate embeddings (text-embedding-ada-002)
   * @param {string} text - Text to embed
   * @returns {Promise<object>} Embedding vector
   */
  async embed(text) {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    })

    return {
      embedding: response.data[0].embedding,
      dimensions: response.data[0].embedding.length,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens
      },
      provider: this.provider
    }
  }

  /**
   * Transcribe audio (Whisper)
   * @param {string} audioFilePath - Path to audio file
   * @param {object} config - Transcription config
   * @returns {Promise<object>} Transcript
   */
  async transcribe(audioFilePath, config = {}) {
    const { language = 'de', prompt = '' } = config

    const response = await this.client.audio.transcriptions.create({
      file: audioFilePath,
      model: 'whisper-1',
      language: language,
      prompt: prompt,
      response_format: 'verbose_json' // Includes timestamps
    })

    return {
      text: response.text,
      segments: response.segments || [],
      language: response.language,
      duration: response.duration,
      provider: this.provider
    }
  }

  /**
   * Test API key validity
   * @returns {Promise<boolean>} True if key is valid
   */
  async testConnection() {
    try {
      // Simple test: list available models
      await this.client.models.list()
      return true
    } catch (error) {
      if (error.status === 401) {
        return false // Invalid API key
      }
      throw error
    }
  }

  /**
   * Get available models
   * @returns {Promise<Array>} List of model IDs
   */
  async getAvailableModels() {
    const response = await this.client.models.list()
    return response.data
      .filter(m => m.id.startsWith('gpt-') || m.id.includes('whisper'))
      .map(m => ({
        id: m.id,
        created: m.created,
        ownedBy: m.owned_by
      }))
  }
}

export default OpenAIAdapter
