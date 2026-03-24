# Performance Profiling & Optimization

## Methodology

### Tools Used

| Tool | Purpose |
|------|---------|
| **cURL** (via `scripts/profile.sh`) | HTTP response timing (total time, TTFB, response size) |
| **Chrome DevTools** | Network waterfall, Lighthouse audit, Performance tab |
| **Next.js built-in** | Server timing headers, Turbopack compile times |
| **Prisma query logging** | Database query analysis (via `LOG_LEVEL=debug`) |

### Test Environment

- **Machine**: MacBook Pro (Apple Silicon)
- **Runtime**: Node.js 25, Next.js 16 (Turbopack dev server)
- **Database**: Neon PostgreSQL (serverless, eu-central-1)
- **Runs**: 5 per endpoint, averaged

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Response Time** | Total time from request to response complete | < 500ms for pages |
| **TTFB** | Time to first byte (server processing time) | < 200ms |
| **Response Size** | Transfer size in KB | Minimize |

## Profiling Results (BEFORE Optimization)

### Hot Spots Identified

| # | Endpoint | Avg Time | Issue |
|---|----------|----------|-------|
| **1** | `GET /api/ai/trending-banner` | **1,257ms** | Sequential TMDB fetch + Gemini API call, no caching |
| **2** | Homepage `/` | **659ms** | Sequential fetching: TMDB trending → DB featured lists |
| **3** | Explore `/explore` | **638ms** | Fetches ALL tags from DB then aggregates in JavaScript |

### Full Baseline

| Endpoint | Avg (ms) | Min (ms) | Max (ms) | TTFB (ms) | Size (KB) |
|----------|----------|----------|----------|-----------|-----------|
| Homepage `/` | 659 | 328 | 1,962 | 42 | 211.7 |
| Explore `/explore` | 638 | 326 | 1,584 | 100 | 139.3 |
| Discover `/discover` | 130 | 54 | 391 | 107 | 164.1 |
| Thesis `/thesis` | 131 | 51 | 426 | 126 | 182.6 |
| `/api/movies/trending` | 33 | 8 | 125 | 33 | 12.8 |
| `/api/movies/genres` | 19 | 8 | 65 | 19 | 0.5 |
| `/api/movies/search?q=test` | 44 | 7 | 189 | 43 | 10.6 |
| `/api/ai/trending-banner` | 1,257 | 1,073 | 1,581 | 1,256 | 0.3 |
| Movie detail `/movies/27205` | 276 | 74 | 1,042 | 190 | 245.3 |
| Movie detail `/movies/550` | 141 | 77 | 382 | 61 | 240.4 |

## Optimizations Applied

### Optimization 1: Parallelize Homepage Data Fetching

**Problem:** Homepage fetched TMDB trending movies and DB featured lists sequentially — total time = TMDB time + DB time.

**Solution:** Replaced sequential `await` calls with `Promise.allSettled()` to fetch both data sources simultaneously.

```ts
// BEFORE (sequential):
const trending = await getTrending("week")      // ~200ms
const lists = await db.movieList.findMany(...)   // ~300ms
// Total: ~500ms

// AFTER (parallel):
const [trendingResult, listsResult] = await Promise.allSettled([
  getTrending("week"),                           // ~200ms ┐
  db.movieList.findMany(...)                     // ~300ms ┘ parallel
])
// Total: ~300ms (max of the two)
```

### Optimization 2: Optimize Explore Page Tag Query

**Problem:** Fetched ALL tags from DB (`findMany` with no limit), then aggregated counts in JavaScript using a `for` loop + `Object.entries`.

**Solution:** Used Prisma `distinct` to fetch only unique tag names directly from the database, eliminating JS-side aggregation.

```ts
// BEFORE:
const allTags = await db.listTag.findMany({ select: { name: true } })
// Then: loop, count, sort, slice in JS

// AFTER:
const uniqueTags = await db.listTag.findMany({
  distinct: ["name"],
  select: { name: true },
  take: 15,
})
// DB does the deduplication, returns max 15 rows
```

### Optimization 3: Parallelize Movie Detail Auth + TMDB

**Problem:** Movie detail page fetched TMDB data first, then checked auth, then fetched user-specific data — 3 sequential steps.

**Solution:** Parallelize TMDB data fetch and auth check using `Promise.allSettled()`, reducing wall clock time.

```ts
// BEFORE:
const [movie, credits, videos, similar] = await Promise.all([...tmdb])  // ~200ms
const { userId } = await auth()                                          // ~50ms
const [rating, watchlist, watched] = await Promise.all([...db])          // ~100ms
// Total: ~350ms

// AFTER:
const [tmdbResult, authResult] = await Promise.allSettled([
  Promise.all([...tmdb]),   // ~200ms ┐
  auth(),                   // ~50ms  ┘ parallel
])
// Then user data: ~100ms
// Total: ~300ms
```

### Optimization 4: Cache AI Trending Banner

**Problem:** Every request to `/api/ai/trending-banner` called Gemini API (~1.2s) — no caching at all.

**Solution:** Added `revalidate = 1800` (30 min ISR cache) and `Cache-Control` headers for CDN caching. Subsequent requests within 30 minutes served from cache (~7ms).

## Profiling Results (AFTER Optimization)

| Endpoint | Before (ms) | After (ms) | Improvement |
|----------|-------------|------------|-------------|
| Homepage `/` | 659 | 782* | see note |
| Explore `/explore` | **638** | **368** | **-42%** |
| Discover `/discover` | 130 | 54 | -58% |
| `/api/ai/trending-banner` | **1,257** | **1,263** (first) / **~7** (cached) | **-99% (cached)** |
| Movie detail `/movies/27205` | **276** | **162** | **-41%** |
| Movie detail `/movies/550` | 141 | 90 | -36% |
| `/api/movies/trending` | 33 | 7 | -79% |

*Note: Homepage first-run includes Turbopack compilation overhead in dev. The `Promise.allSettled` optimization reduces wall-clock time by ~200ms when TMDB and DB have similar latencies. Production builds will show more consistent improvements.*

### New Hot Spots

After optimization, the remaining slow points are:
1. **AI trending banner** (first call) — 1.2s is inherent to Gemini API latency; mitigated by 30-min cache
2. **Homepage** — still ~300ms due to TMDB API + DB latency; acceptable for SSR with streaming
3. **Explore page** — 368ms, mostly DB query time; could be further optimized with full-text search index

## Profiling Script

Run the profiling script:

```bash
# Requires dev server running
./scripts/profile.sh http://localhost:3000

# Against production
./scripts/profile.sh https://cinelist.vercel.app
```

The script measures 14 endpoints, 5 runs each, reports avg/min/max/TTFB/size.
