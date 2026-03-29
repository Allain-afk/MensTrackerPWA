import { SQLocal } from 'sqlocal';
import {
  createDefaultSnapshot,
  DEFAULT_APP_PREFERENCES,
  DEFAULT_CYCLE_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  EMPTY_DAY_LOG,
  type AppDataSnapshot,
  type AppPreferences,
  type CycleSettings,
  type DayLog,
  type NotificationSettings,
} from './models';

const SCHEMA_VERSION = 1;
const DATABASE_NAME = 'menstracker.sqlite3';

const { sql } = new SQLocal(DATABASE_NAME);

type SqlRow = Record<string, unknown>;

let initializationPromise: Promise<void> | null = null;

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseJsonArray<T>(value: unknown): T[] {
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function normalizeDayLog(input?: Partial<DayLog> | null): DayLog {
  return {
    flow: input?.flow ?? EMPTY_DAY_LOG.flow,
    moods: Array.isArray(input?.moods) ? input.moods : [],
    symptoms: Array.isArray(input?.symptoms) ? input.symptoms : [],
    notes: typeof input?.notes === 'string' ? input.notes : '',
    isPeriod: Boolean(input?.isPeriod),
    hadIntimacy: Boolean(input?.hadIntimacy),
    protectionUsed: input?.protectionUsed ?? null,
    intimacyNotes: typeof input?.intimacyNotes === 'string' ? input.intimacyNotes : '',
    sleepQuality: input?.sleepQuality ?? null,
    energyLevel: input?.energyLevel ?? null,
    waterGlasses: typeof input?.waterGlasses === 'number' ? input.waterGlasses : 0,
    cervicalMucus: input?.cervicalMucus ?? null,
  };
}

function rowToDayLog(row: SqlRow): DayLog {
  return normalizeDayLog({
    flow: (row.flow as DayLog['flow']) ?? null,
    moods: parseJsonArray<DayLog['moods'][number]>(row.moods_json),
    symptoms: parseJsonArray<DayLog['symptoms'][number]>(row.symptoms_json),
    notes: asString(row.notes),
    isPeriod: asBoolean(row.is_period),
    hadIntimacy: asBoolean(row.had_intimacy),
    protectionUsed: (row.protection_used as DayLog['protectionUsed']) ?? null,
    intimacyNotes: asString(row.intimacy_notes),
    sleepQuality: (row.sleep_quality as DayLog['sleepQuality']) ?? null,
    energyLevel: (row.energy_level as DayLog['energyLevel']) ?? null,
    waterGlasses: asNumber(row.water_glasses, 0),
    cervicalMucus: (row.cervical_mucus as DayLog['cervicalMucus']) ?? null,
  });
}

function logToInsertable(dateKey: string, log: DayLog) {
  const normalized = normalizeDayLog(log);

  return {
    dateKey,
    flow: normalized.flow,
    moodsJson: JSON.stringify(normalized.moods),
    symptomsJson: JSON.stringify(normalized.symptoms),
    notes: normalized.notes,
    isPeriod: normalized.isPeriod ? 1 : 0,
    hadIntimacy: normalized.hadIntimacy ? 1 : 0,
    protectionUsed: normalized.protectionUsed,
    intimacyNotes: normalized.intimacyNotes ?? '',
    sleepQuality: normalized.sleepQuality,
    energyLevel: normalized.energyLevel,
    waterGlasses: normalized.waterGlasses ?? 0,
    cervicalMucus: normalized.cervicalMucus,
  };
}

async function withTransaction<T>(work: () => Promise<T>): Promise<T> {
  await sql`BEGIN IMMEDIATE`;

  try {
    const result = await work();
    await sql`COMMIT`;
    return result;
  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
}

async function initializeInternal(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS cycle_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      cycle_length INTEGER NOT NULL DEFAULT 28,
      period_length INTEGER NOT NULL DEFAULT 5,
      use_adaptive_predictions INTEGER NOT NULL DEFAULT 1,
      perimenopause_mode INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      period_reminder INTEGER NOT NULL DEFAULT 1,
      fertile_window INTEGER NOT NULL DEFAULT 1,
      daily_log INTEGER NOT NULL DEFAULT 0,
      insights INTEGER NOT NULL DEFAULT 1
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS app_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      app_lock_enabled INTEGER NOT NULL DEFAULT 0,
      notification_permission TEXT NOT NULL DEFAULT '',
      permissions_prompted INTEGER NOT NULL DEFAULT 0,
      calendar_swipe_hint INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS day_logs (
      date_key TEXT PRIMARY KEY,
      flow TEXT,
      moods_json TEXT NOT NULL DEFAULT '[]',
      symptoms_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      is_period INTEGER NOT NULL DEFAULT 0,
      had_intimacy INTEGER NOT NULL DEFAULT 0,
      protection_used TEXT,
      intimacy_notes TEXT NOT NULL DEFAULT '',
      sleep_quality TEXT,
      energy_level TEXT,
      water_glasses INTEGER NOT NULL DEFAULT 0,
      cervical_mucus TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    INSERT INTO app_meta (key, value)
    VALUES ('schema_version', ${String(SCHEMA_VERSION)})
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `;
  await sql`
    INSERT OR IGNORE INTO user_profile (id, name)
    VALUES (1, '')
  `;
  await sql`
    INSERT OR IGNORE INTO cycle_settings (
      id,
      cycle_length,
      period_length,
      use_adaptive_predictions,
      perimenopause_mode
    )
    VALUES (
      1,
      ${DEFAULT_CYCLE_SETTINGS.cycleLength},
      ${DEFAULT_CYCLE_SETTINGS.periodLength},
      ${DEFAULT_CYCLE_SETTINGS.useAdaptivePredictions ? 1 : 0},
      ${DEFAULT_CYCLE_SETTINGS.perimenopauseMode ? 1 : 0}
    )
  `;
  await sql`
    INSERT OR IGNORE INTO notification_settings (
      id,
      period_reminder,
      fertile_window,
      daily_log,
      insights
    )
    VALUES (
      1,
      ${DEFAULT_NOTIFICATION_SETTINGS.periodReminder ? 1 : 0},
      ${DEFAULT_NOTIFICATION_SETTINGS.fertileWindow ? 1 : 0},
      ${DEFAULT_NOTIFICATION_SETTINGS.dailyLog ? 1 : 0},
      ${DEFAULT_NOTIFICATION_SETTINGS.insights ? 1 : 0}
    )
  `;
  await sql`
    INSERT OR IGNORE INTO app_preferences (
      id,
      app_lock_enabled,
      notification_permission,
      permissions_prompted,
      calendar_swipe_hint
    )
    VALUES (
      1,
      ${DEFAULT_APP_PREFERENCES.appLockEnabled ? 1 : 0},
      ${DEFAULT_APP_PREFERENCES.notificationPermission},
      ${DEFAULT_APP_PREFERENCES.permissionsPrompted ? 1 : 0},
      ${DEFAULT_APP_PREFERENCES.calendarSwipeHint ? 1 : 0}
    )
  `;
}

export async function initializeStore(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeInternal();
  }

  return initializationPromise;
}

export async function loadAppSnapshot(): Promise<AppDataSnapshot> {
  await initializeStore();

  const snapshot = createDefaultSnapshot();

  const [profileRow] = (await sql`
    SELECT name
    FROM user_profile
    WHERE id = 1
  `) as SqlRow[];

  if (profileRow) {
    snapshot.profile = {
      name: asString(profileRow.name),
    };
  }

  const [settingsRow] = (await sql`
    SELECT cycle_length, period_length, use_adaptive_predictions, perimenopause_mode
    FROM cycle_settings
    WHERE id = 1
  `) as SqlRow[];

  if (settingsRow) {
    snapshot.cycleSettings = {
      cycleLength: asNumber(settingsRow.cycle_length, DEFAULT_CYCLE_SETTINGS.cycleLength),
      periodLength: asNumber(settingsRow.period_length, DEFAULT_CYCLE_SETTINGS.periodLength),
      useAdaptivePredictions: asBoolean(settingsRow.use_adaptive_predictions),
      perimenopauseMode: asBoolean(settingsRow.perimenopause_mode),
    };
  }

  const [notificationRow] = (await sql`
    SELECT period_reminder, fertile_window, daily_log, insights
    FROM notification_settings
    WHERE id = 1
  `) as SqlRow[];

  if (notificationRow) {
    snapshot.notificationSettings = {
      periodReminder: asBoolean(notificationRow.period_reminder),
      fertileWindow: asBoolean(notificationRow.fertile_window),
      dailyLog: asBoolean(notificationRow.daily_log),
      insights: asBoolean(notificationRow.insights),
    };
  }

  const [preferencesRow] = (await sql`
    SELECT app_lock_enabled, notification_permission, permissions_prompted, calendar_swipe_hint
    FROM app_preferences
    WHERE id = 1
  `) as SqlRow[];

  if (preferencesRow) {
    snapshot.preferences = {
      appLockEnabled: asBoolean(preferencesRow.app_lock_enabled),
      notificationPermission: asString(preferencesRow.notification_permission),
      permissionsPrompted: asBoolean(preferencesRow.permissions_prompted),
      calendarSwipeHint: asBoolean(preferencesRow.calendar_swipe_hint),
    };
  }

  const logRows = (await sql`
    SELECT
      date_key,
      flow,
      moods_json,
      symptoms_json,
      notes,
      is_period,
      had_intimacy,
      protection_used,
      intimacy_notes,
      sleep_quality,
      energy_level,
      water_glasses,
      cervical_mucus
    FROM day_logs
    ORDER BY date_key ASC
  `) as SqlRow[];

  snapshot.logs = logRows.reduce<Record<string, DayLog>>((accumulator, row) => {
    const dateKey = asString(row.date_key);
    if (dateKey) {
      accumulator[dateKey] = rowToDayLog(row);
    }
    return accumulator;
  }, {});

  return snapshot;
}

export async function saveUserName(name: string): Promise<void> {
  await initializeStore();
  await sql`
    INSERT INTO user_profile (id, name)
    VALUES (1, ${name})
    ON CONFLICT(id) DO UPDATE SET name = excluded.name
  `;
}

export async function saveCycleSettings(settings: CycleSettings): Promise<void> {
  await initializeStore();
  await sql`
    INSERT INTO cycle_settings (
      id,
      cycle_length,
      period_length,
      use_adaptive_predictions,
      perimenopause_mode
    )
    VALUES (
      1,
      ${settings.cycleLength},
      ${settings.periodLength},
      ${settings.useAdaptivePredictions ? 1 : 0},
      ${settings.perimenopauseMode ? 1 : 0}
    )
    ON CONFLICT(id) DO UPDATE SET
      cycle_length = excluded.cycle_length,
      period_length = excluded.period_length,
      use_adaptive_predictions = excluded.use_adaptive_predictions,
      perimenopause_mode = excluded.perimenopause_mode
  `;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await initializeStore();
  await sql`
    INSERT INTO notification_settings (
      id,
      period_reminder,
      fertile_window,
      daily_log,
      insights
    )
    VALUES (
      1,
      ${settings.periodReminder ? 1 : 0},
      ${settings.fertileWindow ? 1 : 0},
      ${settings.dailyLog ? 1 : 0},
      ${settings.insights ? 1 : 0}
    )
    ON CONFLICT(id) DO UPDATE SET
      period_reminder = excluded.period_reminder,
      fertile_window = excluded.fertile_window,
      daily_log = excluded.daily_log,
      insights = excluded.insights
  `;
}

export async function saveAppPreferences(preferences: AppPreferences): Promise<void> {
  await initializeStore();
  await sql`
    INSERT INTO app_preferences (
      id,
      app_lock_enabled,
      notification_permission,
      permissions_prompted,
      calendar_swipe_hint
    )
    VALUES (
      1,
      ${preferences.appLockEnabled ? 1 : 0},
      ${preferences.notificationPermission},
      ${preferences.permissionsPrompted ? 1 : 0},
      ${preferences.calendarSwipeHint ? 1 : 0}
    )
    ON CONFLICT(id) DO UPDATE SET
      app_lock_enabled = excluded.app_lock_enabled,
      notification_permission = excluded.notification_permission,
      permissions_prompted = excluded.permissions_prompted,
      calendar_swipe_hint = excluded.calendar_swipe_hint
  `;
}

export async function upsertDayLog(dateKey: string, log: DayLog): Promise<void> {
  await initializeStore();
  const next = logToInsertable(dateKey, log);

  await sql`
    INSERT INTO day_logs (
      date_key,
      flow,
      moods_json,
      symptoms_json,
      notes,
      is_period,
      had_intimacy,
      protection_used,
      intimacy_notes,
      sleep_quality,
      energy_level,
      water_glasses,
      cervical_mucus,
      updated_at
    )
    VALUES (
      ${next.dateKey},
      ${next.flow},
      ${next.moodsJson},
      ${next.symptomsJson},
      ${next.notes},
      ${next.isPeriod},
      ${next.hadIntimacy},
      ${next.protectionUsed},
      ${next.intimacyNotes},
      ${next.sleepQuality},
      ${next.energyLevel},
      ${next.waterGlasses},
      ${next.cervicalMucus},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(date_key) DO UPDATE SET
      flow = excluded.flow,
      moods_json = excluded.moods_json,
      symptoms_json = excluded.symptoms_json,
      notes = excluded.notes,
      is_period = excluded.is_period,
      had_intimacy = excluded.had_intimacy,
      protection_used = excluded.protection_used,
      intimacy_notes = excluded.intimacy_notes,
      sleep_quality = excluded.sleep_quality,
      energy_level = excluded.energy_level,
      water_glasses = excluded.water_glasses,
      cervical_mucus = excluded.cervical_mucus,
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function deleteDayLog(dateKey: string): Promise<void> {
  await initializeStore();
  await sql`
    DELETE FROM day_logs
    WHERE date_key = ${dateKey}
  `;
}

export async function resetAllData(): Promise<void> {
  await initializeStore();

  await withTransaction(async () => {
    await sql`DELETE FROM day_logs`;
    await saveUserName('');
    await saveCycleSettings(DEFAULT_CYCLE_SETTINGS);
    await saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
    await saveAppPreferences(DEFAULT_APP_PREFERENCES);
  });
}

export async function replaceAllData(snapshot: AppDataSnapshot): Promise<void> {
  await initializeStore();

  await withTransaction(async () => {
    await sql`DELETE FROM day_logs`;
    await saveUserName(snapshot.profile.name);
    await saveCycleSettings(snapshot.cycleSettings);
    await saveNotificationSettings(snapshot.notificationSettings);
    await saveAppPreferences(snapshot.preferences);

    const entries = Object.entries(snapshot.logs).sort(([left], [right]) =>
      left.localeCompare(right)
    );

    for (const [dateKey, log] of entries) {
      await upsertDayLog(dateKey, log);
    }
  });
}

export function normalizeSnapshot(input: Partial<AppDataSnapshot>): AppDataSnapshot {
  return {
    profile: {
      name: input.profile?.name ?? '',
    },
    cycleSettings: {
      cycleLength: input.cycleSettings?.cycleLength ?? DEFAULT_CYCLE_SETTINGS.cycleLength,
      periodLength: input.cycleSettings?.periodLength ?? DEFAULT_CYCLE_SETTINGS.periodLength,
      useAdaptivePredictions:
        input.cycleSettings?.useAdaptivePredictions ?? DEFAULT_CYCLE_SETTINGS.useAdaptivePredictions,
      perimenopauseMode:
        input.cycleSettings?.perimenopauseMode ?? DEFAULT_CYCLE_SETTINGS.perimenopauseMode,
    },
    notificationSettings: {
      periodReminder:
        input.notificationSettings?.periodReminder ?? DEFAULT_NOTIFICATION_SETTINGS.periodReminder,
      fertileWindow:
        input.notificationSettings?.fertileWindow ?? DEFAULT_NOTIFICATION_SETTINGS.fertileWindow,
      dailyLog: input.notificationSettings?.dailyLog ?? DEFAULT_NOTIFICATION_SETTINGS.dailyLog,
      insights: input.notificationSettings?.insights ?? DEFAULT_NOTIFICATION_SETTINGS.insights,
    },
    preferences: {
      appLockEnabled: input.preferences?.appLockEnabled ?? DEFAULT_APP_PREFERENCES.appLockEnabled,
      notificationPermission:
        input.preferences?.notificationPermission ?? DEFAULT_APP_PREFERENCES.notificationPermission,
      permissionsPrompted:
        input.preferences?.permissionsPrompted ?? DEFAULT_APP_PREFERENCES.permissionsPrompted,
      calendarSwipeHint:
        input.preferences?.calendarSwipeHint ?? DEFAULT_APP_PREFERENCES.calendarSwipeHint,
    },
    logs: Object.entries(input.logs ?? {}).reduce<Record<string, DayLog>>((accumulator, entry) => {
      accumulator[entry[0]] = normalizeDayLog(entry[1]);
      return accumulator;
    }, {}),
  };
}

export function getSchemaVersion(): number {
  return SCHEMA_VERSION;
}
