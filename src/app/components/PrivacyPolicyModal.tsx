import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { APP_COPY } from '../config/appCopy';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export function PrivacyPolicyModal({ isOpen, onClose, initialTab = 'privacy' }: PrivacyPolicyModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'calc(10px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '100%',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>
                Legal & Data Protection
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                100% Private · Zero Server Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#F1F5F9',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: '8px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderBottom: activeTab === 'privacy' ? '3px solid #059669' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'privacy' ? '#065F46' : '#64748B',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Lock size={15} />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderBottom: activeTab === 'terms' ? '3px solid #059669' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'terms' ? '#065F46' : '#64748B',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <FileText size={15} />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px 24px', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
          {activeTab === 'privacy' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '14px', padding: '12px 14px' }}>
                <div style={{ fontWeight: 800, color: '#065F46', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Our Offline-First Privacy Guarantee</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>
                  Your reproductive and intimate health data is deeply personal. {APP_COPY.appName} was intentionally architected to operate 100% on your device without mandatory accounts, external trackers, or cloud storage.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  1. Local Data Storage & Ownership
                </h3>
                <p style={{ margin: 0 }}>
                  All menstrual cycles, symptoms, moods, medications, and intimacy logs are saved exclusively within your browser's private SQLite/IndexedDB on your device. We do not transmit or store your cycle data on any remote server.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  2. No Ad Networks & No Data Brokers
                </h3>
                <p style={{ margin: 0 }}>
                  Unlike many corporate cycle tracking applications, {APP_COPY.appName} does not integrate third-party advertisement SDKs, analytics tracking (such as Google Analytics or Meta Pixel), or data brokers. Your reproductive telemetry is never monetized or shared.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  3. Encrypted Backups
                </h3>
                <p style={{ margin: 0 }}>
                  When you use the "Export Backup" feature, an encrypted `.json` file is compiled locally on your device. You have full custody of this file and can transfer it across devices or store it in your own secure cloud drives at your discretion.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  4. Data Deletion
                </h3>
                <p style={{ margin: 0 }}>
                  You maintain absolute sovereignty over your records. You can delete individual log days at any time, or permanently erase all app data with a single tap using the "Delete All Data" option in Settings.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '12px 14px' }}>
                <div style={{ fontWeight: 800, color: '#92400E', marginBottom: '4px' }}>
                  ⚠️ Medical Disclaimer
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#B45309' }}>
                  {APP_COPY.appName} is a personal tracking and rhythm awareness tool. It is not a diagnostic device, clinical provider, or contraceptive guarantee.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  1. Acceptance & Permitted Use
                </h3>
                <p style={{ margin: 0 }}>
                  By utilizing this application, you agree to use it solely as a personal wellness companion. The mathematical estimations provided (such as ovulation dates, fertile windows, and period predictions) are statistical approximations based on your input history.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  2. Not a Form of Contraception
                </h3>
                <p style={{ margin: 0 }}>
                  Cycle predictions should never be used as a standalone method of birth control or prevention of sexually transmitted infections (STIs). Always consult a certified gynecologist or physician for family planning, persistent irregularity, or medical concerns.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  3. User Responsibility & Backups
                </h3>
                <p style={{ margin: 0 }}>
                  Because this application prioritizes privacy by avoiding central server storage, you are responsible for maintaining your own backup files using the "Offline Backup" tool in Settings before clearing your browser cache or switching devices.
                </p>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  4. Modifications
                </h3>
                <p style={{ margin: 0 }}>
                  These terms may be updated as new offline features are released. Any changes will continue to adhere to our core philosophy of personal privacy and local data control.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', background: '#FAFAFA', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 22px',
              borderRadius: '999px',
              border: 'none',
              background: '#059669',
              color: 'white',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
