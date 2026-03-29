export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export interface InstallGuideContext {
  isStandalone: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  needsSafari: boolean;
  canInstallDirectly: boolean;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function hasTouchMac() {
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;

  const mediaMatch = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return mediaMatch || navigatorWithStandalone.standalone === true;
}

export function getInstallGuideContext(): InstallGuideContext {
  if (typeof window === 'undefined') {
    return {
      isStandalone: false,
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      needsSafari: false,
      canInstallDirectly: false,
    };
  }

  const ua = navigator.userAgent;
  const lowerUa = ua.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(lowerUa) || hasTouchMac();
  const isAndroid = /android/.test(lowerUa);
  const isMobile = isIOS || isAndroid || /mobile/.test(lowerUa);
  const isSafari =
    isIOS &&
    /safari/.test(lowerUa) &&
    !/crios|fxios|edgios|opr\//.test(lowerUa);

  return {
    isStandalone: isStandalonePwa(),
    isMobile,
    isIOS,
    isAndroid,
    isSafari,
    needsSafari: isIOS && !isSafari,
    canInstallDirectly: !!deferredPrompt,
  };
}

export function subscribeToInstallGuide(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function promptForInstall() {
  if (!deferredPrompt) return 'unavailable';

  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  emitChange();

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  emitChange();

  return choice.outcome;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emitChange();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emitChange();
  });
}
