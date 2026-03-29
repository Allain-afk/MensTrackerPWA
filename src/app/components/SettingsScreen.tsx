import { useState } from 'react';
import {
  Bell,
  Lock,
  ChevronRight,
  Heart,
  RefreshCw,
  Droplets,
  Moon,
  Shield,
  Trash2,
  HelpCircle,
  Star,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useUser } from '../context/UserContext';
import { useCycle } from '../context/CycleContext';
import { resetAllData } from '../data/store';
import { APP_COPY, withAppName } from '../config/appCopy';
import { createEncryptedBackup, downloadBackupFile, restoreEncryptedBackup } from '../utils/offlineBackup';
import { generateCsvExport, downloadCsvFile } from '../utils/offlineExportCsv';
import {
  WEB_NOTIFICATION_SUPPORT_MESSAGE,
  type NotificationSettings,
} from '../utils/localNotifications';

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  color?: string;
  disabled?: boolean;
}

function Toggle({ on, onToggle, color = '#8B5CF6', disabled = false }: ToggleProps) {
  return (
    <button
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: '44px',
        height: '26px',
        borderRadius: '999px',
        background: on ? color : '#D1D5DB',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease',
        flexShrink: 0,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: on ? '21px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

export function SettingsScreen() {
  const { name, setName, initials } = useUser();
  const { snapshot, setNotificationPreferences, updatePreferences, reload } = useAppData();
  const { settings, updateSettings, periodStarts, logs } = useCycle();

  const cycleLength = settings.cycleLength;
  const periodLength = settings.periodLength;
  const useAdaptivePredictions = settings.useAdaptivePredictions;
  const perimenopauseMode = settings.perimenopauseMode;
  const trackedCycles = periodStarts.length;
  const trackedDays = Object.keys(logs).length;
  const setCycleLength = (v: number) => updateSettings({ cycleLength: v });
  const setPeriodLength = (v: number) => updateSettings({ periodLength: v });

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const notifications: NotificationSettings = snapshot.notificationSettings;
  const appLockEnabled = snapshot.preferences.appLockEnabled;
  const [statusMessage, setStatusMessage] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length >= 2) {
      setName(trimmed);
    } else {
      setNameInput(name);
    }
    setEditingName(false);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotificationPreferences(next);
  };

  const handlePrivacyInfo = () => {
    const message = APP_COPY.privacyMessage;
    setStatusMessage('Privacy details shown.');
    window.alert(message);
  };

  const handleAppLock = () => {
    const next = !appLockEnabled;
    updatePreferences({ appLockEnabled: next });
    setStatusMessage(next ? 'App Lock enabled.' : 'App Lock disabled.');
  };

  const handleHelp = () => {
    const message = `Need help?\n\n${APP_COPY.settingsHelpSteps
      .map((step, i) => `${i + 1}. ${step}`)
      .join('\n')}\n\nSupport: ${APP_COPY.supportEmail}`;
    setStatusMessage('Help opened.');
    window.alert(message);
  };

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      'Delete all local data? This removes your name, logs, cycle settings, and notification preferences. This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await resetAllData();
      await reload();
      setStatusMessage('All data deleted. Restarting app...');
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete local data.';
      setStatusMessage(message);
    }
  };

  const handleExportBackup = async () => {
    const passphrase = window.prompt('Create a backup passphrase (min 6 chars):');
    if (!passphrase) return;

    try {
      setBackupBusy(true);
      const content = await createEncryptedBackup(passphrase);
      downloadBackupFile(content);
      setStatusMessage('Encrypted backup exported. Keep the passphrase safe.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup export failed.';
      setStatusMessage(message);
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportBackup = async (file: File | null) => {
    if (!file) return;
    const passphrase = window.prompt('Enter your backup passphrase:');
    if (!passphrase) return;

    try {
      setBackupBusy(true);
      const text = await file.text();
      await restoreEncryptedBackup(text, passphrase);
      await reload();
      setStatusMessage('Backup restored. Restarting app...');
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup import failed.';
      setStatusMessage(message);
    } finally {
      setBackupBusy(false);
    }
  };

  const handleExportCsv = () => {
    try {
      const csv = generateCsvExport(logs);
      downloadCsvFile(csv);
      setStatusMessage('Health report exported as CSV. Open it in any spreadsheet app.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'CSV export failed.';
      setStatusMessage(message);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: '#FAFAFA', fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 100%)',
          padding: '8px 20px 20px',
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
          Settings ⚙️
        </h1>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {statusMessage && (
          <div
            style={{
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: '12px',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#6D28D9',
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Profile Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%)',
            borderRadius: '20px',
            padding: '18px',
            border: '1.5px solid #E9D5FF',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: initials ? '20px' : '26px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            {initials || '🌸'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setNameInput(name); setEditingName(false); } }}
                  autoFocus
                  maxLength={40}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: '2px solid #C084FC',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    color: '#1F2937',
                    outline: 'none',
                    background: 'white',
                    minWidth: 0,
                  }}
                />
                <button onClick={handleSaveName} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#8B5CF6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={14} color="white" strokeWidth={3} />
                </button>
                <button onClick={() => { setNameInput(name); setEditingName(false); }} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={14} color="#6B7280" />
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || 'Your Name'}</h2>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#9CA3AF', fontWeight: 600 }}>
                  {withAppName(APP_COPY.settingsMemberLabel)}
                </p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <span
                    style={{
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid #DDD6FE',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#7C3AED',
                    }}
                  >
                    {trackedCycles} cycle{trackedCycles !== 1 ? 's' : ''} tracked
                  </span>
                  <span
                    style={{
                      background: 'rgba(236,72,153,0.1)',
                      border: '1px solid #FBCFE8',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#BE185D',
                    }}
                  >
                    {trackedDays} log day{trackedDays !== 1 ? 's' : ''}
                  </span>
                </div>
              </>
            )}
          </div>
          {!editingName && (
            <button
              onClick={() => { setNameInput(name); setEditingName(true); }}
              style={{
                padding: '8px 12px',
                background: 'white',
                border: '1.5px solid #E9D5FF',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#8B5CF6',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
              }}
            >
              <Pencil size={12} />
              Edit
            </button>
          )}
        </div>

        {/* Cycle Settings */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            border: '1px solid #F3F4F6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={16} color="#8B5CF6" />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Cycle Settings</h3>
          </div>

          {/* Cycle Length */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Cycle Length</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Average days per cycle</p>
              </div>
              <span
                style={{
                  background: '#F5F3FF',
                  borderRadius: '10px',
                  padding: '4px 12px',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#7C3AED',
                  minWidth: '52px',
                  textAlign: 'center',
                }}
              >
                {cycleLength}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1.5px solid #E9D5FF',
                  background: '#F9FAFB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#7C3AED',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                −
              </button>
              <div style={{ flex: 1, height: '6px', background: '#F3E8FF', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${((cycleLength - 21) / (45 - 21)) * 100}%`,
                    background: 'linear-gradient(90deg, #F472B6, #8B5CF6)',
                    borderRadius: '999px',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              <button
                onClick={() => setCycleLength(Math.min(45, cycleLength + 1))}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1.5px solid #E9D5FF',
                  background: '#F9FAFB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#7C3AED',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Period Length */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Period Length</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Average period duration</p>
              </div>
              <span
                style={{
                  background: '#FDF2F8',
                  borderRadius: '10px',
                  padding: '4px 12px',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#BE185D',
                  minWidth: '52px',
                  textAlign: 'center',
                }}
              >
                {periodLength}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setPeriodLength(Math.max(1, periodLength - 1))}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1.5px solid #FBCFE8',
                  background: '#F9FAFB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#EC4899',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                −
              </button>
              <div style={{ flex: 1, height: '6px', background: '#FCE7F3', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${((periodLength - 1) / (10 - 1)) * 100}%`,
                    background: 'linear-gradient(90deg, #F9A8D4, #EC4899)',
                    borderRadius: '999px',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              <button
                onClick={() => setPeriodLength(Math.min(10, periodLength + 1))}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1.5px solid #FBCFE8',
                  background: '#F9FAFB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#EC4899',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Adaptive Predictions */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Adaptive Predictions</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                Improves period/fertile predictions from your logged history
              </p>
            </div>
            <Toggle
              on={useAdaptivePredictions}
              onToggle={() => updateSettings({ useAdaptivePredictions: !useAdaptivePredictions })}
              color="#8B5CF6"
            />
          </div>

          {/* Perimenopause Mode */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Perimenopause Mode</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                Enables extra symptoms and wider prediction windows
              </p>
            </div>
            <Toggle
              on={perimenopauseMode}
              onToggle={() => updateSettings({ perimenopauseMode: !perimenopauseMode })}
              color="#EC4899"
            />
          </div>
        </div>

        {/* Offline Backup */}
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
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="#4F46E5" />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Offline Backup</h3>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#6B7280', fontWeight: 600, lineHeight: 1.5 }}>
            Export or restore your encrypted local data without cloud sync.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={handleExportBackup}
                disabled={backupBusy}
                style={{
                  padding: '10px',
                  border: '1.5px solid #C7D2FE',
                  borderRadius: '12px',
                  background: '#EEF2FF',
                  color: '#4338CA',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: backupBusy ? 'not-allowed' : 'pointer',
                  opacity: backupBusy ? 0.7 : 1,
                }}
              >
                Export Backup
              </button>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: '12px',
                  background: '#F5F3FF',
                  color: '#7C3AED',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: backupBusy ? 'not-allowed' : 'pointer',
                  opacity: backupBusy ? 0.7 : 1,
                }}
              >
                Import Backup
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  disabled={backupBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    void handleImportBackup(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={Object.keys(logs).length === 0}
              style={{
                width: '100%',
                padding: '10px',
                border: '1.5px solid #A7F3D0',
                borderRadius: '12px',
                background: '#ECFDF5',
                color: '#047857',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Nunito', sans-serif",
                cursor: Object.keys(logs).length === 0 ? 'not-allowed' : 'pointer',
                opacity: Object.keys(logs).length === 0 ? 0.5 : 1,
              }}
            >
              📊 Export Health Report (CSV)
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            border: '1px solid #F3F4F6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#FDF2F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={16} color="#EC4899" />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Notifications</h3>
          </div>

          <div
            style={{
              marginBottom: '10px',
              border: '1.5px solid #FBCFE8',
              borderRadius: '12px',
              background: '#FFF1F2',
              color: '#9D174D',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            {WEB_NOTIFICATION_SUPPORT_MESSAGE}
          </div>

          {[
            { key: 'periodReminder', icon: Droplets, label: 'Period Reminder', desc: '2 days before predicted period', color: '#EC4899' },
            { key: 'fertileWindow', icon: Heart, label: 'Fertile Window', desc: 'When your fertile window starts', color: '#8B5CF6' },
            { key: 'dailyLog', icon: Moon, label: 'Daily Log Reminder', desc: 'Evening reminder to log symptoms', color: '#6D28D9' },
            { key: 'insights', icon: Star, label: 'Monthly Insights', desc: 'Your cycle summary report', color: '#F59E0B' },
          ].map(({ key, icon: Icon, label, desc, color }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 0',
                borderBottom: '1px solid #F9FAFB',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>{desc}</p>
              </div>
              <Toggle
                on={notifications[key as keyof NotificationSettings]}
                onToggle={() => toggleNotification(key as keyof typeof notifications)}
                color={color}
                disabled
              />
            </div>
          ))}
        </div>

        {/* Privacy & More */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '6px 18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            border: '1px solid #F3F4F6',
          }}
        >
          {[
            { icon: Shield, label: 'Privacy & Security', color: '#059669', desc: 'Data protection settings' },
            {
              icon: Lock,
              label: 'App Lock',
              color: '#6D28D9',
              desc: appLockEnabled ? 'Enabled (local toggle)' : 'Disabled (local toggle)',
            },
            { icon: HelpCircle, label: 'Help & Support', color: '#0EA5E9', desc: 'FAQs & contact us' },
            { icon: Trash2, label: 'Delete All Data', color: '#EF4444', desc: 'Permanently erase your data' },
          ].map(({ icon: Icon, label, color, desc }, i, arr) => (
            <button
              key={label}
              onClick={() => {
                if (label === 'Privacy & Security') handlePrivacyInfo();
                if (label === 'App Lock') handleAppLock();
                if (label === 'Help & Support') handleHelp();
                if (label === 'Delete All Data') handleDeleteAllData();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F9FAFB' : 'none',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: `${color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: label === 'Delete All Data' ? '#EF4444' : '#374151' }}>
                  {label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>{desc}</p>
              </div>
              <ChevronRight size={16} color="#D1D5DB" />
            </button>
          ))}
        </div>

        {/* App Version */}
        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#D1D5DB', fontWeight: 600 }}>
            {withAppName(APP_COPY.settingsFooterPrefix)} {trackedCycles > 0 ? `${trackedCycles} cycle${trackedCycles !== 1 ? 's' : ''}` : 'started'}
          </p>
        </div>
      </div>
    </div>
  );
}
