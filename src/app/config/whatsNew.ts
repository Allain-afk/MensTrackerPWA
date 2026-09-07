export interface ReleaseHighlight {
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

export interface ReleaseVersion {
  version: string;
  releaseDate: string;
  title: string;
  subtitle: string;
  highlights: ReleaseHighlight[];
}

export const CURRENT_APP_VERSION = '1.3.0';

export const CURRENT_RELEASE_INFO: ReleaseVersion = {
  version: CURRENT_APP_VERSION,
  releaseDate: 'September 2026',
  title: "What's New in BloomCycle ✨",
  subtitle: 'Modernized calendar, smart period logging, doctor reports, and improved cycle intelligence.',
  highlights: [
    {
      icon: '📅',
      title: 'Modernized Calendar & Quick Navigation',
      description: 'Frosted glass header with 1-month step arrows, interactive Month & Year picker to jump across years, quick filter pills, and a detailed day inspection drawer.',
      badge: 'New',
    },
    {
      icon: '🩸',
      title: 'Smart Period Catch-Up & Projection',
      description: 'Logged late? 1-tap auto-fills missed days through today and automatically projects remaining days of your ongoing period on the calendar.',
      badge: 'Smart',
    },
    {
      icon: '🩺',
      title: "Doctor's Clinical Health Summary (PDF)",
      description: 'Export a professional 1-page clinical report with cycle regularity, bleeding history, and symptom frequencies ready for your gynecologist visit.',
      badge: 'New',
    },
    {
      icon: '🔮',
      title: 'Smart PMS Forecast & Pattern Recognition',
      description: 'Your home screen now intelligently anticipates premenstrual symptoms based on recurring patterns from previous cycles.',
      badge: 'Smart',
    },
    {
      icon: '💊',
      title: 'Medications & Lifestyle Tags',
      description: 'Track pain relievers (Ibuprofen, Paracetamol, Birth Control, Magnesium) and daily factors (Stress, Workouts, Travel, Alcohol) with custom tags.',
      badge: 'New',
    },
    {
      icon: '📱',
      title: 'Seamless Native Mobile Experience',
      description: 'Full safe-area notch and home-bar support, edge-pull prevention, and screen fitting without navigation bar overlaps.',
      badge: 'Enhanced',
    },
    {
      icon: '🛡️',
      title: 'Enhanced Privacy & Offline Security',
      description: 'Transparent on-device Privacy Policy, Terms of Service, interactive backup guide, and zero server tracking.',
    },
  ],
};
