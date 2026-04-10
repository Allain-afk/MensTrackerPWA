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
        padding: '10px 14px',
        borderRadius: '12px',
        border: `1.5px solid ${selected ? '#C084FC' : '#E9D5FF'}`,
        background: selected
          ? 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(139,92,246,0.12))'
          : '#FAFAFA',
        color: selected ? '#7C3AED' : '#4B5563',
        fontSize: '13px',
        fontWeight: selected ? 800 : 600,
        cursor: 'pointer',
        fontFamily: "'Nunito', sans-serif",
        transition: 'all 0.18s ease',
        marginBottom: '7px',
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
    // Already completed — never show again
    if (localStorage.getItem(COMPLETED_KEY)) return;
    // Already shown this session — skip
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Schedule the pop-up
    timerRef.current = setTimeout(() => {
      setVisible(true);
      // Mark as shown for this session
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

    const payload = {
      respondent: nameInput.trim() || null,
      q1,
      q2,
      q3: q3.trim() || null,
      user_agent: navigator.userAgent,
    };

    const result = await submitSurveyResponse(payload);
    setSubmitting(false);

    if (!result.success) {
      setSubmitError('Something went wrong. Please try again.');
      return;
    }

    // Mark permanently complete
    localStorage.setItem(COMPLETED_KEY, '1');
    setStep('success');
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={step !== 'success' ? handleDismiss : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 0 env(safe-area-inset-bottom, 0px)',
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'linear-gradient(180deg, #fffafc 0%, #ffffff 100%)',
            borderRadius: '28px 28px 0 0',
            border: '1px solid #f5d0fe',
            borderBottom: 'none',
            boxShadow: '0 -16px 48px rgba(139,92,246,0.18)',
            padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
            position: 'relative',
            maxHeight: '88dvh',
            overflowY: 'auto',
          }}
        >
          {/* Decorative blob */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-40px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Close button — hidden on success */}
          {step !== 'success' && (
            <button
              type="button"
              aria-label="Close survey"
              onClick={handleDismiss}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #f3e8ff',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1,
              }}
            >
              <X size={16} color="#9CA3AF" />
            </button>
          )}

          {/* ── Step 1: Name ─────────────────────── */}
          {step === 'name' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '16px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(139,92,246,0.16))',
                  border: '1px solid #f5d0fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cloud size={20} color="#7C3AED" />
                </div>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 9px', borderRadius: '999px',
                    background: '#fdf2f8', color: '#db2777',
                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.2px', marginBottom: '3px',
                  }}>
                    Quick Feedback
                  </div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>
                    Help shape MensTracker ☁️
                  </h2>
                </div>
              </div>

              <p style={{ margin: '0 0 18px', fontSize: '13px', lineHeight: 1.65, color: '#6b7280', fontWeight: 600 }}>
                We're exploring a <strong style={{ color: '#7C3AED' }}>cloud sync option</strong> so your cycle data is never lost when your browser cache is cleared. Share your thoughts — it only takes 30 seconds! 🌸
              </p>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '7px' }}>
                Your name or alias <span style={{ color: '#9CA3AF', fontWeight: 600 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Maya, or leave blank to stay anonymous"
                maxLength={60}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #E9D5FF',
                  background: '#FAFAFA',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1F2937',
                  fontFamily: "'Nunito', sans-serif",
                  outline: 'none',
                  marginBottom: '18px',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C084FC'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E9D5FF'; }}
              />

              <button
                type="button"
                onClick={() => setStep('questions')}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #f472b6, #8b5cf6)',
                  color: '#ffffff',
                  padding: '13px 16px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
                }}
              >
                Let's go <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: '#9CA3AF',
                  paddingTop: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                Maybe later
              </button>
            </>
          )}

          {/* ── Step 2: Questions ─────────────────── */}
          {step === 'questions' && (
            <>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 900, color: '#111827', lineHeight: 1.2, paddingRight: '36px' }}>
                Your thoughts 💬
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>
                All answers are anonymous and private.
              </p>

              {/* Q1 */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 9px', fontSize: '13px', fontWeight: 800, color: '#1F2937', lineHeight: 1.45 }}>
                  1. Would you be interested in cloud sync so your data is backed up and never lost if your browser cache is cleared?
                </p>
                {Q1_OPTIONS.map((opt) => (
                  <PillOption
                    key={opt}
                    label={opt}
                    selected={q1 === opt}
                    onClick={() => setQ1(opt)}
                  />
                ))}
              </div>

              {/* Q2 */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 9px', fontSize: '13px', fontWeight: 800, color: '#1F2937', lineHeight: 1.45 }}>
                  2. If cloud sync were available, would you create an account to use it?
                </p>
                {Q2_OPTIONS.map((opt) => (
                  <PillOption
                    key={opt}
                    label={opt}
                    selected={q2 === opt}
                    onClick={() => setQ2(opt)}
                  />
                ))}
              </div>

              {/* Q3 */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 9px', fontSize: '13px', fontWeight: 800, color: '#1F2937', lineHeight: 1.45 }}>
                  3. What concerns, if any, would you have about storing your cycle data in the cloud?{' '}
                  <span style={{ color: '#9CA3AF', fontWeight: 600 }}>(optional)</span>
                </p>
                <textarea
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  placeholder="e.g. privacy, cost, complexity…"
                  maxLength={500}
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid #E9D5FF',
                    background: '#FAFAFA',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1F2937',
                    fontFamily: "'Nunito', sans-serif",
                    outline: 'none',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C084FC'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E9D5FF'; }}
                />
              </div>

              {submitError && (
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#DC2626', fontWeight: 700, textAlign: 'center' }}>
                  {submitError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!q1 || !q2 || submitting}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '999px',
                  background: q1 && q2 && !submitting
                    ? 'linear-gradient(135deg, #f472b6, #8b5cf6)'
                    : '#E5E7EB',
                  color: q1 && q2 && !submitting ? '#ffffff' : '#9CA3AF',
                  padding: '13px 16px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: q1 && q2 && !submitting ? 'pointer' : 'not-allowed',
                  fontFamily: "'Nunito', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  boxShadow: q1 && q2 ? '0 4px 14px rgba(139,92,246,0.28)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                {submitting
                  ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
                  : 'Submit Feedback 🌸'
                }
              </button>
            </>
          )}

          {/* ── Step 3: Success ───────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '68px', height: '68px', borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(139,92,246,0.16))',
                border: '1px solid #f5d0fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={32} color="#8B5CF6" strokeWidth={2} />
              </div>

              <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 900, color: '#111827' }}>
                Thank you so much! 🎉
              </h2>
              <p style={{ margin: '0 0 6px', fontSize: '13px', lineHeight: 1.65, color: '#6b7280', fontWeight: 600 }}>
                Your feedback has been recorded and will only be seen by the MensTracker developer.
              </p>
              <p style={{ margin: '0 0 22px', fontSize: '13px', lineHeight: 1.65, color: '#6b7280', fontWeight: 600 }}>
                It helps us decide whether to build cloud sync to keep your data safe. Thank you for helping shape the future of MensTracker 💜
              </p>

              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #f472b6, #8b5cf6)',
                  color: '#ffffff',
                  padding: '13px 16px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spin keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
