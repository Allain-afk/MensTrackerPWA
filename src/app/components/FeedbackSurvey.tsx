import { useEffect, useRef, useState } from 'react';
import { X, ChevronRight, Cloud, CheckCircle2, Loader2 } from 'lucide-react';
import { submitSurveyResponse } from '../utils/supabaseClient';

const SESSION_KEY = 'mens-tracker:survey-shown';
const COMPLETED_KEY = 'mens-tracker:survey-completed';
const SHOW_DELAY_MS = 2500;

type Step = 'name' | 'questions' | 'success';

const Q1_OPTIONS = [
  'Yes, definitely!',
  "Maybe, I'd like to know more",
  'No, local-only is fine',
];

const Q2_OPTIONS = [
  'Yes, absolutely',
  "Only if it's free",
  'No, I prefer no account',
];

/* ─── Responsive helpers ─────────────────────────────────────────────────
   We can't use media queries directly in inline JS, so we read `innerWidth`
   once at render time and derive breakpoint flags from it.
   CSS @media rules injected via <style> handle the truly dynamic cases.
─────────────────────────────────────────────────────────────────────────── */

function PillOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        /* min 48 px touch target */
        minHeight: '48px',
        padding: '12px 16px',
        borderRadius: '14px',
        border: `1.5px solid ${selected ? '#C084FC' : '#E9D5FF'}`,
        background: selected
          ? 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(139,92,246,0.12))'
          : '#FAFAFA',
        color: selected ? '#7C3AED' : '#4B5563',
        fontSize: 'clamp(13px, 1.8vw, 15px)',
        fontWeight: selected ? 800 : 600,
        cursor: 'pointer',
        fontFamily: "'Nunito', sans-serif",
        transition: 'border-color 0.18s ease, background 0.18s ease, color 0.18s ease',
        marginBottom: '8px',
        lineHeight: 1.35,
      }}
    >
      {selected ? '✓ ' : ''}{label}
    </button>
  );
}

export function FeedbackSurvey() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('name');
  const [nameInput, setNameInput] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (localStorage.getItem(COMPLETED_KEY)) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    timerRef.current = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, SHOW_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDismiss = () => setVisible(false);

  const handleSubmit = async () => {
    if (!q1 || !q2 || submitting) return;
    setSubmitting(true);
    setSubmitError('');

    const result = await submitSurveyResponse({
      respondent: nameInput.trim() || null,
      q1,
      q2,
      q3: q3.trim() || null,
      user_agent: navigator.userAgent,
    });

    setSubmitting(false);

    if (!result.success) {
      setSubmitError('Something went wrong. Please try again.');
      return;
    }

    localStorage.setItem(COMPLETED_KEY, '1');
    setStep('success');
  };

  if (!visible) return null;

  const canSubmit = !!q1 && !!q2 && !submitting;

  return (
    <>
      {/* ── Global responsive styles ───────────────────────────────── */}
      <style>{`
        @keyframes survey-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes survey-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes survey-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Backdrop */
        .survey-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: flex-end;       /* mobile: bottom sheet */
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          animation: survey-fade-in 0.22s ease both;
        }

        /* The card itself */
        .survey-card {
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
          animation: survey-slide-up 0.28s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* Drag handle pill */
        .survey-handle {
          width: 40px;
          height: 4px;
          border-radius: 2px;
          background: #E9D5FF;
          margin: 0 auto 18px;
        }

        /* ── Tablet / desktop: switch to centred floating card ──── */
        @media (min-width: 600px) {
          .survey-backdrop {
            align-items: center;
            padding: 24px;
          }
          .survey-card {
            max-width: 520px;
            border-radius: 28px;
            border-bottom: 1px solid #f5d0fe;
            box-shadow: 0 24px 72px rgba(139, 92, 246, 0.22);
            padding: 32px 32px;
            max-height: 88dvh;
          }
          .survey-handle {
            display: none;
          }
        }

        @media (min-width: 900px) {
          .survey-card {
            max-width: 560px;
          }
        }

        /* Inputs / textareas */
        .survey-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid #E9D5FF;
          background: #FAFAFA;
          font-size: clamp(14px, 2vw, 15px);
          font-weight: 600;
          color: #1F2937;
          font-family: 'Nunito', sans-serif;
          outline: none;
          transition: border-color 0.18s ease;
          /* min touch target height */
          min-height: 48px;
        }
        .survey-input:focus {
          border-color: #C084FC;
        }
        .survey-textarea {
          min-height: 88px;
          resize: vertical;
        }

        /* Primary CTA button */
        .survey-btn-primary {
          width: 100%;
          border: none;
          border-radius: 999px;
          background: linear-gradient(135deg, #f472b6, #8b5cf6);
          color: #fff;
          padding: 15px 20px;
          font-size: clamp(14px, 2vw, 15px);
          font-weight: 800;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 4px 16px rgba(139,92,246,0.32);
          transition: opacity 0.18s ease, transform 0.15s ease;
          min-height: 52px;
        }
        .survey-btn-primary:active { transform: scale(0.97); opacity: 0.9; }
        .survey-btn-primary:disabled {
          background: #E5E7EB;
          color: #9CA3AF;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Ghost dismiss link */
        .survey-btn-ghost {
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
        .survey-btn-ghost:active { opacity: 0.6; }

        /* Close × button */
        .survey-close {
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
          flex-shrink: 0;
        }

        @media (min-width: 600px) {
          .survey-close { top: 20px; right: 20px; }
        }

        /* Question text */
        .survey-q {
          margin: 0 0 10px;
          font-size: clamp(13px, 1.9vw, 15px);
          font-weight: 800;
          color: #1F2937;
          line-height: 1.5;
        }
      `}</style>

      {/* ── Backdrop ────────────────────────────────────────────────── */}
      <div
        className="survey-backdrop"
        onClick={step !== 'success' ? handleDismiss : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Feedback survey"
      >
        {/* ── Modal card ────────────────────────────────────────────── */}
        <div
          className="survey-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle (mobile only via CSS) */}
          <div className="survey-handle" />

          {/* Decorative blob */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-40px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Close × — hidden on success step */}
          {step !== 'success' && (
            <button
              type="button"
              aria-label="Close survey"
              onClick={handleDismiss}
              className="survey-close"
            >
              <X size={16} color="#9CA3AF" />
            </button>
          )}

          {/* ── Step 1: Name ──────────────────────────────────────── */}
          {step === 'name' && (
            <>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', paddingRight: '40px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(139,92,246,0.16))',
                  border: '1px solid #f5d0fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cloud size={22} color="#7C3AED" />
                </div>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: '999px',
                    background: '#fdf2f8', color: '#db2777',
                    fontSize: 'clamp(10px, 1.4vw, 11px)', fontWeight: 800,
                    letterSpacing: '0.3px', marginBottom: '4px',
                  }}>
                    Quick Feedback
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontSize: 'clamp(17px, 3.5vw, 20px)',
                    fontWeight: 900, color: '#111827', lineHeight: 1.2,
                  }}>
                    Help shape MensTracker ☁️
                  </h2>
                </div>
              </div>

              <p style={{
                margin: '0 0 20px',
                fontSize: 'clamp(13px, 1.9vw, 14px)',
                lineHeight: 1.7, color: '#6b7280', fontWeight: 600,
              }}>
                We're exploring a{' '}
                <strong style={{ color: '#7C3AED' }}>cloud sync option</strong>{' '}
                so your cycle data is never lost when your browser cache is cleared.
                Share your thoughts — it only takes 30 seconds! 🌸
              </p>

              <label style={{
                display: 'block',
                fontSize: 'clamp(12px, 1.7vw, 13px)',
                fontWeight: 800, color: '#374151', marginBottom: '8px',
              }}>
                Your name or alias{' '}
                <span style={{ color: '#9CA3AF', fontWeight: 600 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Maya, or leave blank to stay anonymous"
                maxLength={60}
                className="survey-input"
                style={{ marginBottom: '18px' }}
              />

              <button
                type="button"
                onClick={() => setStep('questions')}
                className="survey-btn-primary"
              >
                Let's go <ChevronRight size={17} />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="survey-btn-ghost"
              >
                Maybe later
              </button>
            </>
          )}

          {/* ── Step 2: Questions ─────────────────────────────────── */}
          {step === 'questions' && (
            <>
              <div style={{ paddingRight: '40px', marginBottom: '4px' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: 'clamp(17px, 3.5vw, 20px)',
                  fontWeight: 900, color: '#111827', lineHeight: 1.2,
                }}>
                  Your thoughts 💬
                </h2>
              </div>
              <p style={{
                margin: '4px 0 20px',
                fontSize: 'clamp(11px, 1.6vw, 12px)',
                color: '#9CA3AF', fontWeight: 600,
              }}>
                All answers are anonymous and private.
              </p>

              {/* Q1 */}
              <div style={{ marginBottom: '18px' }}>
                <p className="survey-q">
                  1. Would you be interested in cloud sync so your data is backed up and never
                  lost if your browser cache is cleared?
                </p>
                {Q1_OPTIONS.map((opt) => (
                  <PillOption key={opt} label={opt} selected={q1 === opt} onClick={() => setQ1(opt)} />
                ))}
              </div>

              {/* Q2 */}
              <div style={{ marginBottom: '18px' }}>
                <p className="survey-q">
                  2. If cloud sync were available, would you create an account to use it?
                </p>
                {Q2_OPTIONS.map((opt) => (
                  <PillOption key={opt} label={opt} selected={q2 === opt} onClick={() => setQ2(opt)} />
                ))}
              </div>

              {/* Q3 */}
              <div style={{ marginBottom: '22px' }}>
                <p className="survey-q">
                  3. What concerns, if any, would you have about storing your cycle data in the
                  cloud?{' '}
                  <span style={{ color: '#9CA3AF', fontWeight: 600 }}>(optional)</span>
                </p>
                <textarea
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  placeholder="e.g. privacy, cost, complexity…"
                  maxLength={500}
                  rows={3}
                  className="survey-input survey-textarea"
                />
              </div>

              {submitError && (
                <p style={{
                  margin: '0 0 12px',
                  fontSize: 'clamp(12px, 1.7vw, 13px)',
                  color: '#DC2626', fontWeight: 700, textAlign: 'center',
                }}>
                  {submitError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className="survey-btn-primary"
                style={{
                  background: canSubmit
                    ? 'linear-gradient(135deg, #f472b6, #8b5cf6)'
                    : '#E5E7EB',
                  color: canSubmit ? '#fff' : '#9CA3AF',
                  boxShadow: canSubmit ? '0 4px 16px rgba(139,92,246,0.3)' : 'none',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {submitting
                  ? <><Loader2 size={16} style={{ animation: 'survey-spin 0.8s linear infinite' }} /> Submitting…</>
                  : 'Submit Feedback 🌸'
                }
              </button>
            </>
          )}

          {/* ── Step 3: Success ───────────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(139,92,246,0.16))',
                border: '1px solid #f5d0fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
              }}>
                <CheckCircle2 size={34} color="#8B5CF6" strokeWidth={2} />
              </div>

              <h2 style={{
                margin: '0 0 12px',
                fontSize: 'clamp(18px, 3.5vw, 22px)',
                fontWeight: 900, color: '#111827',
              }}>
                Thank you so much! 🎉
              </h2>
              <p style={{
                margin: '0 0 8px',
                fontSize: 'clamp(13px, 1.9vw, 14px)',
                lineHeight: 1.7, color: '#6b7280', fontWeight: 600,
              }}>
                Your feedback has been recorded and will only be seen by the MensTracker developer.
              </p>
              <p style={{
                margin: '0 0 26px',
                fontSize: 'clamp(13px, 1.9vw, 14px)',
                lineHeight: 1.7, color: '#6b7280', fontWeight: 600,
              }}>
                It helps us decide whether to build cloud sync to keep your data safe.
                Thank you for helping shape the future of MensTracker 💜
              </p>

              <button
                type="button"
                onClick={handleDismiss}
                className="survey-btn-primary"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
