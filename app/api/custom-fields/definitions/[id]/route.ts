import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { updateDefinition, softDeleteDefinition } from "@/lib/custom-fields/definitions";
import { CustomFieldValidationError } from "@/lib/custom-fields/validate";
import type {
  ValidationRules,
  CustomFieldValueShape,
} from "@/lib/custom-fields/types";

const MANAGEMENT_ROLES: Role[] = [Role.SUPERADMIN, Role.OWNER, Role.MANAGER];

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
      { error: "Only OWNER, MANAGER, or SUPERADMIN can manage custom field definitions" },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: Partial<{
    displayName: string;
    description: string | null;
    isRequired: boolean;
    displayOrder: number;
    validationRules: ValidationRules;
    defaultValue: CustomFieldValueShape | null;
    visibleToCustomers: boolean;
    isActive: boolean;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await withTenantScope(prisma, ctx, async (tx) => {
      return updateDefinition(tx, {
        organizationId: ctx.organizationId,
        definitionId: id,
        changes: body,
        actorUserId: ctx.userId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof CustomFieldValidationError) {
      return NextResponse.json(
        { error: e.message, field: e.field },
        { status: 400 },
      );
    }
    throw e;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      { error: "Only OWNER, MANAGER, or SUPERADMIN can manage custom field definitions" },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    await withTenantScope(prisma, ctx, async (tx) => {
      return softDeleteDefinition(tx, {
        organizationId: ctx.organizationId,
        definitionId: id,
        actorUserId: ctx.userId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof CustomFieldValidationError) {
      return NextResponse.json(
        { error: e.message, field: e.field },
        { status: 400 },
      );
    }
    throw e;
  }
}
