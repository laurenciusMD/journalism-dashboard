# Journalism Dashboard

[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-laurencius-blue?logo=docker)](https://hub.docker.com/u/laurencius)
[![Build and Push](https://github.com/laurenciusMD/journalism-dashboard/actions/workflows/docker-hub-deploy.yml/badge.svg)](https://github.com/laurenciusMD/journalism-dashboard/actions/workflows/docker-hub-deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ein zentrales, KI-gestütztes Dashboard für journalistische Arbeit - Ihre persönliche Startseite für Content-Erstellung, Recherche und Informationsmanagement.

## Übersicht

Das Journalism Dashboard vereint alle wichtigen Werkzeuge für moderne journalistische Arbeit in einer einzigen, übersichtlichen Oberfläche. Es integriert verschiedene KI-Modelle und Cloud-Speicher-Lösungen, um einen nahtlosen Workflow zu ermöglichen.

## Kernfunktionen

### KI-Integration
- **Claude AI** - Artikel schreiben, Texte überarbeiten, kreative Unterstützung
- **Google Gemini** - Komplexe Recherchen, Datenanalyse, Faktenchecks
- **ChatGPT/GPTs** - Content-Umformungen, Übersetzungen, spezielle GPT-Tools

### Cloud-Integration
- **Google Drive** - Zugriff auf externe Dokumente und Ressourcen
- **Private Cloud (WebDAV)** - Geschützte Informationen und sensible Daten
- Lokaler Dateizugriff für Offline-Arbeit

### Workflow-Features
- Browser-Startseite für sofortigen Zugriff
- Zentrale Aufgabenverwaltung
- Artikel-Editor mit KI-Unterstützung
- Recherche-Tools mit Multi-Quellen-Suche
- Sichere Datenverwaltung

## Technologie-Stack

### Frontend
- **React** - UI-Framework
- **Vite** - Build-Tool und Dev-Server
- **React Router** - Navigation
- **Zustand** - State Management
- **TanStack Query** - API-Anfragen und Caching

### Backend
- **Node.js** - Runtime
- **Express** - Web-Framework
- **AI SDKs** - Anthropic, Google Gemini, OpenAI
- **Google APIs** - Drive-Integration
- **WebDAV** - Private Cloud-Verbindung

## Installation

### Voraussetzungen
- Node.js 18+ und npm
- Git
- API-Keys für Claude, Gemini und OpenAI

### Setup

1. **Repository klonen**
```bash
git clone <your-repo-url>
cd journalism-dashboard
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren**
```bash
cp .env.example .env
# Bearbeiten Sie .env und fügen Sie Ihre API-Keys hinzu
```

4. **Entwicklungsserver starten**
```bash
npm run dev
```

Das Frontend läuft auf `http://localhost:5173`
Das Backend läuft auf `http://localhost:3001`

## Docker Deployment

### Architektur: All-in-One Container

Das Dashboard läuft in **einem einzigen Container**, der sowohl das Frontend (React UI) als auch das Backend (Node.js API) enthält. Perfekt optimiert für CasaOS und andere Home-Server-Umgebungen.

### Mit Docker Compose (empfohlen)

1. **Umgebungsvariablen konfigurieren**
```bash
cp .env.example .env
# Bearbeiten Sie .env und fügen Sie Ihre API-Keys hinzu
```

2. **Container starten**
```bash
docker-compose up -d
```

3. **Zugriff**
- **Dashboard UI:** `http://localhost:3001`
- **API:** `http://localhost:3001/api`

4. **Container verwalten**
```bash
# Status prüfen
docker-compose ps

# Logs ansehen
docker-compose logs -f

# Container stoppen
docker-compose down

# Container neu builden
docker-compose build --no-cache
```

### Docker Hub Image

Das Image wird automatisch bei jedem Push auf `main` auf Docker Hub deployed:

```bash
docker pull laurencius/journalism-dashboard:latest
```

### Direktes Docker Run (ohne docker-compose)

```bash
docker run -d \
  --name journalism-dashboard \
  -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_claude_key \
  -e GOOGLE_GEMINI_API_KEY=your_gemini_key \
  -e OPENAI_API_KEY=your_openai_key \
  laurencius/journalism-dashboard:latest
```

Zugriff: `http://localhost:3001`

### Manuelles Docker Build

```bash
docker build -t journalism-dashboard .
docker run -p 3001:3001 --env-file .env journalism-dashboard
```

### CasaOS Installation

Perfekt für CasaOS - einfach als Custom App hinzufügen:

1. In CasaOS → **App Store** → **Custom Install**
2. Docker Image: `laurencius/journalism-dashboard:latest`
3. Port Mapping: `3001:3001`
4. Environment Variables hinzufügen:
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_GEMINI_API_KEY`
   - `OPENAI_API_KEY`
5. Container starten

Oder via CasaOS docker-compose Import: Laden Sie die `docker-compose.yml` aus dem Repository hoch.

### Production Deployment

Für Production-Deployments:

1. Erstellen Sie eine `.env` Datei mit Production-Werten
2. Verwenden Sie ein Reverse-Proxy (nginx/traefik) für HTTPS
3. Konfigurieren Sie Health Checks und Monitoring
4. Nutzen Sie Docker secrets für API-Keys
5. Optional: Mounten Sie ein Volume für persistente Daten

## Projekt-Struktur

```
journalism-dashboard/
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # Wiederverwendbare UI-Komponenten
│   │   ├── pages/         # Haupt-Seiten/Views
│   │   ├── services/      # API-Services
│   │   └── styles/        # Globale Styles
│   └── public/            # Statische Assets
├── backend/               # Node.js Backend
│   ├── src/
│   │   ├── routes/        # API-Routen
│   │   ├── controllers/   # Request-Handler
│   │   ├── services/      # Business-Logik (AI, Cloud)
│   │   └── config/        # Konfigurationsdateien
│   └── tests/             # Backend-Tests
├── config/                # Gemeinsame Konfiguration
└── docs/                  # Dokumentation
```

## Konfiguration

### API-Keys einrichten

1. **Claude AI (Anthropic)**
   - Registrieren: https://console.anthropic.com
   - API-Key in `.env` als `ANTHROPIC_API_KEY` eintragen

2. **Google Gemini**
   - Google AI Studio: https://makersuite.google.com
   - API-Key in `.env` als `GOOGLE_GEMINI_API_KEY` eintragen

3. **OpenAI**
   - Platform: https://platform.openai.com
   - API-Key in `.env` als `OPENAI_API_KEY` eintragen

4. **Google Drive**
   - Google Cloud Console: OAuth 2.0 Credentials erstellen
   - Client ID und Secret in `.env` eintragen

### Browser-Startseite einrichten

#### Chrome/Edge
1. Einstellungen → Beim Start → Bestimmte Seiten öffnen
2. `http://localhost:5173` hinzufügen

#### Firefox
1. Einstellungen → Startseite → Benutzerdefinierte Adressen
2. `http://localhost:5173` eintragen

## Nutzung

### Artikel schreiben mit Claude
```javascript
// Beispiel-API-Call
POST /api/ai/claude/generate
{
  "prompt": "Schreibe einen Artikel über...",
  "context": "Hintergrundinformationen..."
}
```

### Recherche mit Gemini
```javascript
POST /api/ai/gemini/research
{
  "query": "Komplexe Suchanfrage...",
  "sources": ["web", "drive"]
}
```

### Content-Umformung mit ChatGPT
```javascript
POST /api/ai/openai/transform
{
  "content": "Originaltext...",
  "instruction": "Fasse in 3 Sätzen zusammen"
}
```

## Entwicklung

### Scripts
- `npm run dev` - Startet Frontend & Backend im Dev-Modus
- `npm run dev:frontend` - Nur Frontend
- `npm run dev:backend` - Nur Backend
- `npm run build` - Production Build
- `npm run lint` - Code-Linting

## Roadmap

- [x] Basis-Dashboard-UI
- [x] All-in-One Docker Container
- [x] Docker Hub Automated Deployment
- [x] GitHub Actions CI/CD
- [x] CasaOS-optimierte Architektur
- [ ] Claude AI Integration
- [ ] Gemini Integration
- [ ] ChatGPT Integration
- [ ] Google Drive Verbindung
- [ ] WebDAV Cloud-Storage
- [ ] Artikel-Editor mit Rich-Text
- [ ] Recherche-Interface
- [ ] Aufgabenverwaltung
- [ ] Offline-Modus
- [ ] Browser-Extension (optional)
- [ ] Benutzerauthentifizierung
- [ ] Artikel-Datenbank

## Sicherheit

- API-Keys niemals in Git committen
- `.env` ist in `.gitignore` enthalten
- Sensible Daten nur in privater Cloud speichern
- HTTPS für Production empfohlen

## Lizenz

MIT

## Support

Bei Fragen oder Problemen öffnen Sie ein Issue im Repository.
