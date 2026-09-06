import { useNavigate } from 'react-router';
import { Bell, Droplets, Flower2, Moon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useCycle, dateToKey, getDaysBetween } from '../context/CycleContext';
import { APP_COPY, withAppName } from '../config/appCopy';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type TipPhase = 'Menstrual Phase' | 'Follicular Phase' | 'Ovulatory Phase' | 'Luteal Phase' | 'No cycle data' | 'Any';

type WellnessTip = {
  icon: string;
  text: string;
  phases: TipPhase[];
};

const WELLNESS_TIP_POOL: WellnessTip[] = [
  { icon: '💧', text: 'Drink water steadily today; hydration can help reduce cramps and headaches.', phases: ['Menstrual Phase', 'Any'] },
  { icon: '🛁', text: 'A warm compress for 15 minutes can ease pelvic and lower-back discomfort.', phases: ['Menstrual Phase'] },
  { icon: '🥬', text: 'Add iron-rich foods like spinach, beans, or lentils to support energy.', phases: ['Menstrual Phase', 'Any'] },
  { icon: '🚶', text: 'Try a 15-minute light walk; gentle movement can improve mood and circulation.', phases: ['Menstrual Phase', 'Luteal Phase', 'Any'] },
  { icon: '🌱', text: 'Your energy may rise now; schedule one task you have been postponing.', phases: ['Follicular Phase'] },
  { icon: '🏋️', text: 'If you feel good, this is a great phase for strength or higher-intensity workouts.', phases: ['Follicular Phase', 'Ovulatory Phase'] },
  { icon: '🍓', text: 'Pair protein with fruit at snacks to keep your energy more stable.', phases: ['Follicular Phase', 'Luteal Phase', 'Any'] },
  { icon: '😴', text: 'Aim for a consistent bedtime tonight to support hormone-friendly recovery.', phases: ['Any'] },
  { icon: '⭐', text: 'Use your high-energy window for important conversations or presentations.', phases: ['Ovulatory Phase'] },
  { icon: '💚', text: 'Social connection can feel easier now; reach out to someone supportive.', phases: ['Ovulatory Phase', 'Any'] },
  { icon: '🥗', text: 'Include fiber today to support digestion and reduce bloating swings.', phases: ['Ovulatory Phase', 'Luteal Phase', 'Any'] },
  { icon: '🧘', text: 'Take 5 slow breaths before meals or meetings to reduce stress load.', phases: ['Any'] },
  { icon: '🌙', text: 'Plan a lower-pressure evening; your body may need more recovery in this phase.', phases: ['Luteal Phase'] },
  { icon: '🍫', text: 'Magnesium-rich foods like dark chocolate, nuts, and seeds may ease PMS symptoms.', phases: ['Luteal Phase'] },
  { icon: '🧂', text: 'Go lighter on salty foods today if you are noticing fluid retention or bloating.', phases: ['Luteal Phase', 'Any'] },
  { icon: '📓', text: 'Log one symptom and one mood note today to improve prediction accuracy.', phases: ['Any', 'No cycle data'] },
  { icon: '☀️', text: 'Get morning daylight for 10 minutes to support sleep and mood rhythm.', phases: ['Any'] },
  { icon: '🍽️', text: 'Eat at regular meal times today to help with energy and craving control.', phases: ['Any'] },
  { icon: '🌸', text: 'No recent cycle data yet: mark period days to unlock smarter predictions.', phases: ['No cycle data'] },
  { icon: '🤍', text: 'Small check-in: ask yourself what your body needs most today and honor it.', phases: ['Any'] },
];

function getDailyWellnessTips(currentPhase: string, today: Date): WellnessTip[] {
  const phaseTips = WELLNESS_TIP_POOL.filter((tip) =>
    tip.phases.includes('Any') || tip.phases.includes(currentPhase as TipPhase)
  );

  const source = phaseTips.length >= 2 ? phaseTips : WELLNESS_TIP_POOL;
  const dayBucket = Math.floor(today.getTime() / 86400000);
  const firstIndex = dayBucket % source.length;
  let secondIndex = (firstIndex + Math.ceil(source.length / 2)) % source.length;
  if (secondIndex === firstIndex) {
    secondIndex = (firstIndex + 1) % source.length;
  }

  return [source[firstIndex], source[secondIndex]];
}

const RING_RADIUS = 90;
const RING_CENTER = 120;

export function HomeScreen() {
  const navigate = useNavigate();
  const { name } = useUser();
  const {
    logs, settings, cycleDay, currentPhase, phaseIcon,
    daysUntilNextPeriod, nextPeriodDate, fertileStart, fertileEnd,
    lastPeriodStart,
    lateByDays,
    ovulationDate,
    predictedPeriodRangeStart,
    predictedPeriodRangeEnd,
    predictionConfidenceLabel,
    predictionConfidencePercent,
    estimatedCycleLength,
    estimatedPeriodLength,
  } = useCycle();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateToKey(today);
  const todayLog = logs[todayKey];
  const firstName = name.split(' ')[0] || 'there';
  const hasData = !!lastPeriodStart;

  const cycleLength = estimatedCycleLength || settings.cycleLength;
  const periodLength = estimatedPeriodLength || settings.periodLength;
  const radius = RING_RADIUS;
  const circumference = 2 * Math.PI * radius;

  // Cycle states (Flo-style)
  const isPeriodActive = Boolean(
    todayLog?.isPeriod || (hasData && cycleDay !== null && cycleDay <= periodLength && lateByDays === 0)
  );

  const isPeriodLate = Boolean(hasData && !isPeriodActive && lateByDays > 0);

  const isPeriodDueToday = Boolean(
    hasData && !isPeriodActive && !isPeriodLate && daysUntilNextPeriod === 0
  );

  const isFertileNow = Boolean(
    hasData && !isPeriodActive && !isPeriodLate && fertileStart && fertileEnd && today >= fertileStart && today <= fertileEnd
  );

  const isOvulationDay = Boolean(
    hasData && !isPeriodActive && !isPeriodLate && ovulationDate && today.getTime() === ovulationDate.getTime()
  );

  const isPeriodApproaching = Boolean(
    hasData && !isPeriodActive && !isPeriodLate && !isPeriodDueToday && daysUntilNextPeriod !== null && daysUntilNextPeriod > 0 && daysUntilNextPeriod <= 5
  );

  // Determine Ring presentation attributes
  let ringColor1 = '#F472B6';
  let ringColor2 = '#8B5CF6';
  let ringGlow = 'rgba(236, 72, 153, 0.35)';
  let topRingLabel = `DAY ${cycleDay ?? 0} OF ${cycleLength}`;
  let heroNumber: string | number = cycleDay ?? '—';
  let heroNumberSize = '42px';
  let heroSubtitle = 'Cycle Day';
  let badgeLabel = currentPhase;
  let badgeIconDisplay = phaseIcon;
  let badgeBg = 'rgba(255, 255, 255, 0.9)';
  let badgeColor = '#7C3AED';
  let badgeBorder = '#E9D5FF';
  let ringProgress = hasData && cycleDay ? Math.min(cycleDay / cycleLength, 1) : 0;
  let showQuickLogButton = false;
  let quickLogText = '🩸 Log Period';

  if (!hasData) {
    ringColor1 = '#DDD6FE';
    ringColor2 = '#C084FC';
    ringGlow = 'rgba(192, 132, 252, 0.25)';
    topRingLabel = 'WELCOME';
    heroNumber = '🌸';
    heroNumberSize = '36px';
    heroSubtitle = 'No cycle data yet';
    badgeLabel = 'Tap to start tracking';
    badgeIconDisplay = '✨';
    ringProgress = 0;
  } else if (isPeriodActive) {
    ringColor1 = '#FB7185';
    ringColor2 = '#E11D48';
    ringGlow = 'rgba(225, 29, 72, 0.4)';
    topRingLabel = 'MENSTRUATION';
    heroNumber = cycleDay ? `Day ${cycleDay}` : 'Period';
    heroNumberSize = '36px';
    heroSubtitle = todayLog?.flow ? `${todayLog.flow} Flow` : 'Period Day';
    badgeLabel = 'Menstrual Phase';
    badgeIconDisplay = '🩸';
    badgeBg = '#FFF1F2';
    badgeColor = '#BE123C';
    badgeBorder = '#FECDD3';
    ringProgress = Math.min((cycleDay ?? 1) / periodLength, 1);
    showQuickLogButton = !todayLog?.isPeriod;
    quickLogText = "🩸 Log Today's Period";
  } else if (isPeriodLate) {
    // ⚠️ Late Period (Flo-style)
    ringColor1 = '#F97316';
    ringColor2 = '#EF4444';
    ringGlow = 'rgba(239, 68, 68, 0.45)';
    topRingLabel = `CYCLE DAY ${cycleDay}`;
    heroNumber = lateByDays;
    heroNumberSize = '48px';
    heroSubtitle = lateByDays === 1 ? 'Day Late' : 'Days Late';
    badgeLabel = lateByDays === 1 ? 'Period is 1 day late' : `Period is ${lateByDays} days late`;
    badgeIconDisplay = '⏳';
    badgeBg = '#FFF7ED';
    badgeColor = '#C2410C';
    badgeBorder = '#FFEDD5';
    ringProgress = 1;
    showQuickLogButton = true;
    quickLogText = '🩸 Log Period';
  } else if (isPeriodDueToday) {
    ringColor1 = '#F472B6';
    ringColor2 = '#E11D48';
    ringGlow = 'rgba(244, 114, 182, 0.5)';
    topRingLabel = `DAY ${cycleDay} OF ${cycleLength}`;
    heroNumber = 'Today';
    heroNumberSize = '36px';
    heroSubtitle = 'Period Expected';
    badgeLabel = 'Period Due Today';
    badgeIconDisplay = '🩸';
    badgeBg = '#FDF2F8';
    badgeColor = '#BE185D';
    badgeBorder = '#FCE7F3';
    ringProgress = 1;
    showQuickLogButton = true;
    quickLogText = 'Did it start? Log here';
  } else if (isOvulationDay) {
    ringColor1 = '#34D399';
    ringColor2 = '#059669';
    ringGlow = 'rgba(16, 185, 129, 0.4)';
    topRingLabel = 'PEAK FERTILITY';
    heroNumber = 'Peak';
    heroNumberSize = '36px';
    heroSubtitle = 'Ovulation Day';
    badgeLabel = 'Ovulatory Phase';
    badgeIconDisplay = '⭐';
    badgeBg = '#ECFDF5';
    badgeColor = '#047857';
    badgeBorder = '#A7F3D0';
    ringProgress = Math.min((cycleDay! - 1) / cycleLength, 1);
  } else if (isFertileNow) {
    ringColor1 = '#34D399';
    ringColor2 = '#10B981';
    ringGlow = 'rgba(16, 185, 129, 0.35)';
    topRingLabel = 'FERTILE WINDOW';
    heroNumber = 'High';
    heroNumberSize = '38px';
    heroSubtitle = 'Chance of pregnancy';
    badgeLabel = 'Fertile Window';
    badgeIconDisplay = '🌱';
    badgeBg = '#ECFDF5';
    badgeColor = '#047857';
    badgeBorder = '#A7F3D0';
    ringProgress = Math.min((cycleDay! - 1) / cycleLength, 1);
  } else if (isPeriodApproaching) {
    ringColor1 = '#C084FC';
    ringColor2 = '#8B5CF6';
    ringGlow = 'rgba(139, 92, 246, 0.35)';
    topRingLabel = `DAY ${cycleDay} OF ${cycleLength}`;
    heroNumber = daysUntilNextPeriod ?? 1;
    heroNumberSize = '48px';
    heroSubtitle = daysUntilNextPeriod === 1 ? 'Day until period' : 'Days until period';
    badgeLabel = 'Luteal Phase';
    badgeIconDisplay = '🍂';
    badgeBg = '#FAF5FF';
    badgeColor = '#7E22CE';
    badgeBorder = '#F3E8FF';
    ringProgress = Math.min((cycleDay! - 1) / cycleLength, 1);
  } else {
    ringColor1 = '#F472B6';
    ringColor2 = '#A855F7';
    ringGlow = 'rgba(236, 72, 153, 0.35)';
    topRingLabel = `DAY ${cycleDay} OF ${cycleLength}`;
    heroNumber = `Day ${cycleDay}`;
    heroNumberSize = '38px';
    heroSubtitle = currentPhase;
    badgeLabel = currentPhase;
    badgeIconDisplay = phaseIcon;
    badgeBg = 'rgba(255, 255, 255, 0.9)';
    badgeColor = '#7C3AED';
    badgeBorder = '#E9D5FF';
    ringProgress = Math.min((cycleDay! - 1) / cycleLength, 1);
  }

  const strokeDashoffset = circumference * (1 - ringProgress);

  // Fertile window status label
  let fertileLabel = '—';
  if (fertileStart && fertileEnd && !isPeriodLate) {
    if (today >= fertileStart && today <= fertileEnd) {
      fertileLabel = 'Now 🟢';
    } else if (today < fertileStart) {
      const daysUntil = getDaysBetween(today, fertileStart);
      fertileLabel = `In ${daysUntil}d`;
    } else {
      fertileLabel = 'Ended';
    }
  } else if (isPeriodLate) {
    fertileLabel = 'Ended';
  }

  // Next period display
  let nextPeriodLabel = '—';
  if (isPeriodLate) {
    nextPeriodLabel = `${lateByDays}d late`;
  } else if (nextPeriodDate) {
    nextPeriodLabel = `${MONTH_NAMES[nextPeriodDate.getMonth()]} ${nextPeriodDate.getDate()}`;
  }

  // Hour greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning ✨' : hour < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙';

  const wellnessTips = getDailyWellnessTips(currentPhase, today);

  // Recent symptoms from today
  const todaySymptoms: string[] = todayLog
    ? [
        ...(todayLog.flow ? [`${todayLog.flow} Flow`] : []),
        ...todayLog.moods,
        ...todayLog.symptoms,
        ...(todayLog.hadIntimacy ? ['Intimacy'] : []),
        ...(todayLog.protectionUsed ? [`Protection: ${todayLog.protectionUsed}`] : []),
        ...(todayLog.sleepQuality ? [`Sleep: ${todayLog.sleepQuality}`] : []),
        ...(todayLog.energyLevel ? [`Energy: ${todayLog.energyLevel}`] : []),
        ...((todayLog.waterGlasses ?? 0) > 0 ? [`💧 ${todayLog.waterGlasses}g`] : []),
        ...(todayLog.cervicalMucus ? [`CM: ${todayLog.cervicalMucus}`] : []),
      ]
    : [];

  const nextPeriodWindow = predictedPeriodRangeStart && predictedPeriodRangeEnd
    ? `${MONTH_NAMES[predictedPeriodRangeStart.getMonth()]} ${predictedPeriodRangeStart.getDate()} - ${MONTH_NAMES[predictedPeriodRangeEnd.getMonth()]} ${predictedPeriodRangeEnd.getDate()}`
    : '—';

  return (
    <div className="ios-scroll-view" style={{ height: '100%', background: '#F8F4FF', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 60%, #ede9fe 100%)',
        padding: 'calc(8px + env(safe-area-inset-top, 0px)) 20px 24px', position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(244,114,182,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#A855F7', fontWeight: 600, margin: 0, letterSpacing: '0.3px' }}>{greeting}</p>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1.2 }}>{firstName}</h1>
          </div>
          <button
            onClick={() => navigate('/settings')}
            aria-label={hasData ? 'Open settings' : 'Open settings (setup needed)'}
            style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)', position: 'relative' }}
          >
            <Bell size={20} color="#6D28D9" strokeWidth={2} aria-hidden="true" />
            {!hasData && (
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#EC4899', borderRadius: '50%', border: '2px solid white' }} />
            )}
          </button>
        </div>

        {/* Cycle ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '220px', height: '220px' }}>
            <svg viewBox="0 0 240 240" width="220" height="220" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="ringGrad" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="220" y2="220">
                  <stop offset="0%" stopColor={ringColor1} />
                  <stop offset="100%" stopColor={ringColor2} />
                </linearGradient>
                <radialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fdf4ff" />
                  <stop offset="100%" stopColor="#f5f0ff" />
                </radialGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <circle cx={RING_CENTER} cy={RING_CENTER} r={radius} fill="none" stroke="#ede9fe" strokeWidth="18" />

              {hasData && (
                <circle
                  cx={RING_CENTER} cy={RING_CENTER} r={radius}
                  fill="none" stroke="url(#ringGrad)" strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
                  style={{ filter: `drop-shadow(0 0 6px ${ringGlow})` }}
                />
              )}

              <circle cx={RING_CENTER} cy={RING_CENTER} r="72" fill="url(#innerGrad)" />

              {/* Tick marks */}
              {Array.from({ length: isPeriodLate ? 28 : Math.min(cycleLength, 35) }).map((_, i) => {
                const totalTicks = isPeriodLate ? 28 : Math.min(cycleLength, 35);
                const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2;
                const tickR = 108;
                const x = 120 + tickR * Math.cos(angle);
                const y = 120 + tickR * Math.sin(angle);
                const isDone = cycleDay !== null && (isPeriodLate || i < cycleDay);
                return (
                  <circle key={i} cx={x} cy={y}
                    r={!isPeriodLate && cycleDay !== null && i === cycleDay - 1 ? 4 : 2.5}
                    fill={
                      !hasData ? '#E9D5FF'
                      : isPeriodLate ? (i % 2 === 0 ? '#FB923C' : '#FDBA74')
                      : isDone ? (i === (cycleDay ?? 0) - 1 ? '#9333EA' : '#C084FC')
                      : '#E9D5FF'
                    }
                  />
                );
              })}
            </svg>

            {/* Inner text */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <span style={{ fontSize: '10.5px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {topRingLabel}
              </span>
              <span style={{
                fontSize: heroNumberSize,
                fontWeight: 900,
                lineHeight: 1.05,
                background: `linear-gradient(135deg, ${ringColor1}, ${ringColor2})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {heroNumber}
              </span>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, textAlign: 'center', lineHeight: 1.3, marginTop: '2px', whiteSpace: 'pre-line' }}>
                {heroSubtitle}
              </span>
            </div>
          </div>

          {/* Phase badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: badgeBg,
            border: `1.5px solid ${badgeBorder}`,
            borderRadius: '999px',
            padding: '6px 14px',
            boxShadow: '0 2px 8px rgba(139,92,246,0.1)',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: '14px' }}>{badgeIconDisplay}</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: badgeColor }}>{badgeLabel}</span>
          </div>

          {/* Flo-style Quick Log action button */}
          {showQuickLogButton && (
            <button
              type="button"
              className="tap-active animate-slide-up"
              onClick={() => navigate(`/log?date=${todayKey}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                background: isPeriodLate
                  ? 'linear-gradient(135deg, #F97316, #EF4444)'
                  : 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                border: 'none',
                borderRadius: '999px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                boxShadow: isPeriodLate
                  ? '0 4px 14px rgba(239, 68, 68, 0.35)'
                  : '0 4px 14px rgba(244, 114, 182, 0.35)',
              }}
            >
              {quickLogText}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { icon: <Droplets size={16} color="#EC4899" />, label: 'Cycle Day', value: cycleDay != null ? `${cycleDay}` : '—' },
            { icon: <Moon size={16} color="#8B5CF6" />, label: 'Predicted Next Period', value: nextPeriodLabel },
            { icon: <Flower2 size={16} color="#10B981" />, label: 'Fertile', value: fertileLabel },
          ].map((stat) => (
            <div key={stat.label} style={{ background: '#ffffff', borderRadius: '24px', padding: '14px 8px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 800,
                color: stat.label === 'Predicted Next Period' && isPeriodLate ? '#EA580C' : '#1F2937'
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginTop: '2px', lineHeight: 1.25 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Prediction Quality ────────────────────────────────────────────── */}
      {hasData && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Prediction Quality</p>
              <span style={{ fontSize: '11px', fontWeight: 800, color: predictionConfidenceLabel === 'High' ? '#059669' : predictionConfidenceLabel === 'Medium' ? '#D97706' : '#DC2626' }}>
                {predictionConfidenceLabel} ({predictionConfidencePercent}%)
              </span>
            </div>
            <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${predictionConfidencePercent}%`, background: 'linear-gradient(90deg, #F472B6, #8B5CF6)', borderRadius: '999px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>
              Predicted period window: {nextPeriodWindow}
            </p>
          </div>
        </div>
      )}

      {/* ── CTA Button ───────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={() => navigate('/log')}
          style={{
            width: '100%', padding: '18px 28px',
            background: 'linear-gradient(135deg, #F472B6 0%, #C084FC 50%, #8B5CF6 100%)',
            border: 'none', borderRadius: '9999px', color: 'white', fontSize: '16px', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            boxShadow: '0 8px 24px rgba(168,85,247,0.35)', fontFamily: "'Nunito', sans-serif",
            letterSpacing: '0.4px', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <span style={{ fontSize: '18px' }}>🌸</span>
          {todayLog ? "Edit Today's Log" : "Log Today's Symptoms"}
        </button>
      </div>

      {/* ── No-data onboarding prompt ─────────────────────────────────────── */}
      {!hasData && (
        <div style={{ margin: '14px 16px 0', background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)', border: '1.5px solid #E9D5FF', borderRadius: '20px', padding: '16px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>{withAppName(APP_COPY.homeEmptyWelcome)}</p>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#6B7280', fontWeight: 600, lineHeight: 1.5 }}>
            Log your first period day to unlock cycle predictions, phase tracking, and personalized wellness tips.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { step: '1', text: 'Tap "Log Today\'s Symptoms"' },
              { step: '2', text: 'Toggle "Period Day" if you\'re on your period' },
              { step: '3', text: 'Save — predictions unlock automatically!' },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #F472B6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'white' }}>{item.step}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's Log Summary ───────────────────────────────────────────── */}
      {todayLog && todaySymptoms.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '14px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1F2937', margin: 0 }}>Today's Log</h3>
              <button
                onClick={() => navigate('/log')}
                style={{ fontSize: '11px', fontWeight: 700, color: '#A855F7', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
              >
                Edit →
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {todayLog.isPeriod && (
                <span style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(252,231,243,0.5))', border: '1.5px solid #FBCFE8', borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, color: '#BE185D' }}>
                  🩸 Period Day
                </span>
              )}
              {todaySymptoms.filter(s => s !== 'Period Day').map((symptom) => (
                <span key={symptom} style={{ background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)', border: '1.5px solid #E9D5FF', borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Wellness Tips ─────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1F2937', margin: '0 0 10px' }}>
          Wellness Tips {phaseIcon}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {wellnessTips.map((tip, i) => (
            <div key={i} style={{ background: '#ffffff', borderRadius: '16px', padding: '13px 15px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', fontWeight: 600, lineHeight: 1.4 }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
