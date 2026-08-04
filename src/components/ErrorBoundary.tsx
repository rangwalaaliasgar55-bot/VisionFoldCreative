import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ErrorHandler } from '../lib/errors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a user-friendly error UI
 * Logs errors for debugging purposes
 * Provides recovery options
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    ErrorHandler.log(error, `ErrorBoundary: ${error.message}`);
    console.error('[v0] Error caught by boundary:', error, errorInfo);

    // Update state
    this.setState({ errorInfo });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4">
            <div className="w-full max-w-md rounded-lg border border-red-600/30 bg-red-600/10 p-6 text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              
              <h2 className="text-lg font-bold text-red-300 mb-2">
                Something Went Wrong
              </h2>
              
              <p className="text-sm text-red-400 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-xs text-red-400 hover:text-red-300">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-black/50 p-2 text-[10px] text-red-300 max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.resetError}
                  className="rounded px-4 py-2 bg-red-600/20 text-red-300 text-sm font-medium hover:bg-red-600/30 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="rounded px-4 py-2 bg-red-600/10 text-red-400 text-sm font-medium hover:bg-red-600/20 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for catching errors in async operations
 * Wraps components that may throw errors during renders
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={options?.fallback} onError={options?.onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
