import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { getSigningProgress } from '@/lib/onboarding/agreement-completion';
import AgreementsClient from './agreements-client';

export const dynamic = 'force-dynamic';

export default async function AgreementsAdminPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.organizationId || !session.user.locationId) {
    redirect('/login');
  }
  if (session.user.role !== 'OWNER') {
    redirect('/dashboard');
  }

  const ctx = tenantCtxFromSession({
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name,
    role: session.user.role,
    organizationId: session.user.organizationId,
    locationId: session.user.locationId,
  });

  const progress = await getSigningProgress({
    prisma,
    ctx,
    input: {
      sessionId,
      organizationId: session.user.organizationId,
      locationId: session.user.locationId,
    },
    authenticatedUserId: session.user.id,
  });

  return (
    <main style={{ minHeight: '100vh', background: '#f7f8fa', padding: '32px 0' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          Employment Agreement Status
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          {progress.signedCount} of {progress.total} agreements signed.
        </p>

        <AgreementsClient
          sessionId={sessionId}
          initialProgress={JSON.parse(JSON.stringify(progress))}
        />
      </div>
    </main>
  );
}
