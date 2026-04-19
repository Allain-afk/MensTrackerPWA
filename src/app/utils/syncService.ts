import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {
  getSyncMeta,
  setSyncMeta,
  listDayLogsUpdatedAfter,
  listTombstonesDeletedAfter,
  getDayLogMeta,
  getTombstone,
  getSingletonUpdatedAt,
  upsertDayLog,
  deleteDayLog,
  saveCycleSettings,
  saveNotificationSettings,
  saveUserName,
  loadAppSnapshot,
} from '../data/store';
import type { CycleSettings, DayLog, NotificationSettings } from '../data/models';

const EPOCH = '1970-01-01T00:00:00.000Z';

const META_LAST_PULLED = 'last_pulled_at';
const META_LAST_PUSHED = 'last_pushed_at';
const META_LAST_SYNCED = 'last_synced_at';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncResult {
  pushed: number;
  pulled: number;
  deletedRemote: number;
  startedAt: string;
  finishedAt: string;
}

type Listener = (state: { status: SyncStatus; lastSyncedAt: string | null; error: string | null }) => void;

let inFlight: Promise<SyncResult> | null = null;
let listeners = new Set<Listener>();
let cached = { status: 'idle' as SyncStatus, lastSyncedAt: null as string | null, error: null as string | null };

function emit() {
  for (const listener of listeners) listener(cached);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(cached);
  return () => {
    listeners.delete(listener);
  };
}

export async function getInitialStatus(): Promise<void> {
  const lastSyncedAt = await getSyncMeta(META_LAST_SYNCED);
  cached = { ...cached, lastSyncedAt };
  emit();
}

function isNewer(a: string, b: string): boolean {
  // Compare ISO-ish timestamps numerically.
  return Date.parse(a) > Date.parse(b);
}

function rowToDayLog(row: Record<string, unknown>): DayLog {
  return {
    flow: (row.flow as DayLog['flow']) ?? null,
    moods: Array.isArray(row.moods) ? (row.moods as DayLog['moods']) : [],
    symptoms: Array.isArray(row.symptoms) ? (row.symptoms as DayLog['symptoms']) : [],
    notes: typeof row.notes === 'string' ? row.notes : '',
    isPeriod: Boolean(row.is_period),
    hadIntimacy: Boolean(row.had_intimacy),
    protectionUsed: (row.protection_used as DayLog['protectionUsed']) ?? null,
    intimacyNotes: typeof row.intimacy_notes === 'string' ? row.intimacy_notes : '',
    sleepQuality: (row.sleep_quality as DayLog['sleepQuality']) ?? null,
    energyLevel: (row.energy_level as DayLog['energyLevel']) ?? null,
    waterGlasses: typeof row.water_glasses === 'number' ? row.water_glasses : 0,
    cervicalMucus: (row.cervical_mucus as DayLog['cervicalMucus']) ?? null,
  };
}

async function pushSingletons(user: User): Promise<void> {
  const snapshot = await loadAppSnapshot();
  const profileUpdatedAt = (await getSingletonUpdatedAt('profile')) || new Date().toISOString();
  const cycleUpdatedAt = (await getSingletonUpdatedAt('cycle')) || new Date().toISOString();
  const notifUpdatedAt = (await getSingletonUpdatedAt('notifications')) || new Date().toISOString();

  // Profile
  const { data: remoteProfile } = await supabase
    .from('user_profiles')
    .select('updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!remoteProfile || isNewer(profileUpdatedAt, remoteProfile.updated_at)) {
    await supabase.from('user_profiles').upsert({
      user_id: user.id,
      name: snapshot.profile.name,
      updated_at: profileUpdatedAt,
    });
  }

  // Settings (cycle + notifications combined in user_settings row)
  const { data: remoteSettings } = await supabase
    .from('user_settings')
    .select('updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  const settingsUpdatedAt = isNewer(cycleUpdatedAt, notifUpdatedAt) ? cycleUpdatedAt : notifUpdatedAt;

  if (!remoteSettings || isNewer(settingsUpdatedAt, remoteSettings.updated_at)) {
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      cycle_length: snapshot.cycleSettings.cycleLength,
      period_length: snapshot.cycleSettings.periodLength,
      use_adaptive_predictions: snapshot.cycleSettings.useAdaptivePredictions,
      perimenopause_mode: snapshot.cycleSettings.perimenopauseMode,
      notif_period_reminder: snapshot.notificationSettings.periodReminder,
      notif_fertile_window: snapshot.notificationSettings.fertileWindow,
      notif_daily_log: snapshot.notificationSettings.dailyLog,
      notif_insights: snapshot.notificationSettings.insights,
      updated_at: settingsUpdatedAt,
    });
  }
}

async function pullSingletons(user: User): Promise<boolean> {
  let changed = false;

  const [{ data: remoteProfile }, { data: remoteSettings }] = await Promise.all([
    supabase.from('user_profiles').select('name, updated_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  if (remoteProfile) {
    const localUpdatedAt = await getSingletonUpdatedAt('profile');
    if (!localUpdatedAt || isNewer(remoteProfile.updated_at, localUpdatedAt)) {
      await saveUserName(remoteProfile.name ?? '', remoteProfile.updated_at);
      changed = true;
    }
  }

  if (remoteSettings) {
    const cycleLocal = await getSingletonUpdatedAt('cycle');
    if (!cycleLocal || isNewer(remoteSettings.updated_at, cycleLocal)) {
      const cycle: CycleSettings = {
        cycleLength: remoteSettings.cycle_length,
        periodLength: remoteSettings.period_length,
        useAdaptivePredictions: remoteSettings.use_adaptive_predictions,
        perimenopauseMode: remoteSettings.perimenopause_mode,
      };
      await saveCycleSettings(cycle, remoteSettings.updated_at);
      changed = true;
    }
    const notifLocal = await getSingletonUpdatedAt('notifications');
    if (!notifLocal || isNewer(remoteSettings.updated_at, notifLocal)) {
      const notif: NotificationSettings = {
        periodReminder: remoteSettings.notif_period_reminder,
        fertileWindow: remoteSettings.notif_fertile_window,
        dailyLog: remoteSettings.notif_daily_log,
        insights: remoteSettings.notif_insights,
      };
      await saveNotificationSettings(notif, remoteSettings.updated_at);
      changed = true;
    }
  }

  return changed;
}

async function pushDayLogs(user: User, since: string): Promise<number> {
  const dirty = await listDayLogsUpdatedAfter(since);
  const tombstones = await listTombstonesDeletedAfter(since);

  if (!dirty.length && !tombstones.length) return 0;

  const rows = [
    ...dirty.map((entry) => ({
      user_id: user.id,
      date_key: entry.dateKey,
      flow: entry.log.flow,
      moods: entry.log.moods,
      symptoms: entry.log.symptoms,
      notes: entry.log.notes,
      is_period: entry.log.isPeriod,
      had_intimacy: entry.log.hadIntimacy ?? false,
      protection_used: entry.log.protectionUsed ?? null,
      intimacy_notes: entry.log.intimacyNotes ?? '',
      sleep_quality: entry.log.sleepQuality ?? null,
      energy_level: entry.log.energyLevel ?? null,
      water_glasses: entry.log.waterGlasses ?? 0,
      cervical_mucus: entry.log.cervicalMucus ?? null,
      updated_at: entry.updatedAt,
      deleted_at: null,
    })),
    ...tombstones.map((t) => ({
      user_id: user.id,
      date_key: t.dateKey,
      flow: null,
      moods: [],
      symptoms: [],
      notes: '',
      is_period: false,
      had_intimacy: false,
      protection_used: null,
      intimacy_notes: '',
      sleep_quality: null,
      energy_level: null,
      water_glasses: 0,
      cervical_mucus: null,
      updated_at: t.deletedAt,
      deleted_at: t.deletedAt,
    })),
  ];

  if (rows.length) {
    const { error } = await supabase.from('day_logs').upsert(rows);
    if (error) throw error;
  }

  return rows.length;
}

async function pullDayLogs(user: User, since: string): Promise<{ pulled: number; deleted: number; latest: string }> {
  const { data, error } = await supabase
    .from('day_logs')
    .select('*')
    .eq('user_id', user.id)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return { pulled: 0, deleted: 0, latest: since };

  let pulled = 0;
  let deleted = 0;
  let latest = since;

  for (const row of data) {
    const remoteUpdatedAt = row.updated_at as string;
    if (isNewer(remoteUpdatedAt, latest)) latest = remoteUpdatedAt;

    const localMeta = await getDayLogMeta(row.date_key);
    const localTomb = await getTombstone(row.date_key);

    const localUpdatedAt = localMeta?.updatedAt ?? localTomb?.deletedAt ?? '';

    // Only apply if remote is strictly newer than what we have locally.
    if (localUpdatedAt && !isNewer(remoteUpdatedAt, localUpdatedAt)) continue;

    if (row.deleted_at) {
      await deleteDayLog(row.date_key, row.deleted_at);
      deleted++;
    } else {
      await upsertDayLog(row.date_key, rowToDayLog(row), remoteUpdatedAt);
      pulled++;
    }
  }

  return { pulled, deleted, latest };
}

export async function syncNow(user: User): Promise<SyncResult> {
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<SyncResult> => {
    cached = { ...cached, status: 'syncing', error: null };
    emit();

    const startedAt = new Date().toISOString();
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        cached = { ...cached, status: 'offline' };
        emit();
        throw new Error('offline');
      }

      const lastPulled = (await getSyncMeta(META_LAST_PULLED)) ?? EPOCH;
      const lastPushed = (await getSyncMeta(META_LAST_PUSHED)) ?? EPOCH;

      // 1. Pull remote day_logs since last pulled.
      const pullResult = await pullDayLogs(user, lastPulled);
      const deletedRemote = pullResult.deleted;

      // 2. Pull singletons (may rewrite local if remote is newer).
      await pullSingletons(user);

      // 3. Push local day_logs since last pushed.
      const pushed = await pushDayLogs(user, lastPushed);

      // 4. Push singletons (LWW).
      await pushSingletons(user);

      const finishedAt = new Date().toISOString();

      await setSyncMeta(META_LAST_PULLED, pullResult.latest);
      await setSyncMeta(META_LAST_PUSHED, finishedAt);
      await setSyncMeta(META_LAST_SYNCED, finishedAt);

      cached = { status: 'idle', lastSyncedAt: finishedAt, error: null };
      emit();

      return {
        pushed,
        pulled: pullResult.pulled,
        deletedRemote,
        startedAt,
        finishedAt,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      cached = {
        ...cached,
        status: message === 'offline' ? 'offline' : 'error',
        error: message === 'offline' ? null : message,
      };
      emit();
      throw err;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

// ─── Debounced auto-sync trigger ─────────────────────────────────────────────

let requestTimer: ReturnType<typeof setTimeout> | null = null;
let pendingUser: User | null = null;

export function setActiveUser(user: User | null) {
  pendingUser = user;
  if (!user && requestTimer) {
    clearTimeout(requestTimer);
    requestTimer = null;
  }
}

export function requestSync(delayMs = 1500) {
  if (!pendingUser) return;
  if (requestTimer) clearTimeout(requestTimer);
  requestTimer = setTimeout(() => {
    requestTimer = null;
    const user = pendingUser;
    if (!user) return;
    syncNow(user).catch((err) => {
      console.error('[Sync] auto-sync failed', err);
    });
  }, delayMs);
}
