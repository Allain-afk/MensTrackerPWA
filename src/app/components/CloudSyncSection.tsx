import { useState } from 'react';
import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return date.toLocaleString();
}

function statusLabel(status: string, error: string | null): string {
  if (error) return 'Error';
  switch (status) {
    case 'syncing': return 'Syncing…';
    case 'offline': return 'Offline';
    case 'error': return 'Error';
    default: return 'Up to date';
  }
}

export function CloudSyncSection() {
  const { user, ready: authReady, signInWithGoogle, signOut } = useAuth();
  const { status, lastSyncedAt, error, syncNow } = useSync();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');

  const email = user?.email ?? user?.user_metadata?.email ?? '';
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? email;

  const handleSignIn = async () => {
    setMessage('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      setMessage(msg);
      setBusy(false);
    }
    // On success the browser redirects, so no setBusy(false).
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm(
      'Sign out? Your local data on this device will stay. Data already synced remains in the cloud.'
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await signOut();
      setMessage('Signed out. Local data is preserved.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-out failed.';
      setMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSyncNow = async () => {
    setMessage('');
    setBusy(true);
    try {
      await syncNow();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        border: '1px solid #F3F4F6',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div
          style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Cloud size={16} color="#2563EB" aria-hidden="true" />
        </div>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Cloud Sync</h3>
      </div>

      <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#6B7280', fontWeight: 600, lineHeight: 1.5 }}>
        Sign in with Google to back up your cycle data so it can be restored on another device. The app stays
        fully offline-first — local data is never replaced accidentally.
      </p>

      {!authReady ? (
        <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Loading…</p>
      ) : !user ? (
        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1.5px solid #DBEAFE',
            background: 'linear-gradient(135deg, #FFFFFF, #EFF6FF)',
            color: '#1E3A8A',
            fontSize: '13px',
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.13 2.73-2.41 3.58v2.97h3.89c2.28-2.1 3.57-5.19 3.57-8.79z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-2.97c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.1-6.68-4.93H1.3v3.09C3.27 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.32 14.35c-.24-.72-.38-1.48-.38-2.35s.14-1.63.38-2.35V6.56H1.3C.47 8.19 0 10.04 0 12s.47 3.81 1.3 5.44l4.02-3.09z"/>
            <path fill="#EA4335" d="M12 4.74c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.23 0 12 0 7.31 0 3.27 2.7 1.3 6.56l4.02 3.09C6.26 6.84 8.89 4.74 12 4.74z"/>
          </svg>
          Sign in with Google
        </button>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: '14px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '36px', height: '36px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #60A5FA, #818CF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, flexShrink: 0,
              }}
            >
              {(displayName || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName || 'Signed in'}
              </p>
              {email && email !== displayName && (
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #F9FAFB',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {status === 'offline' ? (
                <CloudOff size={14} color="#9CA3AF" aria-hidden="true" />
              ) : (
                <Cloud size={14} color={error ? '#DC2626' : '#10B981'} aria-hidden="true" />
              )}
              <span
                aria-live="polite"
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: error ? '#DC2626' : status === 'offline' ? '#9CA3AF' : '#047857',
                }}
              >
                {statusLabel(status, error)}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>
              Last synced: {formatRelative(lastSyncedAt)}
            </span>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                margin: '0 0 10px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                fontSize: '11px',
                fontWeight: 700,
                color: '#991B1B',
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={busy || status === 'syncing'}
              style={{
                padding: '10px',
                border: '1.5px solid #BFDBFE',
                borderRadius: '12px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontSize: '12px',
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: busy || status === 'syncing' ? 'not-allowed' : 'pointer',
                opacity: busy || status === 'syncing' ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw
                size={13}
                aria-hidden="true"
                style={status === 'syncing' ? { animation: 'sync-spin 0.9s linear infinite' } : undefined}
              />
              Sync now
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              style={{
                padding: '10px',
                border: '1.5px solid #E5E7EB',
                borderRadius: '12px',
                background: '#F9FAFB',
                color: '#374151',
                fontSize: '12px',
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={13} aria-hidden="true" />
              Sign out
            </button>
          </div>
          <style>{`@keyframes sync-spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {message && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: '10px 0 0', fontSize: '11px', color: '#6B7280', fontWeight: 700 }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
