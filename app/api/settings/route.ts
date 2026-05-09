import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import {
  ORGANIZATION_ALLOWED_FIELDS,
  BUSINESS_SETTINGS_ALLOWED_FIELDS,
  pickAllowed,
} from "@/lib/tenant/allowlists";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const [org, settings] = await Promise.all([
      tx.organization.findUnique({
        where: { id: ctx.organizationId },
        include: { locations: true },
      }),
      tx.businessSettings.findUnique({
        where: { organizationId: ctx.organizationId },
      }),
    ]);
    return { org, settings };
  });

  return NextResponse.json({
    organization: result.org,
    settings: result.settings,
  });
}

type PatchBody = {
  organizationUpdates?: Record<string, unknown>;
  settingsUpdates?: Record<string, unknown>;
};

export async function PATCH(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.organizationUpdates && !body.settingsUpdates) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  // Apply field allowlists to defend against mass-assignment.
  // See lib/tenant/allowlists.ts for the deliberate set of writable fields.
  const safeOrgUpdates      = pickAllowed(body.organizationUpdates, ORGANIZATION_ALLOWED_FIELDS);
  const safeSettingsUpdates = pickAllowed(body.settingsUpdates,    BUSINESS_SETTINGS_ALLOWED_FIELDS);

  const orgHasUpdates      = Object.keys(safeOrgUpdates).length > 0;
  const settingsHasUpdates = Object.keys(safeSettingsUpdates).length > 0;

  if (!orgHasUpdates && !settingsHasUpdates) {
    return NextResponse.json(
      { error: "No allowed fields to update" },
      { status: 400 },
    );
  }

  // Both writes run in a single transaction. If either fails, neither is persisted.
  await withTenantScope(prisma, ctx, async (tx) => {
    if (orgHasUpdates) {
      await tx.organization.update({
        where: { id: ctx.organizationId },
        data: safeOrgUpdates,
      });
    }
    if (settingsHasUpdates) {
      await tx.businessSettings.upsert({
        where: { organizationId: ctx.organizationId },
        update: safeSettingsUpdates,
        create: { organizationId: ctx.organizationId, ...safeSettingsUpdates },
      });
    }
  });

  return NextResponse.json({ success: true });
}
