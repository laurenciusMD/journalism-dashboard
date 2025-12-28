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

## 7. Personendatenbank & Medienmanagement

### 7.1 Konzept: Person-Centric Investigation

**Problem:**
In investigativen Recherchen entstehen umfangreiche Informationen über Personen:
- Aliase und Namensvarianten
- Attribute mit unterschiedlicher Vertrauenswürdigkeit
- Medienassets (Fotos, Videos) ohne klare Zuordnung
- OSINT-Ergebnisse die manuell kuratiert werden müssen

**Lösung:**
Ein evidenzbasiertes Personensystem mit:
- Kanonischen Personendateien
- Attributen mit Quellenangaben
- Manueller Medien-Zuordnung (kein automatisches Facial Recognition)
- OSINT-Import-Workflow mit Bestätigung

### 7.2 Datenmodell: Personen & Attribute

```sql
-- Personen (Canonical Entities)
CREATE TABLE persons (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  canonical_name TEXT NOT NULL, -- "Max Mustermann"
  aliases TEXT[], -- ["M. Mustermann", "Maximilian M."]
  description TEXT,
  confidence_score FLOAT DEFAULT 0.5, -- Wie sicher ist Identität?
  merged_from UUID[], -- Falls Person aus mehreren zusammengeführt
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attribute mit Evidence-Linking
CREATE TABLE person_attributes (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  attribute_type TEXT NOT NULL, -- email, phone, address, role, affiliation
  attribute_value TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  valid_from DATE,
  valid_to DATE,
  source_type TEXT, -- osint, manual, document, interview
  evidence_refs UUID[], -- Links zu evidence_items
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT false -- Manuell bestätigt?
);

-- Beziehungen zwischen Personen
CREATE TABLE person_relationships (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  person_a_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  person_b_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type TEXT, -- colleague, family, business_partner, adversary
  description TEXT,
  confidence_score FLOAT DEFAULT 0.5,
  evidence_refs UUID[],
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicate relationships
  CONSTRAINT unique_relationship UNIQUE (person_a_id, person_b_id, relationship_type)
);

-- Medienassets (Bilder, Videos, Audio)
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  file_type TEXT NOT NULL, -- image, video, audio
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  sha256 TEXT UNIQUE NOT NULL, -- Deduplication
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- für Video/Audio

  -- EXIF/Metadata
  captured_at TIMESTAMP,
  camera_model TEXT,
  gps_latitude FLOAT,
  gps_longitude FLOAT,
  metadata JSONB, -- Vollständige EXIF

  -- Provenance
  source_url TEXT,
  uploaded_by UUID REFERENCES users(id),
  upload_method TEXT, -- url_download, manual_upload, osint_tool
  uploaded_at TIMESTAMP DEFAULT NOW(),

  -- Organization
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Gesichtserkennung (Detection, NICHT Recognition)
CREATE TABLE detected_faces (
  id UUID PRIMARY KEY,
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,

  -- Bounding Box (Koordinaten)
  bbox_x INTEGER NOT NULL,
  bbox_y INTEGER NOT NULL,
  bbox_width INTEGER NOT NULL,
  bbox_height INTEGER NOT NULL,

  -- Detection Qualität
  detection_confidence FLOAT, -- 0.0 - 1.0
  face_quality_score FLOAT, -- Schärfe, Winkel, Beleuchtung

  -- Face Crop (für Review)
  crop_file_path TEXT, -- Ausgeschnittenes Gesicht als separate Datei

  -- Status
  reviewed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Manuelle Face-to-Person Zuordnung (KEIN Automatic Tagging!)
CREATE TABLE face_annotations (
  id UUID PRIMARY KEY,
  detected_face_id UUID REFERENCES detected_faces(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,

  -- Metadata
  annotated_by UUID REFERENCES users(id) NOT NULL,
  annotated_at TIMESTAMP DEFAULT NOW(),
  confidence TEXT, -- certain, probable, uncertain
  notes TEXT,

  -- Prevent duplicate annotations
  CONSTRAINT unique_face_annotation UNIQUE (detected_face_id, person_id)
);

-- Person-Media Verknüpfung (auch ohne Face Detection)
CREATE TABLE person_media (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,

  -- Context
  appears_in_media BOOLEAN DEFAULT true, -- Person ist im Bild/Video
  context TEXT, -- "Pressekonferenz 2023", "Meeting in Hamburg"
  timestamp_in_media INTEGER, -- Sekunde im Video

  -- Source
  tagged_by UUID REFERENCES users(id),
  tagged_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_person_media UNIQUE (person_id, media_asset_id)
);

-- OSINT Import Inbox (Findings Before Confirmation)
CREATE TABLE osint_findings (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  tool_run_id UUID REFERENCES tool_runs(id),

  -- What was found
  finding_type TEXT, -- email, phone, social_profile, address, breach
  finding_value TEXT NOT NULL,
  finding_context TEXT,

  -- Suggested mapping
  suggested_person_id UUID REFERENCES persons(id), -- Falls Matching möglich
  confidence_score FLOAT,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, merged
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  -- If accepted, link to created attribute
  person_attribute_id UUID REFERENCES person_attributes(id),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Merge Log (Deduplication History)
CREATE TABLE person_merge_log (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  primary_person_id UUID REFERENCES persons(id), -- Behalten
  merged_person_id UUID NOT NULL, -- Wurde entfernt (ID bleibt in merged_from)
  reason TEXT,
  merged_by UUID REFERENCES users(id),
  merged_at TIMESTAMP DEFAULT NOW()
);
```

### 7.3 OSINT → Person Import Workflow

**Problem:** OSINT-Tools liefern Rohdaten die oft:
- False Positives enthalten
- Mehrere Personen betreffen
- Unklare Zuordnung haben

**Lösung: Inbox-System**

```
┌─────────────────┐
│  OSINT Tool Run │
│  (theHarvester) │
└────────┬────────┘
         │
         │ Findet: info@example.com, max.m@corp.de
         ▼
┌─────────────────────────┐
│  osint_findings         │
│  Status: pending        │
│                         │
│  1. info@example.com    │
│     → No Match          │
│                         │
│  2. max.m@corp.de       │
│     → Suggested: "Max M"│
│     → Confidence: 0.7   │
└────────┬────────────────┘
         │
         │ User reviews in UI
         ▼
┌─────────────────────────┐
│  Review Interface       │
│                         │
│  [Accept] [Reject] [New]│
└────────┬────────────────┘
         │
         │ User accepts #2
         ▼
┌─────────────────────────┐
│  person_attributes      │
│                         │
│  person_id: Max M       │
│  type: email            │
│  value: max.m@corp.de   │
│  source_type: osint     │
│  evidence_refs: [...]   │
│  verified: true         │
└─────────────────────────┘
```

**Mapping Rules (Beispiel theHarvester):**

```javascript
// backend/src/services/osintPersonMapper.js

const MAPPING_RULES = {
  'theHarvester': {
    'emails': {
      attribute_type: 'email',
      confidence: 0.8,
      auto_match_strategy: 'email_domain' // Versuche Email mit bekannten Personen zu matchen
    },
    'hosts': {
      attribute_type: 'domain',
      confidence: 0.9,
      auto_match_strategy: 'none' // Domains sind nicht personenbezogen
    },
    'linkedin_profiles': {
      attribute_type: 'social_profile',
      confidence: 0.9,
      auto_match_strategy: 'name_similarity' // Name aus Profil
    }
  },

  'SpiderFoot': {
    'EMAILADDR': {
      attribute_type: 'email',
      confidence: 0.8,
      auto_match_strategy: 'email_domain'
    },
    'BREACH': {
      attribute_type: 'data_breach',
      confidence: 0.95,
      auto_match_strategy: 'email_exact' // Breach bezieht sich auf Email
    },
    'PHONE_NUMBER': {
      attribute_type: 'phone',
      confidence: 0.7,
      auto_match_strategy: 'none' // Telefonnummern schwer zuzuordnen
    }
  }
};

class OSINTPersonMapper {
  async processFinding(toolRun, rawFinding) {
    const rule = MAPPING_RULES[toolRun.tool_id][rawFinding.type];

    if (!rule) {
      console.warn(`No mapping rule for ${toolRun.tool_id}:${rawFinding.type}`);
      return null;
    }

    // 1. Create finding in inbox
    const finding = await db.insert('osint_findings', {
      dossier_id: toolRun.dossier_id,
      tool_run_id: toolRun.id,
      finding_type: rule.attribute_type,
      finding_value: rawFinding.value,
      finding_context: rawFinding.context,
      confidence_score: rule.confidence
    });

    // 2. Try auto-matching (suggested person)
    const suggestedPerson = await this.autoMatch(
      toolRun.dossier_id,
      rawFinding,
      rule.auto_match_strategy
    );

    if (suggestedPerson) {
      await db.update('osint_findings', finding.id, {
        suggested_person_id: suggestedPerson.id
      });
    }

    return finding;
  }

  async autoMatch(dossierId, finding, strategy) {
    switch (strategy) {
      case 'email_domain':
        // Finde Personen die bereits Emails mit gleicher Domain haben
        const domain = finding.value.split('@')[1];
        return await db.query(`
          SELECT DISTINCT p.* FROM persons p
          JOIN person_attributes pa ON pa.person_id = p.id
          WHERE p.dossier_id = $1
            AND pa.attribute_type = 'email'
            AND pa.attribute_value LIKE '%@' || $2
          LIMIT 1
        `, [dossierId, domain]);

      case 'name_similarity':
        // Verwende String-Ähnlichkeit (Levenshtein)
        const extractedName = this.extractNameFromProfile(finding.value);
        return await db.query(`
          SELECT * FROM persons
          WHERE dossier_id = $1
            AND similarity(canonical_name, $2) > 0.6
          ORDER BY similarity(canonical_name, $2) DESC
          LIMIT 1
        `, [dossierId, extractedName]);

      case 'email_exact':
        // Exakte Email-Match
        return await db.query(`
          SELECT p.* FROM persons p
          JOIN person_attributes pa ON pa.person_id = p.id
          WHERE p.dossier_id = $1
            AND pa.attribute_type = 'email'
            AND pa.attribute_value = $2
          LIMIT 1
        `, [dossierId, finding.value]);

      case 'none':
      default:
        return null;
    }
  }
}
```

### 7.4 Mass Image Ingestion

**Use Case:** Recherche liefert 200 Fotos von einer Veranstaltung. Alle müssen:
- Heruntergeladen werden
- Dedupliziert werden (SHA256)
- Metadaten extrahiert
- Face Detection durchlaufen
- Manuell gesichtet werden

**Umsetzung:**

#### 7.4.1 URL-basierter Download

**Frontend:**
```jsx
// components/MediaIngestion.jsx

function BulkURLDownload() {
  const [urls, setUrls] = useState('');
  const [jobId, setJobId] = useState(null);

  const handleSubmit = async () => {
    const urlList = urls.split('\n').filter(u => u.trim());

    const response = await fetch('/api/media/bulk-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossier_id: currentDossier.id,
        urls: urlList,
        tags: ['import_2024_01'],
        extract_exif: true,
        run_face_detection: true
      })
    });

    const { job_id } = await response.json();
    setJobId(job_id);
    // Poll job status
  };

  return (
    <div>
      <h3>Bulk Image Download</h3>
      <textarea
        placeholder="Paste image URLs (one per line)"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={10}
      />
      <button onClick={handleSubmit}>Download {urls.split('\n').length} Images</button>
    </div>
  );
}
```

**Backend:**
```javascript
// routes/media.js

router.post('/bulk-download', async (req, res) => {
  const { dossier_id, urls, tags, extract_exif, run_face_detection } = req.body;

  // Validate access to dossier
  const dossier = await db.findById('dossiers', dossier_id);
  if (!dossier) return res.status(404).json({ error: 'Dossier not found' });

  // Create job
  const job = await mediaQueue.add('bulk-download', {
    dossier_id,
    urls,
    tags,
    extract_exif,
    run_face_detection,
    user_id: req.session.userId
  });

  res.json({ job_id: job.id, status: 'queued' });
});
```

**Worker:**
```javascript
// workers/mediaWorker.js

const queue = new Bull('media-jobs', { redis: redisConfig });

queue.process('bulk-download', async (job) => {
  const { dossier_id, urls, tags, extract_exif, run_face_detection, user_id } = job.data;

  const results = {
    downloaded: 0,
    duplicates: 0,
    errors: 0,
    media_ids: []
  };

  for (const url of urls) {
    try {
      job.progress((urls.indexOf(url) / urls.length) * 100);

      // 1. Download
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // 2. SHA256 hash
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // 3. Check if exists
      const existing = await db.findOne('media_assets', { sha256: hash });
      if (existing) {
        results.duplicates++;
        continue;
      }

      // 4. Extract metadata
      let metadata = {};
      let width, height, captured_at;

      if (extract_exif) {
        const exif = await exifReader.load(buffer);
        metadata = exif;
        width = exif.ImageWidth;
        height = exif.ImageHeight;
        captured_at = exif.DateTimeOriginal;
      } else {
        const dimensions = await sharp(buffer).metadata();
        width = dimensions.width;
        height = dimensions.height;
      }

      // 5. Save file
      const fileName = `${hash}.${mime.extension(response.headers['content-type'])}`;
      const filePath = `/evidence/media/${dossier_id}/${fileName}`;
      await fs.writeFile(filePath, buffer);

      // 6. Create database entry
      const media = await db.insert('media_assets', {
        dossier_id,
        file_type: 'image',
        file_path: filePath,
        file_name: fileName,
        file_size: buffer.length,
        mime_type: response.headers['content-type'],
        sha256: hash,
        width,
        height,
        captured_at,
        metadata,
        source_url: url,
        uploaded_by: user_id,
        upload_method: 'url_download',
        tags
      });

      results.media_ids.push(media.id);
      results.downloaded++;

      // 7. Queue face detection if requested
      if (run_face_detection) {
        await faceDetectionQueue.add('detect-faces', {
          media_asset_id: media.id,
          file_path: filePath
        });
      }

    } catch (error) {
      console.error(`Failed to download ${url}:`, error);
      results.errors++;
    }
  }

  return results;
});
```

#### 7.4.2 Drag-and-Drop Upload

**Frontend:**
```jsx
// components/MediaUpload.jsx

function MediaUpload({ dossierId }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = async (acceptedFiles) => {
    setUploading(true);
    const formData = new FormData();

    formData.append('dossier_id', dossierId);
    acceptedFiles.forEach(file => formData.append('files', file));

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      setProgress((e.loaded / e.total) * 100);
    });

    xhr.addEventListener('load', () => {
      const response = JSON.parse(xhr.responseText);
      console.log('Upload complete:', response);
      setUploading(false);
    });

    xhr.open('POST', '/api/media/upload');
    xhr.send(formData);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: 'image/*,video/*'
  });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {uploading ? (
        <p>Uploading... {progress.toFixed(0)}%</p>
      ) : (
        <p>Drag & drop images/videos here, or click to select files</p>
      )}
    </div>
  );
}
```

**Backend:**
```javascript
// routes/media.js

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads/' });

router.post('/upload', upload.array('files'), async (req, res) => {
  const { dossier_id } = req.body;
  const files = req.files;

  const results = {
    uploaded: 0,
    duplicates: 0,
    media_ids: []
  };

  for (const file of files) {
    const buffer = await fs.readFile(file.path);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check duplicate
    const existing = await db.findOne('media_assets', { sha256: hash });
    if (existing) {
      results.duplicates++;
      await fs.unlink(file.path);
      continue;
    }

    // Extract metadata (same as bulk-download)
    const metadata = await extractMetadata(buffer, file.mimetype);

    // Move to permanent storage
    const fileName = `${hash}.${mime.extension(file.mimetype)}`;
    const filePath = `/evidence/media/${dossier_id}/${fileName}`;
    await fs.rename(file.path, filePath);

    // Create database entry
    const media = await db.insert('media_assets', {
      dossier_id,
      file_type: file.mimetype.startsWith('video') ? 'video' : 'image',
      file_path: filePath,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      sha256: hash,
      ...metadata,
      uploaded_by: req.session.userId,
      upload_method: 'manual_upload'
    });

    results.media_ids.push(media.id);
    results.uploaded++;

    // Queue face detection
    await faceDetectionQueue.add('detect-faces', {
      media_asset_id: media.id,
      file_path: filePath
    });
  }

  res.json(results);
});
```

### 7.5 Face Detection (Organization, NOT Recognition)

**WICHTIG:** Wir verwenden Face **Detection** (Gesichter finden), NICHT Face Recognition (Gesichter identifizieren).

**Ethische Grenzen:**
- ✅ Erlaubt: Bounding Boxes um Gesichter zeichnen
- ✅ Erlaubt: Gesichts-Crops für manuelle Sichtung
- ✅ Erlaubt: Qualitätsscores (scharf/unscharf, frontal/Profil)
- ❌ NICHT: Automatische Zuordnung "Das ist Person X"
- ❌ NICHT: Gesichtserkennung-Datenbank
- ❌ NICHT: Matching gegen externe Datenbanken

**Technologie:**
- Library: `face_detection` (Python, Dlib-basiert) ODER `opencv` mit Haar Cascades
- NICHT: `face_recognition`, `deepface`, `insightface` (zu mächtig)

#### 7.5.1 Detection Worker

**Python Worker:**
```python
# workers/face_detection_worker.py

import face_detection
from PIL import Image
import json
import sys

def detect_faces(image_path):
    """
    Findet Gesichter in einem Bild und gibt Bounding Boxes zurück.
    Kein Recognition, nur Detection!
    """
    detector = face_detection.build_detector(
        "RetinaNetResNet50",
        confidence_threshold=0.5
    )

    image = Image.open(image_path)
    detections = detector.detect(image)

    results = []
    for i, detection in enumerate(detections):
        bbox = detection[:4]  # x1, y1, x2, y2
        confidence = detection[4]

        # Crop face for preview
        x1, y1, x2, y2 = map(int, bbox)
        face_crop = image.crop((x1, y1, x2, y2))

        # Calculate quality score
        quality = calculate_quality(face_crop)

        results.append({
            'bbox': {
                'x': x1,
                'y': y1,
                'width': x2 - x1,
                'height': y2 - y1
            },
            'confidence': float(confidence),
            'quality_score': quality,
            'crop_data': face_crop  # PIL Image object
        })

    return results

def calculate_quality(face_crop):
    """
    Bewertet Gesichts-Qualität (Schärfe, Größe).
    Keine biometrischen Features!
    """
    import cv2
    import numpy as np

    # Convert to grayscale
    gray = cv2.cvtColor(np.array(face_crop), cv2.COLOR_RGB2GRAY)

    # Laplacian variance (Schärfe)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    sharpness = min(laplacian_var / 100.0, 1.0)

    # Size score
    width, height = face_crop.size
    size_score = min((width * height) / 10000, 1.0)

    # Combined quality
    quality = (sharpness * 0.6 + size_score * 0.4)

    return round(quality, 2)

if __name__ == '__main__':
    image_path = sys.argv[1]
    output_path = sys.argv[2]

    results = detect_faces(image_path)

    # Save crops and metadata
    crops = []
    for i, result in enumerate(results):
        crop_file = f"{output_path}/face_{i}.jpg"
        result['crop_data'].save(crop_file, 'JPEG')
        result['crop_file'] = crop_file
        del result['crop_data']  # Remove PIL object for JSON
        crops.append(result)

    # Output JSON
    print(json.dumps(crops))
```

**Node.js Worker Integration:**
```javascript
// workers/faceDetectionWorker.js

const queue = new Bull('face-detection', { redis: redisConfig });

queue.process('detect-faces', async (job) => {
  const { media_asset_id, file_path } = job.data;

  // 1. Get media asset
  const media = await db.findById('media_assets', media_asset_id);
  if (!media) throw new Error('Media asset not found');

  // 2. Create output directory
  const outputDir = `/evidence/faces/${media_asset_id}`;
  await fs.mkdir(outputDir, { recursive: true });

  // 3. Run Python detector
  const { stdout } = await execAsync(`python3 workers/face_detection_worker.py "${file_path}" "${outputDir}"`);

  const detections = JSON.parse(stdout);

  // 4. Store detections in database
  const faceIds = [];
  for (const detection of detections) {
    const face = await db.insert('detected_faces', {
      media_asset_id,
      bbox_x: detection.bbox.x,
      bbox_y: detection.bbox.y,
      bbox_width: detection.bbox.width,
      bbox_height: detection.bbox.height,
      detection_confidence: detection.confidence,
      face_quality_score: detection.quality_score,
      crop_file_path: detection.crop_file,
      reviewed: false
    });

    faceIds.push(face.id);
  }

  return { faces_detected: faceIds.length, face_ids: faceIds };
});
```

#### 7.5.2 Face Review UI

**Frontend:**
```jsx
// components/FaceReview.jsx

function FaceReviewGallery({ dossierId }) {
  const [faces, setFaces] = useState([]);
  const [filter, setFilter] = useState('unreviewed');

  useEffect(() => {
    fetchFaces();
  }, [filter]);

  const fetchFaces = async () => {
    const response = await fetch(`/api/dossiers/${dossierId}/faces?filter=${filter}`);
    const data = await response.json();
    setFaces(data.faces);
  };

  const handleTagFace = async (faceId, personId) => {
    await fetch('/api/faces/annotate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detected_face_id: faceId,
        person_id: personId,
        confidence: 'certain'
      })
    });

    // Mark as reviewed
    await fetch(`/api/faces/${faceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed: true })
    });

    fetchFaces(); // Refresh
  };

  return (
    <div className="face-review">
      <div className="filters">
        <button onClick={() => setFilter('unreviewed')}>
          Unreviewed ({faces.filter(f => !f.reviewed).length})
        </button>
        <button onClick={() => setFilter('all')}>All</button>
      </div>

      <div className="face-grid">
        {faces.map(face => (
          <FaceCard key={face.id} face={face} onTag={handleTagFace} />
        ))}
      </div>
    </div>
  );
}

function FaceCard({ face, onTag }) {
  const [showTagModal, setShowTagModal] = useState(false);

  return (
    <div className="face-card">
      <img src={`/evidence${face.crop_file_path}`} alt="Detected face" />

      <div className="face-info">
        <span>Quality: {(face.face_quality_score * 100).toFixed(0)}%</span>
        <span>Confidence: {(face.detection_confidence * 100).toFixed(0)}%</span>
      </div>

      {face.annotations.length > 0 ? (
        <div className="tagged">
          Tagged: {face.annotations.map(a => a.person_name).join(', ')}
        </div>
      ) : (
        <button onClick={() => setShowTagModal(true)}>Tag Person</button>
      )}

      {showTagModal && (
        <PersonTagModal
          face={face}
          onTag={(personId) => {
            onTag(face.id, personId);
            setShowTagModal(false);
          }}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </div>
  );
}

function PersonTagModal({ face, onTag, onClose }) {
  const [persons, setPersons] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPersons();
  }, [search]);

  const fetchPersons = async () => {
    const response = await fetch(`/api/persons?search=${search}`);
    const data = await response.json();
    setPersons(data.persons);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Tag Face to Person</h3>

        <img src={`/evidence${face.crop_file_path}`} width={150} />

        <input
          type="text"
          placeholder="Search person..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="person-list">
          {persons.map(person => (
            <div key={person.id} onClick={() => onTag(person.id)}>
              {person.canonical_name}
              {person.aliases.length > 0 && (
                <span className="aliases">({person.aliases.join(', ')})</span>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
```

#### 7.5.3 Face Strip View (Schnellsichtung)

**Konzept:** Alle Gesichter nebeneinander, schnelles Durchklicken

```jsx
// components/FaceStripView.jsx

function FaceStripView({ dossierId }) {
  const [faces, setFaces] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchUnreviewedFaces();
  }, []);

  const fetchUnreviewedFaces = async () => {
    const response = await fetch(`/api/dossiers/${dossierId}/faces?filter=unreviewed&sort=quality_desc`);
    const data = await response.json();
    setFaces(data.faces);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowRight') {
      setCurrentIndex(Math.min(currentIndex + 1, faces.length - 1));
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex(Math.max(currentIndex - 1, 0));
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const currentFace = faces[currentIndex];

  if (!currentFace) return <div>No faces to review</div>;

  return (
    <div className="face-strip-view">
      <div className="strip-header">
        Face {currentIndex + 1} of {faces.length}
      </div>

      {/* Thumbnail strip */}
      <div className="thumbnails">
        {faces.map((face, i) => (
          <img
            key={face.id}
            src={`/evidence${face.crop_file_path}`}
            className={i === currentIndex ? 'active' : ''}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>

      {/* Large view */}
      <div className="face-large">
        <img src={`/evidence${currentFace.crop_file_path}`} />

        <div className="face-actions">
          <PersonQuickTag
            faceId={currentFace.id}
            onTagged={() => {
              setCurrentIndex(currentIndex + 1);
              fetchUnreviewedFaces(); // Refresh list
            }}
          />

          <button onClick={() => markAsReviewed(currentFace.id)}>
            Skip
          </button>
        </div>
      </div>

      {/* Source image context */}
      <div className="source-context">
        <img src={`/evidence${currentFace.media_asset.file_path}`} />
        {/* Draw bounding box overlay */}
      </div>
    </div>
  );
}
```

### 7.6 Research Visualizations

#### 7.6.1 Person File Timeline

**Konzept:** Chronologische Ansicht aller Ereignisse/Attribute einer Person

```jsx
// components/PersonTimeline.jsx

import { Timeline } from 'vis-timeline';

function PersonTimeline({ personId }) {
  const timelineRef = useRef(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchPersonEvents();
  }, [personId]);

  const fetchPersonEvents = async () => {
    const response = await fetch(`/api/persons/${personId}/timeline`);
    const data = await response.json();
    setEvents(data.events);
  };

  useEffect(() => {
    if (!events.length) return;

    const items = events.map(event => ({
      id: event.id,
      content: event.title,
      start: event.date,
      type: 'box',
      className: event.type // attribute, relationship, media, event
    }));

    const timeline = new Timeline(timelineRef.current, items, {
      zoomMin: 1000 * 60 * 60 * 24 * 30, // 1 month
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 10 // 10 years
    });

    timeline.on('select', (properties) => {
      const eventId = properties.items[0];
      const event = events.find(e => e.id === eventId);
      showEventDetails(event);
    });
  }, [events]);

  return (
    <div className="person-timeline">
      <div ref={timelineRef} style={{ height: '400px' }}></div>
    </div>
  );
}
```

**Backend Endpoint:**
```javascript
// routes/persons.js

router.get('/:id/timeline', async (req, res) => {
  const { id } = req.params;

  const events = [];

  // 1. Attributes with dates
  const attributes = await db.query(`
    SELECT id, attribute_type, attribute_value, valid_from, valid_to, created_at
    FROM person_attributes
    WHERE person_id = $1 AND (valid_from IS NOT NULL OR valid_to IS NOT NULL)
    ORDER BY COALESCE(valid_from, created_at)
  `, [id]);

  attributes.forEach(attr => {
    events.push({
      id: `attr_${attr.id}`,
      type: 'attribute',
      title: `${attr.attribute_type}: ${attr.attribute_value}`,
      date: attr.valid_from || attr.created_at,
      details: attr
    });
  });

  // 2. Relationships
  const relationships = await db.query(`
    SELECT r.*, p.canonical_name as other_person
    FROM person_relationships r
    JOIN persons p ON (p.id = r.person_b_id AND r.person_a_id = $1) OR (p.id = r.person_a_id AND r.person_b_id = $1)
    WHERE $1 IN (r.person_a_id, r.person_b_id)
      AND r.valid_from IS NOT NULL
    ORDER BY r.valid_from
  `, [id]);

  relationships.forEach(rel => {
    events.push({
      id: `rel_${rel.id}`,
      type: 'relationship',
      title: `${rel.relationship_type} with ${rel.other_person}`,
      date: rel.valid_from,
      details: rel
    });
  });

  // 3. Media appearances
  const media = await db.query(`
    SELECT ma.*, pm.context, pm.tagged_at
    FROM person_media pm
    JOIN media_assets ma ON ma.id = pm.media_asset_id
    WHERE pm.person_id = $1
      AND ma.captured_at IS NOT NULL
    ORDER BY ma.captured_at
  `, [id]);

  media.forEach(m => {
    events.push({
      id: `media_${m.id}`,
      type: 'media',
      title: `Photo: ${m.context || m.file_name}`,
      date: m.captured_at,
      details: m
    });
  });

  // Sort by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json({ events });
});
```

#### 7.6.2 Case Overview Dashboard

```jsx
// components/CaseOverview.jsx

function CaseOverview({ dossierId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [dossierId]);

  const fetchStats = async () => {
    const response = await fetch(`/api/dossiers/${dossierId}/stats`);
    const data = await response.json();
    setStats(data);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="case-overview">
      <h2>{stats.dossier.title}</h2>

      <div className="stats-grid">
        <StatCard
          icon="👤"
          title="Persons"
          count={stats.persons.total}
          details={[
            `${stats.persons.with_photo} with photos`,
            `${stats.persons.high_confidence} verified`
          ]}
        />

        <StatCard
          icon="📄"
          title="Sources"
          count={stats.sources.total}
          details={[
            `${stats.sources.verified} verified`,
            `${stats.sources.web} web, ${stats.sources.documents} documents`
          ]}
        />

        <StatCard
          icon="📷"
          title="Media"
          count={stats.media.total}
          details={[
            `${stats.media.faces_detected} faces detected`,
            `${stats.media.faces_tagged} faces tagged`
          ]}
        />

        <StatCard
          icon="🔗"
          title="Relationships"
          count={stats.relationships.total}
          details={[
            `${stats.relationships.confirmed} confirmed`,
            `${stats.relationships.types} types`
          ]}
        />
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <ActivityFeed dossierId={dossierId} limit={10} />
      </div>
    </div>
  );
}

function StatCard({ icon, title, count, details }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{count}</h3>
        <p>{title}</p>
        {details.map((detail, i) => (
          <small key={i}>{detail}</small>
        ))}
      </div>
    </div>
  );
}
```

#### 7.6.3 Relationship Graph with Evidence

```jsx
// components/RelationshipGraph.jsx

import Cytoscape from 'cytoscape';

function RelationshipGraph({ dossierId, focusPersonId }) {
  const cyRef = useRef(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    fetchGraph();
  }, [dossierId, focusPersonId]);

  const fetchGraph = async () => {
    const response = await fetch(`/api/dossiers/${dossierId}/relationship-graph?focus=${focusPersonId || ''}`);
    const data = await response.json();
    setGraph(data);
  };

  useEffect(() => {
    if (!graph.nodes.length) return;

    const cy = Cytoscape({
      container: cyRef.current,

      elements: [
        ...graph.nodes.map(node => ({
          data: {
            id: node.id,
            label: node.name,
            confidence: node.confidence_score
          },
          classes: node.id === focusPersonId ? 'focus' : ''
        })),

        ...graph.edges.map(edge => ({
          data: {
            source: edge.from,
            target: edge.to,
            label: edge.relationship_type,
            confidence: edge.confidence_score,
            evidence_count: edge.evidence_refs.length
          }
        }))
      ],

      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': '#0074D9',
            'width': (ele) => 30 + (ele.data('confidence') * 20),
            'height': (ele) => 30 + (ele.data('confidence') * 20)
          }
        },
        {
          selector: 'node.focus',
          style: {
            'background-color': '#FF4136',
            'border-width': 3,
            'border-color': '#85144b'
          }
        },
        {
          selector: 'edge',
          style: {
            'label': 'data(label)',
            'width': (ele) => 1 + (ele.data('confidence') * 3),
            'line-color': '#aaa',
            'target-arrow-color': '#aaa',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],

      layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeRepulsion: 400000
      }
    });

    // Click handler
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const relationshipId = edge.id();
      showRelationshipDetails(relationshipId);
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const personId = node.id();
      window.location.href = `/dossiers/${dossierId}/persons/${personId}`;
    });

  }, [graph]);

  return (
    <div className="relationship-graph">
      <div ref={cyRef} style={{ width: '100%', height: '600px' }}></div>

      <div className="graph-legend">
        <h4>Legend</h4>
        <p>Node size = Confidence score</p>
        <p>Edge thickness = Relationship confidence</p>
        <p>Click node to view person</p>
        <p>Click edge to view evidence</p>
      </div>
    </div>
  );
}
```

**Backend:**
```javascript
// routes/dossiers.js

router.get('/:id/relationship-graph', async (req, res) => {
  const { id } = req.params;
  const { focus } = req.query;

  // Get all persons in dossier
  const persons = await db.query(`
    SELECT id, canonical_name, confidence_score
    FROM persons
    WHERE dossier_id = $1
  `, [id]);

  // Get relationships
  const relationships = await db.query(`
    SELECT *
    FROM person_relationships
    WHERE dossier_id = $1
  `, [id]);

  // If focus person specified, filter to 2-degree connections
  let filteredPersons = persons;
  let filteredRelationships = relationships;

  if (focus) {
    const connectedIds = new Set([focus]);

    // 1st degree
    relationships.forEach(rel => {
      if (rel.person_a_id === focus) connectedIds.add(rel.person_b_id);
      if (rel.person_b_id === focus) connectedIds.add(rel.person_a_id);
    });

    // 2nd degree (optional)
    const firstDegree = [...connectedIds];
    firstDegree.forEach(personId => {
      relationships.forEach(rel => {
        if (rel.person_a_id === personId) connectedIds.add(rel.person_b_id);
        if (rel.person_b_id === personId) connectedIds.add(rel.person_a_id);
      });
    });

    filteredPersons = persons.filter(p => connectedIds.has(p.id));
    filteredRelationships = relationships.filter(r =>
      connectedIds.has(r.person_a_id) && connectedIds.has(r.person_b_id)
    );
  }

  res.json({
    nodes: filteredPersons.map(p => ({
      id: p.id,
      name: p.canonical_name,
      confidence_score: p.confidence_score
    })),
    edges: filteredRelationships.map(r => ({
      id: r.id,
      from: r.person_a_id,
      to: r.person_b_id,
      relationship_type: r.relationship_type,
      confidence_score: r.confidence_score,
      evidence_refs: r.evidence_refs
    }))
  });
});
```

#### 7.6.4 Media Gallery with Filters

```jsx
// components/MediaGallery.jsx

function MediaGallery({ dossierId }) {
  const [media, setMedia] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all', // all, image, video
    tagged: 'all', // all, tagged, untagged
    person: null,
    dateFrom: null,
    dateTo: null
  });

  useEffect(() => {
    fetchMedia();
  }, [filters]);

  const fetchMedia = async () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        params.append(key, filters[key]);
      }
    });

    const response = await fetch(`/api/dossiers/${dossierId}/media?${params}`);
    const data = await response.json();
    setMedia(data.media);
  };

  return (
    <div className="media-gallery">
      <div className="gallery-filters">
        <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
          <option value="all">All Types</option>
          <option value="image">Images Only</option>
          <option value="video">Videos Only</option>
        </select>

        <select value={filters.tagged} onChange={(e) => setFilters({...filters, tagged: e.target.value})}>
          <option value="all">All</option>
          <option value="tagged">Tagged with Person</option>
          <option value="untagged">Untagged</option>
        </select>

        <PersonSelect
          value={filters.person}
          onChange={(personId) => setFilters({...filters, person: personId})}
          placeholder="Filter by person..."
        />
      </div>

      <div className="gallery-grid">
        {media.map(item => (
          <MediaItem key={item.id} media={item} />
        ))}
      </div>
    </div>
  );
}

function MediaItem({ media }) {
  const [showFaces, setShowFaces] = useState(false);

  return (
    <div className="media-item">
      <div className="media-thumbnail">
        {media.file_type === 'image' ? (
          <img src={`/evidence${media.file_path}`} alt={media.file_name} />
        ) : (
          <video src={`/evidence${media.file_path}`} controls />
        )}

        {/* Face bounding boxes overlay */}
        {showFaces && media.detected_faces.length > 0 && (
          <svg className="face-overlay">
            {media.detected_faces.map(face => (
              <rect
                key={face.id}
                x={face.bbox_x}
                y={face.bbox_y}
                width={face.bbox_width}
                height={face.bbox_height}
                fill="none"
                stroke={face.annotations.length > 0 ? 'green' : 'yellow'}
                strokeWidth="2"
              />
            ))}
          </svg>
        )}
      </div>

      <div className="media-info">
        <p>{media.file_name}</p>
        {media.captured_at && (
          <small>{new Date(media.captured_at).toLocaleDateString()}</small>
        )}
        {media.detected_faces.length > 0 && (
          <button onClick={() => setShowFaces(!showFaces)}>
            {showFaces ? 'Hide' : 'Show'} {media.detected_faces.length} Faces
          </button>
        )}
      </div>

      {media.person_tags.length > 0 && (
        <div className="tagged-persons">
          Tagged: {media.person_tags.map(p => p.name).join(', ')}
        </div>
      )}
    </div>
  );
}
```

### 7.7 Technical Implementation Notes

#### Database Choice: PostgreSQL vs SQLite

**Empfehlung: PostgreSQL**

**Argumente:**
- ✅ Array-Datentypen (`UUID[]` für `evidence_refs`, `aliases`)
- ✅ JSONB für flexible Metadaten
- ✅ Full-Text Search (für Personennamen, Attribute)
- ✅ String-Similarity-Extension (`pg_trgm` für fuzzy matching)
- ✅ Besser bei vielen Relationships (JOINs)

**SQLite würde bedeuten:**
- ❌ Arrays als JSON speichern (langsamer, unhandlicher)
- ❌ Kein natives Full-Text Search
- ❌ Keine String-Similarity

**Migration:**
Existing SQLite-Datenbank für User-Management bleibt. PostgreSQL nur für Dossiers/Recherchen.

#### Storage Strategy

**Medien:**
- Local Storage: `/evidence/media/{dossier_id}/{sha256}.ext`
- Optional Nextcloud Sync: Background-Job synchronisiert zu Nextcloud (Backup)

**Face Crops:**
- Local Storage: `/evidence/faces/{media_asset_id}/face_{index}.jpg`
- Nicht in Nextcloud (zu viele kleine Dateien)

#### Worker Architecture

**Separate Worker Service:**
```yaml
# docker-compose.yml

services:
  # ... existing services ...

  worker:
    build: ./worker
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    volumes:
      - evidence-storage:/evidence
    depends_on:
      - postgres
      - redis
```

**Python Dependencies:**
```python
# worker/requirements.txt

face-detection==0.2.2
Pillow==10.0.0
opencv-python==4.8.0
numpy==1.24.3
```

#### Job Queue

**Bull (Redis):**
```javascript
// Queues
const mediaQueue = new Bull('media-jobs', redisConfig);
const faceDetectionQueue = new Bull('face-detection', redisConfig);
const osintQueue = new Bull('osint-jobs', redisConfig);

// Concurrency
mediaQueue.process('bulk-download', 3, bulkDownloadHandler); // 3 parallel downloads
faceDetectionQueue.process('detect-faces', 2, faceDetectionHandler); // 2 parallel detections
osintQueue.process('run-tool', 1, osintToolHandler); // 1 OSINT job at a time (rate limits!)
```

### 7.8 API Endpoints Summary

```javascript
// Persons
GET    /api/dossiers/:id/persons
POST   /api/dossiers/:id/persons
GET    /api/persons/:id
PATCH  /api/persons/:id
DELETE /api/persons/:id
POST   /api/persons/:id/merge  // Merge duplicate persons
GET    /api/persons/:id/timeline

// Person Attributes
POST   /api/persons/:id/attributes
PATCH  /api/attributes/:id
DELETE /api/attributes/:id

// Person Relationships
POST   /api/dossiers/:id/relationships
GET    /api/relationships/:id
PATCH  /api/relationships/:id
DELETE /api/relationships/:id

// Media
POST   /api/media/upload
POST   /api/media/bulk-download
GET    /api/dossiers/:id/media
GET    /api/media/:id
DELETE /api/media/:id

// Face Detection
POST   /api/media/:id/detect-faces  // Trigger detection job
GET    /api/dossiers/:id/faces  // Get all detected faces
PATCH  /api/faces/:id  // Mark as reviewed

// Face Annotations
POST   /api/faces/annotate  // Tag face to person
DELETE /api/annotations/:id

// OSINT Findings
GET    /api/dossiers/:id/osint-findings
POST   /api/osint-findings/:id/accept  // Accept finding → create attribute
POST   /api/osint-findings/:id/reject
POST   /api/osint-findings/:id/merge   // Merge to existing person

// Visualizations
GET    /api/dossiers/:id/relationship-graph
GET    /api/dossiers/:id/stats
```

---

## 8. Technische Umsetzung (Module)

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
