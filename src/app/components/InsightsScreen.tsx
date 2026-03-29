import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  useCycle, getPeriodLength, getDaysBetween,
} from '../context/CycleContext';
import { APP_COPY } from '../config/appCopy';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CustomTip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1.5px solid #E9D5FF', borderRadius: '12px', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: "'Nunito', sans-serif" }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>{payload[0].value} days</p>
      </div>
    );
  }
  return null;
};

export function InsightsScreen() {
  const navigate = useNavigate();
  const {
    logs,
    periodStarts,
    nextPeriodDate,
    ovulationDate,
    fertileStart,
    fertileEnd,
    daysUntilNextPeriod,
    predictionConfidenceLabel,
    predictionConfidencePercent,
    estimatedCycleLength,
    estimatedPeriodLength,
    cycleVariability,
    lateByDays,
    predictedPeriodRangeStart,
    predictedPeriodRangeEnd,
    settings,
  } = useCycle();

  // ── Compute cycle history ──────────────────────────────────────────────────
  const { cycleLengths, periodLengths } = useMemo(() => {
    const computedCycleLengths: { month: string; length: number; isCurrent: boolean }[] = [];
    const computedPeriodLengths: { month: string; days: number; isCurrent: boolean }[] = [];

    for (let i = 0; i < periodStarts.length; i++) {
      const start = periodStarts[i];
      const label = `${MONTH_NAMES[start.getMonth()]} '${String(start.getFullYear()).slice(2)}`;
      const isCurrent = i === periodStarts.length - 1;

      const pLen = getPeriodLength(start, logs);
      computedPeriodLengths.push({ month: label, days: pLen, isCurrent });

      if (i < periodStarts.length - 1) {
        const next = periodStarts[i + 1];
        const cycLen = getDaysBetween(start, next);
        computedCycleLengths.push({ month: label, length: cycLen, isCurrent: false });
      }
    }

    return { cycleLengths: computedCycleLengths, periodLengths: computedPeriodLengths };
  }, [periodStarts, logs]);

  // Limit to last 6 entries for readability
  const cycleChartData = cycleLengths.slice(-6);
  const periodChartData = periodLengths.slice(-6);

  const hasCycleData = cycleLengths.length >= 1;
  const hasPeriodData = periodLengths.length >= 1;

  const avgCycleLen = hasCycleData
    ? Math.round(cycleLengths.reduce((s, c) => s + c.length, 0) / cycleLengths.length)
    : null;
  const avgPeriodLen = hasPeriodData
    ? Math.round(periodLengths.reduce((s, p) => s + p.days, 0) / periodLengths.length)
    : null;
  const maxCycle = hasCycleData ? Math.max(...cycleLengths.map(c => c.length)) : null;
  const minCycle = hasCycleData ? Math.min(...cycleLengths.map(c => c.length)) : null;
  const cycleDomain: [number, number] = hasCycleData
    ? [Math.max(18, (minCycle ?? 18) - 2), (maxCycle ?? 36) + 2]
    : [20, 36];

  const formatDateShort = (d: Date) => `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;

  // Regularity: standard deviation of cycle lengths
  let regularityPct = 0;
  let regularityLabel = 'Regular';
  if (hasCycleData && avgCycleLen !== null && cycleLengths.length >= 2) {
    const variance = cycleLengths.reduce((s, c) => s + Math.pow(c.length - avgCycleLen, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);
    regularityPct = Math.max(0, Math.min(100, Math.round(100 - stdDev * 10)));
    regularityLabel = stdDev <= 2 ? 'Very Regular' : stdDev <= 4 ? 'Regular' : stdDev <= 6 ? 'Irregular' : 'Variable';
  } else if (hasCycleData) {
    regularityPct = 100;
  }

  // Next period predictions
  const nextPeriodStr = nextPeriodDate
    ? formatDateShort(nextPeriodDate)
    : null;
  const nextFertileStr = fertileStart && fertileEnd
    ? `${formatDateShort(fertileStart)}–${formatDateShort(fertileEnd)}`
    : null;
  const ovulationStr = ovulationDate
    ? formatDateShort(ovulationDate)
    : null;

  const totalCyclesTracked = periodStarts.length;

  const intimacyLogs = Object.values(logs).filter((l) => l.hadIntimacy);
  const protectedIntimacy = intimacyLogs.filter((l) => l.protectionUsed && l.protectionUsed !== 'None').length;
  const protectionRate = intimacyLogs.length > 0 ? Math.round((protectedIntimacy / intimacyLogs.length) * 100) : null;
  const predictionRange = predictedPeriodRangeStart && predictedPeriodRangeEnd
    ? `${formatDateShort(predictedPeriodRangeStart)}–${formatDateShort(predictedPeriodRangeEnd)}`
    : null;
  const periSymptoms = ['Hot Flashes', 'Night Sweats', 'Sleep Changes', 'Cycle Spotting'];
  const periSymptomDays = Object.values(logs).filter((l) => l.symptoms.some((s) => periSymptoms.includes(s))).length;

  // ── New wellness stats ─────────────────────────────────────────────────────
  const allLogs = Object.values(logs);
  const logsWithSleep = allLogs.filter((l) => l.sleepQuality);
  const sleepDist = { Poor: 0, Fair: 0, Good: 0, Great: 0 };
  logsWithSleep.forEach((l) => { if (l.sleepQuality) sleepDist[l.sleepQuality]++; });
  const topSleep = logsWithSleep.length > 0
    ? (Object.entries(sleepDist).sort((a, b) => b[1] - a[1])[0][0] as string)
    : null;

  const logsWithEnergy = allLogs.filter((l) => l.energyLevel);
  const energyDist = { Low: 0, Medium: 0, High: 0 };
  logsWithEnergy.forEach((l) => { if (l.energyLevel) energyDist[l.energyLevel]++; });
  const topEnergy = logsWithEnergy.length > 0
    ? (Object.entries(energyDist).sort((a, b) => b[1] - a[1])[0][0] as string)
    : null;

  const logsWithWater = allLogs.filter((l) => (l.waterGlasses ?? 0) > 0);
  const avgWater = logsWithWater.length > 0
    ? Math.round(logsWithWater.reduce((s, l) => s + (l.waterGlasses ?? 0), 0) / logsWithWater.length)
    : null;

  const logsWithCM = allLogs.filter((l) => l.cervicalMucus);
  const cmDist: Record<string, number> = {};
  logsWithCM.forEach((l) => { if (l.cervicalMucus) cmDist[l.cervicalMucus] = (cmDist[l.cervicalMucus] ?? 0) + 1; });
  const topCM = logsWithCM.length > 0
    ? Object.entries(cmDist).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const hasWellnessData = logsWithSleep.length > 0 || logsWithEnergy.length > 0 || logsWithWater.length > 0 || logsWithCM.length > 0;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (totalCyclesTracked === 0) {
    return (
      <div style={{ height: '100%', background: '#FAFAFA', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 100%)', padding: '8px 20px 20px', flexShrink: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Your Insights 📊</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '28px', background: 'linear-gradient(135deg, #fce7f3, #ede9fe)', border: '1.5px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', marginBottom: '20px', boxShadow: '0 8px 24px rgba(168,85,247,0.12)' }}>
            📊
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1F2937', margin: '0 0 10px' }}>{APP_COPY.insightsEmptyTitle}</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600, lineHeight: 1.6, margin: '0 0 28px' }}>
            Start logging your periods to unlock<br />beautiful cycle insights and trends.
          </p>
          <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)', border: '1.5px solid #E9D5FF', borderRadius: '20px', padding: '18px', width: '100%', maxWidth: '280px', marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, color: '#7C3AED', letterSpacing: '0.4px' }}>WHAT YOU'LL UNLOCK</p>
            {[
              { icon: '📈', text: 'Cycle length trends over time' },
              { icon: '🩸', text: 'Period duration history' },
              { icon: '🔮', text: 'Accurate future predictions' },
              { icon: '📊', text: 'Regularity & pattern analysis' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>{item.text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/log')}
            style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #F472B6, #8B5CF6)', border: 'none', borderRadius: '999px', color: 'white', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: '0 6px 20px rgba(168,85,247,0.35)' }}
          >
            Log Your First Period 🌸
          </button>
        </div>
      </div>
    );
  }

  // ── Data state ─────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', background: '#FAFAFA', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 100%)', padding: '8px 20px 18px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 2px' }}>Your Insights 📊</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#A855F7', fontWeight: 600 }}>
          {totalCyclesTracked} period{totalCyclesTracked !== 1 ? 's' : ''} tracked
          {cycleLengths.length >= 1 ? ` · avg ${avgCycleLen}-day cycle` : ''}
        </p>
      </div>

      <div style={{ padding: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Cycle Length Chart — only if ≥ 2 period starts */}
        {cycleLengths.length >= 1 ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Cycle Length</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Days per cycle</p>
              </div>
              <div style={{ background: '#F5F3FF', borderRadius: '10px', padding: '4px 10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#7C3AED' }}>avg {avgCycleLen}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={cycleChartData} barCategoryGap="30%">
                <defs>
                  <linearGradient id="barGradCycle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF', fontFamily: "'Nunito', sans-serif" }} />
                <YAxis
                  domain={cycleDomain}
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#D1D5DB', fontFamily: "'Nunito', sans-serif" }}
                  width={22}
                />
                <Tooltip content={<CustomTip />} cursor={{ fill: 'rgba(233,213,255,0.3)', radius: 8 }} />
                {avgCycleLen && <ReferenceLine y={avgCycleLen} stroke="#E9D5FF" strokeDasharray="4 4" strokeWidth={1.5} />}
                <Bar dataKey="length" radius={[7, 7, 3, 3]}>
                  {cycleChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.isCurrent ? 'url(#barGradActive)' : 'url(#barGradCycle)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {avgCycleLen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'center' }}>
                <div style={{ width: '18px', height: '2px', background: '#E9D5FF', borderRadius: '1px' }} />
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>{avgCycleLen}-day average</span>
                <div style={{ width: '18px', height: '2px', background: '#E9D5FF', borderRadius: '1px' }} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)', border: '1.5px dashed #E9D5FF', borderRadius: '20px', padding: '18px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '20px' }}>📈</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#9CA3AF' }}>Track your next period to see cycle length trends</p>
          </div>
        )}

        {/* Period Length Chart */}
        {periodLengths.length >= 1 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Period Duration</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Days per period</p>
              </div>
              <div style={{ background: '#FDF2F8', borderRadius: '10px', padding: '4px 10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#EC4899' }}>avg {avgPeriodLen}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={periodChartData} barCategoryGap="30%">
                <defs>
                  <linearGradient id="barGradPeriod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F9A8D4" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF', fontFamily: "'Nunito', sans-serif" }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#D1D5DB', fontFamily: "'Nunito', sans-serif" }} width={22} />
                <Tooltip content={<CustomTip />} cursor={{ fill: 'rgba(251,207,232,0.3)', radius: 8 }} />
                <Bar dataKey="days" radius={[7, 7, 3, 3]} fill="url(#barGradPeriod)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary stat cards */}
        {hasCycleData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: '🔄', label: 'Avg Cycle Length', value: avgCycleLen ? `${avgCycleLen} Days` : '—', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
              { icon: '🩸', label: 'Avg Period Length', value: avgPeriodLen ? `${avgPeriodLen} Days` : '—', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
              { icon: '📈', label: 'Longest Cycle', value: maxCycle ? `${maxCycle} Days` : '—', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
              { icon: '📉', label: 'Shortest Cycle', value: minCycle ? `${minCycle} Days` : '—', color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8' },
            ].map((stat) => (
              <div key={stat.label} style={{ background: stat.bg, borderRadius: '18px', padding: '14px', border: `1.5px solid ${stat.border}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                <span style={{ fontSize: '17px', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', lineHeight: 1.3 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Predictions Card */}
        {(nextPeriodStr || nextFertileStr || ovulationStr) && (
          <div style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%)', borderRadius: '20px', padding: '16px', border: '1.5px solid #E9D5FF' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Upcoming Predictions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                nextPeriodStr && {
                  label: 'Next Period',
                  value: nextPeriodStr,
                  icon: '🌸',
                  note:
                    daysUntilNextPeriod != null
                      ? daysUntilNextPeriod === 0
                        ? 'Today'
                        : `In ${daysUntilNextPeriod} day${daysUntilNextPeriod !== 1 ? 's' : ''}`
                      : '',
                },
                nextFertileStr && { label: 'Fertile Window', value: nextFertileStr, icon: '💚', note: 'Next cycle' },
                ovulationStr && { label: 'Ovulation Est.', value: ovulationStr, icon: '⭐', note: 'Estimated' },
              ].filter(Boolean).map((pred: any) => (
                <div key={pred.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.75)', borderRadius: '14px', padding: '11px 13px', backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{pred.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>{pred.label}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1F2937', fontWeight: 800 }}>{pred.value}</p>
                  </div>
                  {pred.note && (
                    <span style={{ background: 'linear-gradient(135deg, #fce7f3, #ede9fe)', border: '1px solid #E9D5FF', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6', flexShrink: 0 }}>
                      {pred.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Accuracy Engine (Offline)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '14px', padding: '10px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>Estimated Cycle</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#6D28D9', fontWeight: 900 }}>{estimatedCycleLength} days</p>
            </div>
            <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: '14px', padding: '10px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>Estimated Period</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#BE185D', fontWeight: 900 }}>{estimatedPeriodLength} days</p>
            </div>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#4B5563', fontWeight: 700 }}>
            Confidence: <span style={{ color: predictionConfidenceLabel === 'High' ? '#059669' : predictionConfidenceLabel === 'Medium' ? '#D97706' : '#DC2626' }}>{predictionConfidenceLabel} ({predictionConfidencePercent}%)</span>
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
            Variability: {cycleVariability.toFixed(1)} days {predictionRange ? `• Next window: ${predictionRange}` : ''}
          </p>
          {lateByDays > 0 && (
            <p style={{ margin: 0, fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>
              Period appears late by {lateByDays} day{lateByDays !== 1 ? 's' : ''} based on logged history.
            </p>
          )}
          {settings.perimenopauseMode && (
            <p style={{ margin: lateByDays > 0 ? '6px 0 0' : 0, fontSize: '12px', color: '#9F1239', fontWeight: 700 }}>
              Perimenopause mode is active. Prediction windows are intentionally broader.
            </p>
          )}
        </div>

        {settings.perimenopauseMode && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Perimenopause Symptom Trend</h3>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#4B5563', fontWeight: 700 }}>
              Logged days with peri symptoms: {periSymptomDays}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
              Track hot flashes, night sweats, sleep changes, and spotting to improve pattern clarity.
            </p>
          </div>
        )}

        {intimacyLogs.length > 0 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Intimacy Tracking</h3>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#4B5563', fontWeight: 700 }}>
              Logged activity days: {intimacyLogs.length}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
              Protection used on {protectionRate ?? 0}% of logged intimacy days.
            </p>
          </div>
        )}

        {/* Regularity */}
        {cycleLengths.length >= 2 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Cycle Regularity</h3>
              <span style={{ fontSize: '13px', fontWeight: 800, color: regularityPct >= 75 ? '#059669' : '#F59E0B' }}>
                {regularityLabel} {regularityPct >= 75 ? '✓' : '~'}
              </span>
            </div>
            <div style={{ height: '10px', background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${regularityPct}%`, background: 'linear-gradient(90deg, #F472B6, #8B5CF6)', borderRadius: '999px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>Irregular</span>
              <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 700 }}>{regularityPct}% — {regularityLabel}</span>
              <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>Consistent</span>
            </div>
          </div>
        )}

        {/* Nudge to track more if only 1 period */}
        {totalCyclesTracked === 1 && cycleLengths.length === 0 && (
          <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)', border: '1.5px dashed #E9D5FF', borderRadius: '20px', padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: '18px' }}>🔮</p>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Almost there!</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', fontWeight: 600, lineHeight: 1.5 }}>
              Log your next period to unlock full<br />cycle analytics and trend charts.
            </p>
          </div>
        )}

        {/* Wellness Snapshot */}
        {hasWellnessData && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Wellness Snapshot</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {topSleep && (
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '14px', padding: '12px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>🛌 Most Common Sleep</p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#6D28D9', fontWeight: 900 }}>{topSleep}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#A78BFA', fontWeight: 600 }}>{logsWithSleep.length} days logged</p>
                </div>
              )}
              {topEnergy && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '12px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>⚡ Most Common Energy</p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#B45309', fontWeight: 900 }}>{topEnergy}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#F59E0B', fontWeight: 600 }}>{logsWithEnergy.length} days logged</p>
                </div>
              )}
              {avgWater !== null && (
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '14px', padding: '12px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>💧 Avg Hydration</p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#0369a1', fontWeight: 900 }}>{avgWater} glasses</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#38BDF8', fontWeight: 600 }}>per tracked day</p>
                </div>
              )}
              {topCM && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '14px', padding: '12px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>🌊 Most Common CM</p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#047857', fontWeight: 900 }}>{topCM}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#10B981', fontWeight: 600 }}>{logsWithCM.length} days logged</p>
                </div>
              )}
            </div>
            {/* Sleep breakdown */}
            {logsWithSleep.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#9CA3AF' }}>SLEEP DISTRIBUTION</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['Poor', 'Fair', 'Good', 'Great'] as const).map((level) => {
                    const count = sleepDist[level];
                    const pct = logsWithSleep.length > 0 ? Math.round((count / logsWithSleep.length) * 100) : 0;
                    const color = level === 'Poor' ? '#EF4444' : level === 'Fair' ? '#F59E0B' : level === 'Good' ? '#10B981' : '#059669';
                    return (
                      <div key={level} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                          <div style={{ width: '100%', background: `${color}30`, borderRadius: '4px 4px 0 0', height: `${Math.max(4, pct * 0.4)}px`, position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: color, borderRadius: '4px 4px 0 0', height: `${Math.max(2, pct * 0.4)}px` }} />
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#9CA3AF' }}>{level}</p>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color }}>{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
