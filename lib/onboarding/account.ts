import { hash } from 'bcryptjs';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { transitionTo, getSessionById } from './sessions';
import { OnboardingError } from './types';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';

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
 * 3. Link session.userId = newUser.id, null session.passwordHash
 *    (User row is the sole owner of the credential after this point)
 * 4. Transition session to ACCOUNT_CREATED
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

  // Create user and update session in a transaction
  const user = await prismaAdmin.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: session.email,
        password: passwordHash,
        emailVerified: session.emailVerifiedAt ?? new Date(),
        role: 'OWNER',
      },
    });

    await tx.onboardingSession.update({
      where: { id: args.sessionId },
      data: {
        passwordHash: null,  // User row owns the credential now; null here
                             // so we don't hold a duplicate bcrypt hash
        userId: newUser.id,
      },
    });

    return newUser;
  });

  // Transition state outside the transaction (writes audit log)
  await transitionTo({
    sessionId: args.sessionId,
    toState: 'ACCOUNT_CREATED',
    triggeredByUserId: user.id,
    metadata: { userId: user.id },
  });

  await writeAuditLog({
    userId: user.id,
    organizationId: null,
    action: AuditAction.USER_CREATED,
    entity: 'User',
    entityId: user.id,
    metadata: {
      via: 'onboarding',
      sessionId: args.sessionId,
    },
  });

  return { userId: user.id };
}
