#!/usr/bin/env bash
# =============================================================================
# CineList — Production Build & Start
# Usage: ./scripts/prod.sh [--build-only | --start-only]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
BUILD_ONLY=false
START_ONLY=false

for arg in "$@"; do
    case $arg in
        --build-only) BUILD_ONLY=true ;;
        --start-only) START_ONLY=true ;;
        *) echo "Unknown argument: $arg"; exit 1 ;;
    esac
done

echo -e "${BLUE}🎬 CineList — Production${NC}"
echo "========================="

# ── Check environment ────────────────────────────────────────────────────────

if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local not found. Cannot run in production without env vars.${NC}"
    exit 1
fi

# ── Build ────────────────────────────────────────────────────────────────────

if [ "$START_ONLY" = false ]; then
    echo -e "\n${YELLOW}Installing dependencies...${NC}"
    npm ci
    echo -e "${GREEN}✓ Dependencies installed (clean)${NC}"

    echo -e "\n${YELLOW}Generating Prisma client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✓ Prisma client generated${NC}"

    echo -e "\n${YELLOW}Syncing database schema...${NC}"
    npx prisma db push
    echo -e "${GREEN}✓ Database schema synced${NC}"

    echo -e "\n${YELLOW}Building for production...${NC}"
    npm run build
    echo -e "${GREEN}✓ Production build complete${NC}"

    if [ "$BUILD_ONLY" = true ]; then
        echo -e "\n${GREEN}Build-only mode. Exiting.${NC}"
        exit 0
    fi
fi

# ── Start ────────────────────────────────────────────────────────────────────

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo -e "\n${YELLOW}Starting with PM2...${NC}"

    # Stop existing instance if running
    pm2 delete cinelist 2>/dev/null || true

    pm2 start npm --name "cinelist" -- start
    pm2 save

    echo -e "${GREEN}✓ CineList is running via PM2${NC}"
    echo ""
    pm2 status cinelist
else
    echo -e "\n${YELLOW}PM2 not found. Starting with npm start...${NC}"
    echo -e "${BLUE}   Tip: Install PM2 for process management: npm i -g pm2${NC}"
    echo ""
    npm start
fi
