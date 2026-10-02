/** Suspense fallback shown while a lazy route chunk loads. */
export default function PageFallback() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
