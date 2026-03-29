import { useEffect, useMemo, useState } from 'react';
import { Download, EllipsisVertical, PlusSquare, Share2, Smartphone, X } from 'lucide-react';
import {
  getInstallGuideContext,
  promptForInstall,
  subscribeToInstallGuide,
} from '../utils/pwaInstall';

const DISMISS_KEY = 'mens-tracker:pwa-install-guide-dismissed-at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface StepContent {
  title: string;
  body: string;
  actionLabel?: string;
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

function dismissGuide() {
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

function getGuideSteps(context: ReturnType<typeof getInstallGuideContext>) {
  if (context.canInstallDirectly) {
    return {
      badge: 'Installable',
      title: 'Install MensTracker on your phone',
      description: 'Save it to your home screen so it opens like a regular app and loads faster next time.',
      primaryLabel: 'Install App',
      steps: [
        { title: 'Tap Install App', body: 'Your browser already supports a direct install prompt for this site.' },
        { title: 'Confirm the install', body: 'Choose Install when your browser asks for confirmation.' },
        { title: 'Open from your home screen', body: 'Next time, tap the MensTracker icon instead of opening the website.' },
      ] satisfies StepContent[],
    };
  }

  if (context.needsSafari) {
    return {
      badge: 'iPhone Tip',
      title: 'Use Safari to add this app',
      description: 'On iPhone and iPad, home screen install is handled by Safari instead of other browsers.',
      primaryLabel: '',
      steps: [
        { title: 'Open this page in Safari', body: 'Use your browser menu to open MensTracker in Safari first.' },
        { title: 'Tap Share', body: 'In Safari, tap the Share button at the bottom of the screen.' },
        { title: 'Choose Add to Home Screen', body: 'After that, MensTracker will appear on your home screen like an app.' },
      ] satisfies StepContent[],
    };
  }

  if (context.isIOS) {
    return {
      badge: 'Add to Home Screen',
      title: 'Turn MensTracker into an app',
      description: 'You can save this to your iPhone home screen so it opens full-screen like a normal app.',
      primaryLabel: '',
      steps: [
        { title: 'Tap Share', body: 'Use the Share button in Safari at the bottom of the screen.' },
        { title: 'Tap Add to Home Screen', body: 'Scroll the share sheet until you see Add to Home Screen.' },
        { title: 'Tap Add', body: 'The MensTracker icon will be ready on your home screen after that.' },
      ] satisfies StepContent[],
    };
  }

  return {
    badge: 'Install Tip',
    title: 'Add MensTracker to your home screen',
    description: 'Install it once so you can open it from your phone like a regular app instead of visiting the website.',
    primaryLabel: '',
    steps: [
      { title: 'Open your browser menu', body: 'Look for the menu button in the top or bottom corner of your browser.' },
      { title: 'Tap Install app or Add to Home screen', body: 'Browsers label this a little differently, but either option works.' },
      { title: 'Launch it from your home screen', body: 'Once added, you can tap the icon any time just like a normal app.' },
    ] satisfies StepContent[],
  };
}

function StepIcon({ context, index }: { context: ReturnType<typeof getInstallGuideContext>; index: number }) {
  if (context.canInstallDirectly && index === 0) {
    return <Download size={16} strokeWidth={2.4} color="#ec4899" />;
  }

  if ((context.isIOS || context.needsSafari) && index === 0) {
    return <Share2 size={16} strokeWidth={2.4} color="#ec4899" />;
  }

  if ((context.isIOS || context.needsSafari) && index === 1) {
    return <PlusSquare size={16} strokeWidth={2.4} color="#8b5cf6" />;
  }

  if (index === 0) {
    return <EllipsisVertical size={16} strokeWidth={2.4} color="#ec4899" />;
  }

  return <Smartphone size={16} strokeWidth={2.4} color="#8b5cf6" />;
}

export function PwaInstallGuide() {
  const [context, setContext] = useState(() => getInstallGuideContext());
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => subscribeToInstallGuide(() => setContext(getInstallGuideContext())), []);

  useEffect(() => {
    if (!context.isMobile || context.isStandalone || wasRecentlyDismissed()) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, [context]);

  const guide = useMemo(() => getGuideSteps(context), [context]);

  if (!visible) return null;

  const handleDismiss = () => {
    dismissGuide();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!context.canInstallDirectly || installing) return;

    try {
      setInstalling(true);
      const outcome = await promptForInstall();

      if (outcome !== 'accepted') {
        dismissGuide();
      }

      setVisible(false);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 170,
        background: 'rgba(15, 23, 42, 0.2)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px 14px calc(84px + env(safe-area-inset-bottom, 0px))',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'linear-gradient(180deg, #fffafc 0%, #ffffff 100%)',
          borderRadius: '28px',
          border: '1px solid #f5d0fe',
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
          padding: '18px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-88px',
            right: '-46px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,114,182,0.16) 0%, transparent 68%)',
            pointerEvents: 'none',
          }}
        />

        <button
          type="button"
          aria-label="Close install guide"
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #f3e8ff',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} color="#6b7280" />
        </button>

        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(139,92,246,0.16))',
            border: '1px solid #f5d0fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
          }}
        >
          <Smartphone size={22} color="#7c3aed" />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '999px',
            background: '#fdf2f8',
            color: '#db2777',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.2px',
            marginBottom: '10px',
          }}
        >
          {guide.badge}
        </div>

        <h3
          style={{
            margin: '0 0 8px',
            fontSize: '21px',
            fontWeight: 900,
            color: '#111827',
            lineHeight: 1.2,
            maxWidth: '270px',
          }}
        >
          {guide.title}
        </h3>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#6b7280',
            fontWeight: 700,
          }}
        >
          {guide.description}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {guide.steps.map((step, index) => (
            <div
              key={step.title}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '12px',
                borderRadius: '18px',
                background: '#ffffff',
                border: '1px solid #f3e8ff',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '12px',
                  background: index === 0 ? '#fdf2f8' : '#f5f3ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <StepIcon context={context} index={index} />
              </div>
              <div>
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#1f2937',
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    lineHeight: 1.55,
                    color: '#6b7280',
                    fontWeight: 600,
                  }}
                >
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {context.canInstallDirectly && (
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={installing}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #f472b6, #8b5cf6)',
                color: '#ffffff',
                padding: '13px 16px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: installing ? 'not-allowed' : 'pointer',
                opacity: installing ? 0.75 : 1,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {installing ? 'Opening...' : guide.primaryLabel}
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              flex: context.canInstallDirectly ? 0 : 1,
              borderRadius: '999px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#6b7280',
              padding: '13px 16px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
