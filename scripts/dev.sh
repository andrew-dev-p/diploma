#!/usr/bin/env bash
# =============================================================================
# CineList — Development Environment Startup
# Usage: ./scripts/dev.sh
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

echo -e "${BLUE}🎬 CineList — Development Setup${NC}"
echo "================================="

# ── Check prerequisites ──────────────────────────────────────────────────────

echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed. Install Node.js 20+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}✗ Node.js $NODE_VERSION detected. Version 20+ required.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# ── Check environment file ───────────────────────────────────────────────────

if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local not found.${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}  Creating from .env.example...${NC}"
        cp .env.example .env.local
        echo -e "${YELLOW}  ⚠ Please edit .env.local with your actual values, then re-run this script.${NC}"
        exit 1
    else
        echo -e "${RED}  No .env.example found either. Create .env.local manually.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ .env.local exists${NC}"

# ── Check required env vars ──────────────────────────────────────────────────

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "TMDB_ACCESS_TOKEN"
    "GEMINI_API_KEY"
)

MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${VAR}=" .env.local 2>/dev/null || grep -q "^${VAR}=\.\.\." .env.local 2>/dev/null; then
        echo -e "${RED}✗ $VAR is missing or not configured in .env.local${NC}"
        MISSING=1
    fi
done

if [ "$MISSING" -eq 1 ]; then
    echo -e "${RED}\nPlease configure all required variables in .env.local${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All required environment variables set${NC}"

# ── Install dependencies ─────────────────────────────────────────────────────

echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ── Generate Prisma client ───────────────────────────────────────────────────

echo -e "\n${YELLOW}Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

# ── Push database schema ─────────────────────────────────────────────────────

echo -e "\n${YELLOW}Syncing database schema...${NC}"
npx prisma db push
echo -e "${GREEN}✓ Database schema synced${NC}"

# ── Start dev server ─────────────────────────────────────────────────────────

echo -e "\n${GREEN}🚀 Starting development server...${NC}"
echo -e "${BLUE}   http://localhost:3000${NC}"
echo ""

npm run dev
