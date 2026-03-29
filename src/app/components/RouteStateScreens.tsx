import type { ReactNode } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

function ScreenFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 60%, #ede9fe 100%)',
        padding: '24px',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          borderRadius: '28px',
          background: 'rgba(255, 255, 255, 0.92)',
          boxShadow: '0 20px 48px rgba(168, 85, 247, 0.18)',
          padding: '28px 22px',
          textAlign: 'center',
          border: '1px solid rgba(233, 213, 255, 0.9)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 18px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 100%)',
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: 900,
          }}
        >
          M
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            lineHeight: 1.15,
            color: '#1f2937',
            fontWeight: 900,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: '14px',
            lineHeight: 1.55,
            color: '#6b7280',
            fontWeight: 700,
          }}
        >
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}

export function RouteLoader() {
  return (
    <ScreenFrame
      title="Loading your tracker"
      description="Just a moment while we open the next screen."
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginTop: '22px',
        }}
      >
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f472b6, #8b5cf6)',
              animation: `routeLoaderBounce 1.2s ease-in-out ${dot * 0.12}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes routeLoaderBounce {
          0%, 100% { transform: translateY(0); opacity: 0.45; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </ScreenFrame>
  );
}

function getRouteErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'This screen could not be loaded.';
}

export function RouteErrorBoundary() {
  const error = useRouteError();

  return (
    <ScreenFrame
      title="We hit a loading problem"
      description="The app could not finish opening this screen. A quick reload usually fixes it after an update."
    >
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '12px',
          lineHeight: 1.5,
          color: '#9333ea',
          fontWeight: 700,
        }}
      >
        {getRouteErrorMessage(error)}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '18px',
        }}
      >
        <button
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            border: 'none',
            borderRadius: '999px',
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Reload app
        </button>
        <button
          onClick={() => window.location.assign('/')}
          style={{
            width: '100%',
            borderRadius: '999px',
            padding: '14px 16px',
            background: '#ffffff',
            border: '1.5px solid #e9d5ff',
            color: '#7c3aed',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Go to home
        </button>
      </div>
    </ScreenFrame>
  );
}
