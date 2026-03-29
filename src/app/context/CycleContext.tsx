import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import { useAppData } from './AppDataContext';
import type { CycleSettings, DayLog } from '../data/models';
export type {
  CervicalMucus,
  CycleSettings,
  DayLog,
  EnergyLevel,
  FlowLevel,
  MoodType,
  ProtectionType,
  SleepQuality,
  SymptomType,
} from '../data/models';

// ─── Date helpers ────────────────────────────────────────────────────────────

export function dateToKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function getDaysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function formatMonthShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((acc, n) => acc + Math.pow(n - m, 2), 0) / nums.length;
  return Math.sqrt(variance);
}

function weightedRecentAverage(nums: number[]): number {
  if (!nums.length) return 0;
  let totalWeight = 0;
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    const weight = i + 1;
    totalWeight += weight;
    total += nums[i] * weight;
  }
  return total / totalWeight;
}

// ─── Period clustering ────────────────────────────────────────────────────────

/** Returns sorted list of period-start dates (first day of each cluster). */
export function getPeriodStarts(logs: Record<string, DayLog>): Date[] {
  const periodKeys = Object.entries(logs)
    .filter(([, log]) => log.isPeriod)
    .map(([k]) => k)
    .sort();
  if (!periodKeys.length) return [];

  const starts: Date[] = [];
  let lastDate: Date | null = null;
  for (const key of periodKeys) {
    const date = keyToDate(key);
    if (!lastDate || getDaysBetween(lastDate, date) > 2) {
      starts.push(date);
    }
    lastDate = date;
  }
  return starts;
}

/** Count consecutive isPeriod days from a given start. */
export function getPeriodLength(startDate: Date, logs: Record<string, DayLog>): number {
  let count = 0;
  let d = new Date(startDate);
  while (logs[dateToKey(d)]?.isPeriod) {
    count++;
    d = addDays(d, 1);
    if (count > 14) break;
  }
  return Math.max(count, 1);
}

/** Derive current cycle phase label and icon from cycle day. */
export function getCyclePhase(cycleDay: number, cycleLength: number): { phase: string; icon: string } {
  const ovDay = cycleLength - 14;
  if (cycleDay <= 5) return { phase: 'Menstrual Phase', icon: '🩸' };
  if (cycleDay < ovDay - 1) return { phase: 'Follicular Phase', icon: '🌱' };
  if (cycleDay <= ovDay + 1) return { phase: 'Ovulatory Phase', icon: '⭐' };
  return { phase: 'Luteal Phase', icon: '🍂' };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CycleContextType {
  logs: Record<string, DayLog>;
  settings: CycleSettings;
  saveLog: (dateKey: string, log: DayLog) => void;
  deleteLog: (dateKey: string) => void;
  updateSettings: (s: Partial<CycleSettings>) => void;
  // Derived
  periodStarts: Date[];
  lastPeriodStart: Date | null;
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number | null;
  cycleDay: number | null;
  currentPhase: string;
  phaseIcon: string;
  ovulationDate: Date | null;
  fertileStart: Date | null;
  fertileEnd: Date | null;
  predictedPeriodRangeStart: Date | null;
  predictedPeriodRangeEnd: Date | null;
  estimatedCycleLength: number;
  estimatedPeriodLength: number;
  cycleVariability: number;
  predictionConfidencePercent: number;
  predictionConfidenceLabel: 'High' | 'Medium' | 'Low';
  lateByDays: number;
  cycleLengthsHistory: number[];
  // Calendar helpers
  isPeriodDay: (dateKey: string) => boolean;
  isPredictedPeriod: (dateKey: string) => boolean;
  isFertileDay: (dateKey: string) => boolean;
}

const CycleContext = createContext<CycleContextType>({} as CycleContextType);

export function CycleProvider({ children }: { children: ReactNode }) {
  const {
    snapshot,
    saveLog: persistLog,
    deleteLog: removeLog,
    updateCycleSettings,
  } = useAppData();
  const logs = snapshot.logs;
  const settings = snapshot.cycleSettings;

  const saveLog = useCallback((dateKey: string, log: DayLog) => {
    persistLog(dateKey, log);
  }, [persistLog]);

  const deleteLog = useCallback((dateKey: string) => {
    removeLog(dateKey);
  }, [removeLog]);

  const updateSettings = useCallback((s: Partial<CycleSettings>) => {
    updateCycleSettings(s);
  }, [updateCycleSettings]);

  const computed = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const periodStarts = getPeriodStarts(logs);
    const lastPeriodStart = periodStarts.length > 0 ? periodStarts[periodStarts.length - 1] : null;

    let nextPeriodDate: Date | null = null;
    let daysUntilNextPeriod: number | null = null;
    let cycleDay: number | null = null;
    let ovulationDate: Date | null = null;
    let fertileStart: Date | null = null;
    let fertileEnd: Date | null = null;
    let predictedPeriodRangeStart: Date | null = null;
    let predictedPeriodRangeEnd: Date | null = null;
    let lateByDays = 0;

    const cycleLengthsHistory: number[] = [];
    for (let i = 0; i < periodStarts.length - 1; i++) {
      cycleLengthsHistory.push(getDaysBetween(periodStarts[i], periodStarts[i + 1]));
    }

    const periodLengthsHistory = periodStarts.map(start => getPeriodLength(start, logs));

    const adaptiveCycleLength = cycleLengthsHistory.length
      ? Math.round(weightedRecentAverage(cycleLengthsHistory))
      : settings.cycleLength;

    const adaptivePeriodLength = periodLengthsHistory.length
      ? Math.round(weightedRecentAverage(periodLengthsHistory))
      : settings.periodLength;

    const estimatedCycleLength = settings.useAdaptivePredictions
      ? adaptiveCycleLength
      : settings.cycleLength;

    const estimatedPeriodLength = settings.useAdaptivePredictions
      ? adaptivePeriodLength
      : settings.periodLength;

    const cycleVariability = cycleLengthsHistory.length >= 2 ? stdDev(cycleLengthsHistory) : 0;
    const adjustedVariability = settings.perimenopauseMode ? cycleVariability + 1.5 : cycleVariability;

    const historyCount = cycleLengthsHistory.length;
    const historyFactor = Math.min(1, historyCount / 6);
    const variabilityPenalty = Math.min(0.6, adjustedVariability / 18);
    const confidenceRaw = Math.max(0.2, Math.min(1, historyFactor - variabilityPenalty + 0.2));
    const predictionConfidencePercent = Math.round(confidenceRaw * 100);
    const predictionConfidenceLabel: 'High' | 'Medium' | 'Low' = predictionConfidencePercent >= 75
      ? 'High'
      : predictionConfidencePercent >= 50
      ? 'Medium'
      : 'Low';

    if (lastPeriodStart) {
      const daysSince = getDaysBetween(lastPeriodStart, todayDate);
      cycleDay = daysSince + 1;

      const expectedStartThisCycle = addDays(lastPeriodStart, estimatedCycleLength);
      lateByDays = Math.max(0, getDaysBetween(expectedStartThisCycle, todayDate));

      // Advance predicted period to next future occurrence
      let np = addDays(lastPeriodStart, estimatedCycleLength);
      while (getDaysBetween(todayDate, np) < 0) {
        np = addDays(np, estimatedCycleLength);
      }
      nextPeriodDate = np;
      daysUntilNextPeriod = getDaysBetween(todayDate, np);

      const perimenopauseWindowBonus = settings.perimenopauseMode ? 2 : 0;
      const windowRadius = Math.max(1, Math.round(Math.min(7, (adjustedVariability || 1.5) + perimenopauseWindowBonus)));
      predictedPeriodRangeStart = addDays(np, -windowRadius);
      predictedPeriodRangeEnd = addDays(np, windowRadius);

      // Ovulation / fertile window
      ovulationDate = addDays(np, -14);
      const fertileBuffer = adjustedVariability >= 3 ? 1 : 0;
      fertileStart = addDays(ovulationDate, -5 - fertileBuffer);
      fertileEnd = addDays(ovulationDate, 1 + fertileBuffer);
    }

    // Build key sets for calendar
    const predictedPeriodKeys = new Set<string>();
    const fertileDayKeys = new Set<string>();

    if (lastPeriodStart) {
      // Predicted periods: next 4 cycles forward
      for (let n = 1; n <= 4; n++) {
        const cycleStart = addDays(lastPeriodStart, n * estimatedCycleLength);
        for (let i = 0; i < estimatedPeriodLength; i++) {
          const key = dateToKey(addDays(cycleStart, i));
          if (!logs[key]?.isPeriod) predictedPeriodKeys.add(key);
        }
      }

      // Fertile windows: current + next 4 cycles
      for (let n = 0; n <= 4; n++) {
        const base = addDays(lastPeriodStart, n * estimatedCycleLength);
        const ov = addDays(base, estimatedCycleLength - 14);
        const fertileBuffer = adjustedVariability >= 3 ? 1 : 0;
        for (let i = -5 - fertileBuffer; i <= 1 + fertileBuffer; i++) {
          fertileDayKeys.add(dateToKey(addDays(ov, i)));
        }
      }
    }

    let currentPhase = 'No cycle data';
    let phaseIcon = '🌸';
    if (cycleDay !== null) {
      const p = getCyclePhase(cycleDay, settings.cycleLength);
      currentPhase = p.phase;
      phaseIcon = p.icon;
    }

    return {
      periodStarts,
      lastPeriodStart,
      nextPeriodDate,
      daysUntilNextPeriod,
      cycleDay,
      currentPhase,
      phaseIcon,
      ovulationDate,
      fertileStart,
      fertileEnd,
      predictedPeriodRangeStart,
      predictedPeriodRangeEnd,
      estimatedCycleLength,
      estimatedPeriodLength,
      cycleVariability: adjustedVariability,
      predictionConfidencePercent,
      predictionConfidenceLabel,
      lateByDays,
      cycleLengthsHistory,
      isPeriodDay: (key: string) => !!logs[key]?.isPeriod,
      isPredictedPeriod: (key: string) => predictedPeriodKeys.has(key),
      isFertileDay: (key: string) => fertileDayKeys.has(key) && !logs[key]?.isPeriod,
    };
  }, [logs, settings]);

  return (
    <CycleContext.Provider value={{ logs, settings, saveLog, deleteLog, updateSettings, ...computed }}>
      {children}
    </CycleContext.Provider>
  );
}

export function useCycle() {
  return useContext(CycleContext);
}
