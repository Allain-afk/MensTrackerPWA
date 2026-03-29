import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '../data/models';

export { type NotificationSettings } from '../data/models';

export interface ReminderScheduleInput {
  nextPeriodDate: Date | null;
  fertileStart: Date | null;
}

export const NOTIFICATION_SETTINGS_KEY = 'bloomcycle_notification_settings';
export const WEB_NOTIFICATION_SUPPORT_MESSAGE =
  'Scheduled reminders are unavailable in this standalone offline PWA build.';

export const defaultNotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;

export function loadNotificationSettings(): NotificationSettings {
  return defaultNotificationSettings;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  void settings;
  window.dispatchEvent(new Event('bloomcycle:notifications-changed'));
}

export async function requestLocalNotificationPermission(): Promise<string> {
  return 'unsupported';
}

export async function syncScheduledNotifications(input: ReminderScheduleInput): Promise<void> {
  void input;
}

export function areScheduledNotificationsAvailable(): boolean {
  return false;
}
