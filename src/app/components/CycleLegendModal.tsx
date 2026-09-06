import { createPortal } from 'react-dom';
import { X, Heart, HelpCircle } from 'lucide-react';

interface CycleLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CycleLegendModal({ isOpen, onClose }: CycleLegendModalProps) {
  if (!isOpen) return null;

  const legendItems = [
    {
      label: 'Logged Period',
      desc: 'Days you confirmed bleeding was present.',
      preview: (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(244,114,182,0.22)',
          border: '1.5px solid #F472B6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: '#BE185D',
        }}>
          12
        </div>
      ),
    },
    {
      label: 'Projected Period',
      desc: 'Remaining forecast of your active period based on your cycle average.',
      preview: (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(251,207,232,0.25)',
          border: '1.5px dashed #F472B6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: '#F472B6',
        }}>
          15
        </div>
      ),
    },
    {
      label: 'Fertile Window',
      desc: 'Days with the highest likelihood of conception.',
      preview: (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(192,132,252,0.16)',
          border: '1px solid rgba(192,132,252,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: '#7C3AED',
        }}>
          22
        </div>
      ),
    },
    {
      label: 'Estimated Ovulation',
      desc: 'Projected day of egg release.',
      preview: (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(192,132,252,0.25)',
          border: '2px solid #8B5CF6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: '#6D28D9',
        }}>
          26
        </div>
      ),
    },
    {
      label: 'Today',
      desc: 'Current day marker.',
      preview: (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '2px solid #8B5CF6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: '#8B5CF6',
        }}>
          {new Date().getDate()}
        </div>
      ),
    },
    {
      label: 'Intimacy Logged',
      desc: 'Protected or unprotected intimacy recorded on this day.',
      preview: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px' }}>
          <Heart size={18} color="#E11D48" fill="#E11D48" />
        </div>
      ),
    },
    {
      label: 'Logged Wellness & Symptoms',
      desc: 'Notes, mood, symptoms, water, medications, or lifestyle factors saved.',
      preview: (
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'center', width: '32px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#BE185D' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8B5CF6' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10B981' }} />
        </div>
      ),
    },
  ];

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
        aria-labelledby="legend-modal-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          boxShadow: '0 -10px 40px rgba(112, 26, 117, 0.18)',
          borderTop: '1px solid rgba(233, 213, 255, 0.6)',
          fontFamily: "'Nunito', sans-serif",
          animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 22px 14px',
          borderBottom: '1px solid #F3E8FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FCE7F3, #EDE9FE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HelpCircle size={20} color="#7C3AED" />
            </div>
            <div>
              <h2 id="legend-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1F2937' }}>
                Calendar Guide
              </h2>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>
                Cycle Phases & Legend
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
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
        </div>

        {/* List */}
        <div style={{
          padding: '16px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {legendItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 14px',
                background: '#FAF5FF',
                borderRadius: '16px',
                border: '1px solid #F3E8FF',
              }}
            >
              <div style={{ flexShrink: 0 }}>
                {item.preview}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>
                  {item.label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280', fontWeight: 600, lineHeight: 1.35 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}

          <button
            className="tap-active"
            onClick={onClose}
            style={{
              marginTop: '8px',
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
        </div>
      </div>
    </div>,
    document.body
  );
}
