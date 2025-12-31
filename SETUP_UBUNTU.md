# 🚀 Quill Installation auf blankem Ubuntu System

Diese Anleitung führt Sie Schritt für Schritt durch die Installation des Journalism Dashboards auf einem frisch installierten Ubuntu-System.

## 📋 Voraussetzungen

- Blankes Ubuntu 20.04, 22.04 oder 24.04
- Root/sudo-Zugriff
- Internetverbindung

## 🎯 Schnellstart (Automatische Installation)

Für eine vollautomatische Installation führen Sie diesen Befehl aus:

```bash
curl -fsSL https://raw.githubusercontent.com/laurenciusMD/journalism-dashboard/main/setup.sh | bash
```

Oder klonen Sie das Repository und führen Sie das Setup-Script aus:

```bash
git clone https://github.com/laurenciusMD/journalism-dashboard.git
cd journalism-dashboard
chmod +x setup.sh
./setup.sh
```

Das Script installiert automatisch:
- Docker & Docker Compose
- Alle notwendigen System-Dependencies
- Konfiguriert das Projekt
- Startet alle Services

---

## 📖 Manuelle Installation (Schritt für Schritt)

### Schritt 1: System aktualisieren

```bash
sudo apt update && sudo apt upgrade -y
```

### Schritt 2: Basis-Tools installieren

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release
```

### Schritt 3: Docker installieren

#### Docker Repository hinzufügen

```bash
# Docker GPG-Key hinzufügen
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Docker Repository hinzufügen
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### Docker Engine installieren

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Docker ohne sudo verwenden (optional)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### Docker-Installation testen

```bash
docker --version
docker compose version
```

### Schritt 4: Projekt klonen

```bash
cd ~
git clone https://github.com/laurenciusMD/journalism-dashboard.git
cd journalism-dashboard
```

### Schritt 5: Umgebungsvariablen konfigurieren

#### .env-Datei erstellen

```bash
cp .env.example .env
nano .env
```

#### Minimale Konfiguration

Bearbeiten Sie die `.env`-Datei mit folgenden **REQUIRED** Werten:

```env
# === AUTHENTICATION (REQUIRED) ===
# Nextcloud Admin-Account (wird nur beim ersten Start erstellt)
NEXTCLOUD_INITIAL_ADMIN_USER=ihr_benutzername
NEXTCLOUD_INITIAL_ADMIN_PASSWORD=ihr_sicheres_passwort
SESSION_SECRET=hier_einen_zufaelligen_32_zeichen_string

# === ENCRYPTION (REQUIRED) ===
# Generieren mit: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=38165c882c6eca3ed81ba1394d84111bef2dbfd26eebeb4db65d0a7e3b47bc6d

# === DATABASE PASSWORD ===
JOURNALISM_DB_PASSWORD=journalism_password_hier_aendern

# === AI SERVICES (Optional - können später hinzugefügt werden) ===
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=AIza...
# OPENAI_API_KEY=sk-...
```

#### Sicheren Session-Secret generieren

```bash
# Option 1: Mit OpenSSL
openssl rand -base64 32

# Option 2: Mit /dev/urandom
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# Option 3: Mit Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Kopieren Sie die Ausgabe und fügen Sie sie als `SESSION_SECRET` in die `.env` ein.

### Schritt 6: Docker Services starten

```bash
docker compose up -d
```

Beim ersten Start werden automatisch:
- Alle Docker Images heruntergeladen
- Nextcloud eingerichtet
- Datenbanken initialisiert
- Admin-Account mit Ihren Credentials erstellt

**Hinweis:** Der erste Start kann 2-5 Minuten dauern.

### Schritt 7: Installation überprüfen

#### Container-Status prüfen

```bash
docker compose ps
```

Alle Services sollten "running" und "healthy" sein:
- `journalism-dashboard` (enthält: Dashboard-Backend, Frontend & Nextcloud)
- `journalism-postgres` (PostgreSQL für Journalism DB + Nextcloud DB)
- `journalism-redis` (Job Queue)

#### Logs ansehen

```bash
# Alle Services
docker compose logs -f

# Hauptcontainer (Dashboard + Nextcloud)
docker compose logs -f journalism-dashboard

# PostgreSQL
docker compose logs -f postgres
```

### Schritt 8: Auf die Services zugreifen

Öffnen Sie einen Browser und navigieren Sie zu:

- **📰 Dashboard:** http://localhost:3001
  - Login mit `NEXTCLOUD_INITIAL_ADMIN_USER` / `NEXTCLOUD_INITIAL_ADMIN_PASSWORD`

- **☁️ Nextcloud:** http://localhost:8080
  - Login mit **denselben Credentials**!
  - Läuft im journalism-dashboard Container (effiziente Single-Container-Architektur)

- **🔗 API:** http://localhost:3001/api/health

---

## 🔧 Alternative: Development-Setup (ohne Docker)

Falls Sie das Projekt für die Entwicklung ohne Docker starten möchten:

### Node.js installieren

```bash
# NodeSource Repository hinzufügen (Node.js 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Version prüfen
node --version  # sollte v20.x sein
npm --version
```

### Projekt-Dependencies installieren

```bash
cd ~/journalism-dashboard
npm install
```

### Development-Server starten

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

**Hinweis:** Für Development benötigen Sie keine Docker-Container, aber Nextcloud wird dann nicht verfügbar sein.

---

## 🎛️ Verwaltung & Wartung

### Services stoppen

```bash
cd ~/journalism-dashboard
docker compose down
```

### Services neu starten

```bash
docker compose restart
```

### Services neu bauen (nach Code-Änderungen)

```bash
docker compose build --no-cache
docker compose up -d
```

### Daten-Backup erstellen

```bash
# Container stoppen
docker compose down

# Backup aller Volumes
docker run --rm \
  -v journalism-dashboard_nextcloud-data:/data/nextcloud \
  -v journalism-dashboard_postgres-data:/data/postgres \
  -v journalism-dashboard_dashboard-data:/data/dashboard \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/quill-backup-$(date +%Y%m%d).tar.gz /data

# Container wieder starten
docker compose up -d
```

### Daten-Backup wiederherstellen

```bash
# Container stoppen
docker compose down

# Backup entpacken
docker run --rm \
  -v journalism-dashboard_nextcloud-data:/data/nextcloud \
  -v journalism-dashboard_postgres-data:/data/postgres \
  -v journalism-dashboard_dashboard-data:/data/dashboard \
  -v $(pwd):/backup \
  ubuntu tar xzf /backup/quill-backup-YYYYMMDD.tar.gz -C /

# Container wieder starten
docker compose up -d
```

### Komplett neuinstallieren (Daten löschen)

```bash
cd ~/journalism-dashboard

# WARNUNG: Löscht alle Daten!
docker compose down -v

# Neu starten
docker compose up -d
```

---

## 🌐 Zugriff von anderen Geräten im Netzwerk

### Firewall-Ports öffnen

```bash
# UFW Firewall (Ubuntu default)
sudo ufw allow 3001/tcp  # Dashboard
sudo ufw allow 8080/tcp  # Nextcloud
sudo ufw status
```

### IP-Adresse finden

```bash
ip addr show | grep inet
```

Von anderen Geräten im Netzwerk:
- Dashboard: `http://[IP-ADRESSE]:3001`
- Nextcloud: `http://[IP-ADRESSE]:8080`

### Nextcloud Trusted Domains erweitern

Falls Nextcloud "Zugriff verweigert" anzeigt:

```bash
# Trusted Domain hinzufügen
docker compose exec journalism-dashboard su -s /bin/bash www-data -c "php /var/www/html/occ config:system:set trusted_domains 2 --value='192.168.1.100'"  # Ihre IP
```

---

## 🔒 Sicherheits-Empfehlungen

### Production-Setup

Für den Produktiv-Einsatz sollten Sie:

1. **Reverse-Proxy mit SSL einrichten** (nginx/Traefik)
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Starke Passwörter verwenden**
   - Mindestens 16 Zeichen
   - Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen

3. **API-Keys sicher speichern**
   - Niemals in Git committen
   - Docker Secrets verwenden (fortgeschritten)

4. **Regelmäßige Backups**
   - Automatisierte Backup-Cronjobs einrichten

5. **Firewall konfigurieren**
   - Nur notwendige Ports öffnen
   - VPN für externen Zugriff nutzen

6. **System-Updates**
   ```bash
   # Automatische Updates aktivieren
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```

---

## 👥 Benutzerverwaltung

### 🎯 Wichtig: Nextcloud ist die einzige Quelle der Wahrheit

**Alle Benutzerverwaltung erfolgt ausschließlich in Nextcloud!**

- ✅ User in Nextcloud erstellen → Kann sich am Dashboard anmelden
- ✅ Passwort in Nextcloud ändern → Automatisch für Dashboard geändert
- ✅ User in Nextcloud deaktivieren → Automatisch am Dashboard gesperrt
- ❌ Es gibt KEINE separaten Dashboard-Credentials
- ❌ Die `.env`-Datei wird NICHT für Login-Verwaltung verwendet

### Standard-Benutzergruppen

Das System erstellt automatisch folgende Nextcloud-Gruppen:

- **admin** - Volle Administratorrechte (Systemkonfiguration, alle Features)
- **journalists** - Standard-Benutzer (Dateien, Kalender, Notizen - KEINE Systemeinstellungen)

### Neue Benutzer anlegen

**Für normale Benutzer (Journalisten):**

1. Nextcloud (http://[server-ip]:8080) → Benutzer → Neues Konto
2. Gruppe: **journalists** wählen
3. Manager-Feld: **leer lassen**
4. Speichern
5. ✅ Fertig! User kann sich sofort am Dashboard anmelden

**Für Administratoren:**

Via Command Line (empfohlen):
```bash
docker compose exec journalism-dashboard su -s /bin/bash www-data -c "php /var/www/html/occ user:add USERNAME"
docker compose exec journalism-dashboard su -s /bin/bash www-data -c "php /var/www/html/occ group:adduser admin USERNAME"
```

**Wichtig:** Bei der Admin-Gruppe kann kein Manager über die Web-UI gesetzt werden (Nextcloud-Einschränkung).

### Passwort ändern

Passwörter werden **nur** in Nextcloud verwaltet:

```bash
# Via Web-UI: Nextcloud → Benutzer → User auswählen → Passwort ändern

# Via CLI:
docker compose exec journalism-dashboard su -s /bin/bash www-data -c "php /var/www/html/occ user:resetpassword USERNAME"
```

---

## 🔄 Updates & Datenschutz

### Bestehende Nextcloud-Installation ist geschützt

**Wichtig:** Ihre Nextcloud-Daten und Benutzer sind SICHER!

✅ **Bei Git Updates:**
- Nextcloud-Daten bleiben erhalten (Docker Volumes)
- Bestehende User werden NICHT überschrieben
- Passwörter bleiben unverändert
- `.env`-Änderungen werden IGNORIERT wenn Nextcloud bereits installiert ist

✅ **Bei Container-Neustart:**
- Nextcloud-Installation wird NICHT neu durchgeführt
- Alle Daten bleiben erhalten
- `NEXTCLOUD_INITIAL_ADMIN_*` wird nur beim allerersten Start verwendet

✅ **Daten-Persistenz:**
- Alle Nextcloud-Daten in Docker Volume `nextcloud-data`
- Nextcloud-Datenbank in Docker Volume `postgres-data` (PostgreSQL)
- Bleiben erhalten bei: `docker compose down`, Git Updates, Container-Rebuilds

### System aktualisieren

```bash
cd ~/journalism-dashboard

# 1. Neuesten Code holen
git pull

# 2. Container neu bauen und starten
docker compose build --no-cache journalism-dashboard
docker compose up -d

# ✅ Ihre Nextcloud-Daten bleiben unberührt!
```

### Was wird beim Update NICHT überschrieben:

- ❌ Nextcloud-User (bleiben alle erhalten)
- ❌ Nextcloud-Passwörter (bleiben unverändert)
- ❌ Nextcloud-Dateien (bleiben erhalten)
- ❌ Nextcloud-Konfiguration (bleibt erhalten)
- ❌ Datenbanken (bleiben erhalten)

### Was wird beim Update aktualisiert:

- ✅ Dashboard-Code (neue Features)
- ✅ Backend-Code (Bug-Fixes)
- ✅ Frontend-Code (UI-Updates)
- ✅ System-Bibliotheken (wenn Docker Image neu gebaut wird)

---

## 🐛 Troubleshooting

### Container starten nicht

```bash
# Logs ansehen
docker compose logs

# Hauptcontainer prüfen (enthält Dashboard + Nextcloud)
docker compose logs journalism-dashboard
```

### Port bereits belegt

```bash
# Welcher Prozess nutzt Port 3001?
sudo lsof -i :3001

# Prozess beenden
sudo kill -9 [PID]
```

### Nextcloud zeigt "Setup-Seite" statt Dashboard

Warten Sie 1-2 Minuten nach dem ersten Start. Nextcloud braucht Zeit für die Initialisierung.

```bash
# Status prüfen
docker compose logs -f nextcloud

# Wenn "healthy", dann ist Nextcloud bereit
docker compose ps
```

### Docker Compose Fehler: "Version not supported"

```bash
# Neuere Docker Compose Version installieren
sudo apt remove docker-compose
sudo apt install docker-compose-plugin

# Version prüfen
docker compose version
```

### Nicht genug Speicherplatz

```bash
# Docker bereinigen
docker system prune -a --volumes

# Speicher prüfen
df -h
```

---

## 📚 Weiterführende Dokumentation

- [README.md](README.md) - Projekt-Übersicht
- [ROADMAP.md](ROADMAP.md) - Feature-Roadmap
- [CHANGELOG.md](CHANGELOG.md) - Versions-Historie
- [docs/INVESTIGATIVE_SUITE_ARCHITECTURE.md](docs/INVESTIGATIVE_SUITE_ARCHITECTURE.md) - Architektur

---

## 💬 Support

Bei Problemen oder Fragen:
- GitHub Issues: https://github.com/laurenciusMD/journalism-dashboard/issues
- Dokumentation: Im `docs/` Ordner

---

**Viel Erfolg mit Quill!** 🎉

Version: 0.9.0 | © 2024-2025 Laurencius
