import { useRef, useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Edit3,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X,
} from 'lucide-react';
import { useCycle, dateToKey, keyToDate, getDaysBetween, addDays } from '../context/CycleContext';
import type { DayLog } from '../data/models';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { SmartPeriodCatchUpModal } from './SmartPeriodCatchUpModal';
import { CycleLegendModal } from './CycleLegendModal';
import { MonthYearPickerModal } from './MonthYearPickerModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOOD_EMOJI: Record<string, string> = {
  Happy: '😊', Sensitive: '🌸', Sad: '😔', Energized: '⚡',
  Anxious: '😰', Irritable: '😤', Calm: '😌', Overwhelmed: '😵',
  Focused: '🎯', Indifferent: '😶', Hopeful: '🌟', Restless: '🌀',
};

const SYMPTOM_EMOJI: Record<string, string> = {
  Cramps: '😣', Headache: '🤕', Bloating: '😮', Fatigue: '😴',
  'Back Pain': '🔴', Nausea: '🤢', 'Hot Flashes': '🔥', 'Night Sweats': '💦',
  'Sleep Changes': '🛌', 'Cycle Spotting': '🩹', 'Tender Breasts': '🫀',
  Acne: '⚡', Constipation: '🧱', Diarrhea: '💧', Dizziness: '💫',
  'Joint Pain': '🦴', 'Appetite Changes': '🍽️', Cravings: '🍫', 'Pelvic Pressure': '🫁',
};

const TOTAL_MONTHS = 600; // 50 years window (25 back, 25 forward)
const INITIAL_INDEX = 300;

type FilterType = 'all' | 'intimacy' | 'period' | 'logs';

interface MonthGridProps {
  index: number;
  periodEditMode: boolean;
  periodEditKeys: Set<string>;
  selectedKey: string | null;
  setSelectedKey: React.Dispatch<React.SetStateAction<string | null>>;
  activeFilter: FilterType;
  togglePeriodDay: (key: string) => void;
  ovulationKeys: Set<string>;
  isProjectedCurrentPeriod: (key: string) => boolean;
}

const getMonthYearFromIndex = (index: number) => {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth() + (index - INITIAL_INDEX), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

const MonthGrid = memo(({
  index,
  periodEditMode,
  periodEditKeys,
  selectedKey,
  setSelectedKey,
  activeFilter,
  togglePeriodDay,
  ovulationKeys,
  isProjectedCurrentPeriod,
}: MonthGridProps) => {
  const { year, month } = useMemo(() => getMonthYearFromIndex(index), [index]);
  const { logs, isPeriodDay, isPredictedPeriod, isFertileDay } = useCycle();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateToKey(today);

  const { weeks, getDayKey, isDayToday, isDayFuture } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const wks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) wks.push(cells.slice(i, i + 7));

    const getDayKeyFn = (day: number) =>
      `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isDayTodayFn = (day: number) => getDayKeyFn(day) === todayKey;
    const isDayFutureFn = (day: number) => {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      return d > today;
    };

    return { weeks: wks, getDayKey: getDayKeyFn, isDayToday: isDayTodayFn, isDayFuture: isDayFutureFn };
  }, [year, month, todayKey, today]);

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '8px 0 14px',
      }}>
        <span style={{
          fontSize: '15px',
          fontWeight: 800,
          color: '#1F2937',
          background: 'rgba(243, 232, 255, 0.5)',
          padding: '4px 14px',
          borderRadius: '999px',
          letterSpacing: '-0.2px',
        }}>
          {MONTHS[month]} {year}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 0' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'contents' }}>
            {week.map((day, di) => {
              if (!day) return <div key={`empty-${wi}-${di}`} style={{ height: '50px' }} />;

              const key = getDayKey(day);
              const period = isPeriodDay(key);
              const projected = isProjectedCurrentPeriod(key);
              const predicted = isPredictedPeriod(key);
              const fertile = isFertileDay(key);
              const isToday = isDayToday(day);
              const isOvulation = ovulationKeys.has(key);
              const selected = periodEditMode ? periodEditKeys.has(key) : selectedKey === key;
              const logEntry = logs[key];
              const hasLog = Boolean(logEntry);
              const hasIntimacy = Boolean(logEntry?.hadIntimacy);
              const hasDetails = Boolean(
                logEntry && (
                  (logEntry.moods && logEntry.moods.length > 0) ||
                  (logEntry.symptoms && logEntry.symptoms.length > 0) ||
                  (logEntry.notes && logEntry.notes.trim()) ||
                  (logEntry.medications && logEntry.medications.length > 0) ||
                  (logEntry.tags && logEntry.tags.length > 0)
                )
              );
              const future = isDayFuture(day);

              // Filter matching
              let matchesFilter = true;
              if (activeFilter === 'intimacy') matchesFilter = hasIntimacy;
              else if (activeFilter === 'period') matchesFilter = period;
              else if (activeFilter === 'logs') matchesFilter = hasLog;

              return (
                <button
                  key={di}
                  data-day-key={key}
                  data-day-future={future ? 'true' : 'false'}
                  aria-label={`${MONTHS[month]} ${day}, ${year}${period ? ', period day' : ''}${projected ? ', projected period' : ''}${predicted && !period ? ', predicted period' : ''}${fertile ? ', fertile window' : ''}${isToday ? ', today' : ''}${hasIntimacy ? ', intimacy logged' : ''}`}
                  aria-pressed={selected}
                  onClick={() => {
                    if (periodEditMode) {
                      if (future) return;
                      togglePeriodDay(key);
                      return;
                    }
                    setSelectedKey((prev) => (prev === key ? null : key));
                  }}
                  style={{
                    height: '50px',
                    border: 'none',
                    cursor: periodEditMode && future ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    opacity: !matchesFilter ? 0.18 : periodEditMode && future ? 0.3 : 1,
                    fontFamily: "'Nunito', sans-serif",
                    padding: 0,
                    transition: 'opacity 0.15s ease, transform 0.12s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  {/* 1. Confirmed Period Circle */}
                  {period && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(244, 114, 182, 0.22)',
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* 2. Projected or Future Predicted Period Circle */}
                  {!period && predicted && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: projected
                          ? 'rgba(251, 207, 232, 0.3)'
                          : 'rgba(251, 207, 232, 0.15)',
                        border: '1.5px dashed rgba(244, 114, 182, 0.65)',
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* 3. Fertile Window Circle */}
                  {!period && !predicted && fertile && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(192, 132, 252, 0.16)',
                        border: '1px solid rgba(192, 132, 252, 0.3)',
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* 4. Ovulation Halo Marker */}
                  {isOvulation && !period && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px solid #8B5CF6',
                        background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.05) 75%)',
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* 5. Today Ring */}
                  {isToday && !selected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px solid #8B5CF6',
                        zIndex: 2,
                      }}
                    />
                  )}

                  {/* 6. Selected Day Glow Circle */}
                  {selected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: periodEditMode
                          ? 'linear-gradient(135deg, #EC4899, #F97316)'
                          : 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                        boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                        zIndex: 2,
                      }}
                    />
                  )}

                  {/* Day Number */}
                  <span
                    style={{
                      position: 'relative',
                      zIndex: 3,
                      fontSize: '15px',
                      fontWeight: isToday || selected || period ? 800 : 700,
                      color: selected
                        ? '#FFFFFF'
                        : period
                        ? '#BE185D'
                        : predicted
                        ? '#EC4899'
                        : fertile
                        ? '#6D28D9'
                        : isToday
                        ? '#7C3AED'
                        : future
                        ? '#9CA3AF'
                        : '#1F2937',
                      lineHeight: 1,
                    }}
                  >
                    {day}
                  </span>

                  {/* Micro Indicators */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '2.5px',
                      height: '4px',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 3,
                      marginTop: '3px',
                    }}
                  >
                    {hasIntimacy && !selected && (
                      <div style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: '#E11D48' }} />
                    )}
                    {period && !selected && (
                      <div style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: '#BE185D' }} />
                    )}
                    {(hasDetails || (hasLog && !period && !hasIntimacy)) && !selected && (
                      <div style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: '#8B5CF6' }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

export function CalendarScreen() {
  const navigate = useNavigate();
  const {
    logs,
    saveLog,
    deleteLog,
    cycleDay,
    currentPhase,
    phaseIcon,
    isPeriodDay,
    isFertileDay,
    isPredictedPeriod,
    isProjectedCurrentPeriod,
    ovulationDate,
    periodStarts,
    estimatedPeriodLength,
    autoFillPeriodRange,
  } = useCycle();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateToKey(today);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(INITIAL_INDEX);

  const [selectedKey, setSelectedKey] = useState<string | null>(todayKey);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [periodEditMode, setPeriodEditMode] = useState(false);
  const [periodEditKeys, setPeriodEditKeys] = useState<Set<string>>(new Set());
  const [periodEditStatus, setPeriodEditStatus] = useState('');

  // Modals state
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [catchUpData, setCatchUpData] = useState<{
    isOpen: boolean;
    startDateKey: string;
    endDateKey: string;
    totalDays: number;
  }>({
    isOpen: false,
    startDateKey: '',
    endDateKey: todayKey,
    totalDays: 0,
  });

  // Calculate past & future ovulation dates for halos
  const ovulationKeys = useMemo(() => {
    const set = new Set<string>();
    if (ovulationDate) set.add(dateToKey(ovulationDate));
    for (const start of periodStarts) {
      const ov = addDays(start, -14);
      set.add(dateToKey(ov));
    }
    return set;
  }, [ovulationDate, periodStarts]);

  const buildLogWithPeriod = useCallback(
    (key: string, isPeriod: boolean): DayLog => {
      const existing = logs[key];
      return {
        flow: existing?.flow ?? (isPeriod ? 'Medium' : null),
        moods: existing?.moods ?? [],
        symptoms: existing?.symptoms ?? [],
        notes: existing?.notes ?? '',
        isPeriod,
        hadIntimacy: existing?.hadIntimacy ?? false,
        protectionUsed: existing?.protectionUsed ?? null,
        intimacyNotes: existing?.intimacyNotes ?? '',
        sleepQuality: existing?.sleepQuality ?? null,
        energyLevel: existing?.energyLevel ?? null,
        waterGlasses: existing?.waterGlasses ?? 0,
        cervicalMucus: existing?.cervicalMucus ?? null,
        medications: existing?.medications ?? [],
        tags: existing?.tags ?? [],
      };
    },
    [logs]
  );

  const hasNonPeriodData = useCallback((log: DayLog) => {
    return Boolean(
      log.flow ||
        (log.moods && log.moods.length > 0) ||
        (log.symptoms && log.symptoms.length > 0) ||
        log.notes.trim() ||
        log.hadIntimacy ||
        (log.protectionUsed && log.protectionUsed !== 'None') ||
        log.intimacyNotes?.trim() ||
        (log.medications && log.medications.length > 0) ||
        (log.tags && log.tags.length > 0)
    );
  }, []);

  const togglePeriodDay = useCallback((key: string) => {
    setPeriodEditKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const applyPeriodSelection = () => {
    if (!periodEditKeys.size) return;
    for (const key of periodEditKeys) saveLog(key, buildLogWithPeriod(key, true));
    const count = periodEditKeys.size;
    setPeriodEditStatus(`Marked ${count} day${count === 1 ? '' : 's'} as period.`);
    setPeriodEditKeys(new Set());
  };

  const clearPeriodSelection = () => {
    if (!periodEditKeys.size) return;
    let changed = 0;
    for (const key of periodEditKeys) {
      const existing = logs[key];
      if (!existing?.isPeriod) continue;
      const updated = buildLogWithPeriod(key, false);
      if (hasNonPeriodData(updated)) saveLog(key, updated);
      else deleteLog(key);
      changed++;
    }
    setPeriodEditStatus(
      changed
        ? `Cleared period from ${changed} day${changed === 1 ? '' : 's'}.`
        : 'No selected days were marked as period.'
    );
    setPeriodEditKeys(new Set());
  };

  // Quick 1-tap period toggle in selected day drawer (with Flo catch-up trigger)
  const handleToggleSinglePeriod = (key: string) => {
    const isCurrentlyPeriod = isPeriodDay(key);
    if (isCurrentlyPeriod) {
      const updated = buildLogWithPeriod(key, false);
      if (hasNonPeriodData(updated)) saveLog(key, updated);
      else deleteLog(key);
      return;
    }

    // If turning ON period for a past day that is >= 1 day ago and today is not logged
    const diffDays = getDaysBetween(keyToDate(key), today);
    if (diffDays >= 1 && !isPeriodDay(todayKey)) {
      setCatchUpData({
        isOpen: true,
        startDateKey: key,
        endDateKey: todayKey,
        totalDays: diffDays + 1,
      });
      return;
    }

    // Standard single day mark
    saveLog(key, buildLogWithPeriod(key, true));
  };

  const selectedLog = selectedKey ? logs[selectedKey] : null;
  const isSelectedToday = selectedKey === todayKey;
  const isSelectedFuture = selectedKey
    ? (() => {
        const d = keyToDate(selectedKey);
        d.setHours(0, 0, 0, 0);
        return d > today;
      })()
    : false;

  const selectedDayNum = selectedKey ? parseInt(selectedKey.split('-')[2]) : null;
  const selectedMonthNum = selectedKey ? parseInt(selectedKey.split('-')[1]) - 1 : null;
  const selectedYearObj = selectedKey ? parseInt(selectedKey.split('-')[0]) : null;

  const { year: visYear, month: visMonth } = getMonthYearFromIndex(visibleMonthIndex);
  const isCurrentMonthVisible = visYear === today.getFullYear() && visMonth === today.getMonth();

  const handleMonthStep = (step: number) => {
    const target = visibleMonthIndex + step;
    if (target >= 0 && target < TOTAL_MONTHS) {
      virtuosoRef.current?.scrollToIndex({ index: target, behavior: 'smooth', align: 'start' });
    }
  };

  const handleSelectMonthYear = (targetYear: number, targetMonth: number) => {
    const targetIndex = INITIAL_INDEX + (targetYear - today.getFullYear()) * 12 + (targetMonth - today.getMonth());
    if (targetIndex >= 0 && targetIndex < TOTAL_MONTHS) {
      virtuosoRef.current?.scrollToIndex({ index: targetIndex, behavior: 'smooth', align: 'start' });
    }
  };

  return (
    <div
      style={{
        height: '100%',
        background: '#FAF7FD',
        fontFamily: "'Nunito', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Frosted Glass Sticky Header ──────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: 'calc(10px + env(safe-area-inset-top, 0px)) 16px 12px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(233, 213, 255, 0.6)',
          zIndex: 10,
          boxShadow: '0 2px 14px rgba(168, 85, 247, 0.05)',
        }}
      >
        {/* Top title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1F2937', margin: 0, lineHeight: 1.1 }}>
              My Cycle
            </h1>
            {cycleDay && (
              <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 700, color: '#9333EA' }}>
                {phaseIcon} Day {cycleDay} · {currentPhase}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Legend button */}
            <button
              className="tap-active"
              aria-label="Calendar Guide"
              onClick={() => setIsLegendOpen(true)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#FAF5FF',
                border: '1.5px solid #E9D5FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <HelpCircle size={17} />
            </button>

            {/* Period edit toggle button */}
            <button
              className="tap-active"
              aria-pressed={periodEditMode}
              aria-label={periodEditMode ? 'Exit period edit mode' : 'Edit period days'}
              onClick={() => {
                setPeriodEditMode((prev) => {
                  const next = !prev;
                  if (next) {
                    setSelectedKey(null);
                    setPeriodEditStatus('');
                  } else {
                    setPeriodEditKeys(new Set());
                  }
                  return next;
                });
              }}
              style={{
                padding: '7px 14px',
                border: `1.5px solid ${periodEditMode ? '#F472B6' : '#DDD6FE'}`,
                borderRadius: '999px',
                background: periodEditMode
                  ? 'linear-gradient(135deg, #FCE7F3, #EDE9FE)'
                  : '#FFFFFF',
                color: periodEditMode ? '#BE185D' : '#7C3AED',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                boxShadow: periodEditMode ? '0 2px 8px rgba(244,114,182,0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {periodEditMode ? '✓ Done' : '✏️ Edit Period'}
            </button>
          </div>
        </div>

        {/* Month Navigation Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0 6px',
          }}
        >
          <button
            className="tap-active"
            onClick={() => handleMonthStep(-1)}
            aria-label="Previous month"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Interactive Month & Year Jumper Trigger */}
          <button
            className="tap-active"
            onClick={() => setIsPickerOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.3px' }}>
              {MONTHS[visMonth]} {visYear}
            </span>
            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>▼</span>
          </button>

          <button
            className="tap-active"
            onClick={() => handleMonthStep(1)}
            aria-label="Next month"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* "Back to Today" Floating Return Banner */}
        {!isCurrentMonthVisible && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
            <button
              className="tap-active"
              onClick={() => {
                virtuosoRef.current?.scrollToIndex({ index: INITIAL_INDEX, behavior: 'smooth', align: 'start' });
              }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#7C3AED',
                background: 'linear-gradient(135deg, #FCE7F3, #EDE9FE)',
                border: '1px solid #E9D5FF',
                borderRadius: '12px',
                padding: '3px 12px',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ↩ Return to current month
            </button>
          </div>
        )}

        {/* Horizontal Filter Pill Strip */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingTop: '8px',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'all', label: 'All Days' },
            { id: 'intimacy', label: '❤️ Intimacy' },
            { id: 'period', label: '🩸 Periods' },
            { id: 'logs', label: '📝 Logs' },
          ].map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                className="tap-active"
                onClick={() => setActiveFilter(chip.id as FilterType)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  border: isSelected ? '1.5px solid #EC4899' : '1px solid #E9D5FF',
                  background: isSelected ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : '#FAF5FF',
                  color: isSelected ? '#FFFFFF' : '#6B21A8',
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Weekdays Bar */}
      <div
        style={{
          background: '#FAF7FD',
          borderBottom: '1px solid #F3E8FF',
          padding: '8px 4px 6px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          zIndex: 5,
        }}
      >
        {DAYS_OF_WEEK.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: i === 0 || i === 6 ? '#A855F7' : '#9CA3AF',
              letterSpacing: '0.2px',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Period Edit Mode Instruction Banner */}
      {periodEditMode && (
        <div
          className="animate-slide-up"
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #FFF1F2, #FAF5FF)',
            borderBottom: '1px solid #FBCFE8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={15} color="#BE185D" />
            <p style={{ margin: 0, fontSize: '11px', color: '#9F1239', fontWeight: 700 }}>
              Tap days to select, then Mark or Clear below.
            </p>
          </div>
          {periodEditKeys.size > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                background: '#BE185D',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {periodEditKeys.size} selected
            </span>
          )}
        </div>
      )}

      {/* Scrollable Month Grid via Virtuoso */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#FFFFFF' }}>
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: '100%', width: '100%' }}
          totalCount={TOTAL_MONTHS}
          initialTopMostItemIndex={INITIAL_INDEX}
          overscan={200}
          rangeChanged={(range) => {
            setVisibleMonthIndex(range.startIndex + 1);
          }}
          itemContent={(index) => {
            return (
              <div style={{ padding: '0 6px' }}>
                <MonthGrid
                  index={index}
                  periodEditMode={periodEditMode}
                  periodEditKeys={periodEditKeys}
                  selectedKey={selectedKey}
                  setSelectedKey={setSelectedKey}
                  activeFilter={activeFilter}
                  togglePeriodDay={togglePeriodDay}
                  ovulationKeys={ovulationKeys}
                  isProjectedCurrentPeriod={isProjectedCurrentPeriod}
                />
              </div>
            );
          }}
        />
      </div>

      {/* Floating Bottom Period Edit Toolbar */}
      {periodEditMode && (
        <div
          className="animate-slide-up"
          style={{
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
            background: '#FFFFFF',
            borderTop: '1px solid #F3E8FF',
            display: 'flex',
            gap: '10px',
            zIndex: 15,
            boxShadow: '0 -4px 16px rgba(168, 85, 247, 0.08)',
          }}
        >
          <button
            className="tap-active"
            onClick={applyPeriodSelection}
            disabled={periodEditKeys.size === 0}
            style={{
              flex: 1,
              border: 'none',
              background:
                periodEditKeys.size === 0 ? '#F3F4F6' : 'linear-gradient(135deg, #EC4899, #F472B6)',
              color: periodEditKeys.size === 0 ? '#9CA3AF' : '#FFFFFF',
              borderRadius: '9999px',
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              cursor: periodEditKeys.size === 0 ? 'not-allowed' : 'pointer',
              boxShadow:
                periodEditKeys.size > 0 ? '0 4px 14px rgba(236, 72, 153, 0.3)' : 'none',
            }}
          >
            🩸 Mark Period ({periodEditKeys.size})
          </button>

          <button
            className="tap-active"
            onClick={clearPeriodSelection}
            disabled={periodEditKeys.size === 0}
            style={{
              flex: 1,
              border: `1.5px solid ${periodEditKeys.size === 0 ? '#E5E7EB' : '#FDBA74'}`,
              background: periodEditKeys.size === 0 ? '#F9FAFB' : '#FFF7ED',
              color: periodEditKeys.size === 0 ? '#9CA3AF' : '#C2410C',
              borderRadius: '9999px',
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              cursor: periodEditKeys.size === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ✕ Clear Period
          </button>
        </div>
      )}

      {/* Period Edit Feedback Status Toast */}
      {periodEditStatus && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#BE185D',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800,
            zIndex: 30,
            boxShadow: '0 4px 14px rgba(190, 24, 93, 0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          {periodEditStatus}
        </div>
      )}

      {/* ── Flo-Style Selected Day Drawer ─────────────────────────────────────── */}
      {!periodEditMode && selectedKey && (
        <div
          className="animate-slide-up"
          style={{
            background: '#FFFFFF',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderTop: '1px solid rgba(233, 213, 255, 0.7)',
            boxShadow: '0 -8px 28px rgba(112, 26, 117, 0.09)',
            padding: '12px 18px calc(14px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '340px',
            overflowY: 'auto',
            zIndex: 12,
            flexShrink: 0,
          }}
        >
          {/* Grab handle and Close button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ width: '24px' }} />
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E9D5FF' }} />
            <button
              onClick={() => setSelectedKey(null)}
              aria-label="Dismiss day drawer"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Date header & Main Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1F2937', lineHeight: 1.1 }}>
                {SHORT_MONTHS[selectedMonthNum || 0]} {selectedDayNum}, {selectedYearObj}
              </h3>
              <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                {isSelectedToday && (
                  <span style={{ background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
                    Today
                  </span>
                )}
                {isPeriodDay(selectedKey) && (
                  <span style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#BE185D' }}>
                    Period 🩸
                  </span>
                )}
                {isProjectedCurrentPeriod(selectedKey) && (
                  <span style={{ background: '#FFF1F2', border: '1.5px dashed #F472B6', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#BE185D' }}>
                    Projected Period 🌸
                  </span>
                )}
                {isPredictedPeriod(selectedKey) && !isPeriodDay(selectedKey) && !isProjectedCurrentPeriod(selectedKey) && (
                  <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#E11D48' }}>
                    Predicted Period 🌸
                  </span>
                )}
                {isFertileDay(selectedKey) && (
                  <span style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
                    Fertile Window 💜
                  </span>
                )}
                {ovulationKeys.has(selectedKey) && (
                  <span style={{ background: '#FAF5FF', border: '1px solid #C084FC', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#6D28D9' }}>
                    Ovulation Day 🥚
                  </span>
                )}
              </div>
            </div>

            {/* Right action button */}
            {!isSelectedFuture && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* 1-tap quick period mark button */}
                <button
                  className="tap-active"
                  onClick={() => handleToggleSinglePeriod(selectedKey)}
                  aria-label={isPeriodDay(selectedKey) ? 'Remove period mark' : 'Mark as period'}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '999px',
                    border: `1.5px solid ${isPeriodDay(selectedKey) ? '#BE185D' : '#FBCFE8'}`,
                    background: isPeriodDay(selectedKey) ? '#FDF2F8' : '#FFFFFF',
                    color: '#BE185D',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {isPeriodDay(selectedKey) ? '🩸 Period ✓' : '+ 🩸 Period'}
                </button>

                {/* Edit Log button */}
                <button
                  className="tap-active"
                  onClick={() => navigate(`/log?date=${selectedKey}&from=calendar`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '7px 12px',
                    background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                    border: 'none',
                    borderRadius: '999px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: '0 3px 10px rgba(168,85,247,0.25)',
                  }}
                >
                  {selectedLog ? (
                    <>
                      <Edit3 size={12} /> Edit
                    </>
                  ) : (
                    <>
                      <Plus size={12} strokeWidth={3} /> Log
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Drawer Content */}
          {selectedLog ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Vitals & Summary Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {selectedLog.flow && (
                  <span style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#BE185D' }}>
                    🩸 {selectedLog.flow} flow
                  </span>
                )}
                {selectedLog.sleepQuality && (
                  <span style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#6D28D9' }}>
                    🛌 {selectedLog.sleepQuality} sleep
                  </span>
                )}
                {selectedLog.energyLevel && (
                  <span style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#B45309' }}>
                    ⚡ {selectedLog.energyLevel} energy
                  </span>
                )}
                {(selectedLog.waterGlasses ?? 0) > 0 && (
                  <span style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#0369A1' }}>
                    💧 {selectedLog.waterGlasses} glasses
                  </span>
                )}
                {selectedLog.cervicalMucus && (
                  <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                    🌊 {selectedLog.cervicalMucus}
                  </span>
                )}
                {selectedLog.hadIntimacy && (
                  <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#9F1239' }}>
                    ❤️ Intimacy{selectedLog.protectionUsed && selectedLog.protectionUsed !== 'None' ? ` · ${selectedLog.protectionUsed}` : ''}
                  </span>
                )}
              </div>

              {/* Intimacy Notes */}
              {selectedLog.hadIntimacy && selectedLog.intimacyNotes?.trim() && (
                <div style={{ background: '#FFF1F2', borderRadius: '12px', padding: '8px 12px', border: '1px solid #FECDD3' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#BE185D', fontWeight: 800, letterSpacing: '0.3px' }}>INTIMACY NOTES</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9F1239', fontWeight: 600, lineHeight: 1.4 }}>{selectedLog.intimacyNotes}</p>
                </div>
              )}

              {/* Moods */}
              {selectedLog.moods.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#9CA3AF', fontWeight: 800, letterSpacing: '0.3px' }}>MOOD</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedLog.moods.map((m) => (
                      <span key={m} style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
                        {MOOD_EMOJI[m] || ''} {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Symptoms */}
              {selectedLog.symptoms.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#9CA3AF', fontWeight: 800, letterSpacing: '0.3px' }}>SYMPTOMS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedLog.symptoms.map((s) => (
                      <span key={s} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, color: '#4B5563' }}>
                        {SYMPTOM_EMOJI[s] || ''} {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {selectedLog.medications && selectedLog.medications.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#9CA3AF', fontWeight: 800, letterSpacing: '0.3px' }}>MEDICATIONS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedLog.medications.map((med) => (
                      <span key={med} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>
                        💊 {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle Tags */}
              {selectedLog.tags && selectedLog.tags.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#9CA3AF', fontWeight: 800, letterSpacing: '0.3px' }}>LIFESTYLE FACTORS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedLog.tags.map((tag) => (
                      <span key={tag} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, color: '#15803D' }}>
                        🏷️ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedLog.notes && (
                <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '8px 12px', borderLeft: '3px solid #DDD6FE' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9CA3AF', fontWeight: 800, letterSpacing: '0.3px' }}>NOTES</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#374151', fontWeight: 600, lineHeight: 1.4 }}>{selectedLog.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              {isSelectedFuture ? (
                <div>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>
                    {isPredictedPeriod(selectedKey) ? '🌸' : isFertileDay(selectedKey) ? '💜' : '📅'}
                  </span>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#4B5563' }}>
                    {isProjectedCurrentPeriod(selectedKey)
                      ? 'Projected active period day — based on your typical period length'
                      : isPredictedPeriod(selectedKey)
                      ? 'Forecasted period day for upcoming cycle'
                      : isFertileDay(selectedKey)
                      ? 'Estimated fertile window — high conception likelihood'
                      : 'Future date'}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                    No symptoms or wellness details logged for this day.
                  </p>
                  <button
                    type="button"
                    className="tap-active"
                    onClick={() => navigate(`/log?date=${selectedKey}&from=calendar`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                      border: 'none',
                      borderRadius: '999px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <Plus size={13} strokeWidth={3} /> Log this day
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CycleLegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />

      <MonthYearPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentYear={visYear}
        currentMonth={visMonth}
        onSelectMonthYear={handleSelectMonthYear}
      />

      <SmartPeriodCatchUpModal
        isOpen={catchUpData.isOpen}
        onClose={() => setCatchUpData((prev) => ({ ...prev, isOpen: false }))}
        startDateKey={catchUpData.startDateKey}
        endDateKey={catchUpData.endDateKey}
        totalDays={catchUpData.totalDays}
        expectedPeriodLength={estimatedPeriodLength}
        onConfirmAll={() => {
          autoFillPeriodRange(catchUpData.startDateKey, catchUpData.endDateKey);
          setCatchUpData((prev) => ({ ...prev, isOpen: false }));
          setPeriodEditStatus(`Logged period through today (${catchUpData.totalDays} days)!`);
          setTimeout(() => setPeriodEditStatus(''), 3500);
        }}
        onConfirmSingle={() => {
          saveLog(catchUpData.startDateKey, buildLogWithPeriod(catchUpData.startDateKey, true));
          setCatchUpData((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
