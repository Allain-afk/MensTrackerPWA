import { useEffect, useRef, useState } from 'react';
import { APP_COPY } from '../config/appCopy';

interface SplashScreenProps {
  onDone: () => void;
  blocked?: boolean;
}

export function SplashScreen({ onDone, blocked = false }: SplashScreenProps) {
  const [stage, setStage] = useState<'enter' | 'bloom' | 'exit'>('enter');
  const exitTimerRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const bloomTimer = setTimeout(() => setStage('bloom'), 400);
    return () => {
      clearTimeout(bloomTimer);
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      if (doneTimerRef.current !== null) {
        window.clearTimeout(doneTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      blocked ||
      stage !== 'bloom' ||
      exitTimerRef.current !== null ||
      doneTimerRef.current !== null
    ) {
      return;
    }

    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      setStage('exit');
    }, 1800);

    doneTimerRef.current = window.setTimeout(() => {
      doneTimerRef.current = null;
      onDone();
    }, 2300);
  }, [blocked, onDone, stage]);

  const petals = [
    { angle: 0,   delay: '0ms' },
    { angle: 60,  delay: '60ms' },
    { angle: 120, delay: '120ms' },
    { angle: 180, delay: '180ms' },
    { angle: 240, delay: '240ms' },
    { angle: 300, delay: '300ms' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #fce7f3 0%, #ede9fe 55%, #c4b5fd 100%)',
        zIndex: 999,
        opacity: stage === 'exit' ? 0 : 1,
        transition: 'opacity 0.5s ease',
        fontFamily: "'Nunito', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Background shimmer circles */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '260px', height: '260px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,114,182,0.22) 0%, transparent 70%)',
        animation: 'pulse 3s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-40px', left: '-40px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)',
        animation: 'pulse 3s ease-in-out infinite 1s',
      }} />

      {/* Logo lockup */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
        opacity: stage === 'enter' ? 0 : 1,
        transform: stage === 'enter' ? 'scale(0.8) translateY(16px)' : 'scale(1) translateY(0)',
        transition: 'opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Flower icon */}
        <div style={{ position: 'relative', width: '110px', height: '110px' }}>
          {/* Glow ring */}
          <div style={{
            position: 'absolute', inset: '-12px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
            animation: 'glowPulse 2s ease-in-out infinite',
          }} />

          {/* White card backing */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '30px',
            background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 8px 32px rgba(168,85,247,0.2), 0 2px 8px rgba(0,0,0,0.06)',
            backdropFilter: 'blur(8px)',
          }} />

          {/* SVG flower */}
          <svg
            viewBox="0 0 110 110"
            width="110" height="110"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <defs>
              <linearGradient id="petalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* Petals */}
            {petals.map((p, i) => (
              <g key={i} transform={`rotate(${p.angle} 55 55)`}>
                <ellipse
                  cx="55" cy="30"
                  rx="9" ry="20"
                  fill="url(#petalGrad)"
                  opacity={stage === 'bloom' ? 0.92 : 0}
                  style={{
                    transition: `opacity 0.4s ease ${p.delay}, transform 0.4s ease ${p.delay}`,
                    transformOrigin: '55px 55px',
                  }}
                />
              </g>
            ))}

            {/* Center circle */}
            <circle cx="55" cy="55" r="14"
              fill="url(#centerGrad)"
              opacity={stage === 'bloom' ? 1 : 0}
              style={{ transition: 'opacity 0.3s ease 0.35s' }}
            />
            <circle cx="55" cy="55" r="8"
              fill="rgba(255,255,255,0.5)"
              opacity={stage === 'bloom' ? 1 : 0}
              style={{ transition: 'opacity 0.3s ease 0.4s' }}
            />
          </svg>
        </div>

        {/* App name */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: '34px',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            {APP_COPY.appName}
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: '14px',
            fontWeight: 600,
            color: '#9333EA',
            letterSpacing: '0.3px',
            opacity: stage === 'bloom' ? 1 : 0,
            transform: stage === 'bloom' ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s',
          }}>
            {APP_COPY.appTagline} 🌸
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div style={{
        position: 'absolute', bottom: '52px',
        display: 'flex', gap: '8px', alignItems: 'center',
        opacity: stage === 'bloom' ? 1 : 0,
        transition: 'opacity 0.4s ease 0.5s',
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
              animation: `loadingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes loadingDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
