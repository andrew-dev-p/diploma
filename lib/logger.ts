/**
 * @module logger
 * @description Structured logging system for CineList using Pino.
 *
 * Features:
 * - Structured JSON logs in production, pretty-printed in development
 * - Log level configurable via `LOG_LEVEL` env var (no recompilation needed)
 * - Contextual child loggers per module
 * - Request tracing via `requestId` field
 * - Automatic redaction of sensitive fields (authorization, password, secret)
 *
 * Log levels (from most to least verbose):
 * - `trace` (10): Detailed debugging, function entry/exit
 * - `debug` (20): Diagnostic info useful during development
 * - `info` (30): Normal operations (default in production)
 * - `warn` (40): Recoverable issues, degraded functionality
 * - `error` (50): Operation failures, caught exceptions
 * - `fatal` (60): Unrecoverable errors, application crash
 *
 * @example
 * ```ts
 * import { logger, createModuleLogger } from "@/lib/logger"
 *
 * // Root logger
 * logger.info("Application started")
 *
 * // Module-specific logger
 * const log = createModuleLogger("tmdb")
 * log.info({ movieId: 550 }, "Fetching movie details")
 * log.error({ err, movieId: 550 }, "TMDB API request failed")
 * ```
 */

import pino from "pino"

const isProduction = process.env.NODE_ENV === "production"

/**
 * Root Pino logger instance.
 *
 * Configuration:
 * - Level: `LOG_LEVEL` env var, or "info" (production) / "debug" (development)
 * - Format: JSON in production, pretty-printed in development
 * - Redacts: authorization headers, passwords, secrets
 * - Timestamp: ISO 8601 format
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ["req.headers.authorization", "*.password", "*.secret", "*.token"],
    censor: "[REDACTED]",
  },
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
})

/**
 * Creates a child logger scoped to a specific module.
 * All log entries from this logger will include `{ module: name }`.
 *
 * @param name - Module name (e.g., "tmdb", "ai", "list-actions")
 * @returns A child Pino logger with the module field set
 *
 * @example
 * ```ts
 * const log = createModuleLogger("ai")
 * log.info({ listName: "Horror" }, "Generating AI description")
 * // Output: { level: "info", module: "ai", listName: "Horror", msg: "Generating AI description" }
 * ```
 */
export function createModuleLogger(name: string) {
  return logger.child({ module: name })
}

/**
 * Creates a child logger with a request trace ID for end-to-end tracing.
 * Use this in API routes and middleware to correlate logs across a single request.
 *
 * @param requestId - Unique request identifier (e.g., from X-Request-ID header)
 * @param module - Optional module name
 * @returns A child Pino logger with requestId (and optionally module) set
 */
export function createRequestLogger(requestId: string, module?: string) {
  return logger.child({ requestId, ...(module ? { module } : {}) })
}
