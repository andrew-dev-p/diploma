# Logging & Error Handling

## Overview

CineList uses **Pino** for structured logging and a custom error hierarchy for consistent error handling across the application.

## Logging System

### Chosen Library: Pino

**Why Pino:**
- Fastest Node.js JSON logger (30x faster than Winston in benchmarks)
- Structured JSON output — machine-parseable, compatible with log aggregation tools
- Built-in support for child loggers (module scoping) and redaction
- `pino-pretty` for human-readable development output
- Native Next.js compatibility (works in both Node.js and Edge runtimes)

**Alternatives considered:**
- **Winston** — more features but significantly slower; Pino's simplicity is preferred
- **Bunyan** — similar to Pino but less maintained
- **console.log** — no structure, no levels, no redaction; inadequate for production

### Log Levels

| Level | Value | Usage | Example |
|-------|-------|-------|---------|
| `trace` | 10 | Function entry/exit, detailed debugging | `Entering tmdbFetch with path=/movie/550` |
| `debug` | 20 | Diagnostic info during development | `TMDB API request: /search/movie?q=Inception` |
| `info` | 30 | Normal operations (**default in production**) | `Creating new list: "Horror Classics"` |
| `warn` | 40 | Recoverable issues, degraded state | `Unauthorized list creation attempt` |
| `error` | 50 | Operation failures, caught exceptions | `TMDB API request failed: 503 Service Unavailable` |
| `fatal` | 60 | Unrecoverable errors, process crash | `Database connection lost` |

### Configuration Without Recompilation

The minimum log level is set via the `LOG_LEVEL` environment variable:

```bash
# In .env.local (development)
LOG_LEVEL=debug

# In production (Vercel env vars)
LOG_LEVEL=info

# For troubleshooting production issues temporarily:
LOG_LEVEL=trace
```

If `LOG_LEVEL` is not set:
- **Production** (`NODE_ENV=production`): defaults to `info`
- **Development**: defaults to `debug`

This is a standard Pino feature — the level is read at startup from `process.env.LOG_LEVEL`.

### Log Format

**Development** (via pino-pretty):
```
14:32:15.123 INFO  [tmdb]: TMDB API request { path: "/movie/550" }
14:32:15.456 INFO  [tmdb]: TMDB API response OK { path: "/movie/550", status: 200 }
```

**Production** (structured JSON):
```json
{"level":"info","time":"2026-03-24T14:32:15.123Z","module":"tmdb","path":"/movie/550","msg":"TMDB API request"}
{"level":"info","time":"2026-03-24T14:32:15.456Z","module":"tmdb","path":"/movie/550","status":200,"msg":"TMDB API response OK"}
```

### Contextual Information

Every log entry includes:
- `level` — log level name
- `time` — ISO 8601 timestamp
- `module` — source module name (e.g., "tmdb", "ai", "list-actions")
- `msg` — human-readable message
- Additional fields specific to the operation (userId, listId, movieId, etc.)

### Log Rotation

**Vercel (production):** Logs are ephemeral — streamed to Vercel's log drain. For persistent storage, configure a log drain to an external service (Datadog, Axiom, etc.).

**Self-hosted (VPS with PM2):**
```bash
# PM2 handles log rotation automatically
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M     # Rotate at 10MB
pm2 set pm2-logrotate:retain 10        # Keep last 10 files
pm2 set pm2-logrotate:compress true    # Gzip old logs
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

### Sensitive Data Redaction

Pino automatically redacts:
- `req.headers.authorization` → `[REDACTED]`
- Any field named `password` → `[REDACTED]`
- Any field named `secret` → `[REDACTED]`
- Any field named `token` → `[REDACTED]`

## Error Handling

### Custom Error Hierarchy

```
AppError (base)
├── AuthError (401) — AUTH_UNAUTHORIZED, AUTH_FORBIDDEN
├── NotFoundError (404) — NOT_FOUND
├── ValidationError (400) — VALIDATION_ERROR
├── ExternalServiceError (502) — EXTERNAL_SERVICE_TMDB/AI/AUTH
└── RateLimitError (429) — RATE_LIMIT
```

### Error Properties

| Property | Description |
|----------|-------------|
| `code` | Unique string identifier (e.g., `AUTH_UNAUTHORIZED`) |
| `statusCode` | HTTP status code (401, 404, 400, 502, 429, 500) |
| `message` | Technical message for logs (English) |
| `userMessage` | Localized user-facing message (Ukrainian) |
| `userMessageEn` | Localized user-facing message (English) |
| `context` | Diagnostic data (params, IDs, state) — logged, not shown to user |
| `timestamp` | ISO 8601 when the error occurred |

### Localized Error Messages

All errors have Ukrainian and English user-facing messages:

| Code | Ukrainian | English |
|------|-----------|---------|
| `AUTH_UNAUTHORIZED` | Необхідна авторизація. Будь ласка, увійдіть в систему. | Authentication required. Please sign in. |
| `NOT_FOUND` | {resource} не знайдено. | {resource} not found. |
| `VALIDATION_ERROR` | Надані дані некоректні. Перевірте введені дані. | The provided data is invalid. |
| `EXTERNAL_SERVICE_TMDB` | Не вдалося отримати дані про фільми. | Failed to fetch movie data. |
| `EXTERNAL_SERVICE_AI` | AI-сервіс тимчасово недоступний. | AI service is temporarily unavailable. |
| `RATE_LIMIT` | Забагато запитів. Зачекайте хвилину. | Too many requests. Please wait. |
| `INTERNAL_ERROR` | Виникла внутрішня помилка. | An internal error occurred. |

### Custom Error Pages

| Page | File | Description |
|------|------|-------------|
| **404** | `app/not-found.tsx` | Ukrainian messaging, navigation options (home, explore, discover), report link |
| **Error (public)** | `app/(main)/error.tsx` | Error ID shown, retry/back/home buttons, email report link with error ID |
| **Error (dashboard)** | `app/dashboard/error.tsx` | Same as above, with link to dashboard |
| **500 (global)** | `app/global-error.tsx` | Inline styles (no CSS dependency), critical error messaging, report link |

All error pages include:
- User-friendly Ukrainian message (no technical details)
- Clear action instructions (retry, go back, go home)
- Error reference ID (`digest`) for support correlation
- "Report problem" mailto link pre-filled with error ID

## Request Tracing

Every request gets a unique `X-Request-ID` header, generated in the Edge middleware:

```
Client → Middleware (generates requestId) → Server → Response (X-Request-ID header)
```

This allows correlating logs from a single user request across all server-side components.
