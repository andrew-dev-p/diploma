/**
 * @module errors
 * @description Custom error classes with unique codes, context, and localized messages.
 *
 * Error hierarchy:
 * - `AppError` (base) — all application-specific errors
 *   - `AuthError` — authentication/authorization failures
 *   - `NotFoundError` — resource not found
 *   - `ValidationError` — invalid input data
 *   - `ExternalServiceError` — TMDB, Gemini, Clerk failures
 *   - `RateLimitError` — too many requests
 *
 * Each error includes:
 * - `code`: unique string identifier (e.g., "AUTH_UNAUTHORIZED")
 * - `statusCode`: HTTP status code
 * - `context`: additional diagnostic data (params, state)
 * - `userMessage`: localized user-facing message (UA/EN)
 *
 * @example
 * ```ts
 * throw new NotFoundError("List", listId, { slug })
 * // → { code: "NOT_FOUND", statusCode: 404, message: "List not found: abc123" }
 * ```
 */

type SupportedLocale = "uk" | "en"

const DEFAULT_LOCALE: SupportedLocale = "uk"

/**
 * Localized message map for error types.
 */
const ERROR_MESSAGES: Record<
  string,
  Record<SupportedLocale, string | ((...args: string[]) => string)>
> = {
  AUTH_UNAUTHORIZED: {
    uk: "Необхідна авторизація. Будь ласка, увійдіть в систему.",
    en: "Authentication required. Please sign in.",
  },
  AUTH_FORBIDDEN: {
    uk: "У вас немає доступу до цього ресурсу.",
    en: "You do not have access to this resource.",
  },
  NOT_FOUND: {
    uk: (resource: string) => `${resource} не знайдено.`,
    en: (resource: string) => `${resource} not found.`,
  },
  VALIDATION_ERROR: {
    uk: "Надані дані некоректні. Перевірте введені дані та спробуйте ще раз.",
    en: "The provided data is invalid. Please check your input and try again.",
  },
  EXTERNAL_SERVICE_TMDB: {
    uk: "Не вдалося отримати дані про фільми. Спробуйте пізніше.",
    en: "Failed to fetch movie data. Please try again later.",
  },
  EXTERNAL_SERVICE_AI: {
    uk: "AI-сервіс тимчасово недоступний. Спробуйте пізніше.",
    en: "AI service is temporarily unavailable. Please try again later.",
  },
  EXTERNAL_SERVICE_AUTH: {
    uk: "Сервіс аутентифікації тимчасово недоступний.",
    en: "Authentication service is temporarily unavailable.",
  },
  RATE_LIMIT: {
    uk: "Забагато запитів. Зачекайте хвилину та спробуйте ще раз.",
    en: "Too many requests. Please wait a moment and try again.",
  },
  INTERNAL_ERROR: {
    uk: "Виникла внутрішня помилка. Якщо проблема повторюється, зверніться до підтримки.",
    en: "An internal error occurred. If the problem persists, please contact support.",
  },
}

/**
 * Gets a localized user-facing message for an error code.
 * @param code - Error code
 * @param locale - Locale (defaults to "uk")
 * @param args - Interpolation arguments for template messages
 * @returns Localized message string
 */
function getLocalizedMessage(
  code: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
  ...args: string[]
): string {
  const messages = ERROR_MESSAGES[code]
  if (!messages) return ERROR_MESSAGES.INTERNAL_ERROR[locale] as string

  const msg = messages[locale] ?? messages.en
  if (typeof msg === "function") return msg(...args)
  return msg
}

/**
 * Base application error with unique code, HTTP status, context, and localization.
 *
 * @example
 * ```ts
 * throw new AppError("Something failed", "CUSTOM_CODE", 500, { detail: "info" })
 * ```
 */
export class AppError extends Error {
  /** Unique error code identifier */
  readonly code: string
  /** HTTP status code */
  readonly statusCode: number
  /** Additional diagnostic context (logged, not shown to user) */
  readonly context: Record<string, unknown>
  /** Localized user-facing message (Ukrainian) */
  readonly userMessage: string
  /** Localized user-facing message (English) */
  readonly userMessageEn: string
  /** ISO timestamp when the error occurred */
  readonly timestamp: string

  constructor(
    message: string,
    code = "INTERNAL_ERROR",
    statusCode = 500,
    context: Record<string, unknown> = {},
    ...localeArgs: string[]
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.context = context
    this.timestamp = new Date().toISOString()
    this.userMessage = getLocalizedMessage(code, "uk", ...localeArgs)
    this.userMessageEn = getLocalizedMessage(code, "en", ...localeArgs)
  }

  /**
   * Serializes the error for JSON logging (excludes stack in production).
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV !== "production" ? { stack: this.stack } : {}),
    }
  }
}

/** Authentication or authorization failure. */
export class AuthError extends AppError {
  constructor(
    message = "Unauthorized",
    code = "AUTH_UNAUTHORIZED",
    context: Record<string, unknown> = {}
  ) {
    super(message, code, 401, context)
  }
}

/** Requested resource not found. */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    id?: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      `${resource} not found${id ? `: ${id}` : ""}`,
      "NOT_FOUND",
      404,
      { resource, id, ...context },
      resource
    )
  }
}

/** Invalid input or request data. */
export class ValidationError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, "VALIDATION_ERROR", 400, context)
  }
}

/** External service (TMDB, Gemini, Clerk) failure. */
export class ExternalServiceError extends AppError {
  constructor(
    service: "tmdb" | "ai" | "auth",
    message: string,
    context: Record<string, unknown> = {}
  ) {
    const codeMap = {
      tmdb: "EXTERNAL_SERVICE_TMDB",
      ai: "EXTERNAL_SERVICE_AI",
      auth: "EXTERNAL_SERVICE_AUTH",
    }
    super(message, codeMap[service], 502, { service, ...context })
  }
}

/** Rate limit exceeded. */
export class RateLimitError extends AppError {
  constructor(context: Record<string, unknown> = {}) {
    super("Rate limit exceeded", "RATE_LIMIT", 429, context)
  }
}
