import { randomBytes, createHash } from "crypto";
import type { Prisma } from "@prisma/client";

const RAW_TOKEN_BYTES = 32;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// MUST match lib/onboarding/staff-invites.ts hashToken so acceptStaffInvitation can resolve the token.
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export type StaffInviteError =
  | "staff_not_found"
  | "staff_already_linked"
  | "staff_missing_email"
  | "email_already_user"
  | "invite_already_pending";

type Result =
  | { ok: true; rawToken: string; email: string; name: string; expiresAt: Date; staffInvitationId: string; organizationName: string; locationName: string }
  | { ok: false; error: StaffInviteError };

/**
 * Create a StaffInvitation for an EXISTING roster Staff member, outside the
 * onboarding wizard. Caller passes a tenant-scoped tx (withTenantScope).
 * The token/hash/TTL match acceptStaffInvitation so the existing accept flow
 * consumes it unchanged.
 */
export async function createStaffLoginInvitation(args: {
  tx: Prisma.TransactionClient;
  staffId: string;
  organizationId: string;
  inviterUserId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<Result> {
  const staff = await args.tx.staff.findFirst({
    where: { id: args.staffId, organizationId: args.organizationId, softDeletedAt: null },
    select: {
      id: true, name: true, email: true, userId: true, locationId: true,
      organization: { select: { name: true } },
      location: { select: { name: true } },
    },
  });
  if (!staff) return { ok: false, error: "staff_not_found" };
  if (staff.userId) return { ok: false, error: "staff_already_linked" };

  const email = staff.email?.trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) return { ok: false, error: "staff_missing_email" };

  const existingUser = await args.tx.user.findUnique({ where: { email } });
  if (existingUser) return { ok: false, error: "email_already_user" };

  const now = new Date();
  const existingInvite = await args.tx.staffInvitation.findFirst({
    where: {
      organizationId: args.organizationId,
      locationId: staff.locationId,
      email,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true },
  });
  if (existingInvite) return { ok: false, error: "invite_already_pending" };

  const rawToken = randomBytes(RAW_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invitation = await args.tx.staffInvitation.create({
    data: {
      organizationId: args.organizationId,
      locationId: staff.locationId,
      staffId: staff.id,
      inviterUserId: args.inviterUserId,
      email,
      name: staff.name,
      role: "STAFF",
      tokenHash,
      expiresAt,
      ipAddressIssued: args.ipAddress ?? null,
      userAgentIssued: args.userAgent ?? null,
    },
    select: { id: true },
  });

  return {
    ok: true,
    rawToken,
    email,
    name: staff.name,
    expiresAt,
    staffInvitationId: invitation.id,
    organizationName: staff.organization.name,
    locationName: staff.location.name,
  };
}
