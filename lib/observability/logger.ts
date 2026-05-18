import pino, { type Logger as PinoLogger } from "pino";

const env = process.env.NODE_ENV ?? "development";

/**
 * Application-wide structured logger.
 *
 * Always emits JSON to stdout. In production this is ingested by Vercel's
 * log drain automatically. In local dev, pipe through pino-pretty manually:
 *   npm run dev | npx pino-pretty
 *
 * The transport: { target: 'pino-pretty' } pattern is NOT used because it
 * has known issues with Turbopack + Vercel (thread-stream worker errors).
 *
 * Every log entry should include:
 * - requestId (set per-request via getRequestLogger)
 * - organizationId (set per-request via getRequestLogger)
 * - userId (when authenticated, via getRequestLogger)
 */
const baseLogger: PinoLogger = pino({
  level: env === "test" ? "silent" : env === "production" ? "info" : "debug",

  // Redact common sensitive paths from logs
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "set-cookie",
      "card_number",
      "cvv",
      "ssn",
      "*.password",
      "*.token",
      "*.authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },

  // Standard timestamp + level for log analysis
  formatters: {
    level: (label) => ({ level: label }),
  },

  base: {
    service: "kasse",
    env: process.env.VERCEL_ENV ?? env,
  },
});

export type Logger = PinoLogger;
export const logger: Logger = baseLogger;

/**
 * Create a child logger with request context bound.
 * Used in API routes to ensure every log line has request correlation.
 */
export interface RequestContext {
  requestId: string;
  organizationId?: string | null;
  userId?: string | null;
  path?: string;
  method?: string;
}

export function getRequestLogger(ctx: RequestContext): Logger {
  return baseLogger.child({
    requestId: ctx.requestId,
    ...(ctx.organizationId ? { organizationId: ctx.organizationId } : {}),
    ...(ctx.userId ? { userId: ctx.userId } : {}),
    ...(ctx.path ? { path: ctx.path } : {}),
    ...(ctx.method ? { method: ctx.method } : {}),
  });
}
