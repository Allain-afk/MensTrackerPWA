import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isBusy?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isBusy = false,
}: ConfirmDeleteModalProps) {
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
      onClick={isBusy ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 22px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(185, 28, 28, 0.2)',
          borderTop: '1px solid rgba(254, 202, 202, 0.8)',
          fontFamily: "'Nunito', sans-serif",
          animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#FEE2E2' }} />
        </div>

        {/* Close button */}
        {!isBusy && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#F9FAFB',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}

        {/* Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: '#FEE2E2',
              border: '1.5px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)',
            }}
          >
            <Trash2 size={24} color="#DC2626" />
          </div>
          <div>
            <h2
              id="confirm-delete-title"
              style={{
                margin: 0,
                fontSize: '19px',
                fontWeight: 800,
                color: '#1F2937',
                letterSpacing: '-0.2px',
              }}
            >
              Delete All Data?
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Warning Details Card */}
        <div
          style={{
            background: '#FFF5F5',
            border: '1px solid #FED7D7',
            borderRadius: '18px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color="#E53E3E" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#742A2A', lineHeight: 1.5, fontWeight: 700 }}>
                Permanently erase all local information
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9B2C2C', lineHeight: 1.45, fontWeight: 600 }}>
                This removes all logged period dates, symptoms, moods, medications, lifestyle factors, intimacy entries, cycle settings, and your profile name from this device.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="tap-active"
            onClick={onConfirm}
            disabled={isBusy}
            style={{
              width: '100%',
              padding: '14px',
              background: isBusy
                ? '#9CA3AF'
                : 'linear-gradient(135deg, #EF4444, #DC2626)',
              border: 'none',
              borderRadius: '16px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 800,
              cursor: isBusy ? 'wait' : 'pointer',
              fontFamily: "'Nunito', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isBusy ? 'none' : '0 4px 16px rgba(239, 68, 68, 0.35)',
            }}
          >
            <Trash2 size={18} />
            {isBusy ? 'Erasing data...' : 'Permanently Erase All Data'}
          </button>

          <button
            className="tap-active"
            onClick={onClose}
            disabled={isBusy}
            style={{
              width: '100%',
              padding: '12px',
              background: '#FFFFFF',
              border: '1.5px solid #DDD6FE',
              borderRadius: '16px',
              color: '#6D28D9',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Cancel, Keep My Data
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
