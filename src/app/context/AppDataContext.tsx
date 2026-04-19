import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createDefaultSnapshot,
  type AppDataSnapshot,
  type AppPreferences,
  type CycleSettings,
  type DayLog,
  type NotificationSettings,
} from '../data/models';
import {
  initializeStore,
  loadAppSnapshot,
  saveAppPreferences,
  saveCycleSettings,
  saveNotificationSettings,
  saveUserName,
  upsertDayLog,
  deleteDayLog,
} from '../data/store';
import { requestSync } from '../utils/syncService';

interface AppDataContextValue {
  ready: boolean;
  snapshot: AppDataSnapshot;
  reload: () => Promise<void>;
  setName: (name: string) => void;
  updateCycleSettings: (patch: Partial<CycleSettings>) => void;
  setNotificationPreferences: (settings: NotificationSettings) => void;
  updatePreferences: (patch: Partial<AppPreferences>) => void;
  saveLog: (dateKey: string, log: DayLog) => void;
  deleteLog: (dateKey: string) => void;
}

const defaultValue: AppDataContextValue = {
  ready: false,
  snapshot: createDefaultSnapshot(),
  reload: async () => undefined,
  setName: () => undefined,
  updateCycleSettings: () => undefined,
  setNotificationPreferences: () => undefined,
  updatePreferences: () => undefined,
  saveLog: () => undefined,
  deleteLog: () => undefined,
};

const AppDataContext = createContext<AppDataContextValue>(defaultValue);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<AppDataSnapshot>(createDefaultSnapshot);

  const reload = useCallback(async () => {
    try {
      await initializeStore();
      const nextSnapshot = await loadAppSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      console.error('Failed to reload app data.', error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setName = useCallback((name: string) => {
    setSnapshot((previous) => ({
      ...previous,
      profile: { name },
    }));
    void saveUserName(name).catch((error) => {
      console.error('Failed to save user name.', error);
    });
    requestSync();
  }, []);

  const updateCycleSettings = useCallback((patch: Partial<CycleSettings>) => {
    setSnapshot((previous) => {
      const nextSettings = {
        ...previous.cycleSettings,
        ...patch,
      };

      void saveCycleSettings(nextSettings).catch((error) => {
        console.error('Failed to save cycle settings.', error);
      });
      requestSync();

      return {
        ...previous,
        cycleSettings: nextSettings,
      };
    });
  }, []);

  const setNotificationPreferences = useCallback((settings: NotificationSettings) => {
    setSnapshot((previous) => ({
      ...previous,
      notificationSettings: settings,
    }));
    void saveNotificationSettings(settings).catch((error) => {
      console.error('Failed to save notification settings.', error);
    });
    requestSync();
  }, []);

  const updatePreferences = useCallback((patch: Partial<AppPreferences>) => {
    setSnapshot((previous) => {
      const nextPreferences = {
        ...previous.preferences,
        ...patch,
      };

      void saveAppPreferences(nextPreferences).catch((error) => {
        console.error('Failed to save app preferences.', error);
      });

      return {
        ...previous,
        preferences: nextPreferences,
      };
    });
  }, []);

  const saveLog = useCallback((dateKey: string, log: DayLog) => {
    setSnapshot((previous) => ({
      ...previous,
      logs: {
        ...previous.logs,
        [dateKey]: log,
      },
    }));
    void upsertDayLog(dateKey, log).catch((error) => {
      console.error(`Failed to save log for ${dateKey}.`, error);
    });
    requestSync();
  }, []);

  const deleteLog = useCallback((dateKey: string) => {
    setSnapshot((previous) => {
      const nextLogs = { ...previous.logs };
      delete nextLogs[dateKey];
      return {
        ...previous,
        logs: nextLogs,
      };
    });
    void deleteDayLog(dateKey).catch((error) => {
      console.error(`Failed to delete log for ${dateKey}.`, error);
    });
    requestSync();
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      snapshot,
      reload,
      setName,
      updateCycleSettings,
      setNotificationPreferences,
      updatePreferences,
      saveLog,
      deleteLog,
    }),
    [
      ready,
      snapshot,
      reload,
      setName,
      updateCycleSettings,
      setNotificationPreferences,
      updatePreferences,
      saveLog,
      deleteLog,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}
