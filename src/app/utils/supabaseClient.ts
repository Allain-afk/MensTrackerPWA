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

export async function submitSurveyResponse(data: SurveyResponsePayload): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('survey_responses')
      .insert([data]);

    if (error) {
      console.error('[Survey] Supabase insert error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Survey] Unexpected error:', message);
    return { success: false, error: message };
  }
}
