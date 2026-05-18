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
  });
}
