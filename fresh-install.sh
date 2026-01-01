#!/bin/bash
#
# Fresh Installation Script
# Bereinigt Docker komplett und installiert das System neu
#
# WARNUNG: Löscht ALLE Container, Images, Volumes und Netzwerke!
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================================="
echo "🔥 FRESH INSTALLATION - JOURNALISM DASHBOARD"
echo "=========================================================="
echo ""
echo -e "${RED}⚠️  WARNUNG: Dieses Script löscht:${NC}"
echo "   - Alle Docker Container"
echo "   - Alle Docker Images"
echo "   - Alle Docker Volumes (inkl. ALLE DATEN!)"
echo "   - Alle Docker Networks"
echo "   - Alle lokalen Git-Änderungen"
echo ""
echo -e "${YELLOW}Danach wird das System komplett neu installiert.${NC}"
echo ""
read -p "Bist du sicher, dass du fortfahren möchtest? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Abgebrochen."
    echo ""
    exit 1
fi

echo ""
echo "🚀 Starte Fresh Installation..."
echo ""

# ============================================================================
# SCHRITT 1: Docker komplett bereinigen
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Schritt 1/5: Docker komplett bereinigen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Stoppe alle Container
echo "🛑 Stoppe alle Container..."
docker compose down 2>/dev/null || true
echo "   ✓ Container gestoppt"
echo ""

# Lösche Container, Volumes, Images
echo "🗑️  Lösche Container, Volumes und Images..."
docker compose down -v --rmi all 2>/dev/null || true
echo "   ✓ Docker Compose Ressourcen gelöscht"
echo ""

# Komplette System-Bereinigung
echo "🧼 Bereinige Docker System (inkl. Cache)..."
docker system prune -a --volumes -f 2>/dev/null || true
echo "   ✓ System bereinigt"
echo ""

# Verifiziere
echo "✅ Verifiziere Bereinigung:"
CONTAINERS=$(docker ps -a -q | wc -l)
IMAGES=$(docker images -q | wc -l)
VOLUMES=$(docker volume ls -q | wc -l)
echo "   - Container: $CONTAINERS"
echo "   - Images: $IMAGES"
echo "   - Volumes: $VOLUMES"
echo ""

# ============================================================================
# SCHRITT 2: Git auf sauberen Stand bringen
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Schritt 2/5: Git Repository bereinigen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Aktuellen Branch speichern
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Aktueller Branch: $CURRENT_BRANCH"
echo ""

# Lokale Änderungen verwerfen
echo "🔄 Verwerfe lokale Änderungen..."
git reset --hard HEAD
git clean -fd
echo "   ✓ Lokale Änderungen verworfen"
echo ""

# Neuesten Stand pullen
echo "📥 Hole neuesten Stand vom Remote..."
git fetch origin
git reset --hard origin/$CURRENT_BRANCH
echo "   ✓ Repository auf aktuellem Stand"
echo ""

# Aktueller Commit
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "✅ Aktueller Commit: $CURRENT_COMMIT"
git log --oneline -3 | sed 's/^/   /'
echo ""

# ============================================================================
# SCHRITT 3: Migrationen verifizieren
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Schritt 3/5: Datenbank-Migrationen verifizieren"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "backend/migrations" ]; then
    echo "📁 Migrations-Verzeichnis gefunden:"
    ls -1 backend/migrations/*.sql | while read file; do
        filename=$(basename "$file")
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "?")
        echo "   ✓ $filename (${size} bytes)"
    done
    echo ""

    # Prüfe kritische Migration
    if [ -f "backend/migrations/003_users_table.sql" ]; then
        echo "✅ Kritische Migration 003_users_table.sql vorhanden"
        echo "   (Enthält get_or_create_user() Funktion)"
    else
        echo -e "${RED}❌ FEHLER: 003_users_table.sql fehlt!${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ FEHLER: backend/migrations/ Verzeichnis fehlt!${NC}"
    exit 1
fi
echo ""

# ============================================================================
# SCHRITT 4: Fresh Installation
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Schritt 4/5: Fresh Installation starten"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "./setup.sh" ]; then
    echo -e "${RED}❌ FEHLER: setup.sh nicht gefunden!${NC}"
    exit 1
fi

echo "🎬 Starte ./setup.sh..."
echo ""
chmod +x ./setup.sh
./setup.sh

echo ""
echo "✅ Installation abgeschlossen!"
echo ""

# ============================================================================
# SCHRITT 5: System-Verifizierung
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Schritt 5/5: System-Verifizierung"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Warte kurz bis Services hochgefahren sind
echo "⏳ Warte 10 Sekunden bis Services hochgefahren sind..."
sleep 10
echo ""

# Prüfe Container Status
echo "🐳 Docker Container Status:"
docker compose ps
echo ""

# Prüfe ob alle Services laufen
RUNNING=$(docker compose ps --filter "status=running" | grep -c "Up" || echo "0")
echo "📊 Laufende Services: $RUNNING"
echo ""

# Prüfe Datenbank
echo "🗄️  Prüfe Datenbank-Funktion:"
if docker compose exec -T postgres pg_isready -U journalism >/dev/null 2>&1; then
    echo "   ✓ PostgreSQL erreichbar"

    # Prüfe journalism Datenbank
    if docker compose exec -T postgres psql -U journalism -c 'SELECT 1 as test;' >/dev/null 2>&1; then
        echo "   ✓ journalism Datenbank bereit"
    else
        echo -e "   ${YELLOW}⚠ journalism Datenbank noch nicht bereit${NC}"
    fi

    # Prüfe users table
    if docker compose exec -T postgres psql -U journalism -c '\dt users' 2>/dev/null | grep -q "users"; then
        echo "   ✓ users Tabelle existiert"
    else
        echo -e "   ${YELLOW}⚠ users Tabelle noch nicht erstellt${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠ PostgreSQL noch nicht bereit${NC}"
fi
echo ""

# ============================================================================
# ZUSAMMENFASSUNG
# ============================================================================
echo ""
echo "=========================================================="
echo "🎉 FRESH INSTALLATION ABGESCHLOSSEN"
echo "=========================================================="
echo ""
echo -e "${GREEN}✅ System ist bereit!${NC}"
echo ""
echo "📍 Zugriff:"
echo "   Dashboard:  http://localhost:3001"
echo ""
echo "🔐 Nächste Schritte:"
echo "   1. Dashboard öffnen: http://localhost:3001"
echo "   2. Ersten Admin-User registrieren (wird automatisch Admin)"
echo "   3. Weitere User im Dashboard erstellen (werden automatisch 'autor')"
echo "   4. Login testen"
echo "   5. AI-Settings → Claude API Key speichern testen"
echo ""
echo "📋 Nützliche Commands:"
echo "   docker compose ps                    # Container Status"
echo "   docker compose logs -f               # Alle Logs folgen"
echo "   docker compose logs journalism-dashboard  # Nur Dashboard Logs"
echo "   ./verify-data.sh                     # Daten-Integrität prüfen"
echo ""
echo "📖 Dokumentation:"
echo "   - README.md              # Hauptdokumentation"
echo "   - PRODUCTION_UPDATES.md  # Update-Strategie"
echo "   - BACKUP_RESTORE.md      # Backup & Restore"
echo ""
