import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { requirePermissionSetAccess } from "@/lib/permissions/api-helpers";
import { validatePermissionSetInput } from "@/lib/permissions/validate-permission-set";
import { writeAuditLog, AuditAction } from "@/lib/audit/write";

/**
 * GET /api/permission-sets — list current org's custom PermissionSets.
 */
export async function GET(request: NextRequest) {
  const ctxOrResp = await requirePermissionSetAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const sets = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.permissionSet.findMany({
      where: { organizationId: ctx.organizationId, isSystem: false },
      orderBy: { name: "asc" },
    });
  });

  return NextResponse.json(sets);
}

/**
 * POST /api/permission-sets — create a new custom PermissionSet.
 */
export async function POST(request: NextRequest) {
  const ctxOrResp = await requirePermissionSetAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  const { name, permissions } = body as { name: unknown; permissions: unknown };
  const validation = validatePermissionSetInput({ name, permissions });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // Check name uniqueness within org
    const existing = await tx.permissionSet.findFirst({
      where: { organizationId: ctx.organizationId, name: (name as string).trim() },
    });
    if (existing) return { error: "DUPLICATE_NAME" as const };

    const created = await tx.permissionSet.create({
      data: {
        organizationId: ctx.organizationId,
        name: (name as string).trim(),
        permissions: permissions as string[],
        isSystem: false,
      },
    });
    return { ok: true as const, created };
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: "DUPLICATE_NAME", message: "A permission set with this name already exists in this organization" },
      { status: 409 },
    );
  }

  await writeAuditLog({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    action: AuditAction.PERMISSION_SET_CREATE,
    entity: "PermissionSet",
    entityId: result.created.id,
    after: { name: result.created.name, permissions: result.created.permissions, organizationId: result.created.organizationId },
    route: "/api/permission-sets",
    request,
  });

  return NextResponse.json(result.created, { status: 201 });
}
