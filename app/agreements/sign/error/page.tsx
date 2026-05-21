const REASON_MESSAGES: Record<string, { title: string; body: string }> = {
  invalid: {
    title: 'This link is not valid',
    body: 'The signing link in your email could not be found. If you believe this is an error, please contact the person who sent you this agreement.',
  },
  consumed: {
    title: 'Already signed',
    body: 'This agreement has already been signed. If you need a copy, please contact the person who sent it to you.',
  },
  expired: {
    title: 'Link expired',
    body: 'This signing link has expired. Signing links are valid for 7 days. Please ask the person who sent you the agreement to re-send it.',
  },
};

export default async function SignErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = REASON_MESSAGES[reason ?? ''] ?? REASON_MESSAGES.invalid;

  return (
    <main style={{ minHeight: '100vh', background: '#f7f8fa', padding: '48px 0' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>
            {message.title}
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            {message.body}
          </p>
        </div>
      </div>
    </main>
  );
}
