import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SurveyResponsePayload {
  respondent: string | null;
  q1: string;
  q2: string;
  q3: string | null;
  user_agent: string;
}

const QUEUE_KEY = 'mens-tracker:survey-queue';

function readQueue(): SurveyResponsePayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SurveyResponsePayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SurveyResponsePayload[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // quota/private-mode — swallow
  }
}

function enqueue(data: SurveyResponsePayload) {
  const queue = readQueue();
  queue.push(data);
  writeQueue(queue);
}

async function insertDirect(data: SurveyResponsePayload) {
  return supabase.from('survey_responses').insert([data]);
}

export async function flushSurveyQueue(): Promise<void> {
  const queue = readQueue();
  if (!queue.length) return;
  const remaining: SurveyResponsePayload[] = [];
  for (const item of queue) {
    try {
      const { error } = await insertDirect(item);
      if (error) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
}

export async function submitSurveyResponse(data: SurveyResponsePayload): Promise<{ success: boolean; error?: string; queued?: boolean }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    enqueue(data);
    return { success: true, queued: true };
  }

  try {
    const { error } = await insertDirect(data);

    if (error) {
      console.error('[Survey] Supabase insert error:', error.message);
      enqueue(data);
      return { success: true, queued: true };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Survey] Unexpected error:', message);
    enqueue(data);
    return { success: true, queued: true };
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flushSurveyQueue();
  });
  // Attempt initial flush on load
  setTimeout(() => {
    if (navigator.onLine) void flushSurveyQueue();
  }, 3000);
}
