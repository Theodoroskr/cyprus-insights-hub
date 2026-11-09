import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Errors caused by a stale page after an update (an old copy of the app mixed
// with newly loaded parts). A fresh reload always fixes these.
const STALE_PAGE_PATTERNS = [
  /may be used only in the context of a <Router>/i,
  /No QueryClient set/i,
  /Cannot destructure property 'basename'/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

const RELOAD_KEY = "bh-stale-reload-at";

export const isStalePageError = (message: string) =>
  STALE_PAGE_PATTERNS.some((re) => re.test(message));

function reloadOnceForStalePage(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    // Only auto-reload once per 30 seconds so a real bug can't cause a reload loop.
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    if (isStalePageError(String(error?.message ?? error))) reloadOnceForStalePage();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">An unexpected error occurred. Please reload the page.</p>
            <button
              onClick={() => {
                try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ }
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
