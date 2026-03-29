import type { AppDataSnapshot } from '../data/models';
import {
  getSchemaVersion,
  loadAppSnapshot,
  normalizeSnapshot,
  replaceAllData,
} from '../data/store';

const BACKUP_VERSION = 1;
const BACKUP_FORMAT = 'menstracker-sqlocal-backup';

interface LegacyPlainBackupPayload {
  version: number;
  createdAt: string;
  data: Partial<Record<string, string>>;
}

interface SqlPlainBackupPayload {
  format: typeof BACKUP_FORMAT;
  version: number;
  schemaVersion: number;
  createdAt: string;
  snapshot: AppDataSnapshot;
}

interface EncryptedBackupPayload {
  format?: typeof BACKUP_FORMAT;
  version: number;
  schemaVersion?: number;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveAesKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function isSqlBackupPayload(value: unknown): value is SqlPlainBackupPayload {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as SqlPlainBackupPayload).format === BACKUP_FORMAT &&
      typeof (value as SqlPlainBackupPayload).snapshot === 'object'
  );
}

function mapLegacyBackupToSnapshot(payload: LegacyPlainBackupPayload): AppDataSnapshot {
  const rawLogs = payload.data.bloomcycle_logs;
  const rawCycleSettings = payload.data.bloomcycle_cycle_settings;
  const rawNotifications = payload.data.bloomcycle_notification_settings;

  let logs = {};
  let cycleSettings = {};
  let notificationSettings = {};

  try {
    logs = rawLogs ? JSON.parse(rawLogs) : {};
  } catch {
    logs = {};
  }

  try {
    cycleSettings = rawCycleSettings ? JSON.parse(rawCycleSettings) : {};
  } catch {
    cycleSettings = {};
  }

  try {
    notificationSettings = rawNotifications ? JSON.parse(rawNotifications) : {};
  } catch {
    notificationSettings = {};
  }

  return normalizeSnapshot({
    profile: {
      name: payload.data.bloomcycle_name ?? '',
    },
    cycleSettings: cycleSettings as AppDataSnapshot['cycleSettings'],
    notificationSettings: notificationSettings as AppDataSnapshot['notificationSettings'],
    preferences: {
      appLockEnabled: payload.data.bloomcycle_app_lock === 'true',
      notificationPermission: payload.data.bloomcycle_notification_permission ?? '',
      permissionsPrompted: payload.data.bloomcycle_permissions_prompted === 'true',
      calendarSwipeHint: false,
    },
    logs: logs as AppDataSnapshot['logs'],
  });
}

export async function createEncryptedBackup(passphrase: string): Promise<string> {
  if (!passphrase || passphrase.trim().length < 6) {
    throw new Error('Use a passphrase with at least 6 characters.');
  }

  const iterations = 210000;
  const enc = new TextEncoder();
  const payload: SqlPlainBackupPayload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion: getSchemaVersion(),
    createdAt: new Date().toISOString(),
    snapshot: await loadAppSnapshot(),
  };
  const plainBytes = enc.encode(JSON.stringify(payload));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt, iterations);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plainBytes
  );

  const filePayload: EncryptedBackupPayload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion: payload.schemaVersion,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
  };

  return JSON.stringify(filePayload, null, 2);
}

export async function restoreEncryptedBackup(fileText: string, passphrase: string): Promise<void> {
  const parsed = JSON.parse(fileText) as EncryptedBackupPayload;
  if (!parsed || parsed.algorithm !== 'AES-GCM' || parsed.kdf !== 'PBKDF2') {
    throw new Error('Invalid backup format.');
  }

  const salt = base64ToBytes(parsed.salt);
  const iv = base64ToBytes(parsed.iv);
  const ciphertext = base64ToBytes(parsed.ciphertext);
  const key = await deriveAesKey(passphrase, salt, parsed.iterations);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
  } catch {
    throw new Error('Could not decrypt backup. Check your passphrase.');
  }

  const dec = new TextDecoder();
  const decrypted = dec.decode(decryptedBuffer);
  const payload = JSON.parse(decrypted) as SqlPlainBackupPayload | LegacyPlainBackupPayload;

  if (isSqlBackupPayload(payload)) {
    await replaceAllData(normalizeSnapshot(payload.snapshot));
    return;
  }

  if (payload && typeof payload === 'object' && 'data' in payload && typeof payload.data === 'object') {
    await replaceAllData(mapLegacyBackupToSnapshot(payload as LegacyPlainBackupPayload));
    return;
  }

  throw new Error('Backup payload is invalid.');
}

export function downloadBackupFile(content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `menstracker-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
