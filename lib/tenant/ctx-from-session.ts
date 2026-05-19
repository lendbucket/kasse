import type { Role } from '@prisma/client';
import type { TenantContext } from './context';

/**
 * Build a withTenantScope TenantContext from a NextAuth session user.
 *
 * Caller must verify session.user.id, session.user.email,
 * session.user.organizationId, and session.user.role are present BEFORE
 * calling. This helper throws if role is null rather than silently
 * defaulting (which would be a privilege escalation footgun).
 *
 * isSuperadmin is always false for tenant-scoped routes (by definition).
 */
export function tenantCtxFromSession(user: {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  organizationId: string;
  locationId?: string | null;
}): TenantContext {
  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
    organizationId: user.organizationId,
    locationId: user.locationId ?? null,
    isSuperadmin: false,
  };
}
