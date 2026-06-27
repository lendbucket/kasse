import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, assertLocationInTenant, tenantErrorResponse, type TenantContext } from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { requirePermission, PermissionError, type PermissionSession } from "@/lib/permissions/check";
import { Permissions, type PermissionKey } from "@/lib/permissions/types";
import { createImmediateCheckout, type CheckoutInput, type CheckoutResult } from "@/lib/checkout/create";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ERROR_STATUS: Record<string, number> = {
  no_items: 400, too_many_items: 400, invalid_quantity: 400, invalid_tip: 400, invalid_discount: 400,
  unsupported_tender: 422, service_not_found: 404, staff_not_found: 404, location_mismatch: 409,
};

function isP2002(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try { ctx = await requireTenantContext(request); }
  catch (e) { const r = tenantErrorResponse(e); if (r) return r; throw e; }

  const ps: PermissionSession = { user: { id: ctx.userId, role: ctx.role, organizationId: ctx.organizationId, customRolePermissions: ctx.customRolePermissions as PermissionKey[] | undefined } };
  try { requirePermission(ps, Permissions.POS.OPEN_CHECKOUT); }
  catch (e) { if (e instanceof PermissionError) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); throw e; }

  let body: {
    locationId?: string; clientId?: string; clientName?: string; appointmentId?: string;
    items?: Array<{ serviceId?: string; staffId?: string; quantity?: number }>;
    tipCents?: number; discountCents?: number; method?: string; idempotencyKey?: string;
  };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const locationId = typeof body.locationId === "string" ? body.locationId : "";
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });
  try { await assertLocationInTenant(locationId, ctx); }
  catch (e) { const r = tenantErrorResponse(e); if (r) return r; throw e; }

  const method = typeof body.method === "string" ? body.method.toUpperCase() : "";
  if (method === "CARD") return NextResponse.json({ error: "card_coming_soon", detail: "Card payments arrive in the next slice (SalonTransact engine)." }, { status: 422 });

  const idempotencyKey = typeof body.idempotencyKey === "string" && body.idempotencyKey.trim() ? body.idempotencyKey.trim() : "";
  if (!idempotencyKey) return NextResponse.json({ error: "idempotencyKey required" }, { status: 400 });

  const input: CheckoutInput = {
    organizationId: ctx.organizationId,
    locationId,
    clientId: typeof body.clientId === "string" ? body.clientId : null,
    clientName: typeof body.clientName === "string" ? body.clientName : null,
    appointmentId: typeof body.appointmentId === "string" ? body.appointmentId : null,
    items: Array.isArray(body.items) ? body.items.map((i) => ({ serviceId: String(i.serviceId ?? ""), staffId: i.staffId ? String(i.staffId) : null, quantity: typeof i.quantity === "number" ? i.quantity : 1 })) : [],
    tipCents: typeof body.tipCents === "number" ? body.tipCents : 0,
    discountCents: typeof body.discountCents === "number" ? body.discountCents : 0,
    method,
    idempotencyKey,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent") ?? null,
  };

  let result: CheckoutResult | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try { result = await withTenantScope(prisma, ctx, (tx) => createImmediateCheckout(tx, input)); break; }
    catch (e) { lastErr = e; if (isP2002(e)) continue; throw e; }
  }
  if (!result) { console.error("checkout failed after retries", { attempts: 4, idempotencyKey: input.idempotencyKey, err: lastErr }); return NextResponse.json({ error: "checkout_conflict" }, { status: 409 }); }
  if (!result.ok) return NextResponse.json({ error: result.error, detail: result.detail }, { status: ERROR_STATUS[result.error] ?? 400 });

  return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
}
