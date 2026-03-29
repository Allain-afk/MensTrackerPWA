import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './BottomNav';
import { InAppReminderPrompt } from './InAppReminderPrompt';
import { PwaInstallGuide } from './PwaInstallGuide';

export function Layout() {
  const location = useLocation();
  const isLogScreen = location.pathname === '/log';

  return (
    <div
      style={{
        height: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FAFAFA',
        fontFamily: "'Nunito', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          paddingBottom: isLogScreen
            ? 'calc(100px + env(safe-area-inset-bottom, 0px))'
            : 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <Outlet />
      </main>

      <InAppReminderPrompt />
      <PwaInstallGuide />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
