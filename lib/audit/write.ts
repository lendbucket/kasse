import { prismaAdmin } from "@/lib/prismaAdmin";
import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { type AuditAction } from "./helpers";

export { AuditAction, diffChangedFields } from "./helpers";

/**
 * Audit log entry for any mutating operation. Captures who did what to which
 * entity, with before/after snapshots for diff tracking and downstream
 * forensic review.
 *
 * Writes via prismaAdmin (RLS bypass) because audit logging is platform-wide:
 * the writer is not bound to a tenant, and audit records must be inserted
 * regardless of whether the caller's session has tenant context. This is
 * the same architectural pattern as session-callback writes — prismaAdmin
 * is appropriate for cross-cutting infrastructure concerns.
 *
 * The function is fail-soft: an audit-write failure logs to console but does
 * NOT throw or block the caller's main operation. Better to lose an audit
 * entry than to fail a mutation.
 */
export type AuditInput = {
  userId: string | null;
  organizationId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changedFields?: string[];
  metadata?: Record<string, unknown>;
  route?: string;
  request?: NextRequest;
};

/**
 * Build a deferred audit log create operation for use inside withAdminTx.
 *
 * Unlike writeAuditLog(), this does NOT catch errors — the caller
 * (withAdminTx) handles atomicity. It also does NOT extract request
 * headers (no request context inside a batch builder). Pass IP/UA/
 * requestId explicitly via the metadata field if needed.
 *
 * Returns a PrismaPromise — do NOT await it; pass it directly into
 * the withAdminTx batch array.
 */
export function auditLogCreateOp(
  p: typeof prismaAdmin,
  input: Omit<AuditInput, 'request' | 'route'>
): Prisma.PrismaPromise<unknown> {
  return p.auditLog.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
      changedFields: input.changedFields ?? [],
      metadata: input.metadata ?? undefined,
      ipAddress: null,
      userAgent: null,
      requestId: null,
      route: null,
    },
  });
}

export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    // x-forwarded-for is reliable in production because Vercel Edge sets it
    // before invoking the function. In other environments (self-hosted, local
    // dev) the header is client-controlled and shouldn't be trusted for
    // forensic IP attribution. If we ever move off Vercel, replace this with
    // the platform's documented client-IP header.
    const ipAddress = input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = input.request?.headers.get("user-agent") ?? null;
    const requestId = input.request?.headers.get("x-vercel-id") ?? null;

    await prismaAdmin.auditLog.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        before: input.before ?? undefined,
        after: input.after ?? undefined,
        changedFields: input.changedFields ?? [],
        metadata: input.metadata ?? undefined,
        ipAddress,
        userAgent,
        requestId,
        route: input.route ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write audit log — non-fatal", {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
