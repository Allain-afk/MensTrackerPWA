import { useRef, useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit3 } from 'lucide-react';
import { useCycle, dateToKey, keyToDate } from '../context/CycleContext';
import type { DayLog } from '../context/CycleContext';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

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

const INITIAL_INDEX = 1200;

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
  intimacyFilterOn,
  applyDragSelectionToKey,
  startPeriodDragSelection,
  endPeriodDragSelection
}: any) => {
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
    <div style={{ paddingBottom: '24px' }}>
      <h3 style={{ margin: '0 0 16px', textAlign: 'center', fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>
        {MONTHS[month]} {year}
      </h3>
      <div 
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}
        onPointerLeave={endPeriodDragSelection}
        onPointerCancel={endPeriodDragSelection}
        onPointerUp={endPeriodDragSelection}
      >
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'contents' }}>
            {week.map((day, di) => {
              if (!day) return <div key={`empty-${wi}-${di}`} style={{ height: '52px' }} />;

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

              return (
                <button
                  key={di}
                  data-day-key={key}
                  data-day-future={future ? 'true' : 'false'}
                  onClick={() => {
                    if (periodEditMode) return;
                    setSelectedKey((prev: string | null) => prev === key ? null : key);
                  }}
                  onPointerDown={(e) => {
                    if (!periodEditMode || future) return;
                    e.preventDefault();
                    startPeriodDragSelection(key);
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                  }}
                  onPointerEnter={(e) => {
                    if (!periodEditMode || future) return;
                    if (e.buttons > 0) { // Only if held down
                       applyDragSelectionToKey(key);
                    }
                  }}
                  onPointerUp={(e) => {
                    if (!periodEditMode) return;
                    e.currentTarget.releasePointerCapture?.(e.pointerId);
                    endPeriodDragSelection();
                  }}
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
                    background: 'transparent',
                    opacity: filtered ? 0.2 : periodEditMode && future ? 0.3 : 1,
                    fontFamily: "'Nunito', sans-serif",
                    padding: 0,
                    transition: 'opacity 0.15s ease, transform 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                >
                  {/* Base Period/Predicted indicator circle */}
                  {(period || (predicted && !period)) && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: period ? 'rgba(244,114,182,0.15)' : 'rgba(249,168,212,0.08)',
                      border: predicted && !period ? '1px dashed rgba(249,168,212,0.5)' : 'none',
                      zIndex: 0,
                    }} />
                  )}


                  {selected && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: periodEditMode
                        ? 'linear-gradient(135deg, #EC4899, #F97316)'
                        : 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                      boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                      zIndex: 2,
                      backdropFilter: 'blur(4px)',
                    }} />
                  )}

                  {isToday && !selected && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '2px solid #C084FC',
                      zIndex: 1,
                    }} />
                  )}

                  {fertile && !selected && !period && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      zIndex: 1,
                    }} />
                  )}

                  <span style={{
                    position: 'relative',
                    zIndex: 3,
                    fontSize: '15px',
                    fontWeight: isToday || selected || period ? 800 : 600,
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
    </div>
  );
});

export function CalendarScreen() {
  const navigate = useNavigate();
  const { logs, saveLog, deleteLog, cycleDay, currentPhase, phaseIcon, isPeriodDay, isFertileDay, isPredictedPeriod } = useCycle();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateToKey(today);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(INITIAL_INDEX);
  
  const [selectedKey, setSelectedKey] = useState<string | null>(todayKey);
  const [intimacyFilterOn, setIntimacyFilterOn] = useState(false);
  const [periodEditMode, setPeriodEditMode] = useState(false);
  const [periodEditKeys, setPeriodEditKeys] = useState<Set<string>>(new Set());
  const [periodEditStatus, setPeriodEditStatus] = useState('');
  
  const isDraggingPeriodSelectionRef = useRef(false);
  const dragSelectionValueRef = useRef(true);
  const draggedKeysRef = useRef<Set<string>>(new Set());

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

  const setPeriodDaySelection = useCallback((key: string, shouldSelect: boolean) => {
    setPeriodEditKeys((prev) => {
      if (prev.has(key) === shouldSelect) return prev;
      const next = new Set(prev);
      if (shouldSelect) next.add(key); else next.delete(key);
      return next;
    });
  }, []);

  const applyDragSelectionToKey = useCallback((key: string) => {
    if (!isDraggingPeriodSelectionRef.current) return;
    if (draggedKeysRef.current.has(key)) return;
    draggedKeysRef.current.add(key);
    setPeriodDaySelection(key, dragSelectionValueRef.current);
  }, [setPeriodDaySelection]);

  const startPeriodDragSelection = useCallback((key: string) => {
    dragSelectionValueRef.current = !periodEditKeys.has(key);
    draggedKeysRef.current = new Set();
    isDraggingPeriodSelectionRef.current = true;
    applyDragSelectionToKey(key);
  }, [applyDragSelectionToKey, periodEditKeys]);

  const endPeriodDragSelection = useCallback(() => {
    isDraggingPeriodSelectionRef.current = false;
    draggedKeysRef.current = new Set();
  }, []);

  useEffect(() => {
    // Add global pointer up listener to catch mouse releases outside the component
    const handlePointerUp = () => endPeriodDragSelection();
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [endPeriodDragSelection]);

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

  const selectedLog = selectedKey ? logs[selectedKey] : null;
  const isSelectedToday = selectedKey === todayKey;
  const isSelectedFuture = selectedKey ? (() => {
    const d = keyToDate(selectedKey);
    d.setHours(0, 0, 0, 0);
    return d > today;
  })() : false;

  const selectedDayNum = selectedKey ? parseInt(selectedKey.split('-')[2]) : null;
  const selectedMonthNum = selectedKey ? parseInt(selectedKey.split('-')[1]) - 1 : null;
  const selectedYearObj = selectedKey ? parseInt(selectedKey.split('-')[0]) : null;

  const totalLogs = Object.keys(logs).length;
  
  const { year: visYear, month: visMonth } = getMonthYearFromIndex(visibleMonthIndex);
  const isCurrentMonthVisible = visYear === today.getFullYear() && visMonth === today.getMonth();

  return (
    <div style={{ height: '100%', background: '#F8F4FF', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #fdf2f8 0%, #f0ebff 100%)',
        padding: '10px 20px 16px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(233,213,255,0.5)',
        zIndex: 10,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1 }}>My Cycle</h1>
            {isCurrentMonthVisible && cycleDay && (
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

        {/* Global Month Label (Updates on scroll) */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '40px', justifyContent: 'center' }}>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.3px', transition: 'all 0.2s' }}>
            {MONTHS[visMonth]} {visYear}
          </span>
          <div style={{ height: '20px', overflow: 'hidden' }}>
            {!isCurrentMonthVisible && (
              <button
                className="tap-active"
                onClick={() => {
                  virtuosoRef.current?.scrollToIndex({ index: INITIAL_INDEX, behavior: 'smooth', align: 'start' });
                }}
                style={{ 
                  margin: '3px auto 0', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  color: '#A855F7', 
                  background: 'rgba(255,255,255,0.5)', 
                  border: '1px solid #E9D5FF', 
                  borderRadius: '12px',
                  padding: '2px 8px',
                  cursor: 'pointer', 
                  fontFamily: "'Nunito', sans-serif" 
                }}
              >
                ↩ Back to today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Days of Week Header */}
      <div style={{ 
        background: 'rgba(248,244,255,0.95)', 
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #F3E8FF',
        padding: '10px 8px 6px',
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        zIndex: 5,
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 800,
            color: i === 0 || i === 6 ? '#C084FC' : '#9CA3AF',
            letterSpacing: '0.2px',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Scrollable body with Endless Scroll Virtuoso */}
      <div 
        style={{ 
          flex: 1, 
          overflow: 'hidden', 
          background: '#ffffff',
           // Disable touch action ONLY in edit mode to prevent scrolling while dragging
          touchAction: periodEditMode ? 'none' : 'auto' 
        }}
      >
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: '100%', width: '100%' }}
          totalCount={2400}
          initialTopMostItemIndex={INITIAL_INDEX}
          overscan={200}
          rangeChanged={(range) => {
            // With overscan=200, startIndex + 1 is roughly the topmost fully visible month
            setVisibleMonthIndex(range.startIndex + 1);
          }}
          itemContent={(index) => {
            return (
              <div style={{ padding: '0 8px' }}>
                <MonthGrid 
                  index={index}
                  periodEditMode={periodEditMode}
                  periodEditKeys={periodEditKeys}
                  selectedKey={selectedKey}
                  setSelectedKey={setSelectedKey}
                  intimacyFilterOn={intimacyFilterOn}
                  applyDragSelectionToKey={applyDragSelectionToKey}
                  startPeriodDragSelection={startPeriodDragSelection}
                  endPeriodDragSelection={endPeriodDragSelection}
                />
              </div>
            );
          }}
        />
      </div>

      {/* ── Toolbar row ──────────────────────────────────────────── */}
      <div style={{ padding: '16px', display: 'flex', gap: '12px', background: '#ffffff', borderTop: '1px solid rgba(233,213,255,0.5)', zIndex: 10 }}>
        <button
          className="tap-active"
          onClick={() => setIntimacyFilterOn(v => !v)}
          style={{
            flex: 1,
            border: `1.5px solid ${intimacyFilterOn ? '#FB7185' : '#F3F4F6'}`,
            background: intimacyFilterOn ? 'linear-gradient(135deg, #fff1f2, #fce7f3)' : '#F9FAFB',
            color: intimacyFilterOn ? '#BE123C' : '#6B7280',
            borderRadius: '9999px',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          ❤️ {intimacyFilterOn ? 'Showing Intimacy' : 'Filter: Intimacy'}
        </button>
        {periodEditMode && (
          <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
            <button
              className="tap-active"
              onClick={applyPeriodSelection}
              disabled={periodEditKeys.size === 0}
              style={{
                flex: 1,
                border: 'none',
                background: periodEditKeys.size === 0 ? '#F3F4F6' : 'linear-gradient(135deg, #F472B6, #EC4899)',
                color: periodEditKeys.size === 0 ? '#9CA3AF' : '#fff',
                borderRadius: '9999px',
                padding: '12px 6px',
                fontSize: '13px',
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: periodEditKeys.size === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: periodEditKeys.size > 0 ? '0 4px 12px rgba(236,72,153,0.3)' : 'none',
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = periodEditKeys.size > 0 ? 'scale(0.96)' : 'none'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
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
                borderRadius: '9999px',
                padding: '12px 6px',
                fontSize: '13px',
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: periodEditKeys.size === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = periodEditKeys.size > 0 ? 'scale(0.96)' : 'none'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {periodEditMode && (
        <div className="animate-slide-up" style={{ padding: '0 16px 12px', background: '#ffffff', zIndex: 10 }}>
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

      {/* ── Day detail bottom card ────────────────────────────────── */}
      {!periodEditMode && selectedKey && (
        <div className="animate-slide-up" style={{
          margin: '0',
          background: '#ffffff',
          borderTop: '1px solid #F3F4F6',
          padding: '16px',
          minHeight: '120px',
          zIndex: 10,
        }}>
          {/* Drag handle hint */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E9D5FF' }} />
          </div>

          {/* Date header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1F2937', lineHeight: 1 }}>
                {SHORT_MONTHS[selectedMonthNum || 0]} {selectedDayNum}, {selectedYearObj}
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
  );
}
