import { NextResponse, type NextRequest } from 'next/server';
import { prismaAdmin } from '@/lib/prismaAdmin';
import {
  requireSuperadminContext,
  tenantErrorResponse,
  type SuperadminContext,
} from '@/lib/tenant/context';
import { withAdminScope } from '@/lib/tenant/db-scope';
import { updateFlag } from '@/lib/feature-flags/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { id } = await params;

  const result = await withAdminScope(prismaAdmin, admin, async (tx) => {
    const flag = await tx.featureFlag.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
      },
    });
    if (!flag) return null;

    const audit = await tx.featureFlagAudit.findMany({
      where: { flagId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        changedBy: { select: { name: true, email: true } },
      },
    });

    return { flag, audit };
  });

  if (!result) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { id } = await params;
  const body = await request.json();

  try {
    await withAdminScope(prismaAdmin, admin, async (tx) => {
      return updateFlag(tx, {
        flagId: id,
        changes: {
          description: body.description,
          defaultValue: body.defaultValue,
          rolloutPct: body.rolloutPct,
          overrides: body.overrides,
          isActive: body.isActive,
        },
        reason: body.reason ?? null,
        actorUserId: admin.userId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
