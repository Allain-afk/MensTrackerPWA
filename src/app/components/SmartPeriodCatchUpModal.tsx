import { createPortal } from 'react-dom';
import { Calendar, Droplets, Sparkles, X, Check } from 'lucide-react';

interface SmartPeriodCatchUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDateKey: string;
  endDateKey: string;
  totalDays: number;
  expectedPeriodLength: number;
  onConfirmAll: () => void;
  onConfirmSingle: () => void;
}

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDisplayDate(key: string): string {
  if (!key) return '';
  const [y, m, d] = key.split('-').map(Number);
  return `${SHORT_MONTHS[m - 1]} ${d}, ${y}`;
}

export function SmartPeriodCatchUpModal({
  isOpen,
  onClose,
  startDateKey,
  endDateKey,
  totalDays,
  expectedPeriodLength,
  onConfirmAll,
  onConfirmSingle,
}: SmartPeriodCatchUpModalProps) {
  if (!isOpen) return null;

  const startFormatted = formatDisplayDate(startDateKey);
  const endFormatted = formatDisplayDate(endDateKey);
  const remainingProjected = Math.max(0, expectedPeriodLength - totalDays);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 12, 30, 0.55)',
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
        aria-labelledby="catch-up-modal-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 22px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(112, 26, 117, 0.18)',
          borderTop: '1px solid rgba(244, 114, 182, 0.3)',
          fontFamily: "'Nunito', sans-serif",
          animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E9D5FF' }} />
        </div>

        {/* Close button */}
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
            transition: 'background 0.2s',
          }}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Header Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FCE7F3, #EDE9FE)',
              border: '1.5px solid #FBCFE8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(244, 114, 182, 0.25)',
            }}
          >
            <Droplets size={22} color="#BE185D" />
          </div>
          <div>
            <h2
              id="catch-up-modal-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                color: '#1F2937',
                letterSpacing: '-0.2px',
              }}
            >
              Catch up on your period?
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#7C3AED', fontWeight: 700 }}>
              Continuous Cycle Logging
            </p>
          </div>
        </div>

        {/* Informative card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #F3E8FF',
            borderRadius: '18px',
            padding: '16px',
            marginBottom: '18px',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.05)',
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#4B5563', lineHeight: 1.5, fontWeight: 600 }}>
            You marked your period starting on <strong style={{ color: '#BE185D' }}>{startFormatted}</strong>. Menstrual bleeding typically continues across consecutive days.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FDF2F8',
              border: '1px solid #FBCFE8',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '10px',
            }}
          >
            <Calendar size={18} color="#BE185D" />
            <div style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: '#9D174D' }}>
              Range: {startFormatted} → {endFormatted} ({totalDays} days)
            </div>
          </div>

          {remainingProjected > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FAF5FF',
                border: '1px solid #E9D5FF',
                borderRadius: '12px',
                padding: '10px 12px',
              }}
            >
              <Sparkles size={18} color="#8B5CF6" />
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#6D28D9' }}>
                We'll also project your remaining <strong>{remainingProjected} period {remainingProjected === 1 ? 'day' : 'days'}</strong> on the calendar based on your typical {expectedPeriodLength}-day period.
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="tap-active"
            onClick={onConfirmAll}
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
            <Check size={18} strokeWidth={3} />
            Yes, log through today ({totalDays} days)
          </button>

          <button
            className="tap-active"
            onClick={onConfirmSingle}
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
            Only log {startFormatted}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
