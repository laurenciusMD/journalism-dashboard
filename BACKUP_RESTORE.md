# Backup & Restore Guide

## 🔒 Datensicherung - So schützen Sie Ihre Daten

Diese Anleitung erklärt, wie Sie Ihre Journalism Dashboard Daten sichern und wiederherstellen.

## Schnellstart

```bash
# Backup erstellen (empfohlen: täglich)
./backup.sh

# Datenintegrität prüfen
./verify-data.sh

# Backup wiederherstellen
./restore.sh backup_20241231_120000
```

---

## 📦 Was wird gesichert?

Ein vollständiges Backup enthält:

1. **PostgreSQL Datenbanken**
   - `journalism` - Ihre Ermittlungen, Dossiers, Personen
   - `nextcloud` - Nextcloud-Konfiguration und Metadaten

2. **Nextcloud Benutzerdaten**
   - Alle Dateien von allen Benutzern
   - Benutzerkonten und Passwörter
   - Gruppeneinstellungen

3. **Evidence Storage**
   - Hochgeladene Beweise (Bilder, Videos, PDFs, etc.)

4. **Dashboard Daten**
   - Anwendungsdaten
   - Sessions

5. **Konfiguration**
   - `.env` (Umgebungsvariablen)
   - `docker-compose.yml`

---

## 🔄 Backup erstellen

### Manuelles Backup

```bash
# Einfaches Backup mit Zeitstempel
./backup.sh

# Backup mit eigenem Namen
./backup.sh "vor_update_2024"
```

### Automatisches Backup (empfohlen!)

**Tägliches Backup um 2:00 Uhr nachts:**

```bash
# Crontab bearbeiten
crontab -e

# Diese Zeile hinzufügen:
0 2 * * * cd /root/journalism-dashboard && ./backup.sh "daily_$(date +\%Y\%m\%d)" >> /var/log/journalism-backup.log 2>&1
```

**Wöchentliches Backup (Sonntag 3:00 Uhr):**

```bash
0 3 * * 0 cd /root/journalism-dashboard && ./backup.sh "weekly_$(date +\%Y\%m\%d)" >> /var/log/journalism-backup.log 2>&1
```

### Backup-Aufbewahrung

**Empfohlene Strategie:**
- Täglich: 7 Tage aufbewahren
- Wöchentlich: 4 Wochen aufbewahren
- Monatlich: 12 Monate aufbewahren

**Alte Backups automatisch löschen:**

```bash
# Backups älter als 7 Tage löschen
find ./backups -type d -name "daily_*" -mtime +7 -exec rm -rf {} \;

# Backups älter als 30 Tage löschen
find ./backups -type d -name "weekly_*" -mtime +30 -exec rm -rf {} \;
```

---

## 📥 Backup wiederherstellen

### Verfügbare Backups anzeigen

```bash
ls -lh ./backups/
```

### Backup wiederherstellen

```bash
# Backup auswählen
./restore.sh backup_20241231_120000
```

**⚠️ WARNUNG:** Das Restore überschreibt ALLE aktuellen Daten!

Der Restore-Prozess:
1. ✅ Erstellt automatisch ein Sicherheits-Backup des aktuellen Zustands
2. ⏸️ Stoppt alle Services
3. 🗄️ Stellt PostgreSQL-Datenbanken wieder her
4. 📁 Stellt alle Dateien wieder her
5. 🚀 Startet alle Services neu

### Notfall-Wiederherstellung

Falls etwas schiefgeht:

```bash
# 1. Alle Container stoppen
docker compose down

# 2. Alle Volumes löschen (VORSICHT!)
docker volume rm journalism-dashboard_nextcloud-data
docker volume rm journalism-dashboard_postgres-data
docker volume rm journalism-dashboard_dashboard-data
docker volume rm journalism-dashboard_evidence-storage

# 3. Backup wiederherstellen
./restore.sh <backup-name>
```

---

## 🔍 Datenintegrität prüfen

### Regelmäßige Überprüfung

```bash
./verify-data.sh
```

Dieser Befehl prüft:
- ✅ Alle Container laufen
- ✅ Alle Volumes existieren
- ✅ PostgreSQL-Datenbanken existieren
- ✅ Nextcloud-Benutzer existieren
- ✅ API-Endpoints antworten
- ✅ Backups vorhanden und aktuell

**Empfehlung:** Täglich nach dem Backup ausführen!

```bash
# Automatische Überprüfung nach Backup
0 2 * * * cd /root/journalism-dashboard && ./backup.sh && ./verify-data.sh >> /var/log/journalism-verify.log 2>&1
```

---

## 💾 Backups off-site speichern

**WICHTIG:** Speichern Sie Backups an einem anderen Ort als dem Server!

### Option 1: rsync zu anderem Server

```bash
# Backup zu Remote-Server kopieren
rsync -avz ./backups/ user@backup-server:/backups/journalism-dashboard/

# Im Cron automatisieren
0 4 * * * cd /root/journalism-dashboard && rsync -avz ./backups/ user@backup-server:/backups/journalism-dashboard/ >> /var/log/journalism-rsync.log 2>&1
```

### Option 2: Cloud-Storage (rclone)

```bash
# rclone installieren
curl https://rclone.org/install.sh | sudo bash

# rclone konfigurieren (einmalig)
rclone config

# Backup zu Cloud hochladen
rclone sync ./backups/ mycloud:journalism-backups/

# Im Cron automatisieren
0 5 * * * rclone sync /root/journalism-dashboard/backups/ mycloud:journalism-backups/ >> /var/log/journalism-rclone.log 2>&1
```

### Option 3: Tarball herunterladen

```bash
# Backup als Archiv erstellen
cd backups
tar czf backup_20241231.tar.gz backup_20241231_120000/

# Per SCP herunterladen (von lokalem Computer)
scp root@212.47.64.85:/root/journalism-dashboard/backups/backup_20241231.tar.gz ./
```

---

## 🛡️ Best Practices

### 1. **3-2-1 Backup-Regel**
- **3** Kopien Ihrer Daten
- **2** verschiedene Speichermedien
- **1** Kopie off-site

### 2. **Vor jedem Update: Backup!**

```bash
# VOR dem Update
./backup.sh "before_update_$(date +%Y%m%d)"
./verify-data.sh

# Update durchführen
./update.sh

# NACH dem Update
./verify-data.sh
```

### 3. **Regelmäßige Restore-Tests**

Testen Sie monatlich, ob Ihre Backups funktionieren:

```bash
# Testumgebung erstellen
cd /tmp
git clone /root/journalism-dashboard test-restore
cd test-restore

# Backup wiederherstellen
./restore.sh backup_20241231_120000

# Prüfen ob alles funktioniert
./verify-data.sh
```

### 4. **Monitoring einrichten**

```bash
# E-Mail bei Backup-Fehlern (mit mailutils)
0 2 * * * cd /root/journalism-dashboard && ./backup.sh && ./verify-data.sh || echo "Backup failed!" | mail -s "Journalism Backup Error" admin@example.com
```

---

## 🔧 Troubleshooting

### Problem: "Benutzer verschwunden nach Update"

**Ursache:** Container wurde ohne persistente Daten neu gebaut.

**Lösung:**

```bash
# 1. Backup wiederherstellen
./restore.sh <letztes-backup>

# 2. Falls kein Backup: Benutzer manuell neu anlegen
docker compose exec journalism-dashboard su -s /bin/bash www-data -c \
  "export OC_PASS='IHR_PASSWORT' && php /var/www/nextcloud/occ user:add --password-from-env --display-name='Name' username"
```

### Problem: "Volume nicht gefunden"

```bash
# Volumes prüfen
docker volume ls | grep journalism

# Falls gelöscht: Aus Backup wiederherstellen
./restore.sh <backup-name>
```

### Problem: "Datenbank-Verbindung fehlgeschlagen"

```bash
# PostgreSQL-Container prüfen
docker compose ps postgres

# Datenbanken prüfen
docker compose exec postgres psql -U journalism -l

# Aus Backup wiederherstellen
./restore.sh <backup-name>
```

---

## 📊 Backup-Größe optimieren

### Alte Nextcloud-Versionen bereinigen

```bash
docker compose exec journalism-dashboard su -s /bin/bash www-data -c \
  "php /var/www/nextcloud/occ versions:cleanup"
```

### Trash leeren

```bash
docker compose exec journalism-dashboard su -s /bin/bash www-data -c \
  "php /var/www/nextcloud/occ trashbin:cleanup --all-users"
```

---

## 📞 Support

Bei Problemen:
1. Führen Sie `./verify-data.sh` aus
2. Prüfen Sie die Logs: `docker compose logs`
3. Stellen Sie das letzte Backup wieder her: `./restore.sh`

**Wichtigste Regel:** Backup BEVOR Sie etwas ändern!
