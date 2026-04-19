import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 100%)',
          fontFamily: "'Nunito', sans-serif",
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '56px', marginBottom: '12px' }} aria-hidden="true">🌸</div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1F2937', margin: '0 0 8px' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600, margin: '0 0 20px', maxWidth: '320px', lineHeight: 1.5 }}>
          Your data is safe on this device. You can try again or reload the app.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              border: '1.5px solid #DDD6FE',
              background: 'white',
              color: '#7C3AED',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
