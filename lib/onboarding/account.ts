import { hash } from 'bcryptjs';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { withAdminTx } from '@/lib/admin/withAdminTx';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import { auditLogCreateOp, AuditAction } from '@/lib/audit/write';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;

/**
 * Validate password strength. Returns null on success or a reason string.
 * v1 policy: minimum 12 chars, requires letters + numbers (or special chars).
 */
export function validatePassword(password: string): string | null {
  if (typeof password !== 'string') return 'password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > 200) {
    return 'password is too long (max 200 chars)';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'password must contain at least one letter';
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return 'password must contain at least one number or special character';
  }
  return null;
}

/**
 * After EMAIL_VERIFIED, owner submits a password. We:
 * 1. Hash password (bcrypt 12 rounds)
 * 2. Create the User row (email + passwordHash)
 * 3. Link session.userId = newUser.id, null session.passwordHash,
 *    advance state to ACCOUNT_CREATED
 * 4. Create state transition record
 * 5. Write audit log
 *
 * All writes are atomic via withAdminTx. If any operation fails, all
 * roll back — fixing the pre-existing SEVERE bug where User row could
 * persist with no session linkage if session.update failed.
 *
 * Uses client-side ID generation (crypto.randomUUID()) so the User ID
 * is known at batch build time — the batch form doesn't expose
 * intermediate results.
 *
 * Returns the created user ID.
 */
export async function createAccount(args: {
  sessionId: string;
  password: string;
}): Promise<{ userId: string }> {
  const validation = validatePassword(args.password);
  if (validation) {
    throw new OnboardingError('PASSWORD_TOO_WEAK', validation);
  }

  const session = await getSessionById(args.sessionId);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', `session ${args.sessionId} not found`);
  }
  if (session.expiresAt < new Date()) {
    throw new OnboardingError('SESSION_EXPIRED', `session expired at ${session.expiresAt.toISOString()}`);
  }
  if (session.state === 'COMPLETED') {
    throw new OnboardingError('SESSION_COMPLETED', 'session already completed');
  }
  if (session.state !== 'EMAIL_VERIFIED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot create account from state '${session.state}' — must be EMAIL_VERIFIED`
    );
  }

  // Check for existing User with this email (defensive — should be impossible
  // since we're at EMAIL_VERIFIED of a fresh session, but be paranoid)
  const existing = await prismaAdmin.user.findUnique({
    where: { email: session.email },
  });
  if (existing) {
    throw new OnboardingError(
      'EMAIL_ALREADY_REGISTERED',
      'a user with this email already exists'
    );
  }

  const passwordHash = await hash(args.password, BCRYPT_ROUNDS);

  // Client-side ID so all batch operations can reference it without
  // needing the result of user.create.
  const userId = crypto.randomUUID();

  const [user] = await withAdminTx((p) => [
    p.user.create({
      data: {
        id: userId,
        email: session.email,
        password: passwordHash,
        emailVerified: session.emailVerifiedAt ?? new Date(),
        role: 'OWNER',
      },
    }),
    p.onboardingSession.update({
      where: { id: args.sessionId },
      data: {
        passwordHash: null,
        userId,
        state: 'ACCOUNT_CREATED',
      },
    }),
    p.onboardingStateTransition.create({
      data: {
        sessionId: args.sessionId,
        fromState: session.state,  // guaranteed 'EMAIL_VERIFIED' by guards above
        toState: 'ACCOUNT_CREATED',
        triggeredByUserId: userId,
        metadata: { userId },
      },
    }),
    auditLogCreateOp(p, {
      userId,
      organizationId: null,
      action: AuditAction.USER_CREATED,
      entity: 'User',
      entityId: userId,
      metadata: { via: 'onboarding', sessionId: args.sessionId },
    }),
  ]);

  return { userId: user.id };
}
