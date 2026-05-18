import { NextResponse, type NextRequest } from 'next/server';
import { prismaAdmin } from '@/lib/prismaAdmin';
import {
  requireSuperadminContext,
  tenantErrorResponse,
  type SuperadminContext,
} from '@/lib/tenant/context';
import { withAdminScope } from '@/lib/tenant/db-scope';
import { setFlagOverride } from '@/lib/feature-flags/admin';

export async function POST(
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

  if (!body.organizationId || typeof body.organizationId !== 'string') {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
  }

  if (body.value !== true && body.value !== false && body.value !== null) {
    return NextResponse.json(
      { error: 'value must be true, false, or null (to remove)' },
      { status: 400 },
    );
  }

  try {
    await withAdminScope(prismaAdmin, admin, async (tx) => {
      return setFlagOverride(tx, {
        flagId: id,
        organizationId: body.organizationId,
        value: body.value,
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
