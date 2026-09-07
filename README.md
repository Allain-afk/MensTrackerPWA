# BloomCycle

BloomCycle is an offline-first, privacy-focused Progressive Web Application (PWA) designed for menstrual cycle tracking, symptom monitoring, and personal health analytics. Built on top of client-side SQLite via WebAssembly, all sensitive health data is stored directly on the user's device by default, with optional cloud backup and synchronization through Supabase.

---

## Overview

Most menstrual tracking applications store intimate personal health data on remote commercial servers. BloomCycle is designed with a privacy-first mindset:

- Complete Offline Autonomy: All cycle data, symptom logs, notes, and preferences are written to an embedded SQLite database running directly in the browser using the Origin Private File System (OPFS).
- Zero Compulsory Accounts: The application works out of the box without registration, login, or internet connectivity.
- Optional Cloud Synchronization: Users who wish to back up or sync data across multiple devices can sign in with Google via Supabase, protected by PostgreSQL Row Level Security (RLS).
- Clinical Sharing: Generate summary reports designed for healthcare providers or export data as CSV and JSON.

---

## Key Features

### Cycle Tracking and Predictions
- Adaptive Cycle Forecasting: Dynamic cycle length and period length calculations based on historical cycle data.
- Phase Recognition: Automatic calculation and visualization of cycle phases, including follicular, ovulation, fertile window, and luteal phases.
- Perimenopause Mode: Tailored cycle handling and symptom options for users navigating perimenopause and irregular cycle lengths.
- Smart Catch-Up: Intelligent prompts when a period log may have been missed to maintain tracking continuity.

### Daily Health Logging
- Flow Intensity: Spotting, light, medium, and heavy flow tracking.
- Moods and Emotional States: Detailed tracking for multiple concurrent mood states (e.g., calm, anxious, irritable, energized, sensitive).
- Physical Symptoms: Comprehensive symptom log including cramps, bloating, headache, back pain, fatigue, hot flashes, night sweats, nausea, breast tenderness, and more.
- Intimacy and Contraception: Log intimacy events, protection methods used, and private notes.
- Wellness Metrics: Track sleep quality, energy levels, hydration (water glasses), and cervical mucus consistency.
- Medication and Custom Tags: Record daily medications and custom searchable tags.

### Calendar and Visualization
- Monthly Calendar Interface: Visual indicators for period days, predicted periods, fertile windows, ovulation day, and symptom logs.
- Quick Navigation: Month and year picker modal for browsing historical cycles.
- Color-Coded Cycle Legend: Clear visual guide explaining calendar markers and phases.

### Insights and Analytics
- Cycle Length Trends: Interactive charts showing cycle variance and regularity over time powered by Recharts.
- Period Length Patterns: Distribution and changes in period durations.
- Symptom Frequency Analysis: Identifies recurrent symptoms across different phases of the cycle.

### Doctor Reports and Data Portability
- Doctor Report Generator: Creates a clean, printable medical report detailing cycle averages, symptom frequencies, and recent cycle history for consultations.
- CSV Export: Export raw cycle and daily log data for spreadsheet analysis.
- JSON Backup and Restore: Export and import complete database snapshots for offline data transfer and safety.

### Progressive Web App (PWA)
- Installable on All Platforms: Works as a standalone app on iOS, iPadOS, Android, macOS, and Windows.
- Platform Install Guides: Built-in step-by-step installation instructions for Safari (iOS), Chrome, and desktop browsers.
- Background Service Worker: Offline asset and font caching managed by Workbox.
- Update Management: Non-intrusive update prompt when a new version of the app is available.

---

## Technology Stack

### Frontend
- React 18: Component-based user interface.
- TypeScript: End-to-end type safety.
- React Router 7: Client-side routing with lazy-loaded screens.
- Tailwind CSS v4: Modern utility-first styling with custom animation utilities.
- Lucide React: Iconography.
- Recharts: Responsive charting and visual data analytics.
- React Virtuoso: Virtualized rendering for long data lists.
- React Hot Toast: Toast notifications.

### Storage and Backend
- SQLocal: Browser-native SQLite running via WebAssembly, persisting data locally to the Origin Private File System (OPFS).
- Supabase (Optional): Authentication (Google OAuth) and PostgreSQL cloud sync with Row Level Security (RLS).

### Build System and Tooling
- Vite: Fast module bundler and development server.
- vite-plugin-pwa: Service worker generation and web app manifest management.
- Workbox: Runtime asset caching and offline navigation fallback.

---

## Project Structure

```text
MensTrackerPWA/
├── public/                  # Static assets (favicons, PWA icons, manifest)
├── src/
│   ├── app/
│   │   ├── components/      # UI screens, modals, and shared layout components
│   │   │   ├── BottomNav.tsx
│   │   │   ├── CalendarScreen.tsx
│   │   │   ├── CloudSyncAnnouncement.tsx
│   │   │   ├── CloudSyncSection.tsx
│   │   │   ├── DoctorReportModal.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── InsightsScreen.tsx
│   │   │   ├── LogScreen.tsx
│   │   │   ├── PwaInstallGuide.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   ├── WellnessScreen.tsx
│   │   │   └── ...
│   │   ├── config/          # Application configuration
│   │   ├── context/         # React Context providers (Auth, Cycle, Sync, PWA)
│   │   ├── data/            # Local data layer, SQLite queries, models, and migrations
│   │   │   ├── models.ts    # TypeScript definitions for logs, settings, and snapshots
│   │   │   └── store.ts     # SQLocal SQLite connection, CRUD operations, and sync helpers
│   │   ├── routes.ts        # React Router 7 route definitions
│   │   ├── styles/          # Tailwind CSS style imports
│   │   └── utils/           # Utility functions (analytics, notifications, backup, Supabase)
│   ├── assets/              # Component-level static assets
│   ├── main.tsx             # Application bootstrap entry point
│   └── vite-env.d.ts        # Vite environment variable types
├── supabase/
│   └── migrations/          # SQL migrations for Supabase tables and RLS policies
├── index.html               # Main HTML shell with PWA meta tags
├── package.json             # Project dependencies and npm scripts
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Deployment configuration with security headers
└── vite.config.ts           # Vite, Tailwind, SQLocal, and PWA plugin configuration
```

---

## Getting Started

### Prerequisites
- Node.js: Version 20.18.0 or higher (less than 23.0.0). Check your active version with `node -v`.
- npm: Version 9 or higher.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Allain-afk/MensTrackerPWA.git
   cd MensTrackerPWA
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your Supabase credentials if you plan to test cloud synchronization:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   Note: If you only wish to use the app in offline mode, Supabase configuration is optional.

### Development Server

Start the local development server:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Production Build

Compile TypeScript and build the optimized production bundle:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## Security and Browser Isolation Headers

Because MensTracker uses `sqlocal` to run SQLite via WebAssembly backed by the Origin Private File System (OPFS), the browser requires Cross-Origin Isolation when using features like `SharedArrayBuffer`.

The following HTTP response headers are required on all production hosts (configured in `vercel.json`):

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Additional security headers included in deployment:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Cloud Sync and Supabase Setup

To enable cloud synchronization:

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor in your Supabase dashboard and execute the migration script located at:
   ```text
   supabase/migrations/0001_cloud_sync.sql
   ```
3. Enable the Google provider under Authentication -> Providers.
4. Add your local URL (`http://localhost:5173`) and production domain to Authentication -> URL Configuration -> Redirect URLs.
5. Populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file.

The cloud synchronization mechanism utilizes:
- Soft deletes and tombstones to ensure deletions sync across devices without re-creating removed records.
- Update timestamps (`updated_at`) to resolve concurrent modifications.
- PostgreSQL Row Level Security (RLS) guaranteeing users can only read and write their own records.

---

## License

This project is private and proprietary. All rights reserved.
