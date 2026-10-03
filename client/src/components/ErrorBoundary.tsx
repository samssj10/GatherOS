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
        className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        Try again
      </button>
    );

    if (this.props.inline) {
      return (
        <div role="alert" className="rounded-2xl border border-line bg-white p-6">
          <p className="font-semibold text-ink">This section failed to load.</p>
          <div className="mt-4">{button}</div>
        </div>
      );
    }

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center"
      >
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Something went wrong</h1>
        <p className="max-w-sm text-body">
          An unexpected error occurred. You can try again, or reload the page if it keeps happening.
        </p>
        {button}
      </div>
    );
  }
}
