import Anthropic from '@anthropic-ai/sdk'

/**
 * Anthropic Claude API Adapter
 * Supports: Claude 3 Opus, Sonnet, Haiku
 */
export class AnthropicAdapter {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required')
    }

    this.client = new Anthropic({
      apiKey: apiKey
    })

    this.provider = 'anthropic'
  }

  /**
   * Chat completion with Claude
   * @param {object} config - Model configuration
   * @param {string} prompt - User prompt
   * @returns {Promise<object>} Response with text and metadata
   */
  async chat(config, prompt) {
    const {
      model = 'claude-3-sonnet-20240229',
      temperature = 0.7,
      maxTokens = 4000
    } = config

    const response = await this.client.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    return {
      text: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model,
      stopReason: response.stop_reason,
      provider: this.provider
    }
  }

  /**
   * Chat with system prompt (for specific tasks)
   * @param {object} config - Model configuration
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User prompt
   * @returns {Promise<object>} Response
   */
  async chatWithSystem(config, systemPrompt, userPrompt) {
    const {
      model = 'claude-3-sonnet-20240229',
      temperature = 0.7,
      maxTokens = 4000
    } = config

    const response = await this.client.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    return {
      text: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model,
      provider: this.provider
    }
  }

  /**
   * Stream chat responses (for long-form content)
   * @param {object} config - Model configuration
   * @param {string} prompt - User prompt
   * @param {function} onChunk - Callback for each chunk
   * @returns {Promise<object>} Final response
   */
  async streamChat(config, prompt, onChunk) {
    const {
      model = 'claude-3-sonnet-20240229',
      temperature = 0.7,
      maxTokens = 4000
    } = config

    let fullText = ''
    let usage = null

    const stream = await this.client.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        const text = chunk.delta.text
        fullText += text
        if (onChunk) {
          onChunk(text)
        }
      }

      if (chunk.type === 'message_stop') {
        usage = chunk.usage || {}
      }
    }

    return {
      text: fullText,
      usage: usage,
      model: model,
      provider: this.provider
    }
  }

  /**
   * Test API key validity
   * @returns {Promise<boolean>} True if key is valid
   */
  async testConnection() {
    try {
      // Simple test: create a minimal message
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307', // Cheapest model
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      })
      return true
    } catch (error) {
      if (error.status === 401) {
        return false // Invalid API key
      }
      throw error
    }
  }

  /**
   * Get available Claude models
   * @returns {Array} List of supported models
   */
  getAvailableModels() {
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        pricing: 'highest'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        contextWindow: 200000,
        pricing: 'medium'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        contextWindow: 200000,
        pricing: 'lowest'
      }
    ]
  }
}

export default AnthropicAdapter
