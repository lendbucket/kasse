export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Sentry v10 + Next 16: capture server-side request errors
export { captureRequestError as onRequestError } from "@sentry/nextjs";
