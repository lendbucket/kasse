import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const env = process.env.VERCEL_ENV ?? "development";

const shouldInitialize =
  env === "production" ||
  (env === "preview" && process.env.SENTRY_PREVIEW_ENABLED === "true");

if (shouldInitialize && dsn) {
  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,

    // Don't send PII fields to Sentry
    beforeSend(event) {
      // Strip cookies and headers that may contain tokens
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
          delete event.request.headers["x-api-key"];
        }
      }
      return event;
    },
  });
}
