#!/usr/bin/env bash
# =============================================================================
# CineList — Performance Profiling Script
# Usage: ./scripts/profile.sh [base_url]
# Default: http://localhost:3000
# =============================================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
RUNS=5

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔬 CineList — Performance Profiling${NC}"
echo "====================================="
echo "Target: $BASE_URL"
echo "Runs per endpoint: $RUNS"
echo ""

measure() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    local total=0
    local min=999999
    local max=0
    local ttfb_total=0
    local size=0

    for ((i=1; i<=RUNS; i++)); do
        if [ "$method" = "POST" ] && [ -n "$data" ]; then
            result=$(curl -s -o /dev/null -w "%{time_total},%{time_starttransfer},%{size_download}" \
                -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
        else
            result=$(curl -s -o /dev/null -w "%{time_total},%{time_starttransfer},%{size_download}" "$url" 2>/dev/null)
        fi

        time_total=$(echo "$result" | cut -d',' -f1)
        time_ttfb=$(echo "$result" | cut -d',' -f2)
        size=$(echo "$result" | cut -d',' -f3)

        ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)
        ttfb_ms=$(echo "$time_ttfb * 1000" | bc | cut -d'.' -f1)

        total=$((total + ms))
        ttfb_total=$((ttfb_total + ttfb_ms))

        if [ "$ms" -lt "$min" ]; then min=$ms; fi
        if [ "$ms" -gt "$max" ]; then max=$ms; fi
    done

    avg=$((total / RUNS))
    ttfb_avg=$((ttfb_total / RUNS))
    size_kb=$(echo "scale=1; $size / 1024" | bc)

    printf "%-35s │ avg: %5dms │ min: %5dms │ max: %5dms │ TTFB: %5dms │ %6sKB\n" \
        "$name" "$avg" "$min" "$max" "$ttfb_avg" "$size_kb"
}

echo -e "${YELLOW}── Page Routes ──────────────────────────────────────────────────────────────────────────────────${NC}"
measure "Homepage /"                    "$BASE_URL/"
measure "Explore /explore"              "$BASE_URL/explore"
measure "Discover /discover"            "$BASE_URL/discover"
measure "Thesis /thesis"                "$BASE_URL/thesis"
measure "Sign-in /sign-in"             "$BASE_URL/sign-in"

echo ""
echo -e "${YELLOW}── API Routes ──────────────────────────────────────────────────────────────────────────────────${NC}"
measure "GET /api/movies/trending"      "$BASE_URL/api/movies/trending"
measure "GET /api/movies/genres"        "$BASE_URL/api/movies/genres"
measure "GET /api/movies/search?q=test" "$BASE_URL/api/movies/search?q=test"
measure "GET /api/movies/search?q=inception" "$BASE_URL/api/movies/search?q=inception"
measure "GET /api/movies/discover"      "$BASE_URL/api/movies/discover"
measure "GET /api/ai/trending-banner"   "$BASE_URL/api/ai/trending-banner"

echo ""
echo -e "${YELLOW}── Heavy Operations ────────────────────────────────────────────────────────────────────────────${NC}"
measure "Movie detail /movies/27205"    "$BASE_URL/movies/27205"
measure "Movie detail /movies/550"      "$BASE_URL/movies/550"

echo ""
echo -e "${GREEN}Profiling complete.${NC}"
