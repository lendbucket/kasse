import { Prisma } from '@prisma/client';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { withAdminTx } from '@/lib/admin/withAdminTx';
import { writeAuditLog, auditLogCreateOp, AuditAction } from '@/lib/audit/write';
import {
  type OnboardingState,
  type OnboardingSessionRecord,
  type OnboardingVertical,
  ALLOWED_TRANSITIONS,
  SKIPPABLE_STATES,
  OnboardingError,
} from './types';

const DEFAULT_SESSION_TTL_DAYS = 30;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Get or create an onboarding session for a given email. If an active session
 * exists for the email, returns it. Otherwise creates one in STARTED state.
 *
 * The create path uses withAdminTx to atomically write the session, the
 * initial state transition record, and the audit log entry. If any of the
 * three fails, all roll back.
 */
export async function getOrCreateSession(args: {
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}): Promise<OnboardingSessionRecord> {
  const email = args.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new OnboardingError('INVALID_EMAIL', `'${email}' is not a valid email`);
  }

  const existing = await prismaAdmin.onboardingSession.findFirst({
    where: {
      email,
      state: { notIn: ['COMPLETED'] },
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return existing as unknown as OnboardingSessionRecord;
  }

  const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Client-side ID so we can reference it across all three batch
  // operations without needing the result of the first.
  const sessionId = crypto.randomUUID();

  try {
    const [created] = await withAdminTx((p) => [
      p.onboardingSession.create({
        data: {
          id: sessionId,
          email,
          state: 'STARTED',
          data: {},
          skippedSteps: [],
          expiresAt,
          ipAddressFirstSeen: args.ipAddress ?? null,
          userAgentFirstSeen: args.userAgent ?? null,
          referrerFirstSeen: args.referrer ?? null,
        },
      }),
      p.onboardingStateTransition.create({
        data: {
          sessionId,
          fromState: 'NEW',
          toState: 'STARTED',
          metadata: {
            email,
            ipAddress: args.ipAddress,
            userAgent: args.userAgent,
            referrer: args.referrer,
          },
        },
      }),
      auditLogCreateOp(p, {
        userId: null,
        organizationId: null,
        action: AuditAction.ONBOARDING_SESSION_CREATED,
        entity: 'OnboardingSession',
        entityId: sessionId,
        metadata: { email },
      }),
    ]);

    return created as unknown as OnboardingSessionRecord;
  } catch (err) {
    // P2002 = unique constraint violation. Concurrent signup for same email
    // raced us — the other request won. Re-find and return the existing
    // session so this function stays idempotent.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const raced = await prismaAdmin.onboardingSession.findFirst({
        where: {
          email,
          state: { notIn: ['COMPLETED'] },
          expiresAt: { gt: new Date() },
        },
      });
      if (raced) return raced as unknown as OnboardingSessionRecord;
    }
    throw err;
  }
}

export async function getSessionById(sessionId: string): Promise<OnboardingSessionRecord | null> {
  const session = await prismaAdmin.onboardingSession.findUnique({
    where: { id: sessionId },
  });
  return session as unknown as OnboardingSessionRecord | null;
}

export async function getSessionByEmail(email: string): Promise<OnboardingSessionRecord | null> {
  const normalized = email.trim().toLowerCase();
  const session = await prismaAdmin.onboardingSession.findFirst({
    where: {
      email: normalized,
      state: { notIn: ['COMPLETED'] },
      expiresAt: { gt: new Date() },
    },
  });
  return session as unknown as OnboardingSessionRecord | null;
}

/**
 * Transition a session forward. Validates against ALLOWED_TRANSITIONS —
 * throws OnboardingError('INVALID_TRANSITION') on any disallowed move.
 *
 * Uses withAdminTx to atomically write the session update, state transition
 * record, and audit log entry. If any of the three fails, all roll back.
 */
export async function transitionTo(args: {
  sessionId: string;
  toState: OnboardingState;
  triggeredByUserId?: string | null;
  dataPatch?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<OnboardingSessionRecord> {
  const session = await prismaAdmin.onboardingSession.findUnique({
    where: { id: args.sessionId },
  });
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', `session ${args.sessionId} not found`);
  }
  if (session.expiresAt < new Date()) {
    throw new OnboardingError('SESSION_EXPIRED', `session expired at ${session.expiresAt.toISOString()}`);
  }
  if (session.state === 'COMPLETED') {
    throw new OnboardingError('SESSION_COMPLETED', 'session already completed');
  }

  const expectedNext = ALLOWED_TRANSITIONS[session.state as OnboardingState];
  if (expectedNext !== args.toState) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot transition from '${session.state}' to '${args.toState}' — expected '${expectedNext}'`
    );
  }

  const mergedData = args.dataPatch
    ? { ...(session.data as Record<string, unknown>), ...args.dataPatch }
    : session.data;

  const auditAction = args.toState === 'COMPLETED'
    ? AuditAction.ONBOARDING_SESSION_COMPLETED
    : AuditAction.ONBOARDING_SESSION_TRANSITIONED;

  const [updated] = await withAdminTx((p) => [
    p.onboardingSession.update({
      where: { id: args.sessionId },
      data: {
        state: args.toState,
        data: mergedData as any,
        ...(args.toState === 'EMAIL_VERIFIED' ? { emailVerifiedAt: new Date() } : {}),
        ...(args.toState === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    }),
    p.onboardingStateTransition.create({
      data: {
        sessionId: args.sessionId,
        fromState: session.state,
        toState: args.toState,
        triggeredByUserId: args.triggeredByUserId ?? null,
        metadata: args.metadata ?? {},
      },
    }),
    auditLogCreateOp(p, {
      userId: args.triggeredByUserId ?? null,
      organizationId: session.organizationId,
      action: auditAction,
      entity: 'OnboardingSession',
      entityId: args.sessionId,
      before: { state: session.state },
      after: { state: args.toState },
      changedFields: ['state'],
    }),
  ]);

  return updated as unknown as OnboardingSessionRecord;
}

/**
 * Mark a step as skipped. Only allowed for steps in SKIPPABLE_STATES.
 * Skipping advances the state forward.
 *
 * Uses withAdminTx to atomically write the session update, state transition
 * record, and audit log entry.
 */
export async function skipStep(args: {
  sessionId: string;
  step: OnboardingState;
  triggeredByUserId?: string | null;
}): Promise<OnboardingSessionRecord> {
  if (!SKIPPABLE_STATES.has(args.step)) {
    throw new OnboardingError(
      'STEP_NOT_SKIPPABLE',
      `step '${args.step}' is required and cannot be skipped`
    );
  }

  const session = await prismaAdmin.onboardingSession.findUnique({
    where: { id: args.sessionId },
  });
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', `session ${args.sessionId} not found`);
  }

  if (session.state !== args.step) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `can only skip the current state; session is at '${session.state}', tried to skip '${args.step}'`
    );
  }

  const next = ALLOWED_TRANSITIONS[args.step];
  if (!next) {
    throw new OnboardingError('INVALID_TRANSITION', `no next state from '${args.step}'`);
  }

  const newSkipped = [...session.skippedSteps, args.step];

  const [updated] = await withAdminTx((p) => [
    p.onboardingSession.update({
      where: { id: args.sessionId },
      data: {
        state: next,
        skippedSteps: newSkipped,
      },
    }),
    p.onboardingStateTransition.create({
      data: {
        sessionId: args.sessionId,
        fromState: session.state,
        toState: next,
        triggeredByUserId: args.triggeredByUserId ?? null,
        metadata: { skipped: true },
      },
    }),
    auditLogCreateOp(p, {
      userId: args.triggeredByUserId ?? null,
      organizationId: session.organizationId,
      action: AuditAction.ONBOARDING_SESSION_SKIPPED_STEP,
      entity: 'OnboardingSession',
      entityId: args.sessionId,
      before: { state: session.state },
      after: { state: next, skippedSteps: newSkipped },
      changedFields: ['state', 'skippedSteps'],
      metadata: { skippedStep: args.step },
    }),
  ]);

  return updated as unknown as OnboardingSessionRecord;
}

/**
 * Patch the data column without changing state.
 */
export async function patchData(args: {
  sessionId: string;
  patch: Record<string, unknown>;
}): Promise<OnboardingSessionRecord> {
  const session = await prismaAdmin.onboardingSession.findUnique({
    where: { id: args.sessionId },
  });
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', `session ${args.sessionId} not found`);
  }
  if (session.expiresAt < new Date()) {
    throw new OnboardingError('SESSION_EXPIRED', `session expired at ${session.expiresAt.toISOString()}`);
  }
  if (session.state === 'COMPLETED') {
    throw new OnboardingError('SESSION_COMPLETED', 'session already completed');
  }

  const merged = { ...(session.data as Record<string, unknown>), ...args.patch };

  const updated = await prismaAdmin.onboardingSession.update({
    where: { id: args.sessionId },
    data: { data: merged as any },
  });
  return updated as unknown as OnboardingSessionRecord;
}

/**
 * Attach userId / organizationId / locationId / vertical to a session as
 * those rows get created during later P1 steps.
 */
export async function linkResource(args: {
  sessionId: string;
  userId?: string;
  organizationId?: string;
  locationId?: string;
  vertical?: OnboardingVertical;
}): Promise<OnboardingSessionRecord> {
  const updated = await prismaAdmin.onboardingSession.update({
    where: { id: args.sessionId },
    data: {
      ...(args.userId !== undefined ? { userId: args.userId } : {}),
      ...(args.organizationId !== undefined ? { organizationId: args.organizationId } : {}),
      ...(args.locationId !== undefined ? { locationId: args.locationId } : {}),
      ...(args.vertical !== undefined ? { vertical: args.vertical } : {}),
    },
  });
  return updated as unknown as OnboardingSessionRecord;
}
