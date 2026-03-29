import { useEffect, useRef } from 'react';
import { useCycle } from '../context/CycleContext';
import { syncScheduledNotifications } from '../utils/localNotifications';

export function NotificationSync() {
  const { nextPeriodDate, fertileStart } = useCycle();
  const lastSignature = useRef<string>('');

  useEffect(() => {
    const runSync = async () => {
      const signature = JSON.stringify({
        nextPeriodDate: nextPeriodDate?.toISOString() ?? null,
        fertileStart: fertileStart?.toISOString() ?? null,
      });

      if (signature === lastSignature.current) return;
      lastSignature.current = signature;

      try {
        await syncScheduledNotifications({ nextPeriodDate, fertileStart });
      } catch {
        // Keep app flow resilient even if scheduling fails on a device.
      }
    };

    void runSync();
  }, [nextPeriodDate, fertileStart]);

  useEffect(() => {
    const onSettingsChanged = () => {
      void syncScheduledNotifications({ nextPeriodDate, fertileStart });
    };

    window.addEventListener('bloomcycle:notifications-changed', onSettingsChanged);
    return () => window.removeEventListener('bloomcycle:notifications-changed', onSettingsChanged);
  }, [nextPeriodDate, fertileStart]);

  return null;
}
