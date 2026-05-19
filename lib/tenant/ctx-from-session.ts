import { Role } from '@prisma/client';
import type { TenantContext } from './context';

/**
 * Build a withTenantScope TenantContext from a NextAuth session user.
 *
 * Caller must verify session.user.id, session.user.email, and
 * session.user.organizationId are present BEFORE calling — this helper
 * asserts them but doesn't return error responses. Routes should fail
 * with appropriate 401/409 responses upstream.
 *
 * isSuperadmin is always false for tenant-scoped routes (by definition).
 */
export function tenantCtxFromSession(user: {
  id: string;
  email: string;
  name?: string | null;
  role?: Role | null;
  organizationId: string;
  locationId?: string | null;
}): TenantContext {
  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role ?? Role.OWNER,
    organizationId: user.organizationId,
    locationId: user.locationId ?? null,
    isSuperadmin: false,
  };
}
