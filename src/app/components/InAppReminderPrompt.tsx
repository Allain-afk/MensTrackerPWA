import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';
import { useCycle } from '../context/CycleContext';
import {
  getNextInAppReminder,
  markInAppReminderSeen,
} from '../utils/localNotifications';

const IN_APP_REMINDER_TOAST_ID = 'mens-tracker-in-app-reminder';

export function InAppReminderPrompt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { snapshot } = useAppData();
  const { logs, nextPeriodDate, fertileStart } = useCycle();
  const shownReminderId = useRef('');

  useEffect(() => {
    const reminder = getNextInAppReminder({
      currentPath: location.pathname,
      notificationSettings: snapshot.notificationSettings,
      logs,
      nextPeriodDate,
      fertileStart,
    });

    if (!reminder) {
      shownReminderId.current = '';
      return;
    }

    if (shownReminderId.current === reminder.id) {
      return;
    }

    shownReminderId.current = reminder.id;
    markInAppReminderSeen(reminder.id);

    const timer = window.setTimeout(() => {
      toast.custom(
        (instance) => (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              background: '#ffffff',
              border: '1px solid #f5d0fe',
              borderRadius: '18px',
              boxShadow: '0 12px 34px rgba(0, 0, 0, 0.14)',
              padding: '14px 16px',
              fontFamily: "'Nunito', sans-serif",
              minWidth: '300px',
              maxWidth: '340px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: `${reminder.accentColor}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              {reminder.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#1f2937',
                }}
              >
                {reminder.title}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  lineHeight: 1.5,
                }}
              >
                {reminder.body}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '10px',
                }}
              >
                <button
                  onClick={() => {
                    toast.dismiss(instance.id);
                    navigate(reminder.actionPath);
                  }}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    background: reminder.accentColor,
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '9px 12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {reminder.actionLabel}
                </button>
                <button
                  onClick={() => toast.dismiss(instance.id)}
                  style={{
                    borderRadius: '999px',
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '9px 12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        ),
        {
          id: IN_APP_REMINDER_TOAST_ID,
          duration: 10000,
        }
      );
    }, 700);

    return () => window.clearTimeout(timer);
  }, [fertileStart, location.pathname, logs, navigate, nextPeriodDate, snapshot.notificationSettings]);

  return null;
}
