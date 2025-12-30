# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [0.7.0] - 2025-12-30

### 🎯 Große Änderungen
- **Effizienz-Optimierung**: Konsolidierung von 3 Datenbanken auf 1 PostgreSQL-Instanz
- **Single Sign-On**: Nextcloud als einzige Authentifizierungsquelle
- **All-in-One Container**: PostgreSQL + Redis + Apache + Nextcloud + Dashboard in einem Container

### ✅ Behoben
- **Apache Port-Konfiguration**: Permanente Lösung für "Listen 808080" Fehler
  - Port 8080 wird jetzt im Dockerfile gesetzt (nicht im Startup-Script)
  - Apache startet zuverlässig bei jedem Container-Neustart
- **PostgreSQL Berechtigungen**: Automatische GRANT-Befehle nach Migrations
- **sudo Fehler**: Ersetzt durch `su` (kompatibel mit Debian-Base-Image)
- **Health Check Timeout**: Erhöht auf 180s für Nextcloud-Installation

### 🔄 Geändert
- **Datenbank-Architektur**:
  - ~~MariaDB~~ → PostgreSQL (für Nextcloud)
  - ~~SQLite~~ → Nextcloud Provisioning API (für User-Auth)
  - Nur noch **eine** PostgreSQL-Instanz für beide Datenbanken
- **Authentifizierung**:
  - Nextcloud-Benutzer = Dashboard-Benutzer
  - Kein separates User-Management mehr
- **Port-Konfiguration**: Zurück zu 3001 (Standard)

### 🗑️ Entfernt
- MariaDB Container-Dependency
- SQLite User-Datenbank
- bcrypt und better-sqlite3 Dependencies
- Doppelte Authentifizierungslogik

### 📦 Dependencies
- PostgreSQL 15 (unified für beide Apps)
- Redis 7 (Session-Storage)
- Apache 2.4 + PHP 8.2 (Nextcloud)
- Nextcloud 28.0.2
- Node.js 20 + Express
- React + Vite

### 🔐 Sicherheit
- Session-basierte Authentifizierung über Nextcloud
- Automatische Nextcloud-Installation mit konfigurierbaren Admin-Credentials

---

## [0.6.0] - 2025-12-28

### ✨ Hinzugefügt
- Hypermodern UI mit Glassmorphism-Design
- Dismissible Error-Messages
- Heating History Visualisierung
- InfluxDB Integration

### 🔄 Geändert
- UI Modernisierung mit verbesserten Kontrasten
- Bessere Fehlerbehandlung im Frontend

---

## [0.5.2] - 2025-12-27

### ✅ Behoben
- Code-Block Rendering im Markdown
- Executable Service Calls

### ✨ Hinzugefügt
- Verbesserte Markdown-Unterstützung

---

## [0.5.0] - 2025-12-26

### ✨ Hinzugefügt
- Docker Hub automatisches Deployment
- GitHub Actions Workflow für CI/CD
- Multi-Architektur Support (amd64, arm64)

### 📚 Dokumentation
- CasaOS Installationsanleitung
- Docker Hub Deployment-Guide

---

## [0.2.0] - 2025-12-20

### ✨ Hinzugefügt
- Grundlegendes Dossier-Management
- PostgreSQL für Recherche-Daten
- File Upload Funktionalität
- AI Service Integration (Anthropic, Google, OpenAI)

### 🎨 UI
- Login-Seite mit Versionsnummer
- Dashboard mit Dossier-Übersicht
- Responsive Design

---

## [0.1.0] - 2025-12-15

### ✨ Initiales Release
- Express Backend mit REST API
- React Frontend mit Vite
- Basic Authentication
- SQLite User-Datenbank
- Docker Support

---

## Legende

- ✨ **Hinzugefügt**: Neue Features
- 🔄 **Geändert**: Änderungen an bestehenden Features
- ✅ **Behoben**: Bug-Fixes
- 🗑️ **Entfernt**: Entfernte Features/Dependencies
- 🔐 **Sicherheit**: Security-relevante Änderungen
- 📦 **Dependencies**: Dependency-Updates
- 📚 **Dokumentation**: Dokumentations-Änderungen
