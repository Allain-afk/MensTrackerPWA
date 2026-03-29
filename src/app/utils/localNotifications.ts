import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type DayLog,
  type NotificationSettings,
} from '../data/models';

export { type NotificationSettings } from '../data/models';

export interface ReminderScheduleInput {
  nextPeriodDate: Date | null;
  fertileStart: Date | null;
}

export interface InAppReminderInput {
  currentPath: string;
  notificationSettings: NotificationSettings;
  logs: Record<string, DayLog>;
  nextPeriodDate: Date | null;
  fertileStart: Date | null;
}

export interface InAppReminder {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  actionPath: string;
  accentColor: string;
  icon: string;
}

export const NOTIFICATION_SETTINGS_KEY = 'bloomcycle_notification_settings';
export const WEB_NOTIFICATION_SUPPORT_MESSAGE =
  'Background device notifications are unavailable in this offline PWA build. Reminders will appear inside the app when you reopen it.';

const IN_APP_REMINDER_SEEN_KEY = 'mens-tracker:in-app-reminders-seen';

export const defaultNotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;

export function loadNotificationSettings(): NotificationSettings {
  return defaultNotificationSettings;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  void settings;
  window.dispatchEvent(new Event('bloomcycle:notifications-changed'));
}

export async function requestLocalNotificationPermission(): Promise<string> {
  return 'in-app-only';
}

export async function syncScheduledNotifications(input: ReminderScheduleInput): Promise<void> {
  void input;
}

export function areScheduledNotificationsAvailable(): boolean {
  return false;
}

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
}

function loadSeenReminderMap(): Record<string, string> {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(IN_APP_REMINDER_SEEN_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveSeenReminderMap(map: Record<string, string>): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const nextEntries = Object.entries(map).slice(-60);
    storage.setItem(IN_APP_REMINDER_SEEN_KEY, JSON.stringify(Object.fromEntries(nextEntries)));
  } catch {
    // Reminder bookkeeping should never block the app.
  }
}

function hasSeenReminder(id: string): boolean {
  return Boolean(loadSeenReminderMap()[id]);
}

function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDaysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function hasAnyLogForMonth(logs: Record<string, DayLog>, date: Date): boolean {
  const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-`;
  return Object.keys(logs).some((dateKey) => dateKey.startsWith(prefix));
}

export function markInAppReminderSeen(id: string): void {
  const seenMap = loadSeenReminderMap();
  seenMap[id] = new Date().toISOString();
  saveSeenReminderMap(seenMap);
}

export function getNextInAppReminder(input: InAppReminderInput): InAppReminder | null {
  const now = new Date();
  const today = startOfDay(now);
  const todayKey = dateToKey(today);
  const { currentPath, notificationSettings, logs, nextPeriodDate, fertileStart } = input;
  const candidates: InAppReminder[] = [];

  if (notificationSettings.periodReminder && nextPeriodDate && currentPath !== '/calendar') {
    const predictedDate = startOfDay(nextPeriodDate);
    const daysUntil = getDaysBetween(today, predictedDate);

    if (daysUntil <= 2 && daysUntil >= -1) {
      candidates.push({
        id: `period:${dateToKey(predictedDate)}`,
        title: daysUntil > 0 ? 'Period reminder' : 'Period check-in',
        body:
          daysUntil === 2
            ? 'Your predicted period is about two days away. Open the app and get ready.'
            : daysUntil === 1
            ? 'Your predicted period may start tomorrow.'
            : daysUntil === 0
            ? 'Your predicted period may start today.'
            : 'Your predicted period may have started yesterday. Update your log when you can.',
        actionLabel: 'View calendar',
        actionPath: '/calendar',
        accentColor: '#ec4899',
        icon: '🩸',
      });
    }
  }

  if (notificationSettings.fertileWindow && fertileStart && currentPath !== '/calendar') {
    const fertileDate = startOfDay(fertileStart);
    const daysUntil = getDaysBetween(today, fertileDate);

    if (daysUntil <= 0 && daysUntil >= -1) {
      candidates.push({
        id: `fertile:${dateToKey(fertileDate)}`,
        title: 'Fertile window reminder',
        body:
          daysUntil === 0
            ? 'Your predicted fertile window starts today.'
            : 'Your predicted fertile window started yesterday. Open the calendar to review it.',
        actionLabel: 'Open calendar',
        actionPath: '/calendar',
        accentColor: '#8b5cf6',
        icon: '💜',
      });
    }
  }

  if (
    notificationSettings.dailyLog &&
    currentPath !== '/log' &&
    now.getHours() >= 18 &&
    !logs[todayKey]
  ) {
    candidates.push({
      id: `daily-log:${todayKey}`,
      title: 'Daily log reminder',
      body: 'You have not logged today yet. Add today\'s symptoms before the day ends.',
      actionLabel: 'Open log',
      actionPath: '/log',
      accentColor: '#6d28d9',
      icon: '🌙',
    });
  }

  if (
    notificationSettings.insights &&
    currentPath !== '/insights' &&
    today.getDate() <= 7 &&
    hasAnyLogForMonth(logs, today)
  ) {
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    candidates.push({
      id: `insights:${monthKey}`,
      title: 'Monthly insights ready',
      body: 'Your latest cycle trends are ready to review in Insights.',
      actionLabel: 'Open insights',
      actionPath: '/insights',
      accentColor: '#f59e0b',
      icon: '✨',
    });
  }

  return candidates.find((candidate) => !hasSeenReminder(candidate.id)) ?? null;
}
