# Quill Investigative Suite - Development Roadmap

**Version:** 1.0
**Status:** Planning → Implementation
**Timeline:** Q1 2025 - Q3 2025 (36 Wochen)
**Last Updated:** 30.12.2024

---

## 📊 Executive Summary

Diese Roadmap transformiert Quill von einem Content-Management-System zu einer **Investigative Journalism Intelligence Platform** mit 6 neuen Major-Features:

1. **Portfolio-Tracker** - MDR-Scraping + RAG Chat
2. **News-Radar** - Google News Aggregation
3. **Modulare KI-Steuerung** - BYOM System
4. **Knowledge Graph** - North Data + Visualisierung
5. **Interview-Vault** - Audio-Transkription + Smart Quotes
6. **Live-Fact-Checking** - In-Editor Verifikation

**Team-Size:** 1.5-2.0 FTE
**Total Effort:** 36 Wochen
**Investment:** ~€10.000-15.000 (Infrastruktur + APIs)

---

## 🎯 Phase 1: Foundation (Q1 2025)

**Duration:** 12 Wochen (Jan - März 2025)
**Goal:** Infrastruktur + Basis-Features
**Team:** 1.5 FTE

---

### Sprint 1-2: Infrastructure Setup (Weeks 1-4)

**Objective:** Docker-Multi-Container-Architektur aufbauen

#### Week 1-2: Database Layer

**Tasks:**
- [ ] PostgreSQL um pgvector Extension erweitern
- [ ] Neo4j Community Edition Docker Container einrichten
- [ ] Redis Container für Background Jobs (Bull.js)
- [ ] Docker-Compose-Datei erweitern
- [ ] Health-Check-Endpoints für alle Services

**Deliverables:**
```yaml
# docker-compose.yml Extension
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=quill
      - POSTGRES_USER=quill
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  neo4j:
    image: neo4j:5.15-community
    ports:
      - "7474:7474"  # Browser
      - "7687:7687"  # Bolt
    environment:
      - NEO4J_AUTH=neo4j/${NEO4J_PASSWORD}
    volumes:
      - neo4j_data:/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

**Acceptance Criteria:**
- ✅ Alle Container starten ohne Fehler
- ✅ `docker-compose up -d` läuft stabil
- ✅ Health-Checks antworten mit 200 OK
- ✅ Volumes persistieren Daten nach Neustart

---

#### Week 3-4: Database Migrations

**Tasks:**
- [ ] Migrations für 9 neue PostgreSQL-Tabellen
- [ ] pgvector-Schema für Embeddings
- [ ] Neo4j Constraints & Indizes
- [ ] Seed-Data für Development
- [ ] Rollback-Strategie testen

**Database Schema Files:**
```
backend/migrations/
├── 001_mdr_articles.sql
├── 002_news_feeds.sql
├── 003_ai_model_configs.sql
├── 004_entities_graph.sql
├── 005_interviews.sql
├── 006_fact_checks.sql
├── 007_pgvector_embeddings.sql
└── neo4j/
    └── 001_constraints.cypher
```

**Acceptance Criteria:**
- ✅ Migrations laufen ohne Fehler
- ✅ Foreign Keys funktionieren
- ✅ Indizes sind erstellt
- ✅ Rollback funktioniert
- ✅ Seed-Data lädt korrekt

---

### Sprint 3-4: Epic 3 - Modulare KI-Steuerung (Weeks 5-8)

**Objective:** AI-Router-System implementieren (Basis für alle anderen Features!)

#### Week 5-6: Backend AI Router

**Tasks:**
- [ ] AI-Router-Service mit Adapter-Pattern
- [ ] Provider-Adapter: OpenAI, Anthropic, Google
- [ ] API-Key-Verschlüsselung (AES-256-GCM)
- [ ] User-AI-Config CRUD API
- [ ] Test-Endpoint für API-Key-Validierung

**Code Structure:**
```
backend/src/services/ai/
├── router.js          # Main Router
├── adapters/
│   ├── openai.js      # OpenAI Adapter
│   ├── anthropic.js   # Claude Adapter
│   └── google.js      # Gemini Adapter
├── encryption.js      # API-Key Encryption
└── __tests__/
    └── router.test.js
```

**API Endpoints:**
```javascript
GET    /api/v2/ai/models               // List available models
GET    /api/v2/ai/config                // Get user config
PUT    /api/v2/ai/config/:feature       // Update feature config
POST   /api/v2/ai/test                  // Test API key
```

**Example Request:**
```json
PUT /api/v2/ai/config/transcription
{
  "provider": "openai",
  "model": "whisper-1",
  "apiKey": "sk-...",
  "settings": {
    "language": "de",
    "temperature": 0
  }
}
```

**Acceptance Criteria:**
- ✅ Router leitet Requests korrekt an Provider
- ✅ API-Keys werden verschlüsselt gespeichert
- ✅ Test-Endpoint validiert Keys erfolgreich
- ✅ Fallback auf System-Keys wenn User keine hat
- ✅ Error-Handling für ungültige Keys

---

#### Week 7-8: Frontend AI Settings

**Tasks:**
- [ ] Settings-Panel für AI-Konfiguration
- [ ] Feature-Liste (Transcription, Summarize, etc.)
- [ ] Model-Selector-Dropdown per Feature
- [ ] API-Key-Input mit Visibility-Toggle
- [ ] Test-Button für Key-Validierung
- [ ] Success/Error-Toast-Notifications

**UI Components:**
```jsx
// frontend/src/components/AISettings.jsx
<AISettingsPanel>
  <FeatureConfig feature="transcription">
    <ModelSelector models={['whisper-1', 'deepgram', 'local']} />
    <APIKeyInput provider="openai" />
    <TestButton />
  </FeatureConfig>

  <FeatureConfig feature="summarize">
    <ModelSelector models={['gpt-4', 'claude-3-opus', 'gemini-pro']} />
    <APIKeyInput provider="anthropic" />
  </FeatureConfig>
</AISettingsPanel>
```

**Acceptance Criteria:**
- ✅ User kann Modell pro Feature wählen
- ✅ API-Keys werden maskiert angezeigt
- ✅ Test-Button zeigt Erfolg/Fehler
- ✅ Änderungen werden sofort gespeichert
- ✅ System-Default wenn keine User-Config

---

### Sprint 5-6: Epic 1 - Portfolio-Tracker (RAG) (Weeks 9-12)

**Objective:** Automatisches MDR-Scraping + Chat mit eigenem Archiv

#### Week 9-10: MDR Scraper Service

**Tasks:**
- [ ] Puppeteer-Setup für MDR.de
- [ ] Autor-Name-Matching-Algorithmus
- [ ] Volltext-Extraktion (HTML → Plain Text)
- [ ] Metadata-Parser (Datum, Kategorie, Tags)
- [ ] Duplicate-Detection (URL-Check)
- [ ] Cron-Job für nächtliches Scraping

**Scraper Architecture:**
```javascript
// backend/src/services/scraper/mdr.js
class MDRScraper {
  async scrapeAuthorArticles(authorName) {
    // 1. Suche nach Author auf MDR.de
    const searchUrl = `https://mdr.de/suche?q=${authorName}&sort=date`

    // 2. Parse Search Results
    const articles = await this.parseSearchResults(searchUrl)

    // 3. Für jeden Artikel: Volltext extrahieren
    for (const article of articles) {
      const fullText = await this.extractFullText(article.url)
      await this.saveArticle({ ...article, fullText })
    }
  }

  async extractFullText(url) {
    const page = await this.browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })

    // Extrahiere Hauptinhalt
    const content = await page.evaluate(() => {
      return document.querySelector('article')?.innerText
    })

    return content
  }
}
```

**Acceptance Criteria:**
- ✅ Scraper findet alle Artikel des Autors
- ✅ Volltext wird korrekt extrahiert
- ✅ Metadata (Datum, Titel) werden gespeichert
- ✅ Duplikate werden erkannt (URL-Check)
- ✅ Rate-Limiting (1 Request/5s)
- ✅ Robots.txt wird respektiert

---

#### Week 11: Embedding Pipeline

**Tasks:**
- [ ] Text-Chunking-Algorithmus (LangChain)
- [ ] OpenAI Embeddings API Integration
- [ ] Bulk-Insert in pgvector
- [ ] Background-Job für Embedding-Generierung
- [ ] Batch-Processing (max 100 Chunks parallel)

**Embedding Pipeline:**
```javascript
// backend/src/services/embeddings/generator.js
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const { OpenAIEmbeddings } = require('langchain/embeddings/openai')

async function generateEmbeddings(article) {
  // 1. Text in Chunks aufteilen
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  })

  const chunks = await splitter.createDocuments([article.full_text])

  // 2. Embeddings generieren
  const embeddings = new OpenAIEmbeddings()
  const vectors = await embeddings.embedDocuments(
    chunks.map(c => c.pageContent)
  )

  // 3. In pgvector speichern
  for (let i = 0; i < chunks.length; i++) {
    await db.query(`
      INSERT INTO embeddings (id, content_type, content_id, text_chunk, embedding)
      VALUES ($1, 'mdr_article', $2, $3, $4)
    `, [uuidv4(), article.id, chunks[i].pageContent, JSON.stringify(vectors[i])])
  }
}
```

**Acceptance Criteria:**
- ✅ Text wird sinnvoll in Chunks aufgeteilt
- ✅ Embeddings werden generiert (ada-002)
- ✅ Vektoren werden in pgvector gespeichert
- ✅ Background-Job läuft nach Scraping
- ✅ Batch-Processing verhindert API-Limits

---

#### Week 12: RAG Chat Interface

**Tasks:**
- [ ] Vector-Search in pgvector
- [ ] Context-Retrieval (Top-K Chunks)
- [ ] Prompt-Engineering für RAG
- [ ] LLM-Integration (via AI-Router)
- [ ] Citation-Formatting
- [ ] Chat-UI im Frontend

**Vector Search:**
```sql
-- pgvector Similarity Search
SELECT
  e.text_chunk,
  e.content_id,
  a.title,
  a.url,
  a.published_at,
  1 - (e.embedding <=> $1::vector) AS similarity
FROM embeddings e
JOIN mdr_articles a ON a.id = e.content_id
WHERE e.content_type = 'mdr_article'
ORDER BY e.embedding <=> $1::vector
LIMIT 5;
```

**RAG Prompt:**
```javascript
const prompt = `
Du bist ein Assistent, der einem Journalisten hilft, sein Archiv zu durchsuchen.

Frage: ${userMessage}

Relevante Artikel-Auszüge:
${context.map((c, i) => `
[${i+1}] ${c.title} (${c.published_at})
${c.text_chunk}
Quelle: ${c.url}
`).join('\n\n')}

Beantworte die Frage basierend auf den Artikel-Auszügen. Gib immer die Quelle an.
`
```

**Acceptance Criteria:**
- ✅ Vector-Search findet relevante Artikel
- ✅ Top-5 Chunks werden als Context verwendet
- ✅ LLM generiert korrekte Antwort
- ✅ Sources werden korrekt zitiert
- ✅ Chat-UI zeigt Conversation-History

---

### Sprint 5-6 Deliverables

**Frontend:**
- Portfolio-Chat-Seite mit Chat-Interface
- Source-Citations als klickbare Links
- Loading-State während Vector-Search

**Backend:**
- `/api/v2/portfolio/scrape` - Trigger Scraping
- `/api/v2/portfolio/articles` - List Articles
- `/api/v2/portfolio/chat` - RAG Chat

**Monitoring:**
- Scraping-Erfolgsrate (>95%)
- Embedding-Generierung-Zeit (<2 Min/Artikel)
- RAG-Response-Zeit (<5 Sekunden)

---

## 🚀 Phase 2: Intelligence Features (Q2 2025)

**Duration:** 10 Wochen (April - Juni 2025)
**Goal:** Audio-Intelligence + News-Curation
**Team:** 1.5 FTE

---

### Sprint 7-8: Epic 5 - Interview-Vault (Weeks 13-16)

**Objective:** Audio-Upload + automatische Transkription

#### Week 13-14: Whisper Setup

**Tasks:**
- [ ] OpenAI Whisper Docker Container
- [ ] GPU vs CPU Performance-Test
- [ ] Audio-Format-Konvertierung (FFmpeg)
- [ ] Nextcloud-Upload-Integration
- [ ] File-Size-Limits (max 100MB)

**Whisper Docker:**
```dockerfile
# docker/whisper/Dockerfile
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y python3-pip ffmpeg
RUN pip3 install openai-whisper

WORKDIR /app
COPY transcribe.py .

CMD ["python3", "transcribe.py"]
```

**Transcription Script:**
```python
# docker/whisper/transcribe.py
import whisper
import json

model = whisper.load_model("medium")

def transcribe_audio(audio_path):
    result = model.transcribe(
        audio_path,
        language="de",
        verbose=True
    )

    # Output mit Timestamps
    return {
        "text": result["text"],
        "segments": [
            {
                "start": s["start"],
                "end": s["end"],
                "text": s["text"]
            }
            for s in result["segments"]
        ]
    }
```

**Acceptance Criteria:**
- ✅ Whisper Container startet erfolgreich
- ✅ GPU wird genutzt (falls verfügbar)
- ✅ Transkription läuft (Deutsch)
- ✅ Timestamps sind korrekt
- ✅ Audio-Formate: MP3, WAV, M4A

---

#### Week 15: Transkriptions-Pipeline

**Tasks:**
- [ ] Bull-Queue für Transkriptions-Jobs
- [ ] Job-Status-Tracking (pending, processing, completed)
- [ ] Chunking für lange Audios (>1h)
- [ ] Error-Handling & Retry-Logik
- [ ] Webhook bei Completion

**Background Worker:**
```javascript
// backend/src/workers/transcription.js
const Queue = require('bull')
const transcriptionQueue = new Queue('transcription', {
  redis: { host: 'redis', port: 6379 }
})

transcriptionQueue.process(async (job) => {
  const { interviewId, audioPath } = job.data

  // 1. Update Status: processing
  await db.query(
    'UPDATE interviews SET transcription_status = $1 WHERE id = $2',
    ['processing', interviewId]
  )

  // 2. Call Whisper API
  const transcript = await whisperService.transcribe(audioPath)

  // 3. Save Transcript
  await db.query(`
    UPDATE interviews
    SET transcript_text = $1,
        transcript_json = $2,
        transcription_status = 'completed',
        transcribed_at = NOW()
    WHERE id = $3
  `, [transcript.text, JSON.stringify(transcript), interviewId])

  // 4. Generate Embeddings
  await generateEmbeddings(interviewId, transcript.text)

  return { success: true }
})
```

**Acceptance Criteria:**
- ✅ Jobs werden in Queue eingereiht
- ✅ Status-Updates funktionieren
- ✅ Lange Audios werden in Chunks verarbeitet
- ✅ Retry bei Fehlern (max 3x)
- ✅ Webhook benachrichtigt User

---

#### Week 16: Smart Quotes UI

**Tasks:**
- [ ] Interview-Manager-Seite
- [ ] Transkript-Viewer mit Timeline
- [ ] Click-to-Copy für Quotes (mit Timecode)
- [ ] Search in Transcripts
- [ ] Quote-Bookmark-Funktion

**Frontend Component:**
```jsx
// frontend/src/components/InterviewVault.jsx
function TranscriptViewer({ interview }) {
  const [selectedQuote, setSelectedQuote] = useState(null)

  const handleQuoteClick = (segment) => {
    const quote = `"${segment.text}" (${formatTimecode(segment.start)})`
    navigator.clipboard.writeText(quote)
    toast.success('Zitat kopiert!')
  }

  return (
    <div className="transcript-viewer">
      <Timeline segments={interview.transcript_json.segments} />

      <div className="transcript-text">
        {interview.transcript_json.segments.map((seg, i) => (
          <p
            key={i}
            onClick={() => handleQuoteClick(seg)}
            className="segment"
          >
            <span className="timecode">{formatTimecode(seg.start)}</span>
            {seg.text}
          </p>
        ))}
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- ✅ Transkript wird als Timeline angezeigt
- ✅ Click-to-Copy funktioniert
- ✅ Timecode wird formatiert (MM:SS)
- ✅ Search findet Text in Transkript
- ✅ Bookmarks können gesetzt werden

---

### Sprint 9-10: Epic 2 - News-Radar (Weeks 17-20)

**Objective:** Google News Aggregation + Nextcloud-Integration

#### Week 17-18: Google News Integration

**Tasks:**
- [ ] Google News API Setup (oder RSS-Feed)
- [ ] Keyword-basiertes Monitoring
- [ ] Article-Deduplication
- [ ] Sentiment-Analysis (optional)
- [ ] Cron-Job (täglich um 6 Uhr)

**News Aggregator:**
```javascript
// backend/src/services/news/aggregator.js
const Parser = require('rss-parser')
const parser = new Parser()

async function fetchGoogleNews(keywords) {
  const results = []

  for (const keyword of keywords) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=de&gl=DE&ceid=DE:de`
    const feed = await parser.parseURL(url)

    for (const item of feed.items) {
      results.push({
        title: item.title,
        url: item.link,
        published_at: new Date(item.pubDate),
        source: item.source?.title || 'Unbekannt',
        snippet: item.contentSnippet,
        keyword: keyword
      })
    }
  }

  return results
}
```

**Acceptance Criteria:**
- ✅ News werden täglich abgerufen
- ✅ Duplikate werden erkannt
- ✅ Keyword-Matching funktioniert
- ✅ Max 100 News/Keyword
- ✅ Rate-Limiting beachtet

---

#### Week 19-20: Curation Workflow

**Tasks:**
- [ ] News-Dashboard im Frontend
- [ ] Filter & Search
- [ ] One-Click zu Nextcloud (API)
- [ ] Status-Tracking (new, reviewed, archived)
- [ ] Bulk-Actions (Move all to Nextcloud)

**Nextcloud Integration:**
```javascript
// backend/src/services/nextcloud/client.js
async function moveNewsToNextcloud(newsItemId, userId) {
  const news = await db.query(
    'SELECT * FROM news_items WHERE id = $1',
    [newsItemId]
  )

  // 1. Create Markdown File
  const content = `
# ${news.title}

**Quelle:** ${news.source}
**Datum:** ${news.published_at}
**URL:** ${news.url}

${news.snippet}
  `

  // 2. Upload zu Nextcloud
  const path = `/Recherche/${news.keyword}/${sanitize(news.title)}.md`
  await nextcloudClient.putFileContents(path, content)

  // 3. Update Status
  await db.query(
    'UPDATE news_items SET status = $1, nextcloud_path = $2 WHERE id = $3',
    ['added_to_research', path, newsItemId]
  )
}
```

**Acceptance Criteria:**
- ✅ News werden als Karten angezeigt
- ✅ Filter nach Keyword/Status funktioniert
- ✅ One-Click Move zu Nextcloud
- ✅ Markdown-Dateien werden erstellt
- ✅ Bulk-Actions möglich

---

## 🔍 Phase 3: Deep Investigation (Q3 2025)

**Duration:** 14 Wochen (Juli - Oktober 2025)
**Goal:** Knowledge Graph + Fact-Checking
**Team:** 2.0 FTE (komplex!)

---

### Sprint 11-13: Epic 4 - Knowledge Graph (Weeks 21-29)

**Objective:** North Data Integration + Graph-Visualisierung

#### Week 21-22: North Data API

**Tasks:**
- [ ] North Data API-Schlüssel beantragen
- [ ] Authentication-Flow implementieren
- [ ] Company-Lookup-Funktion
- [ ] Person-Lookup-Funktion
- [ ] Rate-Limiting (API-Credits sparen)
- [ ] Caching-Strategie (Redis)

**North Data Client:**
```javascript
// backend/src/services/north-data/client.js
class NorthDataClient {
  async lookupCompany(name) {
    // 1. Check Cache
    const cached = await redis.get(`northdata:company:${name}`)
    if (cached) return JSON.parse(cached)

    // 2. API Call
    const response = await fetch(
      `https://api.north-data.com/companies?query=${name}`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    )

    const data = await response.json()

    // 3. Cache for 30 days
    await redis.setex(`northdata:company:${name}`, 2592000, JSON.stringify(data))

    return data
  }

  async getManagement(companyId) {
    const response = await fetch(
      `https://api.north-data.com/companies/${companyId}/management`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    )

    return response.json()
  }
}
```

**Acceptance Criteria:**
- ✅ API-Authentifizierung funktioniert
- ✅ Company-Lookup liefert Daten
- ✅ Management-Daten werden abgerufen
- ✅ Caching reduziert API-Calls um 80%
- ✅ Rate-Limiting verhindert Überschreitung

---

#### Week 23-24: Entity Extraction

**Tasks:**
- [ ] Named Entity Recognition (NER)
- [ ] Person-Extraction aus MDR-Artikeln
- [ ] Company-Extraction aus MDR-Artikeln
- [ ] Auto-Linking zu North Data
- [ ] Confidence-Scoring

**NER with OpenAI:**
```javascript
// backend/src/services/ner/extractor.js
async function extractEntities(articleText) {
  const prompt = `
Extrahiere alle Personen und Firmen aus folgendem Artikel:

${articleText}

Ausgabe als JSON:
{
  "persons": [{"name": "Max Mustermann", "role": "Bürgermeister"}],
  "companies": [{"name": "Beispiel GmbH", "context": "Bauvorhaben"}]
}
  `

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })

  return JSON.parse(response.choices[0].message.content)
}
```

**Acceptance Criteria:**
- ✅ Personen werden korrekt extrahiert
- ✅ Firmen werden erkannt
- ✅ Rollen/Kontext werden erfasst
- ✅ Confidence-Score >0.8
- ✅ False-Positives <10%

---

#### Week 25-26: Neo4j Graph Population

**Tasks:**
- [ ] Cypher-Query-Builder
- [ ] Node-Creation (Person, Company, Article)
- [ ] Relationship-Creation
- [ ] Batch-Insert-Optimierung
- [ ] Graph-Update-Strategie

**Graph Builder:**
```javascript
// backend/src/services/graph/builder.js
async function buildGraphFromArticle(articleId) {
  const article = await db.query('SELECT * FROM mdr_articles WHERE id = $1', [articleId])
  const entities = await extractEntities(article.full_text)

  // 1. Create Article Node
  await neo4j.run(`
    MERGE (a:Article {id: $id})
    SET a.title = $title,
        a.url = $url,
        a.published_at = $published_at
  `, article)

  // 2. Create Person Nodes + Relationships
  for (const person of entities.persons) {
    await neo4j.run(`
      MERGE (p:Person {name: $name})
      SET p.role = $role

      MERGE (a:Article {id: $articleId})
      MERGE (p)-[:MENTIONED_IN {context: $context}]->(a)
    `, { ...person, articleId })

    // 3. Lookup in North Data
    const northData = await northDataClient.lookupPerson(person.name)
    if (northData) {
      await linkToNorthData(person, northData)
    }
  }
}
```

**Acceptance Criteria:**
- ✅ Nodes werden ohne Duplikate erstellt
- ✅ Relationships werden korrekt verknüpft
- ✅ North Data Infos werden gemerged
- ✅ Batch-Insert <1 Min/Artikel
- ✅ Graph bleibt konsistent

---

#### Week 27-28: Graph Visualization

**Tasks:**
- [ ] React Flow Integration
- [ ] Layout-Algorithmen (force-directed)
- [ ] Node-Styling nach Typ
- [ ] Interactive Exploration (Zoom, Pan, Click)
- [ ] Shortest-Path-Query
- [ ] Export als PNG/SVG

**Frontend Graph:**
```jsx
// frontend/src/components/KnowledgeGraph.jsx
import ReactFlow, { Background, Controls } from 'reactflow'

function KnowledgeGraph({ entityId }) {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  useEffect(() => {
    fetchGraphData(entityId).then(data => {
      setNodes(data.nodes)
      setEdges(data.edges)
    })
  }, [entityId])

  const onNodeClick = (event, node) => {
    if (node.type === 'person') {
      fetchExtendedNetwork(node.id)
    }
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={onNodeClick}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  )
}
```

**Acceptance Criteria:**
- ✅ Graph wird korrekt visualisiert
- ✅ Nodes sind unterscheidbar (Farben/Icons)
- ✅ Zoom & Pan funktioniert
- ✅ Click öffnet Details
- ✅ Export als Bild möglich

---

#### Week 29: Investigative Queries

**Tasks:**
- [ ] "Finde Verbindungen zwischen X und Y"
- [ ] Shortest-Path-Algorithmus
- [ ] Subgraph-Extraktion
- [ ] Query-Builder-UI
- [ ] Result-Highlighting im Graph

**Cypher Query:**
```cypher
// Shortest Path zwischen Person und Company
MATCH path = shortestPath(
  (p:Person {name: $personName})-[*]-(c:Company {name: $companyName})
)
RETURN path
```

**Acceptance Criteria:**
- ✅ Shortest Path findet Verbindung
- ✅ Max-Depth-Limit (3 Hops)
- ✅ Query-Zeit <2 Sekunden
- ✅ Path wird im Graph hervorgehoben
- ✅ Alle Zwischenknoten werden angezeigt

---

### Sprint 14-15: Epic 6 - Live Fact-Checking (Weeks 30-33)

**Objective:** In-Editor Verifikation mit Ampel-System

#### Week 30-31: Fact-Check Engine

**Tasks:**
- [ ] Claim-Extraction aus Text
- [ ] Multi-Source-Verification:
  - [ ] Eigenes Archiv (Vector Search)
  - [ ] Google Search (Serpapi)
  - [ ] Official Sources (Statistisches Bundesamt)
- [ ] Confidence-Scoring-Algorithmus
- [ ] Source-Ranking

**Fact Checker:**
```javascript
// backend/src/services/fact-check/checker.js
async function checkClaim(claim, context) {
  const sources = []

  // 1. Check Own Archive
  const archiveResults = await vectorSearch(claim)
  sources.push(...archiveResults.map(r => ({
    type: 'own_archive',
    title: r.title,
    excerpt: r.text_chunk,
    url: r.url,
    relevance: r.similarity
  })))

  // 2. Google Search
  const googleResults = await serpapi.search(claim)
  sources.push(...googleResults.organic_results.map(r => ({
    type: 'web',
    title: r.title,
    excerpt: r.snippet,
    url: r.link,
    relevance: r.position <= 3 ? 0.9 : 0.7
  })))

  // 3. Official Sources
  const officialResults = await checkOfficialSources(claim)
  sources.push(...officialResults)

  // 4. AI Analysis
  const analysis = await analyzeWithLLM(claim, sources)

  return {
    status: analysis.status, // 'verified', 'disputed', 'false'
    confidence: analysis.confidence,
    sources: sources,
    analysis: analysis.reasoning
  }
}
```

**Acceptance Criteria:**
- ✅ Claim wird korrekt extrahiert
- ✅ Min 3 Quellen werden gecheckt
- ✅ Confidence-Score ist nachvollziehbar
- ✅ Status ist korrekt (grün/gelb/rot)
- ✅ Response-Zeit <10 Sekunden

---

#### Week 32-33: Editor Integration

**Tasks:**
- [ ] Text-Selection-Handler
- [ ] "Check Fact"-Button
- [ ] Inline-Ampel-Display
- [ ] Source-Sidebar
- [ ] Fact-Check-History

**Editor Component:**
```jsx
// frontend/src/components/FactCheckEditor.jsx
function FactCheckEditor() {
  const [selection, setSelection] = useState(null)
  const [checkResult, setCheckResult] = useState(null)

  const handleCheckFact = async () => {
    const selectedText = window.getSelection().toString()
    const result = await api.checkFact(selectedText)
    setCheckResult(result)
  }

  return (
    <div className="editor">
      <textarea
        onSelect={(e) => {
          const text = e.target.value.substring(
            e.target.selectionStart,
            e.target.selectionEnd
          )
          setSelection(text)
        }}
      />

      {selection && (
        <button onClick={handleCheckFact}>
          ✓ Fact Check
        </button>
      )}

      {checkResult && (
        <FactCheckResult
          status={checkResult.status}
          sources={checkResult.sources}
          confidence={checkResult.confidence}
        />
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- ✅ Text-Auswahl wird erkannt
- ✅ Button erscheint bei Selektion
- ✅ Ampel zeigt korrekten Status
- ✅ Sources sind klickbar
- ✅ History speichert alle Checks

---

## 📊 Success Metrics

### Phase 1 (Foundation)
- **Infrastructure:** Alle Container laufen stabil (99% Uptime)
- **AI Router:** 95% API-Requests erfolgreich
- **Portfolio:** 90% MDR-Artikel werden gefunden
- **RAG Chat:** Response-Zeit <5 Sekunden

### Phase 2 (Intelligence)
- **Transcription:** 95% Accuracy (Deutsch)
- **Smart Quotes:** 100% Copy-Erfolgsrate
- **News Radar:** Täglich 50+ relevante News
- **Curation:** 80% werden zu Nextcloud bewegt

### Phase 3 (Investigation)
- **Graph:** 1000+ Nodes nach 1 Monat
- **North Data:** <100 API-Calls/Monat (Kosten <€50)
- **Fact Check:** 90% korrekte Verifikation
- **User Satisfaction:** NPS >50

---

## 💰 Budget & Resources

### Infrastructure (Monthly)
| Item | Cost | Notes |
|------|------|-------|
| Hetzner CX51 VPS | €26,41 | 8 vCPU, 16GB RAM |
| North Data API | €0-50 | Pay-per-use |
| OpenAI APIs | €10-40 | Embeddings + GPT |
| Google News | FREE | 100 req/day |
| **TOTAL** | **€36-116** | |

### Development Team
| Role | FTE | Duration | Cost (€50/h) |
|------|-----|----------|--------------|
| Backend Dev | 1.0 | 36 weeks | €72.000 |
| Frontend Dev | 0.7 | 36 weeks | €50.400 |
| DevOps | 0.3 | 12 weeks | €7.200 |
| **TOTAL** | **1.7** | | **€129.600** |

**Hinweis:** Bei Solo-Developer = 9 Monate Vollzeit

---

## 🚨 Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MDR blockiert Scraper | HIGH | MEDIUM | RSS-Fallback + Manual URL |
| North Data zu teuer | MEDIUM | HIGH | Caching + User-Limits |
| Neo4j RAM-Limit (4GB) | MEDIUM | MEDIUM | Upgrade zu Enterprise |
| Whisper zu langsam (CPU) | MEDIUM | LOW | GPU-Instance oder OpenAI API |
| User-Overwhelm | HIGH | HIGH | Feature-Flags + Onboarding |

---

## ✅ Quality Gates

Jede Phase benötigt Approval:

### Phase 1 Gates
- [ ] Alle Container-Health-Checks grün
- [ ] AI-Router: 100 Test-Requests erfolgreich
- [ ] MDR-Scraper: 10 Artikel erfolgreich gescraped
- [ ] RAG-Chat: 10 korrekte Antworten in Testdatensatz

### Phase 2 Gates
- [ ] Transkription: 3 Test-Audios (30min, 60min, 90min) erfolgreich
- [ ] News-Radar: 1 Woche stabile Aggregation
- [ ] Nextcloud-Integration: 20 News erfolgreich bewegt

### Phase 3 Gates
- [ ] Graph: 100+ Nodes erfolgreich angelegt
- [ ] North Data: 10 Companies erfolgreich gelinked
- [ ] Fact-Check: 20 Claims mit >90% Accuracy

---

## 📚 Documentation Requirements

Jedes Epic braucht:
- [ ] API-Dokumentation (OpenAPI/Swagger)
- [ ] User-Guide (Markdown in `/docs`)
- [ ] Developer-Setup-Guide
- [ ] Deployment-Guide
- [ ] Troubleshooting-FAQ

---

## 🎯 Next Immediate Actions

### Week 0 (Vorbereitung)
1. **Legal Review:**
   - [ ] MDR.de Nutzungsbedingungen prüfen
   - [ ] North Data API-Vertrag anfragen
   - [ ] DSGVO-Assessment für Audio-Transkripte

2. **Proof of Concepts:**
   - [ ] MDR-Scraping-Test (3 Artikel manuell)
   - [ ] North Data Sandbox-Zugang
   - [ ] Whisper Local vs API Benchmark

3. **User Research:**
   - [ ] 3-5 Interviews mit MDR-Journalisten
   - [ ] Feature-Prioritäts-Umfrage
   - [ ] Pain-Points-Workshop

4. **Team Onboarding:**
   - [ ] Entwicklungsumgebung aufsetzen
   - [ ] Architecture Spec reviewen
   - [ ] Sprint 1 Planning

---

**Status:** ✅ Roadmap fertig - Bereit für Implementierung!

**Nächster Schritt:** Sprint 1 Planning-Meeting

---

*For updates, see Changelog in UI (Footer → Changelog)*
