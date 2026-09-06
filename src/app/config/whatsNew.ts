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
  title: "What's New in MensTracker ✨",
  subtitle: 'Improved health features, smarter predictions, and doctor reports — with 100% on-device privacy.',
  highlights: [
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
      title: 'Seamless Native Mobile Feel',
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
