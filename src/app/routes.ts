import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { HomeScreen } from './components/HomeScreen';
import { RouteErrorBoundary } from './components/RouteStateScreens';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        Component: HomeScreen,
      },
      {
        path: 'calendar',
        lazy: async () => {
          const module = await import('./components/CalendarScreen');
          return { Component: module.CalendarScreen };
        },
      },
      {
        path: 'log',
        lazy: async () => {
          const module = await import('./components/LogScreen');
          return { Component: module.LogScreen };
        },
      },
      {
        path: 'insights',
        lazy: async () => {
          const module = await import('./components/InsightsScreen');
          return { Component: module.InsightsScreen };
        },
      },
      {
        path: 'wellness',
        lazy: async () => {
          const module = await import('./components/WellnessScreen');
          return { Component: module.WellnessScreen };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const module = await import('./components/SettingsScreen');
          return { Component: module.SettingsScreen };
        },
      },
    ],
  },
]);
