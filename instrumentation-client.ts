import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const env = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development";

// Only initialize in production. Optionally allow preview if explicitly enabled.
const shouldInitialize =
  env === "production" ||
  (env === "preview" &&
    process.env.NEXT_PUBLIC_SENTRY_PREVIEW_ENABLED === "true");

if (shouldInitialize && dsn) {
  Sentry.init({
    dsn,
    environment: env,

    // Performance Monitoring
    tracesSampleRate: env === "production" ? 0.1 : 1.0,

    // Session Replay (production only, low sample rate)
    replaysSessionSampleRate: env === "production" ? 0.01 : 0,
    replaysOnErrorSampleRate: env === "production" ? 1.0 : 0,

    // Filter out noise
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Network request failed",
    ],

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
