// Web Crypto API instead of node:crypto. Required for Edge runtime
// compatibility — this module is imported from middleware.ts which runs
// in Edge. The global `crypto.randomUUID()` is available in both Node 19+
// and Edge runtimes, so this works in API routes too.
import type { NextRequest } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Extract or generate a request ID for the incoming request.
 * Prefers an upstream-provided ID (from CDN/load balancer) if present.
 * Otherwise generates a fresh UUID v4.
 */
export function getRequestId(req: NextRequest | Request): string {
  const incoming = req.headers.get(REQUEST_ID_HEADER);
  if (incoming && isValidRequestId(incoming)) {
    return incoming;
  }
  return crypto.randomUUID();
}

/**
 * Validate that an incoming request ID looks reasonable.
 * Accept UUIDs and CDN-style hex IDs (8+ hex chars or UUID format).
 */
function isValidRequestId(id: string): boolean {
  // Reject empty, too long, or anything with control chars
  if (!id || id.length > 128) return false;
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) return false;
  return true;
}
