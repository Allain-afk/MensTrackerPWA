import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        margin: '8px 12px 0',
        padding: '8px 14px',
        background: 'rgba(31, 41, 55, 0.94)',
        color: 'white',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: "'Nunito', sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
      }}
    >
      <WifiOff size={14} aria-hidden="true" />
      You're offline — data saves locally
    </div>
  );
}
