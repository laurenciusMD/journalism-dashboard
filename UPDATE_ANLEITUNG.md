# Update-Anleitung: Journalism Dashboard mit Apache-Fix

## Übersicht
Diese Anleitung zeigt, wie du das aktualisierte Docker Image mit dem Apache-Port-Fix deployest, ohne Daten zu verlieren.

## ⚠️ Wichtig
- Alle Daten bleiben erhalten (PostgreSQL, Nextcloud, Redis)
- Die Docker Volumes werden NICHT gelöscht
- Update dauert ca. 5-10 Minuten

---

## Schritt 1: Docker Image neu bauen

**Auf deinem Entwicklungsrechner** (wo der Code liegt):

```bash
cd /pfad/zu/journalism-dashboard

# Image bauen
docker build -t laurencius/journalism-dashboard:latest .

# Image zu Docker Hub pushen
docker push laurencius/journalism-dashboard:latest
```

**Hinweis:** Der Build dauert ca. 5-10 Minuten (Nextcloud Download + Dependencies)

---

## Schritt 2: Update in CasaOS durchführen

### Option A: Über CasaOS Web-Interface

1. **Container stoppen:**
   - Öffne CasaOS Web-Interface
   - Gehe zu "Apps"
   - Finde "Journalism Dashboard"
   - Klicke auf "Stop"

2. **Container löschen (NICHT die Volumes!):**
   - Klicke auf "Remove" oder "Löschen"
   - ⚠️ **WICHTIG:** Stelle sicher, dass "Remove volumes" NICHT angehakt ist
   - Bestätige das Löschen

3. **Image neu pullen:**
   - Öffne Terminal/SSH auf deinem CasaOS-Server
   ```bash
   docker pull laurencius/journalism-dashboard:latest
   ```

4. **Container neu erstellen:**
   - Gehe zurück zu CasaOS "Apps"
   - Klicke auf "Custom Install" oder importiere die docker-compose.yml
   - Verwende die gleiche Konfiguration wie vorher:

```yaml
version: '3.8'

services:
  journalism-dashboard:
    image: laurencius/journalism-dashboard:latest
    container_name: journalism-dashboard
    ports:
      - "3000:3000"    # Frontend
      - "5000:5000"    # Backend API
      - "8080:8080"    # Nextcloud
    volumes:
      - journalism-postgres:/var/lib/postgresql/data
      - journalism-redis:/var/lib/redis
      - journalism-nextcloud-data:/var/www/nextcloud/data
      - journalism-nextcloud-config:/var/www/nextcloud/config
    environment:
      - NODE_ENV=production
      - POSTGRES_USER=journalism
      - POSTGRES_PASSWORD=journalism
      - POSTGRES_DB=journalism
      - NEXTCLOUD_ADMIN_USER=admin
      - NEXTCLOUD_ADMIN_PASSWORD=admin123
      - NEXTCLOUD_DB_PASSWORD=nextcloud123
      - SESSION_SECRET=change-this-secret-key
      - NEXTCLOUD_TRUSTED_DOMAINS=localhost
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      start_period: 180s
      retries: 3

volumes:
  journalism-postgres:
    external: true
  journalism-redis:
    external: true
  journalism-nextcloud-data:
    external: true
  journalism-nextcloud-config:
    external: true
```

### Option B: Über Terminal/SSH (Schneller)

```bash
# 1. Container stoppen und entfernen (Volumes bleiben!)
docker stop journalism-dashboard
docker rm journalism-dashboard

# 2. Neues Image pullen
docker pull laurencius/journalism-dashboard:latest

# 3. Container neu starten mit gleichen Volumes
docker run -d \
  --name journalism-dashboard \
  -p 3000:3000 \
  -p 5000:5000 \
  -p 8080:8080 \
  -v journalism-postgres:/var/lib/postgresql/data \
  -v journalism-redis:/var/lib/redis \
  -v journalism-nextcloud-data:/var/www/nextcloud/data \
  -v journalism-nextcloud-config:/var/www/nextcloud/config \
  -e NODE_ENV=production \
  -e POSTGRES_USER=journalism \
  -e POSTGRES_PASSWORD=journalism \
  -e POSTGRES_DB=journalism \
  -e NEXTCLOUD_ADMIN_USER=admin \
  -e NEXTCLOUD_ADMIN_PASSWORD=admin123 \
  -e NEXTCLOUD_DB_PASSWORD=nextcloud123 \
  -e SESSION_SECRET=change-this-secret-key \
  -e NEXTCLOUD_TRUSTED_DOMAINS=localhost \
  --restart unless-stopped \
  laurencius/journalism-dashboard:latest
```

---

## Schritt 3: Verifizierung

### Container-Status prüfen:
```bash
# Container läuft?
docker ps | grep journalism-dashboard

# Logs anschauen (sollte KEIN "Listen 808080" mehr enthalten!)
docker logs journalism-dashboard

# Health-Status prüfen
docker inspect journalism-dashboard | grep -A 5 Health
```

### Erwartete Log-Ausgabe:
```
✅ PostgreSQL data directory already exists
✅ PostgreSQL already initialized
🚀 Starting PostgreSQL for Nextcloud setup...
✅ Nextcloud database 'nextcloud' already exists
⏩ Nextcloud already installed, skipping installation
🔧 Configuring Nextcloud...
✅ Trusted domain configured
📡 Starting all services with supervisord...
2025-01-XX XX:XX:XX,XXX INFO supervisord started with pid 1
2025-01-XX XX:XX:XX,XXX INFO spawned: 'postgresql' with pid X
2025-01-XX XX:XX:XX,XXX INFO spawned: 'redis' with pid X
2025-01-XX XX:XX:XX,XXX INFO spawned: 'apache2' with pid X
2025-01-XX XX:XX:XX,XXX INFO spawned: 'journalism-dashboard' with pid X
```

### Wichtig zu prüfen:
1. **Kein "Listen 808080" Fehler mehr** ✅
2. Apache startet erfolgreich (pid wird angezeigt)
3. Alle 4 Services laufen: postgresql, redis, apache2, journalism-dashboard

### Services testen:
```bash
# Frontend erreichbar?
curl http://localhost:3000

# Backend API erreichbar?
curl http://localhost:5000/api/health

# Nextcloud erreichbar?
curl http://localhost:8080
```

### Im Browser:
1. **Frontend:** http://deine-ip:3000
   - Login sollte funktionieren
   - Alle Dossiers sollten noch da sein

2. **Nextcloud:** http://deine-ip:8080
   - Login mit: admin / admin123
   - Alle Dateien sollten noch da sein

---

## Was wurde gefixt?

### Problem vorher:
```
Listen 808080  ← FALSCH!
```
- Apache konnte nicht starten
- Startup-Script hat bei jedem Neustart `sed` ausgeführt
- Port wurde immer wieder verdoppelt: 80 → 8080 → 808080 → 8080808080

### Lösung jetzt:
```
Listen 8080  ← RICHTIG!
```
- Port wird einmalig im Dockerfile gesetzt (beim Image-Build)
- Startup-Script ändert ports.conf nicht mehr
- Apache startet sauber bei jedem Container-Restart

---

## Troubleshooting

### Container bleibt "unhealthy":
```bash
# Warte 3 Minuten (start-period: 180s)
# Dann prüfen:
docker logs journalism-dashboard --tail 100
```

### Apache startet nicht:
```bash
# Port-Konfiguration prüfen
docker exec journalism-dashboard cat /etc/apache2/ports.conf
# Sollte "Listen 8080" zeigen (NICHT 808080!)
```

### Daten fehlen nach Update:
```bash
# Volumes prüfen
docker volume ls | grep journalism

# Sollte zeigen:
# journalism-postgres
# journalism-redis
# journalism-nextcloud-data
# journalism-nextcloud-config

# Volume-Inhalt prüfen
docker volume inspect journalism-postgres
```

---

## Support

Bei Problemen:
1. Logs posten: `docker logs journalism-dashboard`
2. Volume-Status: `docker volume ls | grep journalism`
3. Container-Status: `docker ps -a | grep journalism`

**Wichtig:** Lösche NIEMALS die Volumes manuell - alle Daten sind dort gespeichert!
