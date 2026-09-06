import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { CURRENT_APP_VERSION, CURRENT_RELEASE_INFO } from '../config/whatsNew';

interface WhatsNewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoCheck?: boolean;
}

const STORAGE_KEY = 'last_seen_app_version';

export function WhatsNewModal({ isOpen: controlledIsOpen, onClose: controlledOnClose, autoCheck = false }: WhatsNewModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    if (autoCheck) {
      try {
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        if (lastSeen !== CURRENT_APP_VERSION) {
          // Add a short delay so the app renders its initial state first
          const timer = setTimeout(() => {
            setInternalIsOpen(true);
          }, 600);
          return () => clearTimeout(timer);
        }
      } catch {
        // localStorage not available or private mode
      }
    }
  }, [autoCheck]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
    } catch {
      // ignore storage errors
    }
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

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
          maxWidth: '540px',
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
            background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#1F2937' }}>
                  What's New
                </h2>
                <span
                  style={{
                    background: '#8B5CF6',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  v{CURRENT_RELEASE_INFO.version}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#A855F7', fontWeight: 700 }}>
                {CURRENT_RELEASE_INFO.releaseDate} Update
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.8)',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtitle announcement */}
        <div style={{ padding: '12px 24px', background: '#FDF4FF', borderBottom: '1px solid #F5D0FE', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#701A75', fontWeight: 600, lineHeight: 1.45 }}>
            {CURRENT_RELEASE_INFO.subtitle}
          </p>
        </div>

        {/* Scrollable Highlights List */}
        <div
          style={{
            padding: '16px 20px',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {CURRENT_RELEASE_INFO.highlights.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '16px',
                background: '#FAFAFA',
                border: '1px solid #F3F4F6',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  border: '1px solid #F1F5F9',
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>
                    {item.title}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background:
                          item.badge === 'New'
                            ? '#DCFCE7'
                            : item.badge === 'Smart'
                            ? '#EDE9FE'
                            : '#DBEAFE',
                        color:
                          item.badge === 'New'
                            ? '#166534'
                            : item.badge === 'Smart'
                            ? '#6B21A8'
                            : '#1E40AF',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 600, lineHeight: 1.45 }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'center',
            background: '#FAFAFA',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleDismiss}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #F472B6 0%, #8B5CF6 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            <span>Explore What's New</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
