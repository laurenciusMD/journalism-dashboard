# Production Update Strategy

## 🎯 Intelligentes Update-System

Das System unterscheidet zwischen verschiedenen Arten von Updates und wendet nur die minimal notwendigen Änderungen an.

---

## 🚀 Schnellstart

```bash
# Standard-Update (intelligent, automatisch)
./smart-update.sh

# Force Rebuild (wenn nötig)
./smart-update.sh --force-rebuild

# Nur Migrationen ausführen
./migrate.sh
```

---

## 📊 Update-Typen

### 1. **Code-Update** (am häufigsten)
**Was ändert sich:** Backend/Frontend Code
**Was passiert:**
- ✅ Nur `journalism-dashboard` Container neu starten
- ✅ Kein Rebuild
- ✅ ~10 Sekunden Downtime
- ✅ Nextcloud unberührt

**Erkennung:**
```bash
# Geänderte Dateien:
backend/src/**/*.js
frontend/src/**/*.jsx
```

**Befehl:**
```bash
./smart-update.sh
# → "Update type: CODE UPDATE"
# → docker compose restart journalism-dashboard
```

---

### 2. **Dependency-Update**
**Was ändert sich:** package.json, Dockerfile
**Was passiert:**
- ⚠️ Container wird neu gebaut
- ⚠️ ~2-3 Minuten Downtime
- ✅ Nextcloud-Datenbank unberührt
- ✅ Alle Volumes (Daten) bleiben erhalten

**Erkennung:**
```bash
# Geänderte Dateien:
Dockerfile
docker-compose.yml
backend/package.json
frontend/package.json
```

**Befehl:**
```bash
./smart-update.sh
# → "Update type: FULL REBUILD"
# → docker compose build journalism-dashboard
```

---

### 3. **Schema-Update**
**Was ändert sich:** Datenbank-Schema
**Was passiert:**
- 📋 Neue Migrationen werden angewendet
- ✅ Kein Container-Restart nötig
- ✅ Alle Daten bleiben erhalten
- ✅ Transaktional (bei Fehler: Rollback)

**Erkennung:**
```bash
# Neue Dateien:
backend/migrations/004_*.sql
backend/migrations/005_*.sql
```

**Befehl:**
```bash
./smart-update.sh  # Automatisch erkannt
# ODER manuell:
./migrate.sh
```

---

### 4. **Infrastruktur-Update**
**Was ändert sich:** PostgreSQL, Redis, Nextcloud
**Was passiert:**
- ⚠️⚠️ SELTEN - nur bei Major-Updates
- ⚠️⚠️ Geplante Wartung erforderlich
- 📋 Separates Migrations-Dokument

**Manueller Prozess:**
1. Backup erstellen
2. Wartungsfenster planen
3. Update durchführen
4. Verify + Rollback-Plan

---

## 🔄 Smart Update Flow

```
smart-update.sh ausführen
        ↓
1. Backup erstellen
        ↓
2. Code holen (git pull)
        ↓
3. Änderungen analysieren
        ↓
    ┌───┴───┐
    │       │
  Nur     Rebuild   Migration
  Code    nötig?    nötig?
    │       │         │
    ↓       ↓         ↓
Restart  Build    Apply
         +        Migrations
       Recreate      │
         │           │
         └─────┬─────┘
               ↓
        4. Verify Health
               ↓
         ✅ Fertig
```

---

## 📋 Database Migrations

### Migration erstellen

```bash
# Neue Migration erstellen
cat > backend/migrations/004_add_feature.sql << 'EOF'
-- Migration 004: Add new feature

CREATE TABLE IF NOT EXISTS new_feature (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rollback SQL (kommentiert)
-- DROP TABLE IF EXISTS new_feature;
EOF
```

### Migrations anwenden

```bash
# Automatisch beim Update
./smart-update.sh

# Oder manuell
./migrate.sh
```

### Migration-Tracking

Das System trackt angewendete Migrationen in der `schema_migrations` Tabelle:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

---

## 🛡️ Datensicherheit

### Was wird NIEMALS geändert:

1. **Nextcloud Datenbank** (`nextcloud`)
   - ✅ Benutzer bleiben erhalten
   - ✅ Passwörter bleiben erhalten
   - ✅ Dateien bleiben erhalten

2. **Docker Volumes**
   - ✅ `nextcloud-data` - Nextcloud Dateien
   - ✅ `postgres-data` - Datenbank-Daten
   - ✅ `evidence-storage` - Hochgeladene Beweise

3. **Journalism Datenbank** (`journalism`)
   - ✅ Nur durch Migrationen geändert
   - ✅ Migrationen sind transaktional
   - ✅ Bei Fehler: Automatischer Rollback

### Was passiert bei Container-Rebuild:

```bash
docker compose build journalism-dashboard
```

**Neu gebaut:**
- ✅ Node.js Dependencies
- ✅ Python Packages
- ✅ System-Pakete
- ✅ Nextcloud-Installation (Code)

**NICHT geändert:**
- ✅ PostgreSQL-Daten (in Volume)
- ✅ Nextcloud-Daten (in Volume)
- ✅ Nextcloud-Konfiguration (persistiert)
- ✅ Nextcloud-Benutzer (in DB)

---

## 🔍 Monitoring & Verification

### Nach jedem Update prüfen:

```bash
# 1. Container-Status
docker compose ps

# 2. Logs prüfen
docker compose logs journalism-dashboard --tail 50

# 3. API Health Check
curl http://localhost:3001/api/health

# 4. Nextcloud Check
curl http://localhost:8080/status.php

# 5. Datenintegrität
./verify-data.sh
```

### Bei Problemen:

```bash
# Logs mit Fehlerfilter
docker compose logs journalism-dashboard | grep -i error

# Restart wenn nötig
docker compose restart journalism-dashboard

# Oder kompletter Neustart
docker compose down
docker compose up -d
```

---

## 🔙 Rollback

Falls ein Update fehlschlägt:

```bash
# 1. Neuestes Backup finden
ls -lt backups/ | head -5

# 2. Rollback durchführen
./restore.sh backup_20241231_120000

# 3. Verify
./verify-data.sh
```

**Automatisches Safety-Backup:**
- Jedes Update erstellt automatisch ein Backup
- Format: `before_update_20241231_120000`
- Für schnellen Rollback bei Problemen

---

## 📅 Update-Strategie für Produktion

### Regelmäßige Updates (wöchentlich):

```bash
# Montag morgens, vor Arbeitsbeginn
./smart-update.sh
```

**Erwartete Downtime:**
- Code-Updates: ~10 Sekunden
- Dependency-Updates: ~2-3 Minuten

### Major Updates (monatlich):

1. **Wartungsfenster planen**
   - z.B. Sonntag 2:00 Uhr nachts
   - Nutzer informieren

2. **Backup + Update**
   ```bash
   ./backup.sh "major_update_$(date +%Y%m%d)"
   ./smart-update.sh --force-rebuild
   ```

3. **Umfangreiche Tests**
   - Login testen
   - AI-Features testen
   - Datei-Upload testen

4. **Monitoring für 24h**

---

## ⚡ Zero-Downtime Deployment (Zukunft)

Für späteren Produktionsbetrieb mit höheren Anforderungen:

### Blue-Green Deployment:

```bash
# Zweiter Container läuft parallel
docker compose -p journalism-blue up -d
# Traffic umschalten
# Alten Container stoppen
docker compose -p journalism-green down
```

### Rolling Updates:

```bash
# Mit Docker Swarm oder Kubernetes
# Schrittweiser Container-Austausch
# Keine Downtime
```

---

## 🎓 Best Practices

### DO ✅

- Backup vor jedem Update
- Updates während wartungsarmer Zeiten
- Logs nach Update prüfen
- Verify-Script ausführen
- Kleine, häufige Updates statt große, seltene

### DON'T ❌

- `docker compose down` ohne Backup
- `docker volume rm` in Produktion
- Force-Rebuild ohne Grund
- Updates während Geschäftszeiten (bei Major-Updates)
- Mehrere Änderungen gleichzeitig

---

## 📞 Troubleshooting

### "Container startet nicht nach Update"

```bash
# Logs prüfen
docker compose logs journalism-dashboard

# Häufigste Ursachen:
# 1. Dependency-Konflikt → Force rebuild
./smart-update.sh --force-rebuild

# 2. Migration failed → Manuell fixen
./migrate.sh

# 3. Config-Problem → Restore
./restore.sh <backup-name>
```

### "Nextcloud-Benutzer fehlen"

```bash
# Sollte NICHT passieren nach unserem Fix!
# Falls doch: Aus Backup wiederherstellen
./restore.sh <letztes-backup>

# Oder manuell prüfen
docker compose exec postgres psql -U journalism nextcloud -c "SELECT COUNT(*) FROM oc_users;"
```

### "Migration schlägt fehl"

```bash
# 1. Fehler analysieren
./migrate.sh  # Zeigt genauen Fehler

# 2. Migration-File prüfen
cat backend/migrations/XXX_failed.sql

# 3. Manuell fixen oder aus Backup
./restore.sh <backup-vor-migration>
```

---

## 📊 Update-Log

Halten Sie Updates dokumentiert:

```bash
# Nach jedem Update
echo "$(date): Updated to commit $(git rev-parse --short HEAD)" >> UPDATE_LOG.md
```

Beispiel UPDATE_LOG.md:
```
2024-12-31 10:00: Updated to commit ab9b0f0 - Fixed user deletion bug
2024-12-30 15:00: Updated to commit 4d0d7ef - Added userId to session
2024-12-29 12:00: Updated to commit 0107172 - Added backup system
```

---

## 🔮 Zukunft

Geplante Verbesserungen:

1. **Automated Health Checks**
   - Smoke Tests nach Update
   - Automatischer Rollback bei Fehler

2. **Blue-Green Deployment**
   - Zero-Downtime Updates
   - A/B Testing möglich

3. **Canary Releases**
   - Update zuerst für 10% der User
   - Bei Erfolg: Rollout für alle

4. **Monitoring & Alerts**
   - Prometheus + Grafana
   - Alerts bei Fehlern
   - Performance-Tracking

---

**Fazit:** Mit dem Smart-Update-System haben Sie volle Kontrolle über Updates. Nur die nötigen Komponenten werden aktualisiert, Daten bleiben immer geschützt.
