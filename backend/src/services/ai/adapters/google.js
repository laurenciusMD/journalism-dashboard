import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Google Gemini API Adapter
 * Supports: Gemini Pro, Gemini Pro Vision
 */
export class GoogleAdapter {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Google API key is required')
    }

    this.client = new GoogleGenerativeAI(apiKey)
    this.provider = 'google'
  }

  /**
   * Chat completion with Gemini
   * @param {object} config - Model configuration
   * @param {string} prompt - User prompt
   * @returns {Promise<object>} Response with text and metadata
   */
  async chat(config, prompt) {
    const {
      model = 'gemini-pro',
      temperature = 0.7,
      maxTokens = 2048
    } = config

    const genModel = this.client.getGenerativeModel({
      model: model
    })

    const generationConfig = {
      temperature: temperature,
      maxOutputTokens: maxTokens
    }

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: generationConfig
    })

    const response = result.response

    return {
      text: response.text(),
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0
      },
      model: model,
      provider: this.provider
    }
  }

  /**
   * Chat with conversation history
   * @param {object} config - Model configuration
   * @param {Array} messages - Conversation history [{role: 'user'|'model', content: '...'}]
   * @returns {Promise<object>} Response
   */
  async chatWithHistory(config, messages) {
    const {
      model = 'gemini-pro',
      temperature = 0.7,
      maxTokens = 2048
    } = config

    const genModel = this.client.getGenerativeModel({
      model: model
    })

    const chat = genModel.startChat({
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens
      },
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)

    return {
      text: result.response.text(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0
      },
      model: model,
      provider: this.provider
    }
  }

  /**
   * Stream chat responses
   * @param {object} config - Model configuration
   * @param {string} prompt - User prompt
   * @param {function} onChunk - Callback for each chunk
   * @returns {Promise<object>} Final response
   */
  async streamChat(config, prompt, onChunk) {
    const {
      model = 'gemini-pro',
      temperature = 0.7,
      maxTokens = 2048
    } = config

    const genModel = this.client.getGenerativeModel({
      model: model
    })

    const result = await genModel.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens
      }
    })

    let fullText = ''

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullText += chunkText
      if (onChunk) {
        onChunk(chunkText)
      }
    }

    const finalResponse = await result.response

    return {
      text: fullText,
      usage: {
        promptTokens: finalResponse.usageMetadata?.promptTokenCount || 0,
        completionTokens: finalResponse.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: finalResponse.usageMetadata?.totalTokenCount || 0
      },
      model: model,
      provider: this.provider
    }
  }

  /**
   * Analyze image with Gemini Pro Vision
   * @param {object} config - Model configuration
   * @param {string} prompt - User prompt
   * @param {string} imageData - Base64 encoded image
   * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
   * @returns {Promise<object>} Response
   */
  async analyzeImage(config, prompt, imageData, mimeType) {
    const genModel = this.client.getGenerativeModel({
      model: 'gemini-pro-vision'
    })

    const result = await genModel.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      }
    ])

    return {
      text: result.response.text(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0
      },
      model: 'gemini-pro-vision',
      provider: this.provider
    }
  }

  /**
   * Test API key validity
   * @returns {Promise<boolean>} True if key is valid
   */
  async testConnection() {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' })
      await model.generateContent('Hello')
      return true
    } catch (error) {
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        return false
      }
      throw error
    }
  }

  /**
   * Get available Gemini models
   * @returns {Array} List of supported models
   */
  getAvailableModels() {
    return [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        contextWindow: 32768,
        pricing: 'free-tier'
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        contextWindow: 16384,
        pricing: 'free-tier',
        capabilities: ['text', 'image']
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        contextWindow: 2000000,
        pricing: 'paid'
      }
    ]
  }
}

export default GoogleAdapter
