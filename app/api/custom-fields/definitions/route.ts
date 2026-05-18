import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { createDefinition, listDefinitions } from "@/lib/custom-fields/definitions";
import { CustomFieldValidationError } from "@/lib/custom-fields/validate";
import type {
  CustomFieldTargetEntity,
  CustomFieldType,
  ValidationRules,
  CustomFieldValueShape,
} from "@/lib/custom-fields/types";
import { VALID_TARGET_ENTITIES } from "@/lib/custom-fields/types";

const MANAGEMENT_ROLES: Role[] = [Role.SUPERADMIN, Role.OWNER, Role.MANAGER];

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const targetEntity = request.nextUrl.searchParams.get("targetEntity");
  if (!targetEntity || !VALID_TARGET_ENTITIES.includes(targetEntity as CustomFieldTargetEntity)) {
    return NextResponse.json(
      { error: "targetEntity query param required (CLIENT, SERVICE, APPOINTMENT, STAFF, PRODUCT)" },
      { status: 400 },
    );
  }

  // includeInactive=true is only honored for management roles. Non-management
  // roles must not see soft-deleted field names (avoids leaking historical metadata).
  const includeInactiveRequested = request.nextUrl.searchParams.get("includeInactive") === "true";
  const includeInactive = includeInactiveRequested && MANAGEMENT_ROLES.includes(ctx.role);

  const definitions = await withTenantScope(prisma, ctx, async (tx) => {
    return listDefinitions(tx, {
      organizationId: ctx.organizationId,
      targetEntity: targetEntity as CustomFieldTargetEntity,
      includeInactive,
    });
  });

  return NextResponse.json({ definitions });
}

type CreateBody = {
  targetEntity: CustomFieldTargetEntity;
  key: string;
  displayName: string;
  description?: string | null;
  fieldType: CustomFieldType;
  isRequired?: boolean;
  displayOrder?: number;
  validationRules?: ValidationRules;
  defaultValue?: CustomFieldValueShape | null;
  visibleToCustomers?: boolean;
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
      { error: "Only OWNER, MANAGER, or SUPERADMIN can manage custom field definitions" },
      { status: 403 },
    );
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.key || !body.displayName || !body.fieldType || !body.targetEntity) {
    return NextResponse.json(
      { error: "key, displayName, fieldType, and targetEntity are required" },
      { status: 400 },
    );
  }

  try {
    const result = await withTenantScope(prisma, ctx, async (tx) => {
      return createDefinition(tx, {
        organizationId: ctx.organizationId,
        targetEntity: body.targetEntity,
        key: body.key,
        displayName: body.displayName,
        description: body.description,
        fieldType: body.fieldType,
        isRequired: body.isRequired,
        displayOrder: body.displayOrder,
        validationRules: body.validationRules,
        defaultValue: body.defaultValue,
        visibleToCustomers: body.visibleToCustomers,
        actorUserId: ctx.userId,
      });
    });

    return NextResponse.json(result, { status: 201 });
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
