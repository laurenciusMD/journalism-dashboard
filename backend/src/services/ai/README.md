# AI Router System - Epic 3: Modulare KI-Steuerung

BYOM (Bring Your Own Model) - User-configurable AI models per feature.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Router                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  getUserConfig(userId, feature)                      │  │
│  │  → Check PostgreSQL for user's model preference      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  getApiKey(provider, userConfig)                     │  │
│  │  1. Try user's encrypted API key                     │  │
│  │  2. Fallback to system API key from .env             │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  createAdapter(provider, apiKey)                     │  │
│  │  → Returns provider-specific adapter instance        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────┬────────────────────┬─────────────────┐
        ↓                  ↓                    ↓
┌─────────────┐   ┌─────────────────┐   ┌──────────────┐
│  OpenAI     │   │   Anthropic     │   │   Google     │
│  Adapter    │   │   Adapter       │   │   Adapter    │
├─────────────┤   ├─────────────────┤   ├──────────────┤
│ • GPT-4     │   │ • Claude Opus   │   │ • Gemini Pro │
│ • GPT-3.5   │   │ • Claude Sonnet │   │ • Gemini 1.5 │
│ • Whisper   │   │ • Claude Haiku  │   │              │
│ • Embeddings│   │                 │   │              │
└─────────────┘   └─────────────────┘   └──────────────┘
```

## Features

### Feature-Based Configuration
Users can configure different AI models for different features:
- `transcription` - Audio transcription (Whisper)
- `summarize` - Text summarization (Claude/GPT/Gemini)
- `correct` - Grammar/spelling correction
- `embedding` - Text embeddings for RAG
- `fact_check` - Fact-checking (future)
- `entity_extraction` - Named Entity Recognition (future)

### Security
- **AES-256-GCM Encryption**: User API keys are encrypted before storage
- **Format**: `iv:authTag:ciphertext` (128 chars total)
- **Key Management**: System encryption key in environment variable

### API Key Priority
1. **User's API key** (encrypted in database)
2. **System API key** (from .env file)

## Setup

### 1. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Environment

Add to `.env`:
```env
# AI API Keys (System-wide defaults)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# Encryption Key (REQUIRED)
ENCRYPTION_KEY=38165c882c6eca3ed81ba1394d84111bef2dbfd26eebeb4db65d0a7e3b47bc6d
```

### 3. Run Migration

The migration runs automatically when PostgreSQL container starts. To run manually:

```bash
# If using Docker
docker exec -i journalism-postgres psql -U journalism -d journalism < backend/migrations/002_ai_model_configs.sql

# If using local PostgreSQL
psql -U journalism -d journalism < backend/migrations/002_ai_model_configs.sql
```

### 4. Restart Backend

```bash
npm run dev
```

## API Endpoints

### Get Available Models
```http
GET /api/v2/ai/models
```

**Response:**
```json
{
  "openai": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "contextWindow": 8192,
      "pricing": "high"
    }
  ],
  "anthropic": [...],
  "google": [...]
}
```

### Get User's AI Configurations
```http
GET /api/v2/ai/config
Authorization: Session
```

**Response:**
```json
{
  "configs": [
    {
      "feature_name": "summarize",
      "provider": "anthropic",
      "model_name": "claude-3-sonnet-20240229",
      "settings": {
        "temperature": 0.7,
        "max_tokens": 2000
      }
    }
  ]
}
```

### Update Configuration
```http
PUT /api/v2/ai/config/:feature
Content-Type: application/json
Authorization: Session

{
  "provider": "anthropic",
  "model": "claude-3-sonnet-20240229",
  "apiKey": "sk-ant-...",
  "settings": {
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

### Test API Key
```http
POST /api/v2/ai/test
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-..."
}
```

**Response:**
```json
{
  "valid": true,
  "message": "API key is valid"
}
```

### Get Usage Statistics
```http
GET /api/v2/ai/usage?days=30
Authorization: Session
```

**Response:**
```json
{
  "totalTokens": 15420,
  "totalCost": 0.42,
  "byFeature": {
    "summarize": {
      "calls": 15,
      "tokens": 12000,
      "avgResponseTime": 1250
    }
  }
}
```

## Usage in Code

### Using the AI Router

```javascript
import { aiRouter } from './services/ai/router.js'

// Summarize text
const result = await aiRouter.chat(
  userId,
  'summarize',
  'Please summarize: ...',
  { maxTokens: 500 }
)

console.log(result.text)
console.log(result.usage) // { promptTokens, completionTokens, totalTokens }

// Transcribe audio
const transcript = await aiRouter.transcribe(
  userId,
  '/path/to/audio.mp3',
  { language: 'de' }
)

console.log(transcript.text)

// Generate embeddings
const embedding = await aiRouter.embed(
  userId,
  'Text to embed'
)

console.log(embedding.vector) // [0.123, -0.456, ...]
```

### Direct Adapter Usage

```javascript
import OpenAIAdapter from './adapters/openai.js'

const adapter = new OpenAIAdapter(process.env.OPENAI_API_KEY)

const response = await adapter.chat({
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
}, 'Your prompt here')

console.log(response.text)
```

## Database Schema

### `ai_model_configs`
Stores user-specific AI model configurations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | External reference to SQLite users table |
| `feature_name` | TEXT | Feature identifier (transcription, summarize, etc.) |
| `provider` | TEXT | AI provider (openai, anthropic, google) |
| `model_name` | TEXT | Model identifier (gpt-4, claude-3-opus, etc.) |
| `api_key_encrypted` | TEXT | User's encrypted API key (AES-256-GCM) |
| `settings` | JSONB | Model settings (temperature, max_tokens, etc.) |
| `is_active` | BOOLEAN | Whether this config is active |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique constraint:** `(user_id, feature_name)`

### `ai_usage_logs`
Tracks AI API usage for analytics and billing.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | External reference to users |
| `feature_name` | TEXT | Feature used |
| `provider` | TEXT | Provider used |
| `model_name` | TEXT | Model used |
| `prompt_tokens` | INTEGER | Input tokens |
| `completion_tokens` | INTEGER | Output tokens |
| `total_tokens` | INTEGER | Total tokens |
| `response_time_ms` | INTEGER | API response time |
| `success` | BOOLEAN | Whether the call succeeded |
| `error_message` | TEXT | Error message if failed |
| `created_at` | TIMESTAMP | Call timestamp |

## Testing

### Test Encryption
```javascript
import { encrypt, decrypt, testEncryption } from './services/ai/encryption.js'

// Run self-test
testEncryption()

// Manual test
const encrypted = encrypt('my-secret-api-key')
console.log(encrypted) // iv:authTag:ciphertext

const decrypted = decrypt(encrypted)
console.log(decrypted) // my-secret-api-key
```

### Test Adapters
```javascript
import { aiRouter } from './services/ai/router.js'

// Test API key validity
const isValid = await aiRouter.testApiKey('openai', 'sk-...')
console.log(isValid) // true or false
```

## Default Models

| Provider | Feature | Default Model |
|----------|---------|---------------|
| OpenAI | summarize | gpt-4 |
| OpenAI | correct | gpt-3.5-turbo |
| OpenAI | transcription | whisper-1 |
| OpenAI | embedding | text-embedding-ada-002 |
| Anthropic | summarize | claude-3-sonnet-20240229 |
| Anthropic | correct | claude-3-haiku-20240307 |
| Google | summarize | gemini-pro |
| Google | correct | gemini-pro |

## Cost Estimation

| Model | Cost per 1K tokens | Use case |
|-------|-------------------|----------|
| GPT-4 | $0.03 (in) / $0.06 (out) | Complex summarization |
| GPT-3.5 Turbo | $0.001 (in) / $0.002 (out) | Simple corrections |
| Claude Opus | $0.015 (in) / $0.075 (out) | Premium analysis |
| Claude Sonnet | $0.003 (in) / $0.015 (out) | Balanced quality/cost |
| Claude Haiku | $0.00025 (in) / $0.00125 (out) | Fast, cheap tasks |
| Gemini Pro | Free tier available | Budget-friendly option |

## Troubleshooting

### Migration fails with "relation users does not exist"
- Users are stored in SQLite, not PostgreSQL
- Migration should not reference users table
- If error persists, check that foreign key constraint is removed

### Decryption fails
- Ensure `ENCRYPTION_KEY` is set in `.env`
- Key must be 64 hex characters (32 bytes)
- Do not change the key after encrypting data

### API calls fail with 401
- Check that API keys are valid
- Test with `/api/v2/ai/test` endpoint
- Verify user has configured their API key or system key exists

## Roadmap Integration

This is **Epic 3** from the Investigative Suite Architecture:

- ✅ Backend AI Router with Adapter Pattern
- ✅ AES-256-GCM Encryption for API keys
- ✅ Database schema and migration
- ✅ CRUD API endpoints
- ⏳ Frontend AI Settings Panel
- ⏳ Usage analytics dashboard
- ⏳ Cost tracking and alerts

## Next Steps

1. **Frontend**: Build React settings panel for AI configuration
2. **Integration**: Use AI router in transcription, summarization features
3. **Analytics**: Usage dashboard with cost estimation
4. **Monitoring**: Alert users when approaching API limits
