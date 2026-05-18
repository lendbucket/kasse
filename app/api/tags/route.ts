import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { createTag, listTags, TagValidationError } from "@/lib/tags/definitions";

const MANAGEMENT_ROLES: Role[] = [Role.SUPERADMIN, Role.OWNER, Role.MANAGER];

/**
 * GET /api/tags
 *
 * Lists active tags for the current org. Any authenticated tenant user can
 * call this — they need tags to render UI even if they can't manage them.
 *
 * `includeInactive=true` requires OWNER, MANAGER, or SUPERADMIN role.
 * Non-management roles must not see soft-deleted tag names.
 */
export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const includeInactiveRequested = request.nextUrl.searchParams.get("includeInactive") === "true";
  const includeInactive = includeInactiveRequested && MANAGEMENT_ROLES.includes(ctx.role);

  const tags = await withTenantScope(prisma, ctx, async (tx) => {
    return listTags(tx, {
      organizationId: ctx.organizationId,
      includeInactive,
    });
  });

  return NextResponse.json({ tags });
}

type CreateBody = {
  name: string;
  slug: string;
  color?: string;
  description?: string | null;
  displayOrder?: number;
};

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  if (!MANAGEMENT_ROLES.includes(ctx.role)) {
    return NextResponse.json(
      { error: "Only OWNER, MANAGER, or SUPERADMIN can manage tags" },
      { status: 403 },
    );
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || !body.slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 },
    );
  }

  try {
    const result = await withTenantScope(prisma, ctx, async (tx) => {
      return createTag(tx, {
        organizationId: ctx.organizationId,
        name: body.name,
        slug: body.slug,
        color: body.color,
        description: body.description,
        displayOrder: body.displayOrder,
        actorUserId: ctx.userId,
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof TagValidationError) {
      return NextResponse.json(
        { error: e.message, field: e.field },
        { status: 400 },
      );
    }
    throw e;
  }
}
