# Fresh Installation Guide

## 🔥 Komplette Neuinstallation

Dieses Script bereinigt **ALLES** und installiert das System komplett neu.

### ⚠️ WARNUNG

Das Script löscht:
- ✅ Alle Docker Container
- ✅ Alle Docker Images
- ✅ Alle Docker Volumes (inkl. **ALLE DATEN!**)
- ✅ Alle Docker Networks
- ✅ Alle lokalen Git-Änderungen

**Nur verwenden wenn:**
- Keine wichtigen Daten im System sind
- System in inkonsistentem Zustand ist
- Fresh Start gewünscht ist

---

## 🚀 Verwendung

### Einfachste Methode:

```bash
./fresh-install.sh
```

Das Script führt automatisch aus:
1. ✅ Docker komplett bereinigen
2. ✅ Git Repository auf sauberen Stand bringen
3. ✅ Datenbank-Migrationen verifizieren
4. ✅ Fresh Installation mit `setup.sh`
5. ✅ System-Verifizierung

---

## 📋 Was passiert im Detail

### Schritt 1: Docker Bereinigung
```bash
docker compose down -v --rmi all
docker system prune -a --volumes -f
```

### Schritt 2: Git Reset
```bash
git reset --hard origin/claude/setup-ubuntu-system-I7oYg
git clean -fd
```

### Schritt 3: Migration Check
- Prüft ob `backend/migrations/003_users_table.sql` existiert
- Verifiziert `get_or_create_user()` Funktion

### Schritt 4: Installation
- Führt `./setup.sh` aus
- Baut alle Container neu
- Richtet Datenbanken ein
- Installiert Nextcloud
- Startet alle Services

### Schritt 5: Verifizierung
- Prüft Container Status
- Testet Datenbank-Verbindungen
- Verifiziert `get_or_create_user()` Funktion

---

## ✅ Nach der Installation

### 1. Services prüfen
```bash
docker compose ps
```

Alle Container sollten "Up" Status haben.

### 2. Logs anschauen
```bash
# Alle Logs
docker compose logs -f

# Nur Dashboard
docker compose logs -f journalism-dashboard

# Nur letzte 50 Zeilen
docker compose logs --tail=50 journalism-dashboard
```

### 3. Nextcloud einrichten

Im Browser: http://YOUR-SERVER:8080

- Admin-User wurde während Setup erstellt
- Zusätzlichen User erstellen: `laurencius`
- Passwort setzen

### 4. Dashboard testen

Im Browser: http://YOUR-SERVER:3001

- Mit Nextcloud-Credentials anmelden
- Zu "AI Settings" navigieren
- Claude API Key speichern testen

### 5. Datenbank verifizieren

```bash
# Prüfe get_or_create_user Funktion
docker compose exec journalism-dashboard su - postgres -c \
  "psql -d journalism -c '\df get_or_create_user'"

# Teste Funktion
docker compose exec journalism-dashboard su - postgres -c \
  "psql -d journalism -c \"SELECT get_or_create_user('test_user');\""
```

---

## 🐛 Troubleshooting

### Container starten nicht

```bash
# Logs prüfen
docker compose logs

# Bestimmten Service neu starten
docker compose restart journalism-dashboard
```

### Datenbank nicht erreichbar

```bash
# Warte bis PostgreSQL bereit ist
docker compose exec journalism-dashboard su - postgres -c \
  "pg_isready -d journalism"

# Prüfe ob Tabellen existieren
docker compose exec journalism-dashboard su - postgres -c \
  "psql -d journalism -c '\dt'"
```

### get_or_create_user Funktion fehlt

```bash
# Migrationen manuell ausführen
./migrate.sh

# Oder: Funktion manuell erstellen
docker compose exec -T journalism-dashboard su - postgres -c \
  "psql -d journalism" < backend/migrations/003_users_table.sql
```

### Login funktioniert nicht

```bash
# Backend Logs prüfen
docker compose logs journalism-dashboard | grep -i error

# Teste Nextcloud Verbindung
docker compose exec journalism-dashboard curl -I http://localhost:8080

# Teste Backend API
curl http://localhost:3001/api/status
```

---

## 🔄 Alternative: Manueller Fresh Install

Falls du mehr Kontrolle willst:

```bash
# 1. Docker bereinigen
docker compose down -v --rmi all
docker system prune -a --volumes -f

# 2. Git bereinigen
git reset --hard origin/claude/setup-ubuntu-system-I7oYg
git pull

# 3. Neu installieren
./setup.sh

# 4. Verifizieren
docker compose ps
docker compose logs -f
```

---

## 📞 Support

Bei Problemen:
1. Logs prüfen: `docker compose logs -f`
2. Container Status: `docker compose ps`
3. System Resourcen: `docker stats`
4. Datenbank: `./verify-data.sh`

---

## 🔐 Sicherheit

Das Script:
- ✅ Fragt vor Ausführung nach Bestätigung (`yes`)
- ✅ Zeigt genau was gelöscht wird
- ✅ Verifiziert kritische Komponenten
- ✅ Gibt detailliertes Feedback
- ✅ Stoppt bei Fehlern (`set -e`)

---

## 📚 Siehe auch

- [README.md](README.md) - Hauptdokumentation
- [PRODUCTION_UPDATES.md](PRODUCTION_UPDATES.md) - Update-Strategien
- [BACKUP_RESTORE.md](BACKUP_RESTORE.md) - Backup & Restore
- [SETUP_UBUNTU.md](SETUP_UBUNTU.md) - Ubuntu Setup Guide
