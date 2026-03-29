import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { APP_COPY, withAppName } from '../config/appCopy';

interface OnboardingScreenProps {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { setName } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmed = inputValue.trim();
  const canSubmit = trimmed.length >= 2;

  // Derive initials preview
  const previewInitials = trimmed
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

  const handleSubmit = () => {
    if (!canSubmit) {
      setError('Please enter at least 2 characters.');
      return;
    }
    setError('');
    setSubmitting(true);
    setName(trimmed);
    setTimeout(() => onDone(), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#FAFAFA',
        fontFamily: "'Nunito', sans-serif",
        opacity: submitting ? 0 : 1,
        transition: 'opacity 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Top gradient blob */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          left: '-60px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: '-80px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />

      {/* Status bar space */}
      <div style={{ height: '44px', flexShrink: 0 }} />

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 28px 32px',
          gap: '0',
          overflowY: 'auto',
        }}
      >
        {/* Logo pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #fce7f3, #ede9fe)',
              border: '1.5px solid #E9D5FF',
              borderRadius: '999px',
              padding: '8px 18px',
              boxShadow: '0 2px 10px rgba(168,85,247,0.12)',
            }}
          >
            <span style={{ fontSize: '18px' }}>🌸</span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {APP_COPY.appName}
            </span>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(139,92,246,0.08)',
              borderRadius: '999px',
              padding: '4px 12px',
              marginBottom: '14px',
            }}
          >
            <Sparkles size={12} color="#8B5CF6" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.4px' }}>
              {APP_COPY.onboardingBadge}
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 10px',
              fontSize: '30px',
              fontWeight: 900,
              color: '#111827',
              lineHeight: 1.2,
              letterSpacing: '-0.3px',
            }}
          >
            What should we<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              call you?
            </span>
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: 600,
              lineHeight: 1.6,
            }}
          >
            {withAppName(APP_COPY.onboardingIntro)}
          </p>
        </div>

        {/* Avatar preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative' }}>
            {/* Outer ring */}
            <div
              style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                opacity: canSubmit ? 1 : 0.3,
                transition: 'opacity 0.3s ease',
              }}
            />
            {/* Avatar */}
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: canSubmit
                  ? 'linear-gradient(135deg, #F472B6, #8B5CF6)'
                  : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '3px solid white',
                transition: 'background 0.3s ease',
              }}
            >
              <span
                style={{
                  fontSize: previewInitials === '?' ? '32px' : '26px',
                  fontWeight: 900,
                  color: canSubmit ? 'white' : '#D1D5DB',
                  letterSpacing: '-1px',
                  transition: 'color 0.3s ease',
                  lineHeight: 1,
                }}
              >
                {previewInitials === '?' ? '🌸' : previewInitials}
              </span>
            </div>

            {/* Edit badge */}
            {canSubmit && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                ✓
              </div>
            )}
          </div>
        </div>

        {/* Input field */}
        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: '#6B7280',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}
          >
            YOUR NAME
          </label>
          <div
            style={{
              position: 'relative',
              borderRadius: '18px',
              background: '#ffffff',
              boxShadow: focused
                ? '0 0 0 2.5px #C084FC, 0 4px 16px rgba(168,85,247,0.15)'
                : '0 2px 8px rgba(0,0,0,0.06)',
              border: `2px solid ${focused ? '#C084FC' : error ? '#FCA5A5' : '#F3F4F6'}`,
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) setError('');
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Aria, Sam, Luna…"
              maxLength={40}
              autoComplete="given-name"
              style={{
                width: '100%',
                padding: '16px 52px 16px 20px',
                border: 'none',
                borderRadius: '16px',
                background: 'transparent',
                fontSize: '17px',
                fontWeight: 700,
                color: '#111827',
                outline: 'none',
                fontFamily: "'Nunito', sans-serif",
                boxSizing: 'border-box',
                caretColor: '#A855F7',
              }}
            />
            {/* Character count */}
            {inputValue.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#C4B5FD',
                }}
              >
                {inputValue.length}/40
              </span>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p
              style={{
                margin: '8px 4px 0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#EF4444',
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Name suggestions */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>
            Quick fill:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Aria', 'Maya', 'Luna', 'Sofia', 'Zoe', 'Lily'].map((name) => (
              <button
                key={name}
                onClick={() => {
                  setInputValue(name);
                  setError('');
                }}
                style={{
                  padding: '6px 14px',
                  border: `1.5px solid ${inputValue === name ? '#C084FC' : '#E5E7EB'}`,
                  borderRadius: '999px',
                  background: inputValue === name ? '#F5F3FF' : '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: inputValue === name ? '#7C3AED' : '#6B7280',
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  transition: 'all 0.15s ease',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Features preview */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)',
            border: '1.5px solid #E9D5FF',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#7C3AED', letterSpacing: '0.3px' }}>
            WHAT YOU'LL GET
          </p>
          {[
            { icon: '📅', text: 'Smart period & ovulation predictions' },
            { icon: '📊', text: 'Personalized cycle insights & trends' },
            { icon: '🌸', text: 'Daily symptom tracking & wellness tips' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '17px 24px',
            background: canSubmit
              ? 'linear-gradient(135deg, #F472B6 0%, #C084FC 50%, #8B5CF6 100%)'
              : '#F3F4F6',
            border: 'none',
            borderRadius: '999px',
            color: canSubmit ? 'white' : '#9CA3AF',
            fontSize: '16px',
            fontWeight: 800,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: canSubmit ? '0 8px 24px rgba(168,85,247,0.38)' : 'none',
            fontFamily: "'Nunito', sans-serif",
            transition: 'all 0.25s ease',
            letterSpacing: '0.2px',
          }}
          onMouseDown={(e) => {
            if (canSubmit) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {canSubmit ? (
            <>
              Let's go, {trimmed.split(' ')[0]}!
              <ArrowRight size={18} strokeWidth={3} />
            </>
          ) : (
            'Enter your name to continue'
          )}
        </button>

        {/* Privacy note */}
        <p
          style={{
            margin: '14px 0 0',
            textAlign: 'center',
            fontSize: '11px',
            color: '#9CA3AF',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          🔒 Your data stays on your device.
          <br />We never share your personal information.
        </p>
      </div>
    </div>
  );
}
