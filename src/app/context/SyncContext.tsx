import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  subscribe,
  syncNow as syncNowService,
  setActiveUser,
  getInitialStatus,
  type SyncStatus,
} from '../utils/syncService';
import { useAuth } from './AuthContext';
import { useAppData } from './AppDataContext';

interface SyncContextValue {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  syncNow: async () => undefined,
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const { reload, ready: dataReady } = useAppData();
  const [state, setState] = useState<{ status: SyncStatus; lastSyncedAt: string | null; error: string | null }>({
    status: 'idle',
    lastSyncedAt: null,
    error: null,
  });
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  // Keep syncService aware of the current user.
  useEffect(() => {
    setActiveUser(user ?? null);
  }, [user]);

  // Subscribe to sync state updates.
  useEffect(() => {
    const unsubscribe = subscribe((next) => setState(next));
    void getInitialStatus();
    return unsubscribe;
  }, []);

  // Reload local snapshot into React whenever a sync finishes successfully.
  useEffect(() => {
    if (state.status === 'idle' && state.lastSyncedAt) {
      void reloadRef.current();
    }
  }, [state.lastSyncedAt, state.status]);

  const doSync = useCallback(async () => {
    if (!user) return;
    try {
      await syncNowService(user);
    } catch {
      // errors are surfaced via subscribe()
    }
  }, [user]);

  // Sync on sign-in and on initial app load if already signed in.
  useEffect(() => {
    if (!authReady || !dataReady || !user) return;
    void doSync();
  }, [authReady, dataReady, user, doSync]);

  // Sync when connection returns online.
  useEffect(() => {
    if (!user) return;
    const handleOnline = () => {
      void doSync();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, doSync]);

  const value = useMemo<SyncContextValue>(
    () => ({
      status: state.status,
      lastSyncedAt: state.lastSyncedAt,
      error: state.error,
      syncNow: doSync,
    }),
    [state.status, state.lastSyncedAt, state.error, doSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  return useContext(SyncContext);
}
