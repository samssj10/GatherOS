/** Suspense fallback shown while a lazy route chunk loads. */
export default function PageFallback() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-canvas">
      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-brand" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
