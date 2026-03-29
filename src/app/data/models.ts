export type FlowLevel = 'Light' | 'Medium' | 'Heavy' | null;
export type MoodType =
  | 'Happy'
  | 'Sensitive'
  | 'Sad'
  | 'Energized'
  | 'Anxious'
  | 'Irritable'
  | 'Calm'
  | 'Overwhelmed'
  | 'Focused'
  | 'Indifferent'
  | 'Hopeful'
  | 'Restless';
export type SymptomType =
  | 'Cramps'
  | 'Headache'
  | 'Bloating'
  | 'Fatigue'
  | 'Back Pain'
  | 'Nausea'
  | 'Hot Flashes'
  | 'Night Sweats'
  | 'Sleep Changes'
  | 'Cycle Spotting'
  | 'Tender Breasts'
  | 'Acne'
  | 'Constipation'
  | 'Diarrhea'
  | 'Dizziness'
  | 'Joint Pain'
  | 'Appetite Changes'
  | 'Cravings'
  | 'Pelvic Pressure';
export type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Great';
export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type CervicalMucus = 'Dry' | 'Sticky' | 'Creamy' | 'Watery' | 'Egg White';
export type ProtectionType = 'None' | 'Condom' | 'Pill' | 'Withdrawal' | 'Emergency Contraception' | 'Other' | null;

export interface DayLog {
  flow: FlowLevel;
  moods: MoodType[];
  symptoms: SymptomType[];
  notes: string;
  isPeriod: boolean;
  hadIntimacy?: boolean;
  protectionUsed?: ProtectionType;
  intimacyNotes?: string;
  sleepQuality?: SleepQuality | null;
  energyLevel?: EnergyLevel | null;
  waterGlasses?: number;
  cervicalMucus?: CervicalMucus | null;
}

export interface CycleSettings {
  cycleLength: number;
  periodLength: number;
  useAdaptivePredictions: boolean;
  perimenopauseMode: boolean;
}

export interface NotificationSettings {
  periodReminder: boolean;
  fertileWindow: boolean;
  dailyLog: boolean;
  insights: boolean;
}

export interface AppPreferences {
  appLockEnabled: boolean;
  notificationPermission: string;
  permissionsPrompted: boolean;
  calendarSwipeHint: boolean;
}

export interface UserProfile {
  name: string;
}

export interface AppDataSnapshot {
  profile: UserProfile;
  cycleSettings: CycleSettings;
  notificationSettings: NotificationSettings;
  preferences: AppPreferences;
  logs: Record<string, DayLog>;
}

export const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  cycleLength: 28,
  periodLength: 5,
  useAdaptivePredictions: true,
  perimenopauseMode: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  periodReminder: true,
  fertileWindow: true,
  dailyLog: false,
  insights: true,
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  appLockEnabled: false,
  notificationPermission: '',
  permissionsPrompted: false,
  calendarSwipeHint: false,
};

export const EMPTY_DAY_LOG: DayLog = {
  flow: null,
  moods: [],
  symptoms: [],
  notes: '',
  isPeriod: false,
  hadIntimacy: false,
  protectionUsed: null,
  intimacyNotes: '',
  sleepQuality: null,
  energyLevel: null,
  waterGlasses: 0,
  cervicalMucus: null,
};

export function createDefaultSnapshot(): AppDataSnapshot {
  return {
    profile: { name: '' },
    cycleSettings: { ...DEFAULT_CYCLE_SETTINGS },
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    preferences: { ...DEFAULT_APP_PREFERENCES },
    logs: {},
  };
}
