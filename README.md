# Quill - Investigative Journalism Intelligence Platform

[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-laurencius-blue?logo=docker)](https://hub.docker.com/u/laurencius)
[![Build and Push](https://github.com/laurenciusMD/journalism-dashboard/actions/workflows/docker-hub-deploy.yml/badge.svg)](https://github.com/laurenciusMD/journalism-dashboard/actions/workflows/docker-hub-deploy.yml)
[![Version](https://img.shields.io/badge/version-0.9.0-green)](https://github.com/laurenciusMD/journalism-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Ihre Story. Unser Puls. Aus ihrer Feder.**

Ein KI-gestütztes Investigativ-Tool für professionellen Journalismus - von Content-Erstellung über Deep-Research bis zur Faktenprüfung.

---

## 🎯 Was ist Quill?

Quill ist mehr als ein CMS - es ist eine **Investigative Intelligence Platform**, die Journalisten mit modernsten AI-Tools, automatischer Recherche und Knowledge-Graph-Technologie ausstattet.

**Aktueller Stand:** v0.9.0 - Foundation Phase
**Roadmap:** Transformation zur Full-Stack Investigativ-Suite (siehe [ROADMAP.md](docs/ROADMAP.md))

---

## ✨ Kernfunktionen (v0.9.0)

### 🤖 KI-Integration
- **Claude AI** - Zusammenfassen, Texte überarbeiten, kreative Unterstützung
- **Google Gemini** - Korrektur, Datenanalyse, Fact-Checking
- **ChatGPT/MDR GPTs** - Spezialisierte GPTs für MDR-Content

### ☁️ Cloud-Integration
- **Nextcloud** - Self-hosted Cloud mit Dateien, Kalender, Kontakten, Notizen
- **Auto-Repair** - Nextcloud config.php wird automatisch repariert
- **Direktzugriff** - Click-to-Open für alle Nextcloud-Apps

### 🎨 Moderne UI
- **Glassmorphism-Design** - Helles, modernes Interface
- **Responsive** - Funktioniert auf Desktop & Tablet
- **Changelog & Roadmap** - Transparente Entwicklung
- **File-Upload** - Drag & Drop für TXT, MD, PDF, DOC, DOCX in AI-Panels

---

## 🚀 Kommende Features (2025)

Quill entwickelt sich zur vollwertigen **Investigative Suite**. Geplant sind:

### Q1 2025 - Foundation
- 📰 **Portfolio-Tracker** - Automatisches MDR-Scraping + Chat mit eigenem Archiv (RAG)
- 📡 **News-Radar** - Google News Aggregation + Nextcloud-Integration
- 🤖 **Modulare KI-Steuerung** - Wähle dein eigenes Modell pro Feature (BYOM)

### Q2 2025 - Intelligence
- 🎙️ **Interview-Vault** - Audio-Upload + automatische Transkription (Whisper)
- 💬 **Smart Quotes** - Click-to-Copy mit Timecodes aus Interviews
- 📊 **Erweiterte RAG** - Multi-Source Search (Archiv + Web)

### Q3 2025 - Deep Investigation
- 🕸️ **Knowledge Graph** - Visualisiere Verbindungen zwischen Personen & Firmen
- 🏢 **North Data Integration** - Automatische Handelsregister-Abfragen
- ✅ **Live-Fact-Checking** - In-Editor Verifikation mit Ampel-System
- 🔍 **Investigative Queries** - "Finde versteckte Verbindungen zwischen X und Y"

**Vollständige Planung:** Siehe [INVESTIGATIVE_SUITE_ARCHITECTURE.md](docs/INVESTIGATIVE_SUITE_ARCHITECTURE.md) & [ROADMAP.md](docs/ROADMAP.md)

---

## 🚀 Installation

### Schnellstart auf blankem Ubuntu-System

Für eine vollautomatische Installation auf einem neuen Ubuntu-Server:

```bash
curl -fsSL https://raw.githubusercontent.com/laurenciusMD/journalism-dashboard/main/setup.sh | bash
```

Oder manuell:

```bash
git clone https://github.com/laurenciusMD/journalism-dashboard.git
cd journalism-dashboard
chmod +x setup.sh
./setup.sh
```

**Detaillierte Anleitung:** Siehe [SETUP_UBUNTU.md](SETUP_UBUNTU.md)

---

### Voraussetzungen (für manuelle Installation)
- Node.js 18+ und npm
- Git
- API-Keys für Claude, Gemini und OpenAI (optional)

### Manual Setup (Development)

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

### 🚀 All-in-One Setup mit integriertem Nextcloud

Das Dashboard-Setup beinhaltet **alles, was Sie brauchen** in einem einzigen `docker-compose.yml`:

- **journalism-dashboard** (Port 3001) - Das Hauptdashboard mit Frontend & Backend
- **nextcloud** (Port 8080) - Ihre private Cloud für Dateien, Kalender, Kontakte
- **nextcloud-db** (MariaDB) - Datenbank für Nextcloud

**Besonderheit:** Beide Systeme nutzen **dieselben Login-Daten** - ein Login für alles!

### Mit Docker Compose (empfohlen)

#### 1. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Projektverzeichnis:

```bash
cp .env.example .env
```

**Minimal-Konfiguration** (.env):
```env
# === AUTHENTICATION (REQUIRED) ===
DASHBOARD_USERNAME=ihr_benutzername
DASHBOARD_PASSWORD=ihr_sicheres_passwort
SESSION_SECRET=generieren_sie_einen_zufaelligen_32_zeichen_string

# === AI SERVICES (Optional) ===
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# === NEXTCLOUD DATABASE (Optional - hat sichere Defaults) ===
NEXTCLOUD_DB_PASSWORD=nextcloud_secure_password
NEXTCLOUD_DB_ROOT_PASSWORD=secure_root_password
```

#### 2. Container-Stack starten

```bash
docker-compose up -d
```

Beim ersten Start:
- Nextcloud wird automatisch eingerichtet
- Admin-Account wird mit Ihren Dashboard-Credentials erstellt
- Alle Datenbanken werden initialisiert

#### 3. Zugriff auf die Dienste

- **📰 Dashboard:** `http://localhost:3001`
  → Login mit `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`

- **☁️ Nextcloud:** `http://localhost:8080`
  → Login mit **denselben Credentials**!

- **🔗 API:** `http://localhost:3001/api`

#### 4. Container verwalten

```bash
# Status aller Services prüfen
docker-compose ps

# Logs ansehen (alle Services)
docker-compose logs -f

# Logs eines einzelnen Services
docker-compose logs -f journalism-dashboard
docker-compose logs -f nextcloud

# Container stoppen (Daten bleiben erhalten)
docker-compose down

# Container stoppen UND Daten löschen (Vorsicht!)
docker-compose down -v

# Services neu starten
docker-compose restart

# Dashboard neu builden
docker-compose build --no-cache journalism-dashboard
```

#### 5. Daten-Persistenz

Alle Daten werden in Docker Volumes gespeichert und bleiben auch nach `docker-compose down` erhalten:

- `nextcloud-data` - Nextcloud-Dateien
- `nextcloud-apps` - Installierte Nextcloud-Apps
- `nextcloud-config` - Nextcloud-Konfiguration
- `nextcloud-db` - Datenbank-Daten

**Backup erstellen:**
```bash
docker-compose down
docker run --rm -v nextcloud-data:/data -v $(pwd):/backup ubuntu tar czf /backup/nextcloud-backup.tar.gz /data
docker-compose up -d
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

**Empfohlen:** Nutzen Sie docker-compose für die All-in-One Installation mit Nextcloud!

#### Option 1: Docker Compose Import (empfohlen)

1. In CasaOS → **App Store** → **Import from Docker Compose**
2. Laden Sie die `docker-compose.yml` aus dem Repository hoch
3. Konfigurieren Sie die Umgebungsvariablen:
   - `DASHBOARD_USERNAME` - Ihr Benutzername
   - `DASHBOARD_PASSWORD` - Ihr Passwort
   - `SESSION_SECRET` - Zufälliger String (min. 32 Zeichen)
   - Optional: AI API Keys
4. Installation starten

**Wichtig:** Beide Dienste (Dashboard & Nextcloud) verwenden dieselben Login-Daten!

#### Option 2: Nur Dashboard (ohne Nextcloud)

1. In CasaOS → **App Store** → **Custom Install**
2. Docker Image: `laurencius/journalism-dashboard:latest`
3. Port Mapping: `3001:3001`
4. Environment Variables hinzufügen:
   - `DASHBOARD_USERNAME`
   - `DASHBOARD_PASSWORD`
   - `SESSION_SECRET`
   - Optional: `ANTHROPIC_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `OPENAI_API_KEY`
5. Container starten

**Zugriff:**
- Dashboard: `http://[casa-os-ip]:3001`
- Nextcloud (bei docker-compose): `http://[casa-os-ip]:8080`

### Production Deployment

Für Production-Deployments:

1. Erstellen Sie eine `.env` Datei mit Production-Werten
2. Verwenden Sie ein Reverse-Proxy (nginx/traefik) für HTTPS
3. Konfigurieren Sie Health Checks und Monitoring
4. Nutzen Sie Docker secrets für API-Keys
5. Ändern Sie alle Default-Passwörter in der `.env`
6. Optional: Konfigurieren Sie Nextcloud mit eigenem Domain/SSL

## 🔐 Authentifizierung & Sicherheit

### Single Sign-On (SSO)

Das Dashboard implementiert ein **vereinfachtes SSO-System**:

- **Ein Login für alles:** Dieselben Credentials für Dashboard UND Nextcloud
- **Umgebungsvariablen:** `DASHBOARD_USERNAME` und `DASHBOARD_PASSWORD` werden für beide Systeme verwendet
- **Session-basiert:** HttpOnly Cookies für sichere Session-Verwaltung
- **Nextcloud-Integration:** Optional kann das Dashboard gegen Nextcloud authentifizieren

### Login-Modi

1. **Standard-Modus** (Default)
   - Authentifizierung gegen `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`
   - Funktioniert auch ohne Nextcloud

2. **Nextcloud-SSO-Modus**
   - Checkbox "Mit Nextcloud-Anmeldung" aktivieren
   - Authentifizierung direkt gegen Nextcloud-Server
   - Ermöglicht Nutzung von Nextcloud-App-Passwörtern

### Erste Anmeldung

Nach dem ersten Start:

1. Öffnen Sie `http://localhost:3001`
2. Login-Screen erscheint
3. Verwenden Sie die in `.env` konfigurierten Credentials:
   - Benutzername: Ihr `DASHBOARD_USERNAME`
   - Passwort: Ihr `DASHBOARD_PASSWORD`
4. Optional: Aktivieren Sie "Mit Nextcloud-Anmeldung" für SSO
5. Nach erfolgreicher Anmeldung: Zugriff auf alle Features

**Wichtig:** Die Session bleibt 24 Stunden aktiv (HttpOnly Cookie).

### Sicherheitshinweise

- ✅ Verwenden Sie **starke Passwörter** (min. 16 Zeichen)
- ✅ Ändern Sie `SESSION_SECRET` zu einem zufälligen String
- ✅ Für Nextcloud: Nutzen Sie **App-Passwörter** statt Haupt-Passwort
- ✅ In Production: HTTPS mit Reverse-Proxy (nginx/Traefik)
- ✅ API-Keys niemals in Git committen
- ✅ Für externen Zugriff: Firewall und VPN nutzen

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

### ✅ Abgeschlossen
- [x] Basis-Dashboard-UI mit modernem Design
- [x] All-in-One Docker Container (Frontend + Backend)
- [x] Docker Hub Automated Deployment
- [x] GitHub Actions CI/CD
- [x] CasaOS-optimierte Architektur
- [x] **Benutzerauthentifizierung** (Session-basiert)
- [x] **Nextcloud-Integration** (inkl. SSO)
- [x] **Multi-Service Docker Setup** (Dashboard + Nextcloud + DB)
- [x] Login-UI mit animiertem Hintergrund
- [x] Settings-Panel für Konfiguration

### 🚧 In Arbeit
- [ ] Claude AI Integration (API-Calls)
- [ ] Gemini Integration (API-Calls)
- [ ] ChatGPT Integration (API-Calls)

### 📋 Geplant
- [ ] Nextcloud WebDAV File-Browser im Dashboard
- [ ] Google Drive Verbindung
- [ ] Artikel-Editor mit Rich-Text
- [ ] Recherche-Interface mit Multi-Quellen
- [ ] Aufgabenverwaltung
- [ ] Artikel-Datenbank (Speicherung in Nextcloud)
- [ ] Offline-Modus (PWA)
- [ ] Browser-Extension (optional)
- [ ] Desktop-Benachrichtigungen
- [ ] Dark Mode Toggle

## Sicherheit

- API-Keys niemals in Git committen
- `.env` ist in `.gitignore` enthalten
- Sensible Daten nur in privater Cloud speichern
- HTTPS für Production empfohlen

## Lizenz

MIT License

Copyright © 2024-2025 Laurencius

## Support

Bei Fragen oder Problemen öffnen Sie ein Issue im Repository.

---

**Quill** - Ihre zentrale Arbeitsumgebung für investigativen Journalismus
Version 0.7.0 | © 2024-2025 Laurencius | [Changelog](CHANGELOG.md) | [Roadmap](ROADMAP.md)
