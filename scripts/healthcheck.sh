#!/usr/bin/env bash
# =============================================================================
# CineList — Health Check
# Usage: ./scripts/healthcheck.sh [url]
# Default: http://localhost:3000
# =============================================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🏥 CineList — Health Check"
echo "=========================="
echo "Target: $BASE_URL"
echo ""

PASS=0
FAIL=0

check() {
    local name="$1"
    local url="$2"
    local expected="${3:-200}"

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

    if [ "$STATUS" = "$expected" ]; then
        echo -e "${GREEN}✓ $name — HTTP $STATUS${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}✗ $name — HTTP $STATUS (expected $expected)${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# ── Run checks ───────────────────────────────────────────────────────────────

check "Homepage"          "$BASE_URL/"
check "Explore page"      "$BASE_URL/explore"
check "Discover page"     "$BASE_URL/discover"
check "Thesis page"       "$BASE_URL/thesis"
check "Sign-in page"      "$BASE_URL/sign-in"
check "Trending API"      "$BASE_URL/api/movies/trending"
check "Genres API"        "$BASE_URL/api/movies/genres"
check "Search API"        "$BASE_URL/api/movies/search?q=test"

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
echo "=========================="
TOTAL=$((PASS + FAIL))
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC} / $TOTAL total"

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}⚠ Some checks failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
fi
