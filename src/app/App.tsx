import { Suspense, useState, type ReactNode } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { UserProvider, useUser } from './context/UserContext';
import { CycleProvider } from './context/CycleContext';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { NotificationSync } from './components/NotificationSync';
import { PwaUpdateToast } from './components/PwaUpdateToast';
import { RouteLoader } from './components/RouteStateScreens';

type Phase = 'splash' | 'onboarding' | 'app';

function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh flex items-stretch justify-center sm:items-center sm:p-6"
      style={{
        background: 'linear-gradient(145deg, #fdf2f8 0%, #f8f4ff 50%, #f3e8ff 100%)',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        className="relative w-full h-dvh overflow-hidden bg-[#F8F4FF] sm:h-[844px] sm:w-[390px] sm:rounded-[48px] sm:shadow-[0_0_0_10px_#1a1a2e,0_40px_80px_rgba(0,0,0,0.35)] sm:flex-shrink-0"
        style={{
          width: '100%',
          height: '100dvh',
        }}
      >
        {/* Camera pill */}
        <div
          className="hidden sm:block"
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90px',
            height: '10px',
            background: '#0d0d1a',
            borderRadius: '999px',
            zIndex: 200,
          }}
        />
        <div style={{ height: '100%' }}>{children}</div>
      </div>
    </div>
  );
}

function AppFlow() {
  const { ready } = useAppData();
  const { name } = useUser();

  const [phase, setPhase] = useState<Phase>('splash');

  const handleSplashDone = () => {
    if (name) {
      setPhase('app');
    } else {
      setPhase('onboarding');
    }
  };

  return (
    <PhoneShell>
      {/* Splash always renders first then unmounts */}
      {phase === 'splash' && <SplashScreen blocked={!ready} onDone={handleSplashDone} />}

      {/* Onboarding slides in after splash for new users */}
      {phase === 'onboarding' && (
        <OnboardingScreen onDone={() => setPhase('app')} />
      )}

      {/* Main app */}
      {phase === 'app' && (
        <Suspense fallback={<RouteLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      )}
    </PhoneShell>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <UserProvider>
        <CycleProvider>
          <NotificationSync />
          <PwaUpdateToast />
          <AppFlow />
          <Toaster position="top-center" />
        </CycleProvider>
      </UserProvider>
    </AppDataProvider>
  );
}
