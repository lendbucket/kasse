import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, tenantErrorResponse, type TenantContext } from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { Permissions, type PermissionKey } from "@/lib/permissions/types";
import { requirePermission, PermissionError, type PermissionSession } from "@/lib/permissions/check";
import { createStaffLoginInvitation } from "@/lib/staff/invite";
import { renderStaffInviteEmail } from "@/lib/onboarding/emails/staff-invite";
import { writeAuditLog, AuditAction } from "@/lib/audit/write";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = "Kasse <onboarding@kasseapp.com>";

// Build the accept link on the SAME origin the owner is already using
// (portal.kasseapp.com) — that domain is served by this app and is made public
// in the route map. signup.kasseapp.com is NOT a domain on this Vercel project,
// so we must not default to it. An explicit env override wins only if set to a
// real on-project host.
function getBaseUrl(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) return `${proto}://${host}`;
  const envBase = process.env.NEXT_PUBLIC_ONBOARDING_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  return "https://portal.kasseapp.com";
}

const ERROR_STATUS: Record<string, number> = {
  staff_not_found: 404,
  staff_already_linked: 409,
  staff_missing_email: 400,
  email_already_user: 409,
  invite_already_pending: 409,
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx: TenantContext;
  try { ctx = await requireTenantContext(request); }
  catch (e) { const r = tenantErrorResponse(e); if (r) return r; throw e; }

  const ps: PermissionSession = {
    user: {
      id: ctx.userId,
      role: ctx.role,
      organizationId: ctx.organizationId,
      customRolePermissions: ctx.customRolePermissions as PermissionKey[] | undefined,
    },
  };
  try { requirePermission(ps, Permissions.STAFF.INVITE); }
  catch (e) { if (e instanceof PermissionError) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); throw e; }

  const { id: staffId } = await params;
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const result = await withTenantScope(prisma, ctx, async (tx) =>
    createStaffLoginInvitation({ tx, staffId, organizationId: ctx.organizationId, inviterUserId: ctx.userId, ipAddress, userAgent }),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error] ?? 400 });
  }

  const acceptUrl = `${getBaseUrl(request)}/staff/accept-invite?token=${result.rawToken}`;
  let emailSent = false;
  if (RESEND_API_KEY) {
    try {
      const emailContent = renderStaffInviteEmail({
        inviterName: ctx.name ?? ctx.email ?? "Your manager",
        organizationName: result.organizationName,
        locationName: result.locationName,
        inviteeName: result.name,
        acceptUrl,
        expiresAt: result.expiresAt,
      });
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: RESEND_FROM,
        to: result.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      emailSent = true;
    } catch (err) {
      console.error("staff login invite email failed — non-fatal", err);
    }
  } else {
    console.warn("RESEND_API_KEY not set — staff login invite email not sent");
  }

  await writeAuditLog({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    action: AuditAction.STAFF_INVITATION_SENT,
    entity: "StaffInvitation",
    entityId: result.staffInvitationId,
    metadata: { via: "roster", staffId, emailSent },
  });

  const body: Record<string, unknown> = { ok: true, staffInvitationId: result.staffInvitationId, emailSent };
  if (process.env.NODE_ENV !== "production") body.devRawToken = result.rawToken;
  return NextResponse.json(body, { status: 201, headers: { "Cache-Control": "no-store" } });
}
