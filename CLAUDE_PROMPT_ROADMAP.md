# Journalism Dashboard - Development Prompt for Claude

## Project Context

You are working on an investigative journalism dashboard designed to support complex research workflows, source management, entity tracking, and OSINT integration. This is a professional tool for journalists conducting investigative research.

### Current Architecture

**Tech Stack:**
- **Frontend:** React (Vite), modern UI components
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (for complex relations) + SQLite (user management)
- **Session Management:** Redis + express-session
- **Authentication:** bcrypt password hashing, session-based auth
- **File Storage:** Native file upload with multer (NO Nextcloud)
- **User Roles:** `admin` (first user) and `autor` (subsequent users)

**Docker Setup:**
- Multi-stage Dockerfile (frontend build + production runtime)
- Node 20 Alpine
- Running as root (simplified permissions)
- PostgreSQL 15 for research data
- Redis for sessions and job queues

### What Has Been Implemented

✅ **Native User Management** (Nextcloud removed)
- Registration form with displayName field
- Login/logout functionality
- Session-based authentication
- Password change via UserSettings modal
- User management panel for admins
  - Create users
  - Delete users
  - Toggle admin/autor roles

✅ **Native File Storage** (Nextcloud removed)
- FilesPanel component with drag-and-drop upload
- File download with proper MIME types
- File type icons (images, PDFs, videos, etc.)
- Stored in `/app/uploads` volume
- Database tracking with metadata

✅ **UI Components**
- App.jsx with tab navigation (Entwürfe, Dateien, Benutzer)
- UserSettings modal (password change, user info)
- UserManagement panel (admin only)
- FilesPanel (upload/download interface)
- Login/Register components

✅ **Backend Routes**
- `/api/auth/register` - User registration
- `/api/auth/login` - Login
- `/api/auth/logout` - Logout
- `/api/auth/check` - Session check
- `/api/auth/change-password` - Password change (requireAuth)
- `/api/auth/users` - List users (admin only)
- `/api/auth/users/:id` - Update/delete user (admin only)
- `/api/files/upload` - File upload
- `/api/files/download/:id` - File download
- `/api/files` - List files

### What Needs to Be Built (Roadmap)

## Phase 1: Research Foundation (Weeks 1-4)

### 1.1 Dossier System (Case Files)
**Goal:** Structured workspaces for individual investigations

**Database Schema:**
```sql
CREATE TABLE dossiers (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT, -- active, archived
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dossier_access (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  user_id UUID REFERENCES users(id),
  role TEXT, -- owner, collaborator, viewer
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(dossier_id, user_id)
);
```

**Frontend Components:**
- `DossierList.jsx` - Overview of all cases
- `DossierDetail.jsx` - Case workspace with tabs
- `CreateDossier.jsx` - New case creation modal

**Backend Routes:**
```javascript
POST   /api/dossiers              // Create new case
GET    /api/dossiers              // List all cases (user-specific)
GET    /api/dossiers/:id          // Get case details
PATCH  /api/dossiers/:id          // Update case
DELETE /api/dossiers/:id          // Archive case
POST   /api/dossiers/:id/share    // Share with other users
```

### 1.2 Source Management
**Goal:** Systematic tracking of all research sources with provenance

**Database Schema:**
```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  type TEXT, -- web, document, interview, database, foia
  url TEXT,
  title TEXT,
  author TEXT,
  published_at TIMESTAMP,
  retrieved_at TIMESTAMP NOT NULL,
  trustworthiness_score INTEGER CHECK (trustworthiness_score BETWEEN 1 AND 5),
  access_method TEXT, -- public, archive, foi_request, leaked
  notes TEXT,
  file_id UUID REFERENCES files(id), -- Link to uploaded file
  file_hash TEXT, -- SHA256 for integrity
  metadata JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features:**
- Import from URL with metadata extraction (OpenGraph, Schema.org)
- Automatic archiving via Archive.org API
- Duplicate detection via URL normalization
- Trustworthiness rating (1-5 stars)
- Tag system for categorization

**Frontend:**
```jsx
// SourceManager.jsx
- List view with filters (type, date, trustworthiness)
- Detail view with metadata
- Quick add from URL
- Batch CSV import
```

**Backend:**
```javascript
POST   /api/dossiers/:id/sources
GET    /api/dossiers/:id/sources
GET    /api/sources/:id
PATCH  /api/sources/:id
DELETE /api/sources/:id
```

**Libraries:**
- `metascraper` - Extract metadata from URLs
- `wayback-machine-downloader` - Archive.org integration

### 1.3 Evidence Vault
**Goal:** Immutable archival of evidence with chain of custody

**Database Schema:**
```sql
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  file_id UUID REFERENCES files(id),
  source_id UUID REFERENCES sources(id),
  type TEXT, -- document, photo, video, audio, screenshot
  description TEXT,
  sha256 TEXT UNIQUE NOT NULL,
  metadata JSONB, -- EXIF, file info, etc.
  retrieved_at TIMESTAMP NOT NULL,
  provenance TEXT, -- How this was obtained
  chain_of_custody JSONB[], -- Array of custody events
  verified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features:**
- SHA256 hashing on upload (verify integrity)
- Write-once-read-many principle
- Chain of custody tracking
- Metadata extraction (EXIF, file properties)

## Phase 2: Entity & Timeline (Weeks 5-8)

### 2.1 Entity Recognition & Tracking
**Goal:** Automatic extraction and tracking of people, organizations, locations

**Database Schema:**
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  type TEXT, -- person, organization, location, event
  name TEXT NOT NULL,
  aliases TEXT[], -- Alternative names/spellings
  description TEXT,
  metadata JSONB,
  confidence_score FLOAT, -- NER confidence
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_mentions (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  source_id UUID REFERENCES sources(id),
  context TEXT, -- Sentence/paragraph where mentioned
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_attributes (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  attribute_type TEXT, -- email, phone, address, role, affiliation
  attribute_value TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  valid_from DATE,
  valid_to DATE,
  source_type TEXT, -- osint, manual, document
  evidence_refs UUID[], -- Links to evidence_items
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**NER Pipeline:**
1. User uploads document/text
2. Backend sends to Gemini/Claude for NER
3. Results shown in review UI
4. User confirms/rejects entities
5. Approved entities added to database

**Frontend:**
```jsx
// EntityPanel.jsx
- List of entities (filterable by type)
- Entity detail view with mentions
- Merge duplicates
- Manual entity creation
```

**Backend:**
```javascript
// services/nerService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

async function extractEntities(text, dossierId) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Extract named entities from this text. Return JSON format:
{
  "persons": [{"name": "...", "aliases": [...], "context": "..."}],
  "organizations": [...],
  "locations": [...]
}

Text: ${text}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

### 2.2 Timeline Builder
**Goal:** Chronological visualization of events and evidence

**Database Schema:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  event_date_precision TEXT, -- exact, month, year, circa
  source_ids UUID[],
  evidence_ids UUID[],
  entity_ids UUID[], -- Related entities
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

**Frontend:**
```jsx
// Timeline.jsx
import { Timeline } from 'vis-timeline';

function EventTimeline({ dossierId }) {
  // Fetch events
  // Render vis-timeline
  // Click handlers for event details
  // Zoom controls
  // Filter by confidence/entity
}
```

**Features:**
- Zoom from day to decade view
- Color-coded by confidence
- Tooltips with event details
- Conflict highlighting (contradicting events)
- Export as PNG

## Phase 3: OSINT Integration (Weeks 9-12)

### 3.1 OSINT Plugin System
**Goal:** Safe, containerized execution of OSINT tools

**Architecture:**
```
User Input → Backend API → Job Queue (Bull/Redis)
                              ↓
                        Worker Process
                              ↓
                    Docker Container (OSINT Tool)
                              ↓
                        Parse Results
                              ↓
                    Store in osint_findings (inbox)
                              ↓
                    User Reviews & Approves
                              ↓
                    Create entities/attributes
```

**Database Schema:**
```sql
CREATE TABLE tool_runs (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  tool_id TEXT NOT NULL, -- theharvester, spiderfoot, shodan
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

CREATE TABLE osint_findings (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  tool_run_id UUID REFERENCES tool_runs(id),
  finding_type TEXT, -- email, phone, domain, breach, social_profile
  finding_value TEXT NOT NULL,
  finding_context TEXT,
  confidence_score FLOAT,
  suggested_entity_id UUID REFERENCES entities(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Approved OSINT Tools (Legal & Ethical)

**Tool 1: theHarvester**
- **Purpose:** Email, subdomain, IP discovery from public sources
- **Legal:** Yes (public data only)
- **Docker Image:** `theharvester:latest`
- **Input:** Domain name
- **Output:** Emails, hosts, IPs

**Tool 2: SpiderFoot (Safe Modules Only)**
- **Purpose:** Comprehensive OSINT platform
- **Legal:** Yes (passive reconnaissance only)
- **API Mode:** REST API
- **Modules:** `sfp_emailrep`, `sfp_haveibeenpwned`, `sfp_hunter`

**Tool 3: Shodan API**
- **Purpose:** Internet-connected device search
- **Legal:** Yes (public scans only, no exploitation)
- **API:** REST API with key
- **Use Cases:** Infrastructure mapping, exposed services

**IMPORTANT - Do NOT Implement:**
- ❌ Port scanners (nmap)
- ❌ Vulnerability scanners
- ❌ Social media scrapers (violate ToS)
- ❌ Darknet crawlers
- ❌ Breach database downloaders
- ❌ Paywall bypass tools

**Worker Implementation:**
```javascript
// workers/osintWorker.js
const Bull = require('bull');
const Docker = require('dockerode');

const queue = new Bull('osint-jobs', { redis: redisConfig });

queue.process('run-tool', async (job) => {
  const { tool_id, target, params, dossier_id } = job.data;

  // 1. Create Docker container
  const docker = new Docker();
  const container = await docker.createContainer({
    Image: `osint/${tool_id}:latest`,
    Cmd: buildCommand(tool_id, target, params),
    NetworkMode: 'osint-isolated', // Isolated network
    HostConfig: {
      Memory: 512 * 1024 * 1024, // 512MB limit
      CpuShares: 512
    }
  });

  // 2. Run container
  await container.start();
  const output = await container.logs({ stdout: true });
  const exitCode = (await container.inspect()).State.ExitCode;
  await container.remove();

  // 3. Parse output
  const parsed = parseToolOutput(tool_id, output);

  // 4. Store in findings inbox
  for (const finding of parsed) {
    await db.insert('osint_findings', {
      dossier_id,
      tool_run_id: job.id,
      finding_type: finding.type,
      finding_value: finding.value,
      confidence_score: finding.confidence
    });
  }

  return { findings: parsed.length };
});
```

## Phase 4: Visualization & Analysis (Weeks 13-16)

### 4.1 Relationship Graph
**Goal:** Visual representation of connections between entities

**Database Schema:**
```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  entity_a_id UUID REFERENCES entities(id),
  entity_b_id UUID REFERENCES entities(id),
  relationship_type TEXT, -- colleague, family, business_partner, adversary
  description TEXT,
  evidence_ids UUID[],
  confidence_score FLOAT,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Frontend:**
```jsx
// RelationshipGraph.jsx
import Cytoscape from 'cytoscape';

function RelationshipGraph({ dossierId, focusEntityId }) {
  // Fetch entities and relationships
  // Render Cytoscape graph
  // Node click → entity detail
  // Edge click → relationship evidence
  // Layout: force-directed
  // Filter: by relationship type, confidence
}
```

**Visualization Library:** Cytoscape.js or D3.js force layout

### 4.2 Hypothesis Tracking
**Goal:** Structured tracking of research hypotheses and open questions

**Database Schema:**
```sql
CREATE TABLE hypotheses (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT, -- untested, confirmed, refuted, unclear
  evidence_for UUID[], -- Evidence supporting
  evidence_against UUID[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE open_questions (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  question TEXT NOT NULL,
  priority TEXT, -- high, medium, low
  status TEXT, -- open, answered, blocked
  answer TEXT,
  answered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 Export & Documentation
**Goal:** Generate comprehensive dossier reports

**Formats:**
- **PDF:** Complete dossier with all evidence (via Puppeteer)
- **HTML:** Interactive version for web viewing
- **JSON:** Machine-readable for archival

**Export Includes:**
- Overview and timeline
- All entities with attributes
- Relationship graph (SVG export)
- Source list with provenance
- Evidence inventory
- Hypothesis tracker
- Audit log

## Technical Implementation Guidelines

### Database Strategy
- **PostgreSQL** for dossier/research data (complex relations, JSONB, arrays)
- **SQLite** for user management (existing, keep separate)
- Use UUID for all primary keys
- Implement soft deletes where needed
- Full audit logging for all operations

### Security & Privacy
- All OSINT operations logged (who, what, when, why)
- Legal disclaimer in UI before using OSINT tools
- No automatic scraping against robots.txt
- No ToS violations (social media scrapers)
- Evidence integrity via SHA256
- Chain of custody for all evidence

### Worker Architecture
```yaml
# docker-compose.yml additions

services:
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

  osint-worker:
    build: ./osint-worker
    environment:
      - REDIS_URL=redis://redis:6379
    volumes:
      - evidence-storage:/evidence
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - osint-isolated

networks:
  osint-isolated:
    driver: bridge
    # Isolated network for OSINT containers
```

### API Rate Limiting
- Implement rate limiting for OSINT APIs
- Queue jobs via Bull/Redis
- Respect API provider limits (Shodan, etc.)
- Implement retry logic with exponential backoff

### Data Retention
- Evidence files: immutable, never delete
- Dossiers: soft delete, archive after 1 year inactive
- OSINT findings: keep raw output, parsed results
- Audit logs: retain indefinitely

## Development Principles

### What to Build
✅ Tools that **support** investigative work
✅ Structure and organization systems
✅ Legal, ethical OSINT from public sources
✅ Transparent provenance tracking
✅ Human-in-the-loop workflows
✅ Audit trails for accountability

### What NOT to Build
❌ Automated story generation
❌ Offensive security tools
❌ ToS-violating scrapers
❌ Paywall bypass mechanisms
❌ Darknet monitoring
❌ Automatic publishing decisions
❌ Facial recognition (detection only, not recognition)
❌ Blockchain/Web3 gimmicks
❌ Project management overkill (Gantt charts, sprints)

### Ethical Guidelines
1. **Transparency:** Every source must have clear provenance
2. **Legality:** No hacking, no unauthorized access
3. **Privacy:** Respect personal data, follow GDPR principles
4. **Verification:** Multiple sources for critical claims
5. **Attribution:** Clear sourcing for all evidence
6. **Human Oversight:** No fully automated decisions

## Current Task Context

When working on this project, you should:

1. **Maintain existing functionality:**
   - Native user management (no Nextcloud)
   - Native file storage system
   - Session-based authentication
   - Admin/autor role system

2. **Follow established patterns:**
   - React components in `frontend/src/components/`
   - Backend routes in `backend/src/routes/`
   - Services in `backend/src/services/`
   - Database migrations in `backend/src/migrations/`

3. **Code style:**
   - Use async/await for promises
   - Proper error handling with try/catch
   - Validate all user input
   - Use parameterized queries (prevent SQL injection)
   - Log important operations
   - Add helpful comments for complex logic

4. **Testing considerations:**
   - Manual testing via UI
   - Check permissions (admin vs autor)
   - Verify file uploads/downloads
   - Test session persistence

5. **Commit messages:**
   - Clear, descriptive commit messages
   - Reference issue numbers if applicable
   - Use imperative mood ("Add feature" not "Added feature")

## Questions to Ask Before Implementing

1. **Is this feature legal and ethical?**
2. **Does it require user approval/review, or can it be automated?**
3. **How is provenance tracked?**
4. **What happens if the operation fails?**
5. **Is there a privacy concern?**
6. **Can this be abused?**

## Example Implementation Flow

When asked to implement a feature, follow this pattern:

1. **Plan the database schema** (if needed)
2. **Create migration file** (if schema change)
3. **Implement backend route/service**
4. **Add frontend component**
5. **Test manually**
6. **Commit changes**
7. **Document in README if user-facing**

## Current Development Branch

Always develop on: `claude/setup-ubuntu-system-I7oYg`
Push all changes to this branch.

---

This is your working context. When implementing features, refer to this roadmap and always prioritize:
- Legal compliance
- Ethical journalism practices
- Data provenance
- User privacy
- Human oversight
