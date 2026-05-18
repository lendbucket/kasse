import * as Sentry from "@sentry/nextjs";

/**
 * Set the tenant context for the current Sentry scope.
 * Call this early in every API route after resolving the org.
 */
export function setSentryTenantContext(args: {
  organizationId: string;
  userId?: string | null;
  requestId: string;
}): void {
  Sentry.getCurrentScope().setTag("organizationId", args.organizationId);
  Sentry.getCurrentScope().setTag("requestId", args.requestId);
  if (args.userId) {
    Sentry.getCurrentScope().setUser({ id: args.userId });
  }
}

/**
 * Capture an exception with structured context.
 * Use this in catch blocks where you want explicit Sentry reporting +
 * context attachment without re-throwing.
 */
export function captureException(
  error: unknown,
  context: {
    requestId: string;
    organizationId?: string | null;
    userId?: string | null;
    extra?: Record<string, unknown>;
  },
): void {
  Sentry.withScope((scope) => {
    scope.setTag("requestId", context.requestId);
    if (context.organizationId) {
      scope.setTag("organizationId", context.organizationId);
    }
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });
}
