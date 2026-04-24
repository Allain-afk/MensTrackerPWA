export const APP_COPY = {
  appName: 'MensTracker',
  appTagline: 'Your body, your rhythm',
  supportEmail: 'support@allainafk.dev',
  onboardingBadge: 'WELCOME',
  onboardingIntro:
    'This helps us personalize your experience and make {appName} feel like home. 💜',
  homeEmptyWelcome: '👋 Welcome to {appName}!',
  calendarEmptyTitle: 'Start your journey',
  insightsEmptyTitle: 'No Insights Yet',
  settingsMemberLabel: '{appName} member',
  settingsFooterPrefix: '{appName} · Tracking',
  settingsHelpSteps: [
    'Check your cycle settings',
    'Log at least one full cycle for better predictions',
    'Reopen the app if charts look out of date',
  ],
  privacyMessage:
    'Your data is stored locally on your device. We do not upload your logs or personal details to a server in this app build.',
};

export function withAppName(template: string): string {
  return template.replace('{appName}', APP_COPY.appName);
}
