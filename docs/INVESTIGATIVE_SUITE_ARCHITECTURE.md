# Quill Investigative Suite - Technical Architecture Specification

**Version:** 1.0
**Date:** 30.12.2024
**Status:** Planning Phase
**Lead Architect:** AI-Assisted Design

---

## Executive Summary

Transformation von Quill von einem Content-Management-System zu einer vollwertigen **Investigative Journalism Intelligence Platform**. Sechs neue Module erweitern die Kernfunktionalität um Data Mining, Knowledge Graphs, Audio Intelligence und Fact-Checking.

---

## 1. System Architecture Overview (Text-Based Diagram)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          QUILL FRONTEND (React)                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Portfolio  │  │ Knowledge  │  │ Interview  │  │ Fact Check │       │
│  │ Chat       │  │ Graph UI   │  │ Vault      │  │ Editor     │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │   API Gateway (Node)   │
                        │   + AI Router          │
                        └───────────┬───────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐        ┌─────────▼────────┐      ┌─────────▼─────────┐
│ CORE SERVICES  │        │  INTELLIGENCE    │      │  EXTERNAL APIs     │
│                │        │  SERVICES        │      │                    │
│ • Auth         │        │ • MDR Scraper    │      │ • North Data API   │
│ • Research DB  │        │ • News Radar     │      │ • OpenAI           │
│ • Nextcloud    │        │ • Transcription  │      │ • Google Gemini    │
│ • File Upload  │        │ • Fact Checker   │      │ • Anthropic        │
└────────────────┘        │ • Graph Builder  │      │ • Google News      │
                          └──────────────────┘      └────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐        ┌─────────▼────────┐      ┌─────────▼─────────┐
│ PostgreSQL     │        │ Vector Database   │      │ Graph Database    │
│ (Main Data)    │        │ (pgvector)        │      │ (Neo4j/ArangoDB)  │
│                │        │                   │      │                   │
│ • Users        │        │ • Article         │      │ • Persons         │
│ • Articles     │        │   Embeddings      │      │ • Companies       │
│ • Interviews   │        │ • Transcripts     │      │ • Relationships   │
│ • Fact Checks  │        │ • Queries         │      │ • North Data      │
└────────────────┘        └───────────────────┘      └───────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    DOCKER INFRASTRUCTURE                                 │
│                                                                          │
│  Container 1: Main App (Node + React + PostgreSQL + Redis + Nextcloud) │
│  Container 2: Vector DB (pgvector OR ChromaDB standalone)              │
│  Container 3: Graph DB (Neo4j Community Edition)                       │
│  Container 4: Whisper Transcription Service (OpenAI Whisper)           │
│  Container 5: Background Workers (Bull.js + Redis Queue)               │
│                                                                          │
│  Volumes: nextcloud_data, postgres_data, vector_data, graph_data       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Extensions

### 2.1 PostgreSQL Core Extensions

```sql
-- ===== EPIC 1: Portfolio Tracker =====
CREATE TABLE mdr_articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  published_at TIMESTAMP,
  author_name TEXT,
  full_text TEXT,
  html_content TEXT,
  metadata JSONB, -- {category, tags, image_url, etc.}
  scraped_at TIMESTAMP DEFAULT NOW(),
  last_checked TIMESTAMP,
  embedding_id TEXT, -- Reference to vector DB
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mdr_articles_user ON mdr_articles(user_id);
CREATE INDEX idx_mdr_articles_published ON mdr_articles(published_at DESC);
CREATE INDEX idx_mdr_articles_metadata ON mdr_articles USING GIN (metadata);

-- ===== EPIC 2: News Radar =====
CREATE TABLE news_feeds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL, -- ["Landtag Magdeburg", "AfD Sachsen-Anhalt"]
  sources TEXT[], -- ["google_news", "rss_feeds"]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE news_items (
  id SERIAL PRIMARY KEY,
  feed_id INTEGER REFERENCES news_feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  published_at TIMESTAMP,
  snippet TEXT,
  status TEXT DEFAULT 'new', -- new, reviewed, archived, added_to_research
  nextcloud_path TEXT, -- Path if moved to Nextcloud
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_news_items_feed ON news_items(feed_id);
CREATE INDEX idx_news_items_status ON news_items(status);

-- ===== EPIC 3: Modular AI Config =====
CREATE TABLE ai_model_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  feature_name TEXT NOT NULL, -- "transcription", "summarize", "fact_check"
  provider TEXT NOT NULL, -- "openai", "anthropic", "google"
  model_name TEXT NOT NULL, -- "gpt-4", "claude-3-opus", "gemini-pro"
  api_key_encrypted TEXT, -- User's own API key (encrypted)
  settings JSONB, -- {temperature: 0.7, max_tokens: 2000}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

-- ===== EPIC 4: Knowledge Graph (PostgreSQL side) =====
CREATE TABLE entities (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- "person", "company", "location", "event"
  name TEXT NOT NULL,
  north_data_id TEXT, -- External ID from North Data
  metadata JSONB, -- Alle Daten von North Data
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_relations (
  id SERIAL PRIMARY KEY,
  source_entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL, -- "geschaeftsfuehrer_von", "erwähnt_in_artikel", "beteiligt_an"
  strength FLOAT DEFAULT 1.0, -- 0.0 - 1.0
  source_type TEXT, -- "north_data", "mdr_article", "manual"
  source_id INTEGER, -- Reference to mdr_articles.id or other
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_north_data ON entities(north_data_id);
CREATE INDEX idx_relations_source ON entity_relations(source_entity_id);
CREATE INDEX idx_relations_target ON entity_relations(target_entity_id);

-- ===== EPIC 5: Interview Vault =====
CREATE TABLE interviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  interview_date DATE,
  location TEXT,
  participants JSONB, -- [{name: "Max Mustermann", role: "Bürgermeister"}]
  audio_file_path TEXT, -- Nextcloud path
  audio_duration_seconds INTEGER,
  transcription_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  transcript_text TEXT,
  transcript_json JSONB, -- Full Whisper output with timestamps
  embedding_id TEXT, -- Vector DB reference
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  transcribed_at TIMESTAMP
);

CREATE TABLE interview_quotes (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  speaker TEXT,
  start_time_seconds FLOAT, -- 123.45
  end_time_seconds FLOAT,
  marked_important BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interviews_user ON interviews(user_id);
CREATE INDEX idx_quotes_interview ON interview_quotes(interview_id);

-- ===== EPIC 6: Fact Checking =====
CREATE TABLE fact_checks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  claim_text TEXT NOT NULL,
  context TEXT, -- Surrounding paragraph
  source_article_id INTEGER, -- If checking own article
  check_status TEXT DEFAULT 'pending', -- pending, verified, disputed, false
  confidence_score FLOAT, -- 0.0 - 1.0
  sources JSONB, -- [{url: "...", title: "...", excerpt: "..."}]
  ai_analysis TEXT,
  manual_notes TEXT,
  checked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fact_checks_user ON fact_checks(user_id);
CREATE INDEX idx_fact_checks_status ON fact_checks(check_status);
```

### 2.2 Vector Database Schema (pgvector)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id TEXT PRIMARY KEY, -- UUID
  content_type TEXT NOT NULL, -- "mdr_article", "interview_transcript", "fact_check"
  content_id INTEGER NOT NULL, -- Reference to source table
  text_chunk TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 = 1536 dimensions
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embeddings_type ON embeddings(content_type);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 2.3 Graph Database Schema (Neo4j Cypher)

```cypher
// ===== NODES =====
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT article_id IF NOT EXISTS FOR (a:Article) REQUIRE a.id IS UNIQUE;

// Person Node
(:Person {
  id: "person_123",
  name: "Max Mustermann",
  north_data_id: "nd_xyz",
  roles: ["Geschäftsführer", "Politiker"],
  metadata: {...}
})

// Company Node
(:Company {
  id: "company_456",
  name: "Beispiel GmbH",
  north_data_id: "nd_abc",
  registry_number: "HRB 12345",
  legal_form: "GmbH",
  address: "Magdeburg",
  metadata: {...}
})

// Article Node
(:Article {
  id: "article_789",
  title: "Skandal um lokale Firma",
  url: "https://mdr.de/...",
  published_at: "2024-12-15"
})

// ===== RELATIONSHIPS =====
(:Person)-[:MANAGES {since: "2020-01-01", share: 51}]->(:Company)
(:Person)-[:MENTIONED_IN {sentiment: "neutral"}]->(:Article)
(:Company)-[:MENTIONED_IN {context: "Insolvenzverfahren"}]->(:Article)
(:Person)-[:KNOWS {strength: 0.8}]->(:Person)
(:Company)-[:SUBSIDIARY_OF]->(:Company)
```

---

## 3. API Design

### 3.1 Core API Structure

```javascript
// Base URL: /api/v2/

// ===== EPIC 1: Portfolio Tracker =====
POST   /api/v2/portfolio/scrape          // Trigger MDR scraping
GET    /api/v2/portfolio/articles        // List user's articles
POST   /api/v2/portfolio/chat            // RAG-based chat with archive
GET    /api/v2/portfolio/stats           // Publishing statistics

// ===== EPIC 2: News Radar =====
POST   /api/v2/news/feeds                // Create news feed
GET    /api/v2/news/feeds                // List all feeds
GET    /api/v2/news/feeds/:id/items      // Get items for feed
POST   /api/v2/news/items/:id/move       // Move to Nextcloud
PATCH  /api/v2/news/items/:id            // Update status

// ===== EPIC 3: AI Model Config =====
GET    /api/v2/ai/models                 // List available models
GET    /api/v2/ai/config                 // Get user's AI config
PUT    /api/v2/ai/config/:feature        // Set model for feature
POST   /api/v2/ai/test                   // Test API key validity

// ===== EPIC 4: Knowledge Graph =====
GET    /api/v2/graph/entities            // List entities (paginated)
POST   /api/v2/graph/entities            // Create entity manually
GET    /api/v2/graph/entities/:id        // Get entity details
POST   /api/v2/graph/search              // Search for entity
GET    /api/v2/graph/entities/:id/network // Get network around entity
POST   /api/v2/graph/north-data/lookup  // Query North Data API
POST   /api/v2/graph/build               // Build graph from article

// ===== EPIC 5: Interview Vault =====
POST   /api/v2/interviews                // Create interview record
GET    /api/v2/interviews                // List interviews
GET    /api/v2/interviews/:id            // Get interview + transcript
POST   /api/v2/interviews/:id/transcribe // Trigger transcription
GET    /api/v2/interviews/:id/quotes     // Get smart quotes
POST   /api/v2/interviews/:id/quotes     // Create quote bookmark

// ===== EPIC 6: Fact Checking =====
POST   /api/v2/fact-check/check          // Submit claim for checking
GET    /api/v2/fact-check/history        // Get user's fact checks
GET    /api/v2/fact-check/:id            // Get specific check result
```

### 3.2 Detailed Endpoint Specifications

#### 3.2.1 Knowledge Graph - North Data Integration

```javascript
/**
 * POST /api/v2/graph/north-data/lookup
 *
 * Request Body:
 * {
 *   "query": "Beispiel GmbH",
 *   "type": "company" | "person",
 *   "includeRelations": true
 * }
 *
 * Response:
 * {
 *   "results": [
 *     {
 *       "north_data_id": "nd_123456",
 *       "name": "Beispiel GmbH",
 *       "legal_form": "GmbH",
 *       "registry": {
 *         "court": "Amtsgericht Magdeburg",
 *         "number": "HRB 12345"
 *       },
 *       "address": {
 *         "street": "Beispielstraße 1",
 *         "city": "Magdeburg",
 *         "postal_code": "39104"
 *       },
 *       "management": [
 *         {
 *           "name": "Max Mustermann",
 *           "role": "Geschäftsführer",
 *           "since": "2020-01-01"
 *         }
 *       ],
 *       "shareholders": [...],
 *       "subsidiaries": [...]
 *     }
 *   ],
 *   "cached": false,
 *   "api_credits_used": 1
 * }
 */
```

#### 3.2.2 Graph Network Visualization

```javascript
/**
 * GET /api/v2/graph/entities/:id/network
 *
 * Query Params:
 * - depth: 1-3 (how many hops)
 * - types: ["person", "company", "article"]
 * - minStrength: 0.0-1.0
 *
 * Response (React Flow compatible format):
 * {
 *   "nodes": [
 *     {
 *       "id": "person_123",
 *       "type": "person",
 *       "data": {
 *         "label": "Max Mustermann",
 *         "north_data_id": "nd_xyz",
 *         "metadata": {...}
 *       },
 *       "position": { "x": 100, "y": 100 }
 *     },
 *     {
 *       "id": "company_456",
 *       "type": "company",
 *       "data": {
 *         "label": "Beispiel GmbH",
 *         "registry_number": "HRB 12345"
 *       },
 *       "position": { "x": 300, "y": 100 }
 *     }
 *   ],
 *   "edges": [
 *     {
 *       "id": "rel_789",
 *       "source": "person_123",
 *       "target": "company_456",
 *       "type": "manages",
 *       "label": "Geschäftsführer seit 2020",
 *       "strength": 1.0,
 *       "animated": false
 *     }
 *   ]
 * }
 */
```

#### 3.2.3 Portfolio Chat (RAG)

```javascript
/**
 * POST /api/v2/portfolio/chat
 *
 * Request:
 * {
 *   "message": "Was habe ich über AfD in Sachsen-Anhalt geschrieben?",
 *   "conversation_id": "uuid-optional",
 *   "max_results": 5
 * }
 *
 * Response:
 * {
 *   "answer": "In den letzten 3 Monaten haben Sie 4 Artikel über die AfD in Sachsen-Anhalt veröffentlicht...",
 *   "sources": [
 *     {
 *       "article_id": 123,
 *       "title": "AfD fordert Neuwahlen",
 *       "url": "https://mdr.de/...",
 *       "published_at": "2024-11-15",
 *       "relevance_score": 0.92,
 *       "excerpt": "..."
 *     }
 *   ],
 *   "conversation_id": "uuid",
 *   "tokens_used": 1234
 * }
 */
```

#### 3.2.4 Fact Checking

```javascript
/**
 * POST /api/v2/fact-check/check
 *
 * Request:
 * {
 *   "claim": "Die Arbeitslosenquote in Sachsen-Anhalt liegt bei 7,2%",
 *   "context": "Umgebender Absatz...",
 *   "check_sources": ["own_archive", "google", "north_data"]
 * }
 *
 * Response:
 * {
 *   "id": 456,
 *   "status": "verified" | "disputed" | "false",
 *   "confidence": 0.85,
 *   "analysis": "Die Angabe ist korrekt. Laut Bundesagentur für Arbeit lag die Quote im November 2024 bei 7,2%.",
 *   "sources": [
 *     {
 *       "type": "official",
 *       "title": "Arbeitsmarktbericht November 2024",
 *       "url": "https://...",
 *       "excerpt": "...7,2%...",
 *       "relevance": 0.95
 *     },
 *     {
 *       "type": "own_archive",
 *       "article_id": 789,
 *       "title": "Arbeitsmarkt erholt sich leicht",
 *       "excerpt": "...bestätigt die 7,2%..."
 *     }
 *   ],
 *   "alternatives": [
 *     {
 *       "claim": "Die Quote lag im Oktober bei 7,5%",
 *       "confidence": 0.92
 *     }
 *   ],
 *   "checked_at": "2024-12-30T15:30:00Z"
 * }
 */
```

---

## 4. Implementation Roadmap & Prioritization

### Phase 1: Foundation (Q1 2025) - 8-10 Wochen

**Priority: CRITICAL**

#### Sprint 1-2: Infrastructure (Weeks 1-4)
- [ ] Docker-Compose erweitern für neue Services
  - pgvector Container (oder pgvector Extension in bestehendem PostgreSQL)
  - Neo4j Community Edition Container
  - Redis für Background Jobs (Bull.js Queue)
- [ ] Datenbank-Migrationen für alle neuen Tabellen
- [ ] AI Router/Proxy Backend implementieren
- [ ] Basis-Tests für neue Infrastruktur

**Deliverables:**
- Multi-Container Setup läuft stabil
- Migrations funktionieren
- Health-Check-Endpoints für alle Services

#### Sprint 3-4: Epic 3 - Modular AI Config (Weeks 5-8)
**Why first?** Alle anderen Features brauchen dieses System!

- [ ] Backend: AI Model Router mit Adapter-Pattern
  ```javascript
  // backend/src/services/ai/router.js
  class AIRouter {
    async route(feature, userConfig, prompt) {
      const config = await this.getUserConfig(feature)
      const adapter = this.getAdapter(config.provider)
      return adapter.execute(prompt, config)
    }
  }
  ```
- [ ] Frontend: Settings-Panel für Model-Auswahl
- [ ] API-Key-Verschlüsselung (AES-256)
- [ ] Test-Funktion für API-Keys

**Deliverables:**
- Nutzer kann pro Feature (Transcription, Summarize, etc.) Modell wählen
- Eigene API-Keys sicher speichern
- Fallback auf System-Keys wenn User keine hat

#### Sprint 5-6: Epic 1 - Portfolio Tracker (RAG) (Weeks 9-12)
- [ ] MDR Scraper Service
  - Puppeteer/Playwright für Scraping
  - Autor-Name Matching
  - Volltext-Extraktion
- [ ] Embedding-Pipeline
  - Text-Chunking (LangChain)
  - OpenAI Embeddings generieren
  - In pgvector speichern
- [ ] RAG Chat-Interface
  - Vector Search Implementation
  - Context Retrieval
  - LLM Integration über AI Router
- [ ] Frontend: Chat-UI mit Source-Citations

**Deliverables:**
- Automatisches Monitoring von MDR.de
- Chat mit eigenem Archiv funktioniert
- Sources werden korrekt angezeigt

---

### Phase 2: Intelligence Features (Q2 2025) - 10-12 Wochen

#### Sprint 7-8: Epic 5 - Interview Vault (Weeks 13-16)
- [ ] Whisper Docker Container Setup
  - OpenAI Whisper (lokal für Datenschutz)
  - Audio-Upload zu Nextcloud
- [ ] Transkriptions-Pipeline
  - Background Worker (Bull Queue)
  - Chunking für lange Audios
  - Timestamp-Extraction
- [ ] Frontend: Interview-Manager
  - Transkript-Viewer mit Timeline
  - Smart Quotes (click-to-copy mit Timecode)
  - Search in Transcripts

**Deliverables:**
- Upload Audio → automatische Transkription
- Durchsuchbare Interview-Bibliothek
- Quote-Extraction mit Timecodes

#### Sprint 9-10: Epic 2 - News Radar (Weeks 17-20)
- [ ] Google News API Integration
  - Keyword-basiertes Monitoring
  - RSS-Feed-Aggregation
- [ ] Curation-Workflow
  - One-Click zu Nextcloud
  - Status-Tracking (new, reviewed, archived)
- [ ] Frontend: News-Dashboard
  - Karten-basierte UI
  - Filter & Search
  - Bulk-Actions

**Deliverables:**
- Automatische News-Aggregation
- Curation zu Nextcloud-Ordnern
- Email-Digest Option

---

### Phase 3: Deep Investigation (Q3 2025) - 12-14 Wochen

#### Sprint 11-13: Epic 4 - Knowledge Graph (Weeks 21-29)
**Most Complex Feature!**

- [ ] North Data API Integration
  - Authentifizierung
  - Rate Limiting (API Credits sparen)
  - Caching-Strategie
- [ ] Entity Extraction aus eigenen Artikeln
  - Named Entity Recognition (spaCy oder OpenAI)
  - Auto-Linking zu North Data
- [ ] Graph Database Population
  - Neo4j Cypher Queries
  - Beziehungs-Inferenz
- [ ] Graph Visualization Frontend
  - React Flow Integration
  - Interactive Graph Explorer
  - Filter & Layout-Algorithmen (force-directed, hierarchical)
- [ ] Search & Discovery
  - "Finde alle Verbindungen zwischen Person X und Firma Y"
  - Shortest Path Queries

**Deliverables:**
- North Data Lookup funktioniert
- Graph wird automatisch aus Artikeln gebaut
- Interaktive Visualisierung
- Investigative Queries (z.B. "hidden connections")

#### Sprint 14-15: Epic 6 - Live Fact-Checking (Weeks 30-33)
- [ ] Fact-Check-Engine
  - Claim Extraction
  - Multi-Source Verification
    1. Eigenes Archiv (Vector Search)
    2. Google Search (Serpapi)
    3. Official Sources (Statistisches Bundesamt APIs)
  - Confidence Scoring
- [ ] Editor Integration
  - Text-Selection → Check Button
  - Inline Ampel-System (Traffic Light)
  - Source Sidebar
- [ ] Fact-Check History
  - Alle Checks speichern
  - Trend-Analyse ("häufig gecheckte Claims")

**Deliverables:**
- In-Editor Fact-Checking
- Multi-Source Verification
- Confidence-basierte Ampel
- Source Transparency

---

## 5. Technical Decisions & Rationale

### 5.1 Warum pgvector statt ChromaDB?

**Decision:** pgvector als PostgreSQL Extension

**Rationale:**
- **Pro:**
  - Keine zusätzliche Datenbank → weniger Docker-Komplexität
  - ACID-Garantien
  - SQL Joins mit Vector Search kombinierbar
  - Production-ready (Supabase, Neon nutzen es)
- **Con:**
  - Weniger Features als dedizierte Vector DBs
  - Performance bei >10M Vektoren schlechter

**Alternative:** ChromaDB standalone nur wenn >1M Dokumente erwartet

---

### 5.2 Warum Neo4j statt PostgreSQL Recursive Queries?

**Decision:** Neo4j für Knowledge Graph

**Rationale:**
- **Pro:**
  - Native Graph-Queries (Cypher)
  - Path-Finding-Algorithmen out-of-the-box
  - Visualisierungs-Tools (Neo4j Bloom)
  - Performance bei komplexen Beziehungen (3+ Hops)
- **Con:**
  - Zusätzlicher Container
  - Community Edition hat Memory Limit (4GB Heap)

**Alternative:** PostgreSQL mit `ltree` oder `pg_graph` nur für einfache Fälle

---

### 5.3 Warum lokaler Whisper statt OpenAI API?

**Decision:** Self-hosted Whisper Docker Container

**Rationale:**
- **Datenschutz:** Interviews können sensible Quellen sein
- **Kosten:** OpenAI Whisper = $0.006/min → bei 100h Interviews = $36
- **Offline-Fähigkeit:** Funktioniert ohne Internet
- **Con:** Braucht GPU für Echtzeit (oder 2-3x Audio-Länge CPU)

**Fallback:** Nutzer kann in AI Config auf OpenAI API wechseln

---

### 5.4 Background Job Queue Strategy

**Decision:** Bull.js mit Redis

**Tasks:**
- MDR Scraping (jede Nacht)
- Embedding-Generierung (nach Scraping)
- Transkription (kann Minuten dauern)
- North Data Batch-Lookups
- Fact-Check-Jobs

**Monitoring:** Bull Board (Web-UI für Queue-Überwachung)

---

## 6. Security & Privacy Considerations

### 6.1 API-Key-Storage

```javascript
// Verschlüsselung mit crypto
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const key = process.env.ENCRYPTION_KEY; // 32 bytes

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```

### 6.2 North Data API Rate Limiting

```javascript
// Redis-based Rate Limiter
const RateLimiter = require('rate-limiter-flexible');

const northDataLimiter = new RateLimiter.RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // API Credits per day
  duration: 86400, // 1 day
  keyPrefix: 'north_data_api'
});

// Before each API call
await northDataLimiter.consume(userId);
```

### 6.3 Scraping Ethics & Legal

**MDR.de Scraping:**
- Robots.txt beachten
- Rate Limiting (max 1 Request/5 Sekunden)
- User-Agent setzen: `Mozilla/5.0 (Quill Journalism Tool; +info@quill-app.de)`
- Nur eigene Artikel scrapen (Name-Matching)
- Cache-Header respektieren

**Legal Check:**
- MDR Nutzungsbedingungen prüfen
- Ggf. offizielle API anfragen
- Alternativen: RSS-Feed oder Author-Archive URL

---

## 7. Cost Estimation

### 7.1 Infrastructure Costs (pro Monat bei 10 aktiven Usern)

| Service | Cost | Notes |
|---------|------|-------|
| Hetzner VPS (CX51) | €26,41 | 8 vCPU, 16GB RAM, 240GB SSD |
| North Data API | €0-50 | Pay-per-use, ~100 Lookups/Monat |
| OpenAI Embeddings | €2-5 | ada-002: $0.0001/1k tokens |
| OpenAI GPT-4 (Fact Check) | €10-30 | Optional, sonst Gemini Flash |
| Google News API | FREE | Kostenlos bis 100 Requests/Tag |
| **TOTAL** | **€38-111** | Je nach AI-Nutzung |

### 7.2 Development Time Estimation

| Phase | Sprints | Weeks | FTE |
|-------|---------|-------|-----|
| Phase 1 (Foundation) | 6 | 12 | 1.5 |
| Phase 2 (Intelligence) | 5 | 10 | 1.5 |
| Phase 3 (Deep Investigation) | 6 | 14 | 2.0 |
| **TOTAL** | **17** | **36** | **1.7 avg** |

**Hinweis:** Bei einem Solo-Developer = 9 Monate Vollzeit

---

## 8. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| North Data API zu teuer | Medium | High | Caching + User-Limits (z.B. 50 Lookups/Monat) |
| MDR blockiert Scraper | High | Medium | Fallback auf manuelle URL-Eingabe + RSS |
| Neo4j RAM Limit (4GB) | Medium | Medium | Upgrade auf Enterprise oder ArangoDB |
| Whisper Transkription zu langsam | Medium | Low | Optional OpenAI Whisper API |
| Komplexität erschlägt User | High | High | Feature-Flags + Progressive Onboarding |

---

## 9. Monitoring & Observability

### 9.1 Key Metrics

```javascript
// Prometheus Metrics
const metrics = {
  // Performance
  'api_request_duration_seconds': histogram,
  'vector_search_latency_seconds': histogram,
  'graph_query_duration_seconds': histogram,

  // Business
  'mdr_articles_scraped_total': counter,
  'interviews_transcribed_total': counter,
  'fact_checks_performed_total': counter,
  'north_data_api_calls_total': counter,

  // Errors
  'scraping_errors_total': counter,
  'transcription_failures_total': counter,
  'api_rate_limit_hits_total': counter
};
```

### 9.2 Logging Strategy

- **Structured Logging:** Winston + JSON format
- **Log Levels:**
  - ERROR: Scraping failed, API errors
  - WARN: Rate limit approaching
  - INFO: Jobs completed, API calls
  - DEBUG: Vector search results

---

## 10. Next Steps

### Immediate Actions (Before Implementation)

1. **Legal Review:**
   - [ ] MDR.de Nutzungsbedingungen prüfen
   - [ ] North Data API Vertrag review
   - [ ] DSGVO-Compliance für Audio-Transkripte

2. **Proof of Concepts:**
   - [ ] MDR Scraping Test (Puppeteer Script)
   - [ ] North Data API Sandbox
   - [ ] Whisper Performance Test (CPU vs GPU)
   - [ ] pgvector vs ChromaDB Benchmark

3. **User Research:**
   - [ ] Interviews mit 3-5 MDR-Journalisten
   - [ ] Welche Features haben höchste Priority?
   - [ ] Pain Points im aktuellen Workflow?

4. **Team Setup:**
   - [ ] Backend Dev (Node.js + Databases)
   - [ ] Frontend Dev (React + D3.js/React Flow)
   - [ ] DevOps (Docker + Deployment)
   - [ ] Part-time: Data Scientist (NLP + Graph Algorithms)

---

## Appendix A: Alternative Technologies Considered

| Feature | Chosen | Alternatives Considered | Why Not? |
|---------|--------|------------------------|----------|
| Vector DB | pgvector | Pinecone, Weaviate, Qdrant | Vendor Lock-in, Kosten |
| Graph DB | Neo4j | ArangoDB, DGraph, PostgreSQL Recursive | Community, Tooling |
| Transcription | Local Whisper | Deepgram, AssemblyAI, Rev.ai | Datenschutz, Kosten |
| Scraping | Puppeteer | Scrapy, BeautifulSoup | JavaScript-heavy Sites |
| Job Queue | Bull.js | Celery, BeeQueue, Agenda | Node.js Ecosystem |

---

## Appendix B: Example Workflows

### Workflow 1: Investigative Research on Local Politician

```
1. User searches: "Max Mustermann" in Knowledge Graph
2. System checks:
   - Own MDR articles → Finds 2 mentions
   - North Data → Finds: Geschäftsführer of "Consulting GmbH"
3. Graph shows:
   - Person: Max Mustermann
   - Company: Consulting GmbH (since 2018)
   - Article 1: "Stadtrat beschließt Bauvorhaben" (2023)
   - Article 2: "Kritik an Vergabeverfahren" (2024)
4. User clicks "Expand Network" →
   - Consulting GmbH has subsidiary: "Bau & Service GmbH"
   - Bau & Service has contract with Stadt Magdeburg (from North Data)
5. User sees potential conflict of interest
6. User clicks "Create Fact Check" →
   - Claim: "Max Mustermann als Stadtrat entschied über Auftrag an seine Firma"
   - System searches archive + Google
   - Finds: Municipal transparency portal confirms contract
7. User exports Graph as PNG for article illustration
```

### Workflow 2: Interview Preparation & Follow-up

```
1. User uploads 45-min Interview MP3 to Nextcloud
2. System auto-detects upload → triggers transcription
3. After 10 minutes: Transcription complete
4. User opens Interview Vault → sees timeline
5. User searches transcript for "Korruption"
6. Finds quote at 23:45: "Ich kann nicht ausschließen, dass..."
7. User clicks "Copy Quote" → clipboard contains:
   "Ich kann nicht ausschließen, dass..." (23:45-24:12)
8. User pastes in Editor → begins writing article
9. User marks claim in article: "Laut Zeugen gab es Schmiergeldzahlungen"
10. Clicks "Fact Check" →
    - System searches own archive: No prior mention
    - Google: Finds press release from Staatsanwaltschaft
    - Status: "Verified" (Green)
11. User publishes article →
12. System scrapes it next day from MDR.de →
13. Adds to Portfolio → Embeddings generated
14. Next time: Can chat "What did witness say about corruption?"
```

---

**END OF SPECIFICATION**

*For questions or implementation support, contact the development team.*
