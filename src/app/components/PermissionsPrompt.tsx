import { useState } from 'react';
import { requestLocalNotificationPermission } from '../utils/localNotifications';

interface PermissionsPromptProps {
  onDone: () => void;
}

export function PermissionsPrompt({ onDone }: PermissionsPromptProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>('');

  const saveAndClose = (permission: string) => {
    localStorage.setItem('bloomcycle_notification_permission', permission);
    localStorage.setItem('bloomcycle_permissions_prompted', 'true');
    window.dispatchEvent(new Event('bloomcycle:notifications-changed'));
    onDone();
  };

  const requestNotificationPermission = async () => {
    try {
      setBusy(true);
      const status = await requestLocalNotificationPermission();
      setResult(status);
      saveAndClose(status);
    } catch {
      saveAndClose('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 220,
        background: 'rgba(17,24,39,0.48)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '340px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '18px',
          boxShadow: '0 18px 46px rgba(0,0,0,0.3)',
          border: '1px solid #F3F4F6',
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: '20px' }}>🔔</p>
        <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 900, color: '#1F2937' }}>
          Permission Setup
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: '13px', lineHeight: 1.5, color: '#6B7280', fontWeight: 600 }}>
          To run fully on your device, the app can request notification permission for period and logging reminders.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            disabled={busy}
            onClick={() => void requestNotificationPermission()}
            style={{
              border: 'none',
              borderRadius: '12px',
              padding: '11px',
              fontSize: '13px',
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.75 : 1,
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {busy ? 'Requesting...' : 'Allow Notifications'}
          </button>

          <button
            disabled={busy}
            onClick={() => saveAndClose('skipped')}
            style={{
              border: '1.5px solid #E5E7EB',
              borderRadius: '12px',
              padding: '11px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#6B7280',
              background: '#ffffff',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Not Now
          </button>
        </div>

        {result && (
          <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>
            Result: {result}
          </p>
        )}
      </div>
    </div>
  );
}
