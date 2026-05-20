import { randomBytes, createHash } from 'crypto';
import { hash } from 'bcryptjs';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import { validatePassword } from './account';
import type { Prisma } from '@prisma/client';

const RAW_TOKEN_BYTES = 32;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BCRYPT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Create a staff invitation during onboarding. The owner invites a stylist
 * by email, or skips the step entirely.
 *
 * Accepts a tenant-scoped transaction client (tx) from withTenantScope for
 * Staff.create + StaffInvitation.create (RLS-enforced tenant isolation).
 * OnboardingSession state writes happen in the CALLER (route handler) AFTER
 * withTenantScope returns, so the Staff/StaffInvitation rows are committed
 * and visible on the prismaAdmin connection that sessions.ts helpers use.
 */
export async function createStaffInvitation(args: {
  tx: Prisma.TransactionClient;
  input: {
    sessionId: string;
    organizationId: string;
    locationId: string;
    skip?: boolean;
    email?: string;
    name?: string;
  };
  authenticatedUserId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{
  staffInvitationId: string | null;
  staffId: string | null;
  rawToken: string | null;
  email: string | null;
  name: string | null;
  expiresAt: Date | null;
  organizationName: string;
  locationName: string;
  skipped: boolean;
  organizationId: string;
}> {
  // Pre-tx fast-fail checks via prismaAdmin (getSessionById uses prismaAdmin).
  const session = await getSessionById(args.input.sessionId);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', 'session not found');
  }
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session does not belong to authenticated user');
  }
  if (session.organizationId === null) {
    throw new OnboardingError(
      'ORG_NOT_YET_CREATED',
      'organization must be created before inviting staff'
    );
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session organization does not match the input organization');
  }
  if (session.locationId === null) {
    throw new OnboardingError(
      'LOCATION_NOT_YET_CREATED',
      'location must be created before inviting staff'
    );
  }
  if (session.state !== 'SERVICES_SEEDED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot invite staff from state '${session.state}' — must be SERVICES_SEEDED`
    );
  }

  // Validate email + name if not skipping
  if (!args.input.skip) {
    if (!args.input.email) {
      throw new OnboardingError('INVITE_EMAIL_REQUIRED', 'email is required to invite a stylist');
    }
    if (!EMAIL_PATTERN.test(args.input.email)) {
      throw new OnboardingError('INVALID_EMAIL', `'${args.input.email}' is not a valid email`);
    }
    if (!args.input.name || !args.input.name.trim()) {
      throw new OnboardingError('INVITE_NAME_REQUIRED', 'name is required to invite a stylist');
    }

    // Check if a User already exists with this email
    const existingUser = await args.tx.user.findUnique({
      where: { email: args.input.email.trim().toLowerCase() },
    });
    if (existingUser) {
      throw new OnboardingError(
        'INVITE_EMAIL_ALREADY_USER',
        'a user with this email already exists'
      );
    }

    // Check for existing pending invitation at this org+location
    const existingInvite = await args.tx.staffInvitation.findFirst({
      where: {
        organizationId: args.input.organizationId,
        locationId: args.input.locationId,
        email: args.input.email.trim().toLowerCase(),
        acceptedAt: null,
        revokedAt: null,
      },
    });
    if (existingInvite) {
      throw new OnboardingError(
        'INVITE_ALREADY_EXISTS',
        'a pending invitation already exists for this email at this location'
      );
    }
  }

  // Read org + location names via tx (RLS-enforced). Used for the
  // email template. Reading inside the tx keeps the dual-client pattern
  // consistent and avoids two extra prismaAdmin round-trips in the route
  // handler.
  const [org, location] = await Promise.all([
    args.tx.organization.findUnique({
      where: { id: args.input.organizationId },
      select: { name: true },
    }),
    args.tx.location.findUnique({
      where: { id: args.input.locationId },
      select: { name: true },
    }),
  ]);

  if (!org) {
    throw new OnboardingError(
      'ORG_NOT_YET_CREATED',
      `organization ${args.input.organizationId} not found`
    );
  }
  if (!location) {
    throw new OnboardingError(
      'LOCATION_NOT_YET_CREATED',
      `location ${args.input.locationId} not found`
    );
  }

  const organizationName = org.name;
  const locationName = location.name;

  // Atomic claim via state transition. Same pattern as SERVICES_PENDING in
  // createServicesForOnboarding. Concurrent POSTs both try this UPDATE;
  // Postgres row-level lock serializes them. The first transitions
  // SERVICES_SEEDED → STAFF_PENDING (count=1). The second sees
  // state='STAFF_PENDING', WHERE fails, count=0 → throws.
  const claim = await prismaAdmin.onboardingSession.updateMany({
    where: {
      id: args.input.sessionId,
      state: 'SERVICES_SEEDED',
      userId: args.authenticatedUserId,
      organizationId: args.input.organizationId,
      locationId: { not: null },
    },
    data: {
      state: 'STAFF_PENDING',
    },
  });

  if (claim.count === 0) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      'session is no longer eligible for staff invitation — concurrent call or state has advanced'
    );
  }

  // Skip path: return early with no staff/invitation created.
  // Route handler will transitionTo STAFF_INVITED + record skip.
  if (args.input.skip) {
    return {
      staffInvitationId: null,
      staffId: null,
      rawToken: null,
      email: null,
      name: null,
      expiresAt: null,
      organizationName,
      locationName,
      skipped: true,
      organizationId: args.input.organizationId,
    };
  }

  const normalizedEmail = args.input.email!.trim().toLowerCase();
  const normalizedName = args.input.name!.trim();

  // Create Staff row (userId=null — not yet linked to a User account)
  const staff = await args.tx.staff.create({
    data: {
      organizationId: args.input.organizationId,
      locationId: args.input.locationId,
      name: normalizedName,
      email: normalizedEmail,
      role: 'stylist',
      // commissionRate is stored as PERCENT (e.g., 40 = 40% to the stylist).
      // Default of 40% matches the Staff schema default and is a common
      // starting point for new salon stylists. Owner can adjust per-stylist
      // later via the staff settings UI (P1.A.7+).
      commissionRate: 40,
      isActive: false, // Activated on invite acceptance
    },
  });

  // Generate invite token (hashed at rest, raw returned for email)
  const rawToken = randomBytes(RAW_TOKEN_BYTES).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invitation = await args.tx.staffInvitation.create({
    data: {
      organizationId: args.input.organizationId,
      locationId: args.input.locationId,
      staffId: staff.id,
      inviterUserId: args.authenticatedUserId,
      email: normalizedEmail,
      name: normalizedName,
      role: 'STAFF',   // Hardcoded; only STAFF is valid for staff invitations
      tokenHash,
      expiresAt,
      ipAddressIssued: args.ipAddress ?? null,
      userAgentIssued: args.userAgent ?? null,
    },
  });

  return {
    staffInvitationId: invitation.id,
    staffId: staff.id,
    rawToken,
    email: normalizedEmail,
    name: normalizedName,
    expiresAt,
    organizationName,
    locationName,
    skipped: false,
    organizationId: args.input.organizationId,
  };
}

/**
 * Accept a staff invitation. Public/unauthenticated — the invitee has no
 * User account yet. Uses prismaAdmin directly (no tenant scope — the
 * invitee doesn't have session context).
 *
 * 1. Atomically consume the token (updateMany WHERE tokenHash + not consumed)
 * 2. Create User row with the invitee's email + password
 * 3. Link Staff.userId = newUser.id, activate staff
 * 4. Record acceptedUserId on the invitation
 *
 * Atomicity gap: spans User/Staff/StaffInvitation writes on prismaAdmin
 * without a single transaction. Same #95 territory as all other onboarding
 * flows. If any step fails after token consumption, the invitation is
 * marked consumed but the User/Staff link is incomplete. Recovery requires
 * SUPERADMIN intervention.
 */
export async function acceptStaffInvitation(args: {
  rawToken: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{
  userId: string;
  staffId: string;
  organizationId: string;
  locationId: string;
  email: string;
}> {
  // Validate password before doing anything
  const passwordError = validatePassword(args.password);
  if (passwordError) {
    throw new OnboardingError('PASSWORD_TOO_WEAK', passwordError);
  }

  const tokenHash = hashToken(args.rawToken);
  const now = new Date();

  // 1. Atomic token consumption via updateMany
  const consume = await prismaAdmin.staffInvitation.updateMany({
    where: {
      tokenHash,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      acceptedAt: now,
      ipAddressAccepted: args.ipAddress ?? null,
      userAgentAccepted: args.userAgent ?? null,
    },
  });

  if (consume.count === 0) {
    // Re-fetch to distinguish which condition failed
    const existing = await prismaAdmin.staffInvitation.findUnique({
      where: { tokenHash },
    });
    if (!existing) {
      throw new OnboardingError('INVITE_NOT_FOUND', 'no matching invitation token');
    }
    if (existing.acceptedAt) {
      throw new OnboardingError('INVITE_ALREADY_ACCEPTED', 'invitation has already been accepted');
    }
    if (existing.revokedAt) {
      throw new OnboardingError('INVITE_EXPIRED', 'invitation has been revoked');
    }
    if (existing.expiresAt < now) {
      throw new OnboardingError('INVITE_EXPIRED', 'invitation has expired');
    }
    // Race: concurrent accept consumed the token
    throw new OnboardingError('INVITE_ALREADY_ACCEPTED', 'invitation consumed by concurrent request');
  }

  // 2. Read back the consumed invitation.
  // Note: the updateMany consume above locked the row atomically. The
  // theoretical window between consume and this re-read is microseconds
  // and only exploitable by SUPERADMIN actively racing the request.
  // The whole-row read is consistent because Postgres MVCC + the unique
  // constraint on tokenHash guarantee the row identity hasn't changed.
  const invitation = await prismaAdmin.staffInvitation.findUnique({
    where: { tokenHash },
  });
  if (!invitation) {
    throw new OnboardingError('INVITE_NOT_FOUND', 'consumed invitation not found on re-read');
  }

  // 3. Check for existing user with this email (defense against race between
  // invite-send and accept where someone else registered with that email)
  const existingUser = await prismaAdmin.user.findUnique({
    where: { email: invitation.email },
  });
  if (existingUser) {
    throw new OnboardingError(
      'INVITE_EMAIL_ALREADY_USER',
      'a user with this email already exists'
    );
  }

  // 4. Hash password and create User
  const passwordHash = await hash(args.password, BCRYPT_ROUNDS);

  const newUser = await prismaAdmin.user.create({
    data: {
      email: invitation.email,
      name: invitation.name,
      password: passwordHash,
      emailVerified: now, // Auto-verified by virtue of clicking the invite link
      role: 'STAFF',
      organizationId: invitation.organizationId,
      locationId: invitation.locationId,
    },
  });

  // Staff claim — defense-in-depth. Token consume above already serialized
  // this flow (only one caller per token). This claim can only fail if the
  // Staff row was linked via a code path that doesn't go through this
  // function (SUPERADMIN intervention, future bugs in other helpers). If
  // it fails, the User row created above is orphaned.
  //
  // Recovery (SUPERADMIN, executed via psql or Supabase SQL editor):
  //
  //   -- Identify orphan: User created with role=STAFF whose Staff row's
  //   -- userId points to a DIFFERENT User (or no Staff at all).
  //   SELECT u.id, u.email, u."organizationId", u."createdAt"
  //   FROM "User" u
  //   LEFT JOIN "Staff" s ON s."userId" = u.id
  //   WHERE u.role = 'STAFF'
  //     AND s.id IS NULL
  //     AND u."createdAt" > NOW() - INTERVAL '7 days';
  //
  //   -- Delete the orphan User row (no Staff/Org/etc dependencies because
  //   -- the orphan never got linked). Verify the row matches expectations
  //   -- before running.
  //   DELETE FROM "User" WHERE id = '<orphan-user-id>';
  //
  // Tracked in #95 (withAdminTx would let us wrap all 3 writes in one
  // transaction, eliminating this gap entirely + auto-rollback).
  const staffLink = await prismaAdmin.staff.updateMany({
    where: {
      id: invitation.staffId,
      userId: null, // Defense against double-accept
    },
    data: {
      userId: newUser.id,
      isActive: true,
    },
  });

  if (staffLink.count === 0) {
    // Staff already linked — concurrent accept race. The User row we just
    // created is orphaned. Recovery is manual (#95 territory).
    console.error('[ORPHAN_USER] acceptStaffInvitation: Staff link failed after User created', {
      userId: newUser.id,
      staffId: invitation.staffId,
      invitationId: invitation.id,
      organizationId: invitation.organizationId,
      timestamp: new Date().toISOString(),
    });
    throw new OnboardingError(
      'INVITE_ALREADY_ACCEPTED',
      'staff record already linked to a user — concurrent accept race'
    );
  }

  // 5. Record acceptedUserId on the invitation
  await prismaAdmin.staffInvitation.update({
    where: { id: invitation.id },
    data: { acceptedUserId: newUser.id },
  });

  return {
    userId: newUser.id,
    staffId: invitation.staffId,
    organizationId: invitation.organizationId,
    locationId: invitation.locationId,
    email: invitation.email,
  };
}
