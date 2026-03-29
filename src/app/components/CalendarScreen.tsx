import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit3 } from 'lucide-react';
import { useCycle, dateToKey, keyToDate } from '../context/CycleContext';
import type { DayLog } from '../context/CycleContext';
import { useAppData } from '../context/AppDataContext';
import { APP_COPY } from '../config/appCopy';

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

export function CalendarScreen() {
  const navigate = useNavigate();
  const { snapshot, updatePreferences } = useAppData();
  const {
    logs, saveLog, deleteLog,
    isPeriodDay, isPredictedPeriod, isFertileDay,
    cycleDay, currentPhase, phaseIcon,
  } = useCycle();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateToKey(today);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(todayKey);
  const [intimacyFilterOn, setIntimacyFilterOn] = useState(false);
  const [periodEditMode, setPeriodEditMode] = useState(false);
  const [periodEditKeys, setPeriodEditKeys] = useState<Set<string>>(new Set());
  const [periodEditStatus, setPeriodEditStatus] = useState('');
  const isDraggingPeriodSelectionRef = useRef(false);
  const dragSelectionValueRef = useRef(true);
  const draggedKeysRef = useRef<Set<string>>(new Set());

  // ── Swipe-to-navigate state ───────────────────────────────────────────────
  const [swipeHintSeen, setSwipeHintSeen] = useState(snapshot.preferences.calendarSwipeHint);
  const gridRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingMonthRef = useRef(false);   // true once direction is locked to horizontal
  const swipeLockedRef = useRef(false);      // true once we've committed or rejected the gesture

  const SWIPE_THRESHOLD = 80; // px to commit month change

  useEffect(() => {
    setSwipeHintSeen(snapshot.preferences.calendarSwipeHint);
  }, [snapshot.preferences.calendarSwipeHint]);

  const buildLogWithPeriod = useCallback((key: string, isPeriod: boolean): DayLog => {
    const existing = logs[key];
    return {
      flow: existing?.flow ?? null,
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
    };
  }, [logs]);

  const hasNonPeriodData = useCallback((log: DayLog) => Boolean(
    log.flow || log.moods.length || log.symptoms.length || log.notes.trim() ||
    log.hadIntimacy || (log.protectionUsed && log.protectionUsed !== 'None') ||
    log.intimacyNotes?.trim()
  ), []);

  const setPeriodDaySelection = (key: string, shouldSelect: boolean) => {
    setPeriodEditKeys((prev) => {
      if (prev.has(key) === shouldSelect) return prev;
      const next = new Set(prev);
      if (shouldSelect) next.add(key); else next.delete(key);
      return next;
    });
  };

  const applyDragSelectionToKey = (key: string) => {
    if (!isDraggingPeriodSelectionRef.current) return;
    if (draggedKeysRef.current.has(key)) return;
    draggedKeysRef.current.add(key);
    setPeriodDaySelection(key, dragSelectionValueRef.current);
  };

  const startPeriodDragSelection = (key: string) => {
    dragSelectionValueRef.current = !periodEditKeys.has(key);
    draggedKeysRef.current = new Set();
    isDraggingPeriodSelectionRef.current = true;
    applyDragSelectionToKey(key);
  };

  const endPeriodDragSelection = () => {
    isDraggingPeriodSelectionRef.current = false;
    draggedKeysRef.current = new Set();
  };

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
      if (hasNonPeriodData(updated)) saveLog(key, updated); else deleteLog(key);
      changed++;
    }
    setPeriodEditStatus(changed
      ? `Cleared period from ${changed} day${changed === 1 ? '' : 's'}.`
      : 'No selected days were marked as period.');
    setPeriodEditKeys(new Set());
  };

  const goBack = useCallback(() => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }, [currentMonth]);

  const goForward = useCallback(() => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }, [currentMonth]);

  // Commit a month swipe — animate off-screen then jump
  const commitSwipe = useCallback((direction: 'left' | 'right') => {
    if (!gridRef.current) return;
    
    if (!swipeHintSeen) {
      setSwipeHintSeen(true);
      updatePreferences({ calendarSwipeHint: true });
    }

    const targetOffset = direction === 'left' ? -window.innerWidth : window.innerWidth;
    
    // Material decelerate exit
    gridRef.current.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 1, 1)';
    gridRef.current.style.transform = `translate3d(${targetOffset}px, 0, 0)`;
    
    const handler = () => {
      if (!gridRef.current) return;
      gridRef.current.removeEventListener('transitionend', handler);
      gridRef.current.style.transition = 'none';
      gridRef.current.style.transform = 'translate3d(0, 0, 0)';
      if (direction === 'left') goForward(); else goBack();
    };
    gridRef.current.addEventListener('transitionend', handler);
  }, [goBack, goForward, swipeHintSeen, updatePreferences]);

  const snapBack = useCallback(() => {
    if (!gridRef.current) return;
    // iOS spring bounce back
    gridRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    gridRef.current.style.transform = 'translate3d(0, 0, 0)';
    
    const handler = () => {
      if (!gridRef.current) return;
      gridRef.current.removeEventListener('transitionend', handler);
      gridRef.current.style.transition = 'none';
    };
    gridRef.current.addEventListener('transitionend', handler);
  }, []);

  // Swipe pointer handlers (calendar grid)
  const onCalendarPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start a month swipe if period edit mode is using drag
    if (periodEditMode || !gridRef.current) return;
    
    // Stop any in-progress snap-back transition instantly
    const style = window.getComputedStyle(gridRef.current);
    const matrix = new DOMMatrix(style.transform);
    gridRef.current.style.transition = 'none';
    gridRef.current.style.transform = `translate3d(${matrix.m41}px, 0, 0)`;

    swipeStartRef.current = { x: e.clientX, y: e.clientY };
    isSwipingMonthRef.current = false;
    swipeLockedRef.current = false;
  }, [periodEditMode]);

  const onCalendarPointerMove = useCallback((e: React.PointerEvent) => {
    if (!swipeStartRef.current || swipeLockedRef.current || !gridRef.current) return;
    if (periodEditMode) return;

    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Lock direction once we have enough movement
    if (!isSwipingMonthRef.current) {
      if (absDx < 8 && absDy < 8) return; // not enough movement yet
      if (absDy > absDx) {
        // Vertical swipe — let period drag or scroll handle it
        swipeLockedRef.current = true;
        return;
      }
      isSwipingMonthRef.current = true;
    }

    // Apply damped offset (rubber-band past threshold)
    const damp = absDx > SWIPE_THRESHOLD ? SWIPE_THRESHOLD + (absDx - SWIPE_THRESHOLD) * 0.35 : absDx;
    const finalOffset = dx > 0 ? damp : -damp;
    
    // Direct DOM mutation — NO REACT STATE RE-RENDER! 🔥
    gridRef.current.style.transform = `translate3d(${finalOffset}px, 0, 0)`;
  }, [periodEditMode, SWIPE_THRESHOLD]);

  const onCalendarPointerUp = useCallback(() => {
    if (!isSwipingMonthRef.current || !gridRef.current) {
      swipeStartRef.current = null;
      return;
    }
    
    // Read current translate X offset from DOM
    const style = window.getComputedStyle(gridRef.current);
    const matrix = new DOMMatrix(style.transform);
    const currentOffset = matrix.m41;

    if (currentOffset <= -SWIPE_THRESHOLD) commitSwipe('left');
    else if (currentOffset >= SWIPE_THRESHOLD) commitSwipe('right');
    else snapBack();
    
    swipeStartRef.current = null;
    isSwipingMonthRef.current = false;
    swipeLockedRef.current = false;
  }, [SWIPE_THRESHOLD, commitSwipe, snapBack]);

  const { weeks, getDayKey, isDayToday, isDayFuture } = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const wks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) wks.push(cells.slice(i, i + 7));

    const getDayKeyFn = (day: number) =>
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isDayTodayFn = (day: number) => getDayKeyFn(day) === todayKey;
    const isDayFutureFn = (day: number) => {
      const d = new Date(currentYear, currentMonth, day);
      d.setHours(0, 0, 0, 0);
      return d > today;
    };

    return { weeks: wks, getDayKey: getDayKeyFn, isDayToday: isDayTodayFn, isDayFuture: isDayFutureFn };
  }, [currentYear, currentMonth, todayKey, today]);

  // Helper: is this day at the start / end of a period run (for pill shaping)
  const isPeriodStart = useCallback((day: number, week: (number | null)[]) => {
    const key = getDayKey(day);
    if (!isPeriodDay(key)) return false;
    const di = week.indexOf(day);
    if (di === 0) return true;
    const prev = week[di - 1];
    return !prev || !isPeriodDay(getDayKey(prev));
  }, [getDayKey, isPeriodDay]);

  const isPeriodEnd = useCallback((day: number, week: (number | null)[]) => {
    const key = getDayKey(day);
    if (!isPeriodDay(key)) return false;
    const di = week.indexOf(day);
    if (di === 6) return true;
    const next = week[di + 1];
    return !next || !isPeriodDay(getDayKey(next));
  }, [getDayKey, isPeriodDay]);

  // Selected day info
  const selectedLog = selectedKey ? logs[selectedKey] : null;
  const isSelectedToday = selectedKey === todayKey;
  const isSelectedFuture = selectedKey ? (() => {
    const d = keyToDate(selectedKey);
    d.setHours(0, 0, 0, 0);
    return d > today;
  })() : false;

  const selectedDayNum = selectedKey ? parseInt(selectedKey.split('-')[2]) : null;
  const selectedMonthNum = selectedKey ? parseInt(selectedKey.split('-')[1]) - 1 : currentMonth;
  const selectedYear = selectedKey ? parseInt(selectedKey.split('-')[0]) : currentYear;

  const totalLogs = Object.keys(logs).length;
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div style={{ height: '100%', background: '#F8F4FF', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #fdf2f8 0%, #f0ebff 100%)',
        padding: '10px 20px 16px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(233,213,255,0.5)',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1 }}>My Cycle</h1>
            {isCurrentMonth && cycleDay && (
              <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 700, color: '#A855F7' }}>
                {phaseIcon} Day {cycleDay} · {currentPhase}
              </p>
            )}
          </div>
          {/* Period edit toggle */}
          <button
            className="tap-active"
            onClick={() => {
              setPeriodEditMode(prev => {
                const next = !prev;
                if (next) { setSelectedKey(null); setPeriodEditStatus(''); }
                else setPeriodEditKeys(new Set());
                return next;
              });
            }}
            style={{
              padding: '7px 14px',
              border: `1.5px solid ${periodEditMode ? '#F472B6' : '#DDD6FE'}`,
              borderRadius: '999px',
              background: periodEditMode ? 'linear-gradient(135deg, #fce7f3, #ede9fe)' : 'rgba(255,255,255,0.8)',
              color: periodEditMode ? '#BE185D' : '#7C3AED',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
            }}
          >
            {periodEditMode ? '✓ Done' : '✏️ Edit Period'}
          </button>
        </div>

        {/* Month label — centered, no buttons */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.3px' }}>
            {MONTHS[currentMonth]} {currentYear}
          </span>
          {!isCurrentMonth && (
            <button
              className="tap-active"
              onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
              style={{ display: 'block', margin: '3px auto 0', fontSize: '10px', fontWeight: 700, color: '#A855F7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
            >
              ↩ Back to today
            </button>
          )}
          {isCurrentMonth && !swipeHintSeen && (
            <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: 600, color: '#C4B5FD', animation: 'slideUpFadeIn 0.3s ease forwards' }}>← swipe to navigate →</p>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Calendar grid ─────────────────────────────────────────── */}
        <div style={{ background: '#ffffff', padding: '12px 8px 8px', overflow: 'hidden' }}>

          {/* Day-of-week headers and grid — slide together */}
          <div
            ref={gridRef}
            style={{
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
              touchAction: 'pan-y',
            }}
          >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={i} style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: i === 0 || i === 6 ? '#C084FC' : '#9CA3AF',
                paddingBottom: '4px',
                letterSpacing: '0.2px',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks — swipe + period drag container */}
          <div
            onPointerDown={onCalendarPointerDown}
            onPointerMove={(e) => {
              // Month swipe
              onCalendarPointerMove(e);
              // Period drag (only when period editing and not swiping a month)
              if (!periodEditMode || !isDraggingPeriodSelectionRef.current || isSwipingMonthRef.current) return;
              const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
              const dayEl = el?.closest('[data-day-key]') as HTMLElement | null;
              if (!dayEl || dayEl.dataset.dayFuture === 'true') return;
              const dragKey = dayEl.dataset.dayKey;
              if (dragKey) applyDragSelectionToKey(dragKey);
            }}
            onPointerUp={() => {
              onCalendarPointerUp();
              endPeriodDragSelection();
            }}
            onPointerCancel={() => {
              snapBack();
              endPeriodDragSelection();
            }}
            onPointerLeave={() => {
              if (isSwipingMonthRef.current) return; // don't cancel mid-swipe on leave
              endPeriodDragSelection();
            }}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >

            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                {week.map((day, di) => {
                  if (!day) return <div key={di} style={{ height: '52px' }} />;

                  const key = getDayKey(day);
                  const period = isPeriodDay(key);
                  const predicted = isPredictedPeriod(key);
                  const fertile = isFertileDay(key);
                  const isToday = isDayToday(day);
                  const selected = periodEditMode ? periodEditKeys.has(key) : selectedKey === key;
                  const hasLog = !!logs[key];
                  const hasIntimacy = !!logs[key]?.hadIntimacy;
                  const future = isDayFuture(day);
                  const filtered = intimacyFilterOn && !hasIntimacy;

                  // Period pill shaping
                  const pStart = isPeriodStart(day, week);
                  const pEnd = isPeriodEnd(day, week);
                  const periodRadius = period
                    ? `${pStart ? '20px' : '0px'} ${pEnd ? '20px' : '0px'} ${pEnd ? '20px' : '0px'} ${pStart ? '20px' : '0px'}`
                    : '0px';

                  // Predicted pill shaping (same logic)
                  const isPredStart = predicted && !period && (() => {
                    const di2 = week.indexOf(day);
                    if (di2 === 0) return true;
                    const prev = week[di2 - 1];
                    return !prev || !isPredictedPeriod(getDayKey(prev)) || isPeriodDay(getDayKey(prev));
                  })();
                  const isPredEnd = predicted && !period && (() => {
                    const di2 = week.indexOf(day);
                    if (di2 === 6) return true;
                    const next = week[di2 + 1];
                    return !next || !isPredictedPeriod(getDayKey(next)) || isPeriodDay(getDayKey(next));
                  })();
                  const predictedRadius = predicted && !period
                    ? `${isPredStart ? '20px' : '0px'} ${isPredEnd ? '20px' : '0px'} ${isPredEnd ? '20px' : '0px'} ${isPredStart ? '20px' : '0px'}`
                    : '0px';

                  return (
                    <button
                      key={di}
                      data-day-key={key}
                      data-day-future={future ? 'true' : 'false'}
                      onClick={() => {
                        if (periodEditMode) return;
                        setSelectedKey(prev => prev === key ? null : key);
                      }}
                      onPointerDown={(e) => {
                        if (!periodEditMode || future) return;
                        e.preventDefault();
                        startPeriodDragSelection(key);
                        e.currentTarget.setPointerCapture?.(e.pointerId);
                      }}
                      onPointerEnter={() => {
                        if (!periodEditMode || future) return;
                        applyDragSelectionToKey(key);
                      }}
                      onPointerUp={(e) => {
                        if (!periodEditMode) return;
                        e.currentTarget.releasePointerCapture?.(e.pointerId);
                        endPeriodDragSelection();
                      }}
                      onPointerCancel={endPeriodDragSelection}
                      style={{
                        height: '52px',
                        border: 'none',
                        cursor: periodEditMode && future ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        // Period band ALWAYS shows on period days — selection circle floats on top
                        background: period
                          ? 'rgba(244,114,182,0.15)'
                          : predicted && !period
                          ? 'rgba(249,168,212,0.1)'
                          : 'transparent',
                        // Period pill shape ALWAYS keeps its radius — no sharp/round clash
                        borderRadius: period
                          ? periodRadius
                          : predicted && !period
                          ? predictedRadius
                          : '0px',
                        opacity: filtered ? 0.2 : periodEditMode && future ? 0.3 : 1,
                        fontFamily: "'Nunito', sans-serif",
                        padding: 0,
                        transition: 'opacity 0.15s ease',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {/* Selection circle — always floats above the period band */}
                      {selected && (
                        <div style={{
                          position: 'absolute',
                          inset: '4px',
                          borderRadius: '50%',
                          background: periodEditMode
                            ? 'linear-gradient(135deg, #EC4899, #F97316)'
                            : 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                          boxShadow: '0 3px 10px rgba(168,85,247,0.45)',
                          zIndex: 2,
                        }} />
                      )}

                      {/* Today ring — outline on today's cell */}
                      {isToday && !selected && (
                        <div style={{
                          position: 'absolute',
                          inset: '4px',
                          borderRadius: '50%',
                          border: '2px solid #C084FC',
                          zIndex: 1,
                        }} />
                      )}

                      {/* Fertile circle background */}
                      {fertile && !selected && !period && (
                        <div style={{
                          position: 'absolute',
                          inset: '4px',
                          borderRadius: '50%',
                          background: 'rgba(139,92,246,0.12)',
                          zIndex: 1,
                        }} />
                      )}

                      {/* Day number — always on top (z:3) */}
                      <span style={{
                        position: 'relative',
                        zIndex: 3,
                        fontSize: '14px',
                        fontWeight: isToday || selected || period ? 800 : 500,
                        color: selected
                          ? '#fff'
                          : period
                          ? '#BE185D'
                          : predicted && !period
                          ? '#F9A8D4'
                          : fertile
                          ? '#7C3AED'
                          : isToday
                          ? '#8B5CF6'
                          : future
                          ? '#C4B5FD'
                          : '#1F2937',
                        lineHeight: 1,
                      }}>
                        {day}
                      </span>

                      {/* Dot indicators — also on top (z:3) */}
                      <div style={{ display: 'flex', gap: '2px', height: '4px', alignItems: 'center', position: 'relative', zIndex: 3 }}>
                        {hasLog && !selected && (
                          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: period ? '#F472B6' : fertile ? '#8B5CF6' : '#D1D5DB' }} />
                        )}
                        {hasIntimacy && !selected && (
                          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#E11D48' }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
            {[
              { color: '#F472B6', bg: 'rgba(244,114,182,0.15)', label: 'Period', solid: true },
              { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Fertile', solid: false },
              { color: '#F9A8D4', bg: 'rgba(249,168,212,0.1)', label: 'Predicted', solid: false },
              { color: '#E11D48', bg: 'transparent', label: 'Intimacy', solid: true },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: item.solid ? item.color : item.bg,
                  border: item.solid ? 'none' : `1.5px solid ${item.color}`,
                }} />
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div> {/* end translateX wrapper */}
        </div> {/* end calendar card */}

        {/* ── Toolbar row ──────────────────────────────────────────── */}
        <div style={{ padding: '10px 16px', display: 'flex', gap: '8px', background: '#ffffff', borderTop: '1px solid #F3F4F6' }}>
          <button
            className="tap-active"
            onClick={() => setIntimacyFilterOn(v => !v)}
            style={{
              flex: 1,
              border: `1.5px solid ${intimacyFilterOn ? '#FB7185' : '#E5E7EB'}`,
              background: intimacyFilterOn ? 'linear-gradient(135deg, #fff1f2, #fce7f3)' : '#F9FAFB',
              color: intimacyFilterOn ? '#BE123C' : '#9CA3AF',
              borderRadius: '12px',
              padding: '9px 12px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer',
            }}
          >
            ❤️ {intimacyFilterOn ? 'Showing intimacy days' : 'Filter: Intimacy'}
          </button>
          {periodEditMode && (
            <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
              <button
                className="tap-active"
                onClick={applyPeriodSelection}
                disabled={periodEditKeys.size === 0}
                style={{
                  flex: 1,
                  border: 'none',
                  background: periodEditKeys.size === 0 ? '#F3F4F6' : 'linear-gradient(135deg, #F472B6, #EC4899)',
                  color: periodEditKeys.size === 0 ? '#9CA3AF' : '#fff',
                  borderRadius: '12px',
                  padding: '9px 6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: periodEditKeys.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Mark ({periodEditKeys.size})
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
                  borderRadius: '12px',
                  padding: '9px 6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: periodEditKeys.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Clear ({periodEditKeys.size})
              </button>
            </div>
          )}
        </div>

        {periodEditMode && (
          <div className="animate-slide-up" style={{ padding: '0 16px 12px', background: '#ffffff' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderLeft: '4px solid #F472B6', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Edit3 size={16} color="#94A3B8" />
              <p style={{ margin: 0, fontSize: '11px', color: '#475569', fontWeight: 600, lineHeight: 1.4 }}>
                Tap or drag across past days to select them,<br/>then hit Mark or Clear.
              </p>
            </div>
            {periodEditStatus && (
              <p className="animate-slide-up" style={{ margin: '8px 0 0', fontSize: '12px', color: '#BE185D', fontWeight: 700, textAlign: 'center' }}>
                {periodEditStatus}
              </p>
            )}
          </div>
        )}

        {/* ── empty state / detail card ────────────────────────────── */}
        {totalLogs === 0 && (
          <div className="animate-slide-up" style={{ margin: '14px 16px', background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)', border: '1.5px solid #E9D5FF', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: '28px' }}>🌸</p>
            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>{APP_COPY.calendarEmptyTitle}</p>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#9CA3AF', fontWeight: 600, lineHeight: 1.5 }}>
              Tap any past day to log your symptoms.<br />Mark period days to unlock cycle predictions.
            </p>
            <button
              className="tap-active"
              onClick={() => navigate('/log')}
              style={{ padding: '11px 24px', background: 'linear-gradient(135deg, #F472B6, #8B5CF6)', border: 'none', borderRadius: '999px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: '0 4px 16px rgba(168,85,247,0.3)' }}
            >
              Log Today 🌸
            </button>
          </div>
        )}

        {/* ── Day detail bottom card ────────────────────────────────── */}
        {!periodEditMode && selectedKey && (
          <div className="animate-slide-up" style={{
            margin: '0',
            background: '#ffffff',
            borderTop: '1px solid #F3F4F6',
            padding: '16px',
            minHeight: '120px',
          }}>
            {/* Drag handle hint */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E9D5FF' }} />
            </div>

            {/* Date header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1F2937', lineHeight: 1 }}>
                  {SHORT_MONTHS[selectedMonthNum]} {selectedDayNum}, {selectedYear}
                </h3>
                <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {isSelectedToday && (
                    <span style={{ background: 'linear-gradient(135deg, #fce7f3, #ede9fe)', border: '1px solid #E9D5FF', borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>Today</span>
                  )}
                  {isPeriodDay(selectedKey) && (
                    <span style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, color: '#BE185D' }}>Period 🩸</span>
                  )}
                  {isFertileDay(selectedKey) && (
                    <span style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>Fertile 💜</span>
                  )}
                  {isPredictedPeriod(selectedKey) && !isPeriodDay(selectedKey) && (
                    <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, color: '#E11D48' }}>Predicted 🌸</span>
                  )}
                </div>
              </div>
              {/* Edit / Add button */}
              {!isSelectedFuture && (
                <button
                  className="tap-active"
                  onClick={() => navigate(`/log?date=${selectedKey}&from=calendar`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                    border: 'none',
                    borderRadius: '999px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                    flexShrink: 0,
                  }}
                >
                  {selectedLog ? <><Edit3 size={12} /> Edit Log</> : <><Plus size={12} strokeWidth={3} /> Log Day</>}
                </button>
              )}
            </div>

            {/* Log content */}
            {selectedLog ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Quick chips row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedLog.isPeriod && (
                    <span style={{ background: 'rgba(244,114,182,0.12)', border: '1px solid #FBCFE8', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#BE185D' }}>
                      🩸 Period day
                    </span>
                  )}
                  {selectedLog.flow && (
                    <span style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid #FBCFE8', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#BE185D' }}>
                      {selectedLog.flow} flow
                    </span>
                  )}
                  {selectedLog.sleepQuality && (
                    <span style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#6D28D9' }}>
                      🛌 {selectedLog.sleepQuality} sleep
                    </span>
                  )}
                  {selectedLog.energyLevel && (
                    <span style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#B45309' }}>
                      ⚡ {selectedLog.energyLevel} energy
                    </span>
                  )}
                  {(selectedLog.waterGlasses ?? 0) > 0 && (
                    <span style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>
                      💧 {selectedLog.waterGlasses}g water
                    </span>
                  )}
                  {selectedLog.cervicalMucus && (
                    <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                      🌊 {selectedLog.cervicalMucus}
                    </span>
                  )}
                  {selectedLog.hadIntimacy && (
                    <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#9F1239' }}>
                      ❤️ Intimacy{selectedLog.protectionUsed && selectedLog.protectionUsed !== 'None' ? ` · ${selectedLog.protectionUsed}` : ''}
                    </span>
                  )}
                </div>

                {/* Moods */}
                {selectedLog.moods.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 5px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.3px' }}>MOOD</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {selectedLog.moods.map(m => (
                        <span key={m} style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>
                          {MOOD_EMOJI[m] || ''} {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {selectedLog.symptoms.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 5px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.3px' }}>SYMPTOMS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {selectedLog.symptoms.map(s => (
                        <span key={s} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                          {SYMPTOM_EMOJI[s] || ''} {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLog.notes && (
                  <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '10px 14px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.3px' }}>NOTES</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', fontWeight: 600, lineHeight: 1.5 }}>{selectedLog.notes}</p>
                  </div>
                )}

                {/* Period only — minimal state */}
                {!selectedLog.flow && selectedLog.moods.length === 0 && selectedLog.symptoms.length === 0 && !selectedLog.notes && !selectedLog.hadIntimacy && (
                  <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF', fontWeight: 600, textAlign: 'center', padding: '4px 0' }}>
                    {selectedLog.isPeriod ? '🩸 Marked as period day' : 'Log entry with no details'}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                {isSelectedFuture ? (
                  <>
                    <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>
                      {isPredictedPeriod(selectedKey) ? '🌸' : isFertileDay(selectedKey) ? '💜' : '📅'}
                    </span>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>
                      {isPredictedPeriod(selectedKey)
                        ? 'Predicted period day'
                        : isFertileDay(selectedKey)
                        ? 'Predicted fertile window'
                        : 'Future date — no data yet'}
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>No log for this day</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ height: '20px' }} />
      </div>
    </div>
  );
}
