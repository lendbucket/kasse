import { NextResponse, type NextRequest } from 'next/server';
import { prismaAdmin } from '@/lib/prismaAdmin';
import {
  requireSuperadminContext,
  tenantErrorResponse,
  type SuperadminContext,
} from '@/lib/tenant/context';
import { withAdminScope } from '@/lib/tenant/db-scope';
import { createFlag } from '@/lib/feature-flags/admin';

export async function GET(request: NextRequest) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const flags = await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
      },
    });
  });

  return NextResponse.json({ flags });
}

export async function POST(request: NextRequest) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json();

  try {
    const result = await withAdminScope(prismaAdmin, admin, async (tx) => {
      return createFlag(tx, {
        key: body.key,
        description: body.description ?? '',
        defaultValue: body.defaultValue ?? false,
        rolloutPct: body.rolloutPct ?? 0,
        overrides: body.overrides ?? {},
        isActive: body.isActive ?? true,
        actorUserId: admin.userId,
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
