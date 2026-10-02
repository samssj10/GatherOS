import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Compact fallback for wrapping a single widget instead of the whole app. */
  inline?: boolean;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const button = (
      <button
        type="button"
        onClick={this.reset}
        className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Try again
      </button>
    );

    if (this.props.inline) {
      return (
        <div role="alert" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-slate-900">This section failed to load.</p>
          <div className="mt-4">{button}</div>
        </div>
      );
    }

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center"
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
        <p className="max-w-sm text-slate-500">
          An unexpected error occurred. You can try again, or reload the page if it keeps happening.
        </p>
        {button}
      </div>
    );
  }
}
