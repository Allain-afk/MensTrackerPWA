import { createPortal } from 'react-dom';
import { Sparkles, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../config/whatsNew';

interface PwaUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'checking' | 'available' | 'up-to-date';
  onReload: () => void;
  onCheckAgain: () => void;
}

export function PwaUpdateModal({
  isOpen,
  onClose,
  status,
  onReload,
  onCheckAgain,
}: PwaUpdateModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 12, 30, 0.58)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-update-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 22px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(112, 26, 117, 0.18)',
          borderTop: '1px solid rgba(233, 213, 255, 0.7)',
          fontFamily: "'Nunito', sans-serif",
          animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E9D5FF' }} />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(243, 232, 255, 0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6B21A8',
          }}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Status: Checking */}
        {status === 'checking' && (
          <div style={{ textAlign: 'center', padding: '16px 8px 12px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #FCE7F3, #EDE9FE)',
                border: '1.5px solid #E9D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <RefreshCw size={26} color="#8B5CF6" className="animate-spin" />
            </div>
            <h2 id="pwa-update-title" style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#1F2937' }}>
              Checking for Updates...
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
              Connecting to see if a newer version is available.
            </p>
          </div>
        )}

        {/* Status: Available */}
        {status === 'available' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #FCE7F3, #EDE9FE)',
                  border: '1.5px solid #FBCFE8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(236, 72, 153, 0.25)',
                }}
              >
                <Sparkles size={24} color="#EC4899" />
              </div>
              <div>
                <h2 id="pwa-update-title" style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#1F2937' }}>
                  Update Available! ✨
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#BE185D', fontWeight: 700 }}>
                  A new version is ready to install
                </p>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #F3E8FF',
                borderRadius: '18px',
                padding: '16px',
                marginBottom: '20px',
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.05)',
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#4B5563', lineHeight: 1.5, fontWeight: 600 }}>
                A newer build of BloomCycle has been downloaded in the background.
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#7C3AED', fontWeight: 700 }}>
                Reload now to apply the latest features, calendar improvements, and offline assets.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="tap-active"
                onClick={onReload}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)',
                }}
              >
                <RefreshCw size={18} />
                Reload & Apply Update Now
              </button>

              <button
                className="tap-active"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#FFFFFF',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: '16px',
                  color: '#6D28D9',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                Later
              </button>
            </div>
          </div>
        )}

        {/* Status: Up-to-date */}
        {status === 'up-to-date' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '16px',
                  background: '#F0FDF4',
                  border: '1.5px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
                }}
              >
                <CheckCircle2 size={24} color="#16A34A" />
              </div>
              <div>
                <h2 id="pwa-update-title" style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#1F2937' }}>
                  You're Up to Date! 🎉
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#15803D', fontWeight: 700 }}>
                  BloomCycle v{CURRENT_APP_VERSION}
                </p>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #F3E8FF',
                borderRadius: '18px',
                padding: '16px',
                marginBottom: '20px',
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.05)',
              }}
            >
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#4B5563', lineHeight: 1.5, fontWeight: 600 }}>
                You are currently running the latest available version of the app. All offline assets and features are up to date.
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                Service worker status: Active & caching offline
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="tap-active"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: '0 4px 16px rgba(168, 85, 247, 0.25)',
                }}
              >
                Got it
              </button>

              <button
                className="tap-active"
                onClick={onCheckAgain}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#FFFFFF',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: '16px',
                  color: '#6D28D9',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={15} />
                Force Check Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
