# Journalism Dashboard - CasaOS Installation

## 🚀 Schnellstart

### 1. Container aus Docker Hub ziehen

```bash
docker pull laurencius/journalism-dashboard:latest
```

### 2. Container starten mit Volume

**WICHTIG:** Damit Ihre Daten (Benutzer, Dossiers, Uploads) erhalten bleiben, müssen Sie Volumes mounten:

```bash
docker run -d \
  --name journalism-dashboard \
  -p 3001:3001 \
  -v journalism-data:/app/data \
  -v journalism-evidence:/app/evidence \
  -v journalism-pgdata:/var/lib/postgresql/data \
  -e JOURNALISM_DB_PASSWORD=IhrSicheresPasswort123 \
  laurencius/journalism-dashboard:latest
```

### 3. CasaOS Web-UI Installation

Wenn Sie über die CasaOS Web-UI installieren:

1. **App Store** → **Eigene App hinzufügen**
2. **Image:** `laurencius/journalism-dashboard:latest`
3. **Port-Mapping:** `3001:3001`
4. **⚠️ WICHTIG - Volumes hinzufügen:**
   - `/app/data` → Speichert Benutzer und Einstellungen
   - `/app/evidence` → Speichert hochgeladene Dateien
   - `/var/lib/postgresql/data` → Speichert Recherche-Datenbank

## 📦 Was ist enthalten?

- **Node.js Backend** mit Express
- **React Frontend** (vorgebaut)
- **PostgreSQL 15** für Recherchen/Dossiers
- **Redis 7** für Job-Queues
- **SQLite** für Benutzer-Management

Alle Services laufen in **einem Container** - keine separate docker-compose Installation nötig!

## 🔧 Konfiguration

### Umgebungsvariablen

```bash
# PostgreSQL Passwort (optional, default: journalism)
JOURNALISM_DB_PASSWORD=IhrPasswort

# Session Secret (optional, wird automatisch generiert)
SESSION_SECRET=IhrSicheresSecret

# API Keys (optional, können auch in der UI eingegeben werden)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
```

### Erste Anmeldung

1. Öffnen Sie `http://localhost:3001` (oder Ihre Server-IP)
2. Beim ersten Start sehen Sie die Registrierung
3. Erstellen Sie Ihren Admin-Account
4. ✅ Fertig!

## ⚠️ Wichtig für Updates

### Daten sichern vor Update:

Wenn Sie den Container neu erstellen (z.B. nach Update):

**MIT Volumes (empfohlen):**
```bash
# Alte Container stoppen und entfernen
docker stop journalism-dashboard
docker rm journalism-dashboard

# Neu starten (Volumes bleiben erhalten!)
docker run -d \
  --name journalism-dashboard \
  -p 3001:3001 \
  -v journalism-data:/app/data \
  -v journalism-evidence:/app/evidence \
  -v journalism-pgdata:/var/lib/postgresql/data \
  laurencius/journalism-dashboard:latest
```

**OHNE Volumes (Daten gehen verloren):**
- Jeder Neustart = Neue Installation
- Benutzer muss neu angelegt werden
- Alle Dossiers/Uploads gehen verloren

## 📂 Datenverzeichnisse

| Verzeichnis | Inhalt | Größe |
|-------------|--------|-------|
| `/app/data` | SQLite-DB (Benutzer), Redis-Daten | ~10 MB |
| `/app/evidence` | Hochgeladene Dateien (Bilder, Videos, PDFs) | Variabel |
| `/var/lib/postgresql/data` | PostgreSQL-Datenbank (Recherchen) | ~100 MB |

## 🐛 Troubleshooting

### "Authentication required" Fehler

**Gelöst in Version 0.7.0+**
- Cookies funktionieren jetzt über HTTP
- Session bleibt erhalten

### Container startet nicht

```bash
# Logs anzeigen
docker logs journalism-dashboard

# Häufige Probleme:
# - Port 3001 bereits belegt → Anderen Port verwenden
# - Keine Schreibrechte auf Volumes → Permissions prüfen
```

### PostgreSQL initialisiert nicht

```bash
# Container komplett neu aufsetzen
docker stop journalism-dashboard
docker rm journalism-dashboard
docker volume rm journalism-pgdata  # ⚠️ Löscht PostgreSQL-Daten!

# Neu starten
docker run -d --name journalism-dashboard -p 3001:3001 \
  -v journalism-data:/app/data \
  -v journalism-evidence:/app/evidence \
  -v journalism-pgdata:/var/lib/postgresql/data \
  laurencius/journalism-dashboard:latest
```

### Benutzer vergessen

Wenn Sie Volumes nutzen aber das Passwort vergessen haben:

```bash
# SQLite-Datenbank zurücksetzen (nur Benutzer!)
docker exec -it journalism-dashboard rm /app/data/users.db
docker restart journalism-dashboard
```

## 🔄 Update-Prozess

```bash
# 1. Neuestes Image ziehen
docker pull laurencius/journalism-dashboard:latest

# 2. Alten Container stoppen
docker stop journalism-dashboard
docker rm journalism-dashboard

# 3. Mit gleichem Volume-Setup neu starten
docker run -d \
  --name journalism-dashboard \
  -p 3001:3001 \
  -v journalism-data:/app/data \
  -v journalism-evidence:/app/evidence \
  -v journalism-pgdata:/var/lib/postgresql/data \
  laurencius/journalism-dashboard:latest

# 4. Prüfen
docker logs journalism-dashboard
```

## 📊 Features

- ✅ Recherche-Dossiers mit Personen-Datenbank
- ✅ File-Upload (Drag & Drop)
- ✅ AI-Integration (Claude, Gemini, ChatGPT)
- ✅ MDR GPTs mit Direktübergabe
- ✅ Social Media Generator
- ✅ Nextcloud-Integration (optional)

## 🔗 Links

- **GitHub:** https://github.com/laurenciusMD/journalism-dashboard
- **Docker Hub:** https://hub.docker.com/r/laurencius/journalism-dashboard
- **Issues:** https://github.com/laurenciusMD/journalism-dashboard/issues

## 📝 Lizenz

MIT License - Siehe GitHub Repository
