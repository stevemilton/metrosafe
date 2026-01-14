import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-[var(--color-text-muted)] mb-4 max-w-md">
            An unexpected error occurred. Please try again or refresh the page.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface MapErrorFallbackProps {
  onRetry: () => void;
}

export function MapErrorFallback({ onRetry }: MapErrorFallbackProps): ReactNode {
  return (
    <div className="glass rounded-2xl h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl mb-4">🗺️</div>
      <h3 className="text-lg font-semibold mb-2">Map failed to load</h3>
      <p className="text-[var(--color-text-muted)] mb-4 text-sm">
        There was a problem loading the map component.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors text-sm"
      >
        Retry
      </button>
    </div>
  );
}

export function StatsErrorFallback({ onRetry }: MapErrorFallbackProps): ReactNode {
  return (
    <div className="glass rounded-2xl h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-3">📊</div>
      <h3 className="text-lg font-semibold mb-2">Stats unavailable</h3>
      <p className="text-[var(--color-text-muted)] mb-4 text-sm">
        Failed to load statistics.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors text-sm"
      >
        Retry
      </button>
    </div>
  );
}
