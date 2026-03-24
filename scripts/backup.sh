#!/usr/bin/env bash
# =============================================================================
# CineList — Database Backup
# Usage: ./scripts/backup.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🗄️  CineList — Database Backup"
echo "==============================="

# ── Load DATABASE_URL from .env.local ────────────────────────────────────────

if [ -f ".env.local" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2-)
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}✗ DATABASE_URL not found. Set it in .env.local or as an env variable.${NC}"
    exit 1
fi

# ── Check pg_dump is available ───────────────────────────────────────────────

if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}✗ pg_dump not found. Install PostgreSQL client tools.${NC}"
    echo "  macOS:   brew install libpq && brew link --force libpq"
    echo "  Ubuntu:  sudo apt install postgresql-client"
    exit 1
fi

# ── Create backup directory ──────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"

# ── Run backup ───────────────────────────────────────────────────────────────

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cinelist_${TIMESTAMP}.dump"

echo -e "${YELLOW}Creating backup...${NC}"
pg_dump "$DATABASE_URL" --no-owner --no-acls -F c -f "$BACKUP_FILE"

# ── Verify ───────────────────────────────────────────────────────────────────

if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE ($SIZE)${NC}"
else
    echo -e "${RED}✗ Backup failed.${NC}"
    exit 1
fi

# ── Cleanup old backups (keep last 10) ───────────────────────────────────────

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/cinelist_*.dump 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}Cleaning old backups (keeping last 10)...${NC}"
    ls -1t "$BACKUP_DIR"/cinelist_*.dump | tail -n +11 | xargs rm -f
    echo -e "${GREEN}✓ Old backups removed${NC}"
fi

echo ""
echo "To restore: pg_restore -d \"\$DATABASE_URL\" --no-owner --no-acls $BACKUP_FILE"
