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
        background: '#F8F4FF',
        fontFamily: "'Nunito', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        overscrollBehavior: 'none',
      }}
    >
      {/* Main Content */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Outlet />
      </main>

      <InAppReminderPrompt />
      <PwaInstallGuide />

      {/* Bottom Navigation */}
      {!isLogScreen && <BottomNav />}
    </div>
  );
}
