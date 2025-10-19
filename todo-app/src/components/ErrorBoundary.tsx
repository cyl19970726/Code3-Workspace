import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors
 * and display user-friendly error messages
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-strong p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon
                    className="h-8 w-8 text-red-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    We're sorry, but something unexpected happened. The application
                    encountered an error and couldn't continue.
                  </p>

                  {/* Error details (only in development) */}
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mb-4 p-3 bg-gray-50 rounded text-xs">
                      <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                        Error details (development only)
                      </summary>
                      <div className="space-y-2">
                        <div>
                          <strong>Error:</strong>
                          <pre className="mt-1 text-red-600 overflow-x-auto">
                            {this.state.error.toString()}
                          </pre>
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="mt-1 text-gray-600 overflow-x-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={this.handleReset}
                      className="btn-secondary text-sm"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={this.handleReload}
                      className="btn-primary text-sm"
                    >
                      Reload Page
                    </button>
                  </div>

                  {/* Help text */}
                  <p className="mt-4 text-xs text-gray-500">
                    If this problem persists, try clearing your browser cache or
                    contact support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
