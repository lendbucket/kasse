import { runAllHealthChecks } from '@/lib/health/checks';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const snapshot = await runAllHealthChecks();
  const betterStackUrl = process.env.NEXT_PUBLIC_BETTERSTACK_STATUS_URL;

  return (
    <main style={{
      maxWidth: 720,
      margin: '64px auto',
      padding: '0 24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#111827',
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Kasse Status
      </h1>
      <p style={{ color: '#606E74', marginBottom: 32 }}>
        Real-time view of Kasse platform health. For incident history and
        notifications, visit our status page.
      </p>

      {/* Overall status banner */}
      <div style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: snapshot.ok ? '#f0fdf4' : '#fef2f2',
        marginBottom: 24,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontWeight: 600,
        }}>
          <span style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: snapshot.ok ? '#22c55e' : '#ef4444',
          }} />
          {snapshot.ok ? 'All systems operational' : 'One or more checks are failing'}
        </div>
        <div style={{ fontSize: 12, color: '#606E74', marginTop: 8 }}>
          Last checked {snapshot.timestamp}
        </div>
      </div>

      {/* Per-check breakdown */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
        Components
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {snapshot.checks.map(check => (
          <li
            key={check.name}
            style={{
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ textTransform: 'capitalize' }}>
              {check.name.replace(/_/g, ' ')}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              color: check.ok ? '#22c55e' : '#ef4444',
              fontWeight: 500,
            }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'currentColor',
              }} />
              {check.ok ? 'Operational' : 'Issue detected'}
            </span>
          </li>
        ))}
      </ul>

      {/* BetterStack embed */}
      {betterStackUrl && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>
            Uptime History
          </h2>
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fafafa',
            padding: 16,
            textAlign: 'center',
          }}>
            <p style={{ marginBottom: 16, color: '#606E74' }}>
              For 90-day uptime history, incident reports, and email subscriptions:
            </p>
            <a
              href={betterStackUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#111827',
                color: '#ffffff',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              View full status page
            </a>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid #e5e7eb',
        fontSize: 14,
        color: '#606E74',
        textAlign: 'center',
      }}>
        Report an issue: <a href="mailto:support@kasseapp.com" style={{ color: '#606E74' }}>support@kasseapp.com</a>
      </div>
    </main>
  );
}
