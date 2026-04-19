import { useEffect, useState } from 'react';
import { X, Cloud, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DISMISSED_KEY = 'mens-tracker:cloud-sync-announce-dismissed';
const SHOW_DELAY_MS = 2500;

export function CloudSyncAnnouncement() {
  const { user, ready: authReady, signInWithGoogle } = useAuth();
  const [visible, setVisible] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady) return;
    if (user) return; // already signed in — nothing to announce
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [authReady, user]);

  const dismiss = (remember = true) => {
    if (remember) {
      try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* ignore */ }
    }
    setVisible(false);
  };

  const handleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      // Persist dismissal first — the page will redirect, and we don't want
      // the modal to flash back on return.
      try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* ignore */ }
      await signInWithGoogle();
      // Browser will redirect to Google; component unmounts with the page.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(message);
      setSigningIn(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cs-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes cs-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cs-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .cs-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          animation: cs-fade-in 0.22s ease both;
        }

        .cs-card {
          position: relative;
          width: 100%;
          background: linear-gradient(180deg, #fffafc 0%, #ffffff 100%);
          border: 1px solid #f5d0fe;
          border-bottom: none;
          border-radius: 28px 28px 0 0;
          box-shadow: 0 -16px 56px rgba(139, 92, 246, 0.22);
          padding: 22px 20px;
          padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          max-height: 92dvh;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          animation: cs-slide-up 0.28s cubic-bezier(0.22,1,0.36,1) both;
        }

        .cs-handle {
          width: 40px;
          height: 4px;
          border-radius: 2px;
          background: #E9D5FF;
          margin: 0 auto 18px;
        }

        @media (min-width: 600px) {
          .cs-backdrop {
            align-items: center;
            padding: 24px;
          }
          .cs-card {
            max-width: 520px;
            border-radius: 28px;
            border-bottom: 1px solid #f5d0fe;
            box-shadow: 0 24px 72px rgba(139, 92, 246, 0.22);
            padding: 32px;
            max-height: 88dvh;
          }
          .cs-handle { display: none; }
        }

        .cs-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #f3e8ff;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
        }

        @media (min-width: 600px) {
          .cs-close { top: 20px; right: 20px; }
        }

        .cs-primary {
          width: 100%;
          border: none;
          border-radius: 999px;
          background: linear-gradient(135deg, #60a5fa, #8b5cf6);
          color: #fff;
          padding: 15px 20px;
          font-size: clamp(14px, 2vw, 15px);
          font-weight: 800;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.32);
          transition: opacity 0.18s ease, transform 0.15s ease;
          min-height: 52px;
        }
        .cs-primary:active { transform: scale(0.97); opacity: 0.9; }
        .cs-primary:disabled {
          background: #E5E7EB;
          color: #9CA3AF;
          box-shadow: none;
          cursor: not-allowed;
        }

        .cs-ghost {
          width: 100%;
          border: none;
          background: transparent;
          color: #9CA3AF;
          padding: 12px 0;
          font-size: clamp(12px, 1.8vw, 13px);
          font-weight: 700;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          min-height: 44px;
        }
        .cs-ghost:active { opacity: 0.6; }

        .cs-feature {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
        }
        .cs-feature-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(96,165,250,0.15), rgba(139,92,246,0.15));
          border: 1px solid #E0E7FF;
        }
      `}</style>

      <div
        className="cs-backdrop"
        onClick={() => dismiss(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cs-title"
      >
        <div className="cs-card" onClick={(e) => e.stopPropagation()}>
          <div className="cs-handle" />

          <div style={{
            position: 'absolute', top: '-60px', right: '-40px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <button
            type="button"
            aria-label="Close announcement"
            onClick={() => dismiss(true)}
            className="cs-close"
          >
            <X size={16} color="#9CA3AF" aria-hidden="true" />
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', paddingRight: '40px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
              background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(139,92,246,0.3)',
            }}>
              <Cloud size={24} color="#fff" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '999px',
                background: '#EFF6FF', color: '#1D4ED8',
                fontSize: 'clamp(10px, 1.4vw, 11px)', fontWeight: 800,
                letterSpacing: '0.3px', marginBottom: '4px',
              }}>
                <Sparkles size={10} aria-hidden="true" /> New
              </div>
              <h2
                id="cs-title"
                style={{
                  margin: 0,
                  fontSize: 'clamp(17px, 3.5vw, 20px)',
                  fontWeight: 900, color: '#111827', lineHeight: 1.2,
                }}
              >
                Cloud Sync is now live ☁️
              </h2>
            </div>
          </div>

          <p style={{
            margin: '0 0 16px',
            fontSize: 'clamp(13px, 1.9vw, 14px)',
            lineHeight: 1.65, color: '#4b5563', fontWeight: 600,
          }}>
            You can now sign in with your <strong style={{ color: '#1D4ED8' }}>Google account</strong> to back up
            your cycle data — <strong>no password required</strong>. Your data restores automatically on any device
            you sign in on.
          </p>

          {/* Feature list */}
          <div style={{ marginBottom: '18px' }}>
            <div className="cs-feature">
              <div className="cs-feature-icon">
                <Shield size={16} color="#7C3AED" aria-hidden="true" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>
                  Private by default
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 600, color: '#6B7280', lineHeight: 1.5 }}>
                  Only you can see your data. The app stays fully offline-first.
                </p>
              </div>
            </div>
            <div className="cs-feature">
              <div className="cs-feature-icon">
                <Cloud size={16} color="#2563EB" aria-hidden="true" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>
                  Never lose your cycle history
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 600, color: '#6B7280', lineHeight: 1.5 }}>
                  Clearing your browser won't wipe your data anymore.
                </p>
              </div>
            </div>
            <div className="cs-feature">
              <div className="cs-feature-icon">
                <Sparkles size={16} color="#8B5CF6" aria-hidden="true" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>
                  One tap — no password
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 600, color: '#6B7280', lineHeight: 1.5 }}>
                  Use your Google email. That's it.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              aria-live="polite"
              style={{
                margin: '0 0 12px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                fontSize: 'clamp(12px, 1.7vw, 13px)',
                color: '#991B1B', fontWeight: 700, textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={signingIn}
            className="cs-primary"
          >
            {signingIn ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ animation: 'cs-spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 20" opacity="0.9" />
                </svg>
                Opening Google…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#fff" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.13 2.73-2.41 3.58v2.97h3.89c2.28-2.1 3.57-5.19 3.57-8.79z" opacity="0.95"/>
                  <path fill="#fff" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-2.97c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.1-6.68-4.93H1.3v3.09C3.27 21.3 7.31 24 12 24z" opacity="0.85"/>
                  <path fill="#fff" d="M5.32 14.35c-.24-.72-.38-1.48-.38-2.35s.14-1.63.38-2.35V6.56H1.3C.47 8.19 0 10.04 0 12s.47 3.81 1.3 5.44l4.02-3.09z" opacity="0.75"/>
                  <path fill="#fff" d="M12 4.74c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.23 0 12 0 7.31 0 3.27 2.7 1.3 6.56l4.02 3.09C6.26 6.84 8.89 4.74 12 4.74z" opacity="0.95"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => dismiss(true)}
            className="cs-ghost"
          >
            Maybe later
          </button>

          <p style={{
            margin: '6px 0 0',
            fontSize: '11px', color: '#9CA3AF', fontWeight: 600,
            textAlign: 'center', lineHeight: 1.5,
          }}>
            You can also sign in any time from Settings → Cloud Sync.
          </p>
        </div>
      </div>
    </>
  );
}
