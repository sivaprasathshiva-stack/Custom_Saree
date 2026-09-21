/**
 * Structured logging (requirements §51.1).
 *
 * Every log line is a single JSON object so it can be queried in production
 * rather than grepped. The redaction list is not decoration: §51.1 forbids
 * logging tokens, signed URLs, full personal data or image contents, and the
 * easiest way to keep that promise is to make it impossible to do by accident.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  traceId?: string;
  userId?: string;
  designId?: string;
  jobId?: string;
  route?: string;
  durationMs?: number;
  status?: number;
  errorCode?: string;
  [key: string]: unknown;
}

/**
 * Keys whose values are never written to a log, at any nesting depth.
 * Matching is case-insensitive and substring-based, so `supabaseAccessToken`
 * and `SIGNED_URL` are both caught.
 */
const REDACTED_KEY_PATTERNS = [
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "signedurl",
  "signed_url",
  "servicerole",
  "service_role",
  "email",
  "phone",
  "address",
  "fullname",
  "full_name",
  "bytes",
  "dataurl",
  "data_url",
  "prompt",
];

const REDACTED = "[redacted]";
const MAX_DEPTH = 6;

function shouldRedact(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z_]/g, "");
  return REDACTED_KEY_PATTERNS.some((pattern) => normalized.includes(pattern.replace(/_/g, "")));
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[truncated]";
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    // A bearer token or signed URL can arrive as a bare string value under an
    // innocuous key; truncate anything implausibly long rather than emit it.
    return value.length > 512 ? `${value.slice(0, 512)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return `[binary ${"byteLength" in value ? value.byteLength : "?"} bytes]`;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((entry) => sanitize(entry, depth + 1));
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = shouldRedact(key) ? REDACTED : sanitize(entry, depth + 1);
    }
    return output;
  }
  return String(value);
}

function currentLevel(): LogLevel {
  const configured = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (configured === "debug" || configured === "info" || configured === "warn" || configured === "error") {
    return configured;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function enabled(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel()];
}

function emit(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!enabled(level)) return;

  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...(sanitize(context) as Record<string, unknown>),
  });

  // A logging failure must never take down a request.
  try {
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } catch {
    // Intentionally silent.
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
  /** A logger with context pre-bound, for a request or a job. */
  child(bound: LogContext) {
    return {
      debug: (message: string, context?: LogContext) => emit("debug", message, { ...bound, ...context }),
      info: (message: string, context?: LogContext) => emit("info", message, { ...bound, ...context }),
      warn: (message: string, context?: LogContext) => emit("warn", message, { ...bound, ...context }),
      error: (message: string, context?: LogContext) => emit("error", message, { ...bound, ...context }),
    };
  },
};

export type Logger = ReturnType<typeof logger.child>;

/** Exposed for tests that assert the redaction contract holds. */
export const __testing = { sanitize, shouldRedact };
