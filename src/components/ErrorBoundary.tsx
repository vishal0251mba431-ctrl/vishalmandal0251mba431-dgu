import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unexpected application error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error in Campus Cravings:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      let parsedError: string = this.state.message;
      try {
        const obj = JSON.parse(this.state.message);
        if (obj && typeof obj.error === 'string') {
          parsedError = `${obj.operationType?.toUpperCase() || 'DB'} (${obj.path || 'unknown'}): ${obj.error}`;
        }
      } catch {
        // Keep original message
      }

      return (
        <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-lg font-bold text-slate-50">
                Database or Application Error
              </h1>
            </div>
            <p className="text-xs font-mono text-slate-300 bg-[#0B0E14] border border-slate-800 rounded-lg p-3 break-words">
              {parsedError}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
