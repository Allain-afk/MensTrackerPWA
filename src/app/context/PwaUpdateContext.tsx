import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PwaUpdateContextType {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  checkForUpdate: () => Promise<boolean>;
}

const PwaUpdateContext = createContext<PwaUpdateContextType>({
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: async () => {},
  checkForUpdate: async () => false,
});

export function PwaUpdateProvider({ children }: { children: ReactNode }) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();

  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting || registration.installing) {
            setNeedRefresh(true);
            return true;
          }
        }
      } catch (err) {
        console.warn('[PWA] Check for update failed:', err);
      }
    }
    return needRefresh;
  }, [needRefresh, setNeedRefresh]);

  return (
    <PwaUpdateContext.Provider value={{ needRefresh, offlineReady, updateServiceWorker, checkForUpdate }}>
      {children}
    </PwaUpdateContext.Provider>
  );
}

export function usePwaUpdate() {
  return useContext(PwaUpdateContext);
}
