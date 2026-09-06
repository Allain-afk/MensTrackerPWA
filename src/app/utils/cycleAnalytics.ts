import type { DayLog } from '../data/models';
import { keyToDate, dateToKey } from '../context/CycleContext';

export interface RecurrentPattern {
  name: string;
  category: 'symptom' | 'mood';
  cycleCount: number;
  totalCyclesWithLogs: number;
  frequencyPercent: number;
}

export interface CycleRegularityStats {
  averageCycleLength: number;
  minCycleLength: number;
  maxCycleLength: number;
  cycleLengthVariation: number;
  regularityLabel: 'Very Regular' | 'Mostly Regular' | 'Irregular' | 'Insufficient Data';
  clinicalFlags: string[];
}

export interface PmsForecast {
  isUpcoming: boolean; // true if within 1-5 days before predicted period
  daysUntilPeriod: number;
  predictedPeriodDate: Date | null;
  likelySymptoms: RecurrentPattern[];
}

export interface CycleAnalyticsResult {
  pmsPatterns: RecurrentPattern[];
  regularity: CycleRegularityStats;
  pmsForecast: PmsForecast;
  totalTrackedCycles: number;
}

/**
 * Adds or subtracts days from a Date object
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates cycle intervals and statistical regularity from period start dates
 */
export function calculateRegularityStats(periodStarts: (string | Date)[], fallbackCycleLength: number): CycleRegularityStats {
  if (periodStarts.length < 2) {
    return {
      averageCycleLength: fallbackCycleLength,
      minCycleLength: fallbackCycleLength,
      maxCycleLength: fallbackCycleLength,
      cycleLengthVariation: 0,
      regularityLabel: 'Insufficient Data',
      clinicalFlags: ['Log at least 2 consecutive periods to calculate clinical regularity.'],
    };
  }

  // Sort dates chronologically
  const sortedStarts = [...periodStarts]
    .map((k) => (k instanceof Date ? k : keyToDate(k)))
    .sort((a, b) => a.getTime() - b.getTime());

  const intervals: number[] = [];
  for (let i = 1; i < sortedStarts.length; i++) {
    const diffDays = Math.round(
      (sortedStarts[i].getTime() - sortedStarts[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    // Ignore unreasonable outliers like gap years (>90d) or duplicates (<10d)
    if (diffDays >= 15 && diffDays <= 90) {
      intervals.push(diffDays);
    }
  }

  if (intervals.length === 0) {
    return {
      averageCycleLength: fallbackCycleLength,
      minCycleLength: fallbackCycleLength,
      maxCycleLength: fallbackCycleLength,
      cycleLengthVariation: 0,
      regularityLabel: 'Insufficient Data',
      clinicalFlags: [],
    };
  }

  const sum = intervals.reduce((acc, v) => acc + v, 0);
  const avg = Math.round(sum / intervals.length);
  const min = Math.min(...intervals);
  const max = Math.max(...intervals);
  const variation = max - min;

  const clinicalFlags: string[] = [];
  if (min < 21) {
    clinicalFlags.push('One or more cycles were under 21 days (Polymenorrhea).');
  }
  if (max > 35) {
    clinicalFlags.push('One or more cycles exceeded 35 days (Oligomenorrhea).');
  }
  if (variation >= 9) {
    clinicalFlags.push(`Cycle length varied by ${variation} days across tracked cycles.`);
  }

  let regularityLabel: 'Very Regular' | 'Mostly Regular' | 'Irregular' = 'Mostly Regular';
  if (variation <= 3) {
    regularityLabel = 'Very Regular';
  } else if (variation <= 7) {
    regularityLabel = 'Mostly Regular';
  } else {
    regularityLabel = 'Irregular';
  }

  return {
    averageCycleLength: avg,
    minCycleLength: min,
    maxCycleLength: max,
    cycleLengthVariation: variation,
    regularityLabel,
    clinicalFlags,
  };
}

/**
 * Analyzes logs across previous cycles in the 5-day premenstrual window to find recurrent symptoms/moods.
 */
export function analyzePmsPatterns(
  logs: Record<string, DayLog>,
  periodStarts: (string | Date)[]
): RecurrentPattern[] {
  if (periodStarts.length === 0) return [];

  const sortedStarts = [...periodStarts]
    .map((k) => (k instanceof Date ? k : keyToDate(k)))
    .sort((a, b) => a.getTime() - b.getTime());

  // For each cycle start, look at the 5 days prior (start - 5 to start - 1)
  const symptomCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  let cyclesEvaluated = 0;

  for (const start of sortedStarts) {
    const pmsDates: string[] = [];
    for (let offset = 1; offset <= 5; offset++) {
      pmsDates.push(dateToKey(addDays(start, -offset)));
    }

    // Check if user logged on any of these 5 days
    const relevantLogs = pmsDates.map((k) => logs[k]).filter(Boolean);
    if (relevantLogs.length === 0) continue;

    cyclesEvaluated++;
    const cycleSymptoms = new Set<string>();
    const cycleMoods = new Set<string>();

    for (const log of relevantLogs) {
      log.symptoms?.forEach((s) => cycleSymptoms.add(s));
      log.moods?.forEach((m) => cycleMoods.add(m));
    }

    cycleSymptoms.forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
    cycleMoods.forEach((m) => {
      moodCounts[m] = (moodCounts[m] || 0) + 1;
    });
  }

  if (cyclesEvaluated === 0) return [];

  const patterns: RecurrentPattern[] = [];

  Object.entries(symptomCounts).forEach(([name, count]) => {
    const frequencyPercent = Math.round((count / cyclesEvaluated) * 100);
    // Include symptoms occurring in >= 33% of evaluated cycles or at least twice
    if (frequencyPercent >= 33 || count >= 2) {
      patterns.push({
        name,
        category: 'symptom',
        cycleCount: count,
        totalCyclesWithLogs: cyclesEvaluated,
        frequencyPercent,
      });
    }
  });

  Object.entries(moodCounts).forEach(([name, count]) => {
    const frequencyPercent = Math.round((count / cyclesEvaluated) * 100);
    if (frequencyPercent >= 33 || count >= 2) {
      patterns.push({
        name,
        category: 'mood',
        cycleCount: count,
        totalCyclesWithLogs: cyclesEvaluated,
        frequencyPercent,
      });
    }
  });

  // Sort by highest frequency
  return patterns.sort((a, b) => b.frequencyPercent - a.frequencyPercent);
}

/**
 * Evaluates whether today is in the PMS window (1 to 5 days prior to predicted next period).
 */
export function evaluatePmsForecast(
  periodStarts: (string | Date)[],
  cycleLength: number,
  patterns: RecurrentPattern[]
): PmsForecast {
  if (periodStarts.length === 0) {
    return {
      isUpcoming: false,
      daysUntilPeriod: 0,
      predictedPeriodDate: null,
      likelySymptoms: [],
    };
  }

  // Get most recent period start
  const sortedStarts = [...periodStarts]
    .map((k) => (k instanceof Date ? k : keyToDate(k)))
    .sort((a, b) => a.getTime() - b.getTime());
  const lastStart = sortedStarts[sortedStarts.length - 1];

  const predictedNext = addDays(lastStart, cycleLength);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = predictedNext.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // PMS window is typically 1 to 5 days before period start
  const isUpcoming = diffDays >= 1 && diffDays <= 5;

  return {
    isUpcoming,
    daysUntilPeriod: diffDays,
    predictedPeriodDate: predictedNext,
    likelySymptoms: patterns.slice(0, 4), // top 4 most common PMS patterns
  };
}

/**
 * Main entry point: runs complete cycle analytics
 */
export function analyzeCyclePatterns(
  logs: Record<string, DayLog>,
  periodStarts: (string | Date)[],
  cycleLength: number
): CycleAnalyticsResult {
  const pmsPatterns = analyzePmsPatterns(logs, periodStarts);
  const regularity = calculateRegularityStats(periodStarts, cycleLength);
  const pmsForecast = evaluatePmsForecast(periodStarts, regularity.averageCycleLength || cycleLength, pmsPatterns);

  return {
    pmsPatterns,
    regularity,
    pmsForecast,
    totalTrackedCycles: periodStarts.length,
  };
}
