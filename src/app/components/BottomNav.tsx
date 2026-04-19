import { useNavigate, useLocation } from 'react-router';
import { Home, Calendar, BarChart2, Settings, BookOpen } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: BarChart2, label: 'Insights', path: '/insights' },
  { icon: BookOpen, label: 'Wellness', path: '/wellness' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const activeIndex = navItems.findIndex(item => isActive(item.path));

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'relative',
        minHeight: '76px',
        background: '#ffffff',
        borderTop: '1px solid #F3E8FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        paddingTop: '8px',
        flexShrink: 0,
        boxShadow: '0 -4px 20px rgba(168, 85, 247, 0.08)',
      }}
    >
      {/* Sliding background pill */}
      {activeIndex >= 0 && (
        <div
          className="tab-indicator-transition"
          style={{
            position: 'absolute',
            top: '16px', // 8px padding + 8px button padding
            // Calculate left position: center of the button minus half the pill width
            // Button takes up 1 / navItems.length width
            left: `calc(${(activeIndex + 0.5) * (100 / navItems.length)}% - 20px)`,
            width: '40px',
            height: '28px',
            background: 'linear-gradient(135deg, #fce7f3, #ede9fe)',
            borderRadius: '14px',
            zIndex: 0,
          }}
        />
      )}

      {navItems.map(({ icon: Icon, label, path }, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={path}
            className="tap-active"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(path)}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                size={20}
                style={{
                  color: active ? '#9333EA' : '#9CA3AF',
                  transition: 'color 0.2s ease',
                  strokeWidth: active ? 2.5 : 1.8,
                }}
              />
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: active ? 800 : 500,
                color: active ? '#9333EA' : '#9CA3AF',
                fontFamily: "'Nunito', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
