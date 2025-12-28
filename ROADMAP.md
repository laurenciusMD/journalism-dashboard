# Journalism Dashboard - Feature Roadmap
## Investigativer Journalismus & OSINT Integration

Basierend auf journalistischen Workflow-Anforderungen für investigative Recherche.

---

## 1. Funktionsmodule (Kernfunktionen)

### 1.1 Quellenmanagement ✅ (Teilweise)
**Status:** Basis vorhanden (Nextcloud Integration)
**Fehlend:** Strukturierte Quellenbewertung, Metadaten, Vertrauenswürdigkeit

**Begründung:** Quellen sind das Fundament. Ohne systematische Erfassung und Bewertung verliert man den Überblick.

**Umsetzung:**
- Quellenregister mit Kategorien (Primär, Sekundär, Tertiär)
- Vertrauenswürdigkeits-Score
- Kontaktdaten, Zugangsmethoden
- Abrufdatum, Archivinformationen

### 1.2 Entity Recognition & Tracking
**Status:** Nicht vorhanden
**Fehlend:** Automatische Erkennung von Personen, Organisationen, Orten

**Begründung:** In komplexen Recherchen tauchen Dutzende Akteure auf. Manuelles Tracking ist fehleranfällig.

**Umsetzung:**
- NER (Named Entity Recognition) via Gemini/Claude
- Entity-Datenbank: Personen, Orgs, Orte, Ereignisse
- Automatische Verlinkung in Texten
- Alias-Verwaltung (verschiedene Schreibweisen)

### 1.3 Chronologie-Builder (Timeline)
**Status:** Nicht vorhanden
**Fehlend:** Zeitstrahl für Ereignisse, Dokumente, Aussagen

**Begründung:** Zeitliche Abläufe sind zentral für investigative Arbeit. Widersprüche zeigen sich oft in der Chronologie.

**Umsetzung:**
- Ereignis-Timeline mit Datums-Parsing
- Visualisierung als Zeitstrahl
- Quellenverknüpfung pro Ereignis
- Konflikte markieren (unterschiedliche Zeitangaben)

### 1.4 Beziehungsgraph (Relationship Mapping)
**Status:** Nicht vorhanden
**Fehlend:** Visuelle Darstellung von Verbindungen zwischen Akteuren

**Begründung:** Netzwerke und Beziehungen sind oft der Kern einer Story.

**Umsetzung:**
- Graph-Datenbank oder JSON-basierte Relationships
- Visualisierung (D3.js, Cytoscape.js)
- Beziehungstypen: Geschäftlich, Familär, Politisch, etc.
- Gewichtung nach Evidenz-Stärke

### 1.5 Recherche-Dossiers (Case Files)
**Status:** Nicht vorhanden
**Fehlend:** Strukturierte Arbeitsräume pro Recherche

**Begründung:** Mehrere Recherchen parallel. Jede braucht eigenen Raum mit Kontext.

**Umsetzung:**
- Dossier = Container für: Notizen, Quellen, Entities, Timeline, Hypothesen
- Versionierung (Git-like History)
- Export als PDF/HTML (Belegdokumentation)
- Zugriffskontrolle (falls Team-Nutzung)

### 1.6 Hypothesen & Offene Fragen
**Status:** Nicht vorhanden
**Fehlend:** Strukturierte Liste von Annahmen und offenen Punkten

**Begründung:** Recherche ist iterativ. Hypothesen müssen nachvollziehbar sein, um Bias zu vermeiden.

**Umsetzung:**
- Hypothesen-Board pro Dossier
- Status: Ungeprüft, Bestätigt, Widerlegt, Unklar
- Verknüpfung mit Belegen
- Changelog (wann Hypothese aufgestellt/verworfen)

### 1.7 Evidence Vault (Beweismittel-Archiv)
**Status:** Teilweise (Nextcloud Speicher)
**Fehlend:** Strukturierte Archivierung mit Provenance

**Begründung:** Belege müssen unveränderbar archiviert sein. Herkunft nachweisbar.

**Umsetzung:**
- SHA256-Hashing bei Upload
- Metadaten: Abrufdatum, Quelle, Methode
- Write-Once-Read-Many Prinzip
- Chain of Custody Tracking

### 1.8 OSINT Tool Integration
**Status:** Nicht vorhanden
**Fehlend:** Einbindung von Open Source Intelligence Tools

**Begründung:** Manuelle OSINT ist zeitaufwändig. Automatisierung wo legal und sinnvoll.

**Umsetzung:** Siehe Abschnitt 6 (detailliert)

### 1.9 Dokumenten-OCR & Parsing
**Status:** Nicht vorhanden
**Fehlend:** PDFs durchsuchbar machen, Tabellen extrahieren

**Begründung:** Viele Quellen sind Scans. Ohne OCR nicht durchsuchbar.

**Umsetzung:**
- Tesseract OCR Integration
- PDF → Text (mit Layout-Erhaltung)
- Tabellen-Extraktion (Camelot, Tabula)
- Volltext-Suche

### 1.10 Faktencheck-Workflow
**Status:** Teilweise (Gemini Korrektur)
**Fehlend:** Strukturierte Fact-Checking-Pipeline

**Begründung:** Jede Behauptung muss überprüfbar sein.

**Umsetzung:**
- Fact-Claim-Datenbank
- Verifikationsstatus: Geprüft, Ungeprüft, Wahr, Falsch, Unklar
- Belege pro Claim
- Widersprüche automatisch erkennen

### 1.11 Kontakt & Interview Management
**Status:** Nicht vorhanden
**Fehlend:** Tracking von Gesprächspartnern, Interview-Notizen

**Begründung:** Wer hat wann was gesagt? Interview-Transkripte müssen auffindbar sein.

**Umsetzung:**
- Kontakt-Datenbank
- Interview-Protokolle (Datum, Ort, Kontext)
- Zitate mit Quellenangabe
- Einwilligungen tracking

### 1.12 Deadline & Task Tracker
**Status:** Nicht vorhanden
**Fehlend:** Einfaches Task-Management ohne PM-Overkill

**Begründung:** Deadlines und offene Punkte nicht vergessen.

**Umsetzung:**
- Einfache Todo-Liste pro Dossier
- Deadline-Reminder
- Kein Kanban, kein Scrum - nur Liste

---

## 2. Daten & Recherche Layer

### 2.1 Quellensammlung

**Datenmodell:**
```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  type TEXT, -- web, document, interview, database
  url TEXT,
  title TEXT,
  author TEXT,
  published_at TIMESTAMP,
  retrieved_at TIMESTAMP NOT NULL,
  trustworthiness_score INTEGER, -- 1-5
  access_method TEXT, -- public, archive, foi_request
  notes TEXT,
  file_path TEXT, -- wenn gespeichert
  file_hash TEXT, -- SHA256
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features:**
- Import von URLs (mit Snapshot via Archive.org)
- Automatische Metadaten-Extraktion (OpenGraph, Schema.org)
- Duplikaterkennung
- Kategorisierung (Primärquelle, Sekundärquelle)

### 2.2 Entity Erkennung

**Datenmodell:**
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  type TEXT, -- person, organization, location, event
  name TEXT NOT NULL,
  aliases TEXT[], -- andere Schreibweisen
  description TEXT,
  metadata JSONB, -- flexibel
  confidence_score FLOAT, -- NER Confidence
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_mentions (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  source_id UUID REFERENCES sources(id),
  context TEXT, -- Satz/Absatz
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Parser:**
- Gemini/Claude für NER
- spaCy als Fallback (Open Source, lokal)
- Manuelle Korrektur möglich

### 2.3 Zeitachsen & Chronologie

**Datenmodell:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  event_date_precision TEXT, -- exact, month, year, circa
  source_id UUID REFERENCES sources(id),
  evidence TEXT[], -- Array von Evidence IDs
  confidence TEXT, -- confirmed, alleged, disputed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_relationships (
  id UUID PRIMARY KEY,
  event_a_id UUID REFERENCES events(id),
  event_b_id UUID REFERENCES events(id),
  relationship_type TEXT, -- caused_by, followed_by, contradicts
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Visualisierung:**
- Horizontale Timeline (vis.js Timeline)
- Zoom, Filter nach Confidence
- Konflikte rot markieren

---

## 3. Arbeitsräume (Dossiers)

### Konzept: Recherche-Dossier

**Struktur:**
```
Dossier "Wirecard Skandal"
├── Übersicht
│   ├── Titel, Beschreibung
│   ├── Status (aktiv, archiviert)
│   └── Team (falls kollaborativ)
├── Hypothesen
│   ├── "Bilanzfälschung seit 2015"
│   │   ├── Status: Bestätigt
│   │   ├── Belege: [doc1, doc2]
│   │   └── Changelog
│   └── "EY war involviert"
│       ├── Status: Unklar
│       └── Offene Fragen
├── Offene Fragen
│   ├── "Wo ist Marsalek?"
│   └── "Welche Behörden wussten Bescheid?"
├── Quellen (120)
├── Entities
│   ├── Personen (45)
│   ├── Organisationen (12)
│   └── Orte (8)
├── Timeline (80 Ereignisse)
├── Beziehungsgraph
├── Evidence Vault (230 Dokumente)
└── Notizen
    ├── Interview-Protokolle (5)
    └── Analyse-Notizen (23)
```

**Versionierung:**
- Git-basiert (jede Änderung = Commit)
- Diffing für Texte
- Audit Log für Datenbank-Änderungen

**Export:**
- PDF: Vollständiges Dossier mit allen Belegen
- HTML: Interaktive Version
- JSON: Maschinenlesbar

---

## 4. Visualisierung

### 4.1 Timeline (Zeitachse)

**Library:** vis.js Timeline
**Features:**
- Zoom (Tag bis Jahr)
- Gruppierung (Personen, Ereignistypen)
- Tooltips mit Details
- Farbcodierung nach Confidence
- Export als PNG

**Beispiel:**
```
2015 ─────────────── 2020 ─────────────── 2024
  │                    │                    │
  ├ Q2: Bilanz veröffentlicht (bestätigt)
  │                    ├ FT Article (bestätigt)
  │                    │  ├ BaFin Razzia (bestätigt)
  │                    │                    ├ Insolvenz
```

### 4.2 Beziehungsgraph

**Library:** Cytoscape.js oder D3.js Force Layout
**Features:**
- Nodes: Entities (Personen, Orgs)
- Edges: Beziehungen (mit Labels)
- Gewichtung nach Evidence-Stärke
- Klick auf Node → Details
- Filter: Beziehungstyp, Zeitraum

**Beispiel:**
```
[Markus Braun] ──CEO──> [Wirecard AG]
       │                     │
   Geschäftspartner      Prüfer
       │                     │
       v                     v
 [Jan Marsalek]  <──────  [EY]
```

### 4.3 Dossier-Dashboard

**Minimalistisch:**
- Statusübersicht: Hypothesen (3 bestätigt, 2 offen)
- Quellen: 120 erfasst, 45 geprüft
- Timeline: 80 Ereignisse
- Offene Fragen: 12
- Letzte Aktivität

**Keine** Gantt-Charts, Burn-Down-Charts, Velocity Tracking.

---

## 5. Workflow-Automationen

### 5.1 Erinnerungen

**Use Cases:**
- "Quelle X in 7 Tagen erneut prüfen"
- "Interview Y transkribieren"
- "FOI Request Status checken"

**Umsetzung:**
- Simple Reminders (nicht Jira-Tickets)
- Email/In-App Notification
- Snooze-Funktion

### 5.2 Offene Punkte Tracking

**Dashboard:**
- Ungeklärte Hypothesen
- Quellen ohne Verifikation
- Events ohne Datum
- Entities ohne Beschreibung

**Automatisch:**
- "15 Quellen haben kein Abrufdatum"
- "3 Hypothesen seit 30 Tagen ungeprüft"

### 5.3 Daten-Updates

**Szenarien:**
- Automatisches Archivieren von Web-Quellen (Archive.org API)
- RSS-Feeds für Keywords
- Google Alerts Integration

**Kein:**
- Automatisches Scraping
- Aggressive Crawler
- API-Missbrauch

---

## 6. OSINT Integration in Docker

### 6.1 Plugin-System für OSINT-Tools

**Tool Definition (YAML):**
```yaml
tool_id: spiderfoot
name: SpiderFoot
version: "4.0"
type: api # oder cli
description: "OSINT Reconnaissance Tool"

input_schema:
  - name: target
    type: string
    required: true
    description: "Domain, IP, Email, Name"
  - name: modules
    type: array
    required: false
    default: ["safe"]
    allowlist: ["safe", "footprint", "passive"]

output_format: json

parser:
  type: custom
  file: "parsers/spiderfoot_parser.py"

evidence_mapping:
  emails: entity.email
  domains: entity.domain
  ips: entity.ip

legal_notice: "Nur auf eigene Domains oder mit Genehmigung nutzen"
```

**Plugin Interface (Backend):**
```python
class OSINTPlugin:
    def __init__(self, config: dict):
        self.tool_id = config['tool_id']
        self.name = config['name']
        self.version = config['version']

    def validate_input(self, params: dict) -> bool:
        """Prüft Input gegen Schema"""
        pass

    def run(self, params: dict) -> JobResult:
        """Führt Tool aus"""
        pass

    def parse_output(self, raw_output: str) -> dict:
        """Parst Rohausgabe"""
        pass

    def create_evidence(self, parsed_data: dict) -> List[Evidence]:
        """Erstellt Evidence Items"""
        pass
```

### 6.2 Tool Runner / Job Service

**Backend Service (Node.js):**
```javascript
// backend/src/services/osintService.js

class OSINTJobRunner {
  async runTool(job) {
    const { case_id, tool_id, target, params, user_id } = job;

    // 1. Validate
    const tool = await this.loadTool(tool_id);
    if (!tool.validateInput(params)) {
      throw new Error('Invalid params');
    }

    // 2. Create Job Record
    const jobId = await db.createJob({
      case_id,
      tool_id,
      target,
      params,
      user_id,
      status: 'running',
      started_at: new Date()
    });

    // 3. Execute (containerized or API)
    const result = await this.executeToolSafe(tool, params);

    // 4. Store Raw Output
    const outputPath = `/evidence/${jobId}/raw_output.json`;
    await fs.writeFile(outputPath, result.stdout);
    const hash = crypto.createHash('sha256').update(result.stdout).digest('hex');

    // 5. Parse
    const parsed = tool.parse_output(result.stdout);

    // 6. Create Evidence Items
    const evidence = await tool.createEvidence(parsed, {
      job_id: jobId,
      retrieved_at: new Date(),
      sha256: hash,
      tool_version: tool.version
    });

    // 7. Update Job
    await db.updateJob(jobId, {
      status: 'completed',
      ended_at: new Date(),
      exit_code: result.exit_code,
      evidence_count: evidence.length
    });

    return { jobId, evidence };
  }

  async executeToolSafe(tool, params) {
    if (tool.type === 'cli') {
      // Docker container execution
      return await this.runInDocker(tool, params);
    } else if (tool.type === 'api') {
      // API call
      return await this.callAPI(tool, params);
    }
  }

  async runInDocker(tool, params) {
    const docker = new Docker();
    const container = await docker.createContainer({
      Image: tool.docker_image,
      Cmd: tool.buildCommand(params),
      NetworkMode: 'osint-isolated', // Netzwerk-Isolation
      HostConfig: {
        Memory: 512 * 1024 * 1024, // 512 MB limit
        CpuShares: 512
      }
    });

    await container.start();
    const stream = await container.logs({ stdout: true, stderr: true });
    const output = await streamToString(stream);
    const inspect = await container.inspect();

    await container.remove();

    return {
      stdout: output,
      stderr: inspect.stderr,
      exit_code: inspect.State.ExitCode
    };
  }
}
```

**Job Queue:**
- Bull (Redis-basiert)
- Worker-Prozess für lange Jobs
- Rate Limiting (nicht API-Limits sprengen)

### 6.3 Tool-Auswahl (Legal & Sinnvoll)

#### Tool 1: theHarvester

**Beschreibung:** Sammelt Emails, Subdomains, IPs aus öffentlichen Quellen
**Legal:** Ja (nur Public Data, keine Exploits)
**Methode:** CLI

**Input:**
```yaml
target: example.com
sources: [google, bing, linkedin]
limit: 100
```

**Output (Beispiel):**
```json
{
  "emails": [
    "info@example.com",
    "press@example.com"
  ],
  "hosts": [
    "mail.example.com",
    "www.example.com"
  ],
  "ips": ["93.184.216.34"]
}
```

**Parser:**
```python
def parse_harvester_output(raw_json):
    data = json.loads(raw_json)
    entities = []

    for email in data.get('emails', []):
        entities.append({
            'type': 'email',
            'value': email,
            'confidence': 0.8
        })

    for host in data.get('hosts', []):
        entities.append({
            'type': 'domain',
            'value': host,
            'confidence': 0.9
        })

    return entities
```

**False Positives:**
- Generische Emails (admin@, info@) → niedrige Relevanz
- Veraltete Subdomains → DNS-Check

#### Tool 2: SpiderFoot (API Mode)

**Beschreibung:** Umfassende OSINT-Plattform
**Legal:** Ja (hat "safe modules" nur passive Recherche)
**Methode:** API (Web UI + REST API)

**Input:**
```json
{
  "target": "john.doe@example.com",
  "modules": [
    "sfp_emailrep",
    "sfp_haveibeenpwned",
    "sfp_hunter"
  ]
}
```

**Output:**
```json
{
  "results": [
    {
      "module": "sfp_emailrep",
      "type": "EMAILADDR_DELIVERABLE",
      "data": "john.doe@example.com",
      "source": "emailrep.io"
    },
    {
      "module": "sfp_haveibeenpwned",
      "type": "BREACH",
      "data": "Found in LinkedIn breach 2021",
      "source": "haveibeenpwned.com"
    }
  ]
}
```

**Parser:**
```javascript
function parseSpiderFoot(results) {
  const evidence = [];

  for (const result of results) {
    evidence.push({
      type: 'data_breach',
      entity: result.data,
      source: result.source,
      description: result.data,
      confidence: result.module === 'sfp_haveibeenpwned' ? 0.95 : 0.7
    });
  }

  return evidence;
}
```

**False Positives:**
- Email-Validierung kann fehlschlagen → manuell prüfen
- Breaches ≠ aktuell kompromittiert

#### Tool 3: Shodan (API, konservativ)

**Beschreibung:** Suchmaschine für Internet-Geräte
**Legal:** Ja (nur öffentliche Scans, keine Exploits)
**Methode:** API

**Input:**
```json
{
  "query": "hostname:example.com",
  "facets": ["port", "country"]
}
```

**Output:**
```json
{
  "total": 5,
  "results": [
    {
      "ip": "93.184.216.34",
      "port": 443,
      "product": "nginx",
      "version": "1.21.0",
      "location": { "country": "US" }
    }
  ]
}
```

**Parser:**
```python
def parse_shodan(data):
    infrastructure = []

    for result in data['results']:
        infrastructure.append({
            'type': 'server',
            'ip': result['ip'],
            'port': result['port'],
            'software': f"{result.get('product', 'unknown')} {result.get('version', '')}",
            'location': result['location']['country']
        })

    return infrastructure
```

**Journalistische Nutzung:**
- Infrastruktur einer Organisation verstehen
- Server-Standorte (Datenschutz-Fragen)
- Veraltete Software (Sicherheitsproblematik)

**False Positives:**
- Shared Hosting → nicht unbedingt Target
- CDN-IPs → irrelevant

### 6.4 Datenmodell-Ergänzung

```sql
-- OSINT Tool Runs
CREATE TABLE tool_runs (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  tool_id TEXT NOT NULL,
  tool_version TEXT,
  target TEXT NOT NULL,
  params JSONB,
  user_id UUID REFERENCES users(id),
  status TEXT, -- queued, running, completed, failed
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  exit_code INTEGER,
  raw_output_path TEXT,
  parsed_output JSONB,
  evidence_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Evidence Items
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  tool_run_id UUID REFERENCES tool_runs(id),
  type TEXT, -- email, domain, ip, breach, document
  value TEXT,
  description TEXT,
  metadata JSONB,
  sha256 TEXT, -- Hash des Rohwerts
  retrieved_at TIMESTAMP NOT NULL,
  source_url TEXT,
  provenance TEXT, -- "SpiderFoot v4.0 via API on 2024-01-15"
  confidence_score FLOAT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Entities (erweitert)
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  type TEXT,
  name TEXT NOT NULL,
  aliases TEXT[],
  description TEXT,
  metadata JSONB,
  evidence_refs UUID[], -- Array von Evidence IDs
  confidence_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Relationships
CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  entity_a_id UUID REFERENCES entities(id),
  entity_b_id UUID REFERENCES entities(id),
  relationship_type TEXT, -- works_for, owns, partners_with
  description TEXT,
  evidence_refs UUID[],
  confidence_score FLOAT,
  from_date DATE,
  to_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  dossier_id UUID,
  user_id UUID REFERENCES users(id),
  action TEXT, -- tool_run, entity_created, evidence_added
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 6.5 Docker Compose Skizze

```yaml
version: '3.8'

services:
  # === Backend ===
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/journalism
      - REDIS_URL=redis://redis:6379
    volumes:
      - evidence-storage:/app/evidence
    networks:
      - app-internal
    depends_on:
      - postgres
      - redis

  # === Frontend ===
  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    networks:
      - app-internal

  # === Database ===
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=journalism
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-internal

  # === Redis (Job Queue) ===
  redis:
    image: redis:7-alpine
    networks:
      - app-internal

  # === OSINT Worker ===
  osint-worker:
    build: ./osint-worker
    environment:
      - REDIS_URL=redis://redis:6379
    volumes:
      - evidence-storage:/app/evidence
      - /var/run/docker.sock:/var/run/docker.sock # Für Docker-in-Docker
    networks:
      - app-internal
      - osint-outbound
    depends_on:
      - redis

  # === Tool Containers (on-demand) ===
  # Werden dynamisch gestartet, nicht dauerhaft

networks:
  app-internal:
    driver: bridge
  osint-outbound:
    driver: bridge
    # Outbound für OSINT-Tools (isoliert)

volumes:
  postgres-data:
  evidence-storage:
```

**Sicherheit:**
- `osint-outbound` Netzwerk hat **keine** Zugriff auf `app-internal`
- Tool-Container haben Memory/CPU Limits
- Evidence Storage ist Write-Once

---

## 7. Technische Umsetzung (Module)

### 7.1 Quellenmanagement

**Frontend:**
```jsx
// SourceManager.jsx
- List View: Alle Quellen mit Filter/Sort
- Detail View: Quelle mit Metadaten
- Add Source: URL oder Upload
- Batch Import: CSV
```

**Backend:**
```javascript
// routes/sources.js
POST   /api/dossiers/:id/sources
GET    /api/dossiers/:id/sources
GET    /api/sources/:id
PATCH  /api/sources/:id
DELETE /api/sources/:id
```

**Libraries:**
- `metascraper` (Metadaten aus URLs)
- `wayback-machine-downloader` (Archivierung)

### 7.2 Entity Recognition

**Frontend:**
```jsx
// EntityPanel.jsx
- Entity List (Personen, Orgs, Orte)
- Entity Detail mit Mentions
- Graph View
```

**Backend:**
```javascript
// services/nerService.js
- Gemini API für NER
- spaCy (lokal, Python subprocess)
```

**Libraries:**
- `@anthropic-ai/sdk` (Claude)
- `@google/generative-ai` (Gemini)
- spaCy (Python, via API)

### 7.3 Timeline

**Frontend:**
```jsx
// Timeline.jsx
import { Timeline } from 'vis-timeline';
```

**Backend:**
```javascript
// routes/events.js
POST   /api/dossiers/:id/events
GET    /api/dossiers/:id/events
PATCH  /api/events/:id
```

**Libraries:**
- `vis-timeline` (Visualisierung)

### 7.4 OSINT Tool Runner

**Frontend:**
```jsx
// OSINTPanel.jsx
- Tool Selector (theHarvester, SpiderFoot, Shodan)
- Input Form
- Job Status
- Results Table
```

**Backend:**
```javascript
// services/osintService.js
- Job Queue (Bull)
- Docker Runner (dockerode)
- Parser Registry
```

**Libraries:**
- `bull` (Redis Queue)
- `dockerode` (Docker API)

---

## 8. Was bewusst weglassen

### ❌ Nicht implementieren:

1. **Aggressive Scraping**
   - Robots.txt ignorieren
   - Rate Limits umgehen
   - Paywall-Bypass
   **Warum:** Legal fragwürdig, unethisch

2. **Offensive Security Tools**
   - Port Scanner (außer passive wie Shodan)
   - Vulnerability Scanner
   - Exploit Frameworks
   **Warum:** Irrelevant für Journalismus, potentiell illegal

3. **Social Media Scraping ohne API**
   - Instagram Scraper
   - Twitter ohne API
   - LinkedIn Harvester
   **Warum:** Verstößt gegen ToS, rechtlich riskant

4. **Darknet Monitoring**
   - Automated Onion Crawler
   - Breach Database Downloads
   **Warum:** Rechtlich grau, ethisch fragwürdig

5. **Projektmanagement Overkill**
   - Gantt Charts
   - Sprint Planning
   - Velocity Tracking
   **Warum:** Journalismus ≠ Softwareentwicklung

6. **Automatische Story-Generierung**
   - "KI schreibt Artikel komplett"
   - Automatische Headline-Generierung ohne Kontext
   **Warum:** Journalismus braucht menschliche Urteilskraft

7. **Blockchain/Web3 Integration**
   - "Dezentralisierte Recherche"
   - NFT-basierte Quellen
   **Warum:** Buzzword, kein praktischer Nutzen

8. **Vollautomatische Entscheidungen**
   - "KI entscheidet, was Story-würdig ist"
   - Automatisches Fact-Checking ohne Review
   **Warum:** Bias, False Positives, mangelnde Transparenz

---

## Nächste Schritte (Priorisierung)

### Phase 1: Fundament (Wochen 1-4)
1. Dossier-System (Cases)
2. Quellenmanagement
3. Basale Notizen

### Phase 2: Struktur (Wochen 5-8)
4. Entity Recognition (Gemini/Claude)
5. Timeline (vis.js)
6. Evidence Vault

### Phase 3: OSINT (Wochen 9-12)
7. Plugin-System
8. theHarvester Integration
9. Job Runner

### Phase 4: Visualisierung (Wochen 13-16)
10. Beziehungsgraph
11. Dashboard
12. Export-Funktionen

---

## Technologie-Stack

**Frontend:**
- React (existing)
- vis.js (Timeline)
- Cytoscape.js (Graph)
- React-PDF (Viewer)

**Backend:**
- Node.js/Express (existing)
- PostgreSQL (statt SQLite, für Relations)
- Redis (Job Queue)
- Bull (Queue System)

**OSINT:**
- Docker (Tool Isolation)
- Python (spaCy, Parsers)
- theHarvester (CLI)
- SpiderFoot (API)

**Storage:**
- Nextcloud (existing)
- S3-kompatibel (Minio) für Evidence

---

## Rechtliche Absicherung

### Disclaimer im Tool:
```
WICHTIG: Dieses Tool ist für legalen investigativen Journalismus konzipiert.

Verboten:
- Zugriff auf geschützte Systeme ohne Genehmigung
- Umgehen von Zugangskontrollen
- Automatisches Scraping gegen ToS
- Download/Verbreitung von Breach-Daten

Erlaubt:
- OSINT aus öffentlichen Quellen
- Recherche mit Genehmigung
- Anfragen im Rahmen von Informationsfreiheitsgesetzen

Bei Zweifeln: Juristische Beratung einholen.
```

### Audit Log:
Jede OSINT-Operation wird geloggt:
- Wer (User)
- Wann (Timestamp)
- Was (Tool, Target, Parameter)
- Warum (Case ID, Notiz)

→ Nachvollziehbarkeit bei rechtlichen Fragen

---

## Zusammenfassung

**Fokus:**
- Struktur, Nachvollziehbarkeit, Belege
- Workflow-Unterstützung, nicht Ersatz
- Legal, ethisch, transparent

**Keine:**
- Hacking-Tools
- Automatische Storys
- PM-Overkill

**Ergebnis:**
Ein Tool, das investigativen Journalismus **unterstützt** durch Struktur, Automatisierung des Tediums und klare Nachvollziehbarkeit - ohne die journalistische Urteilskraft zu ersetzen.
