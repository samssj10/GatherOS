import { CircleCheck, CircleX, X } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

/** Global toast region. aria-live makes screen readers announce each message as it appears. */
export default function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid="toast"
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-lg"
        >
          {toast.tone === 'success' ? (
            <CircleCheck className="size-5 shrink-0 text-ok" aria-hidden="true" />
          ) : (
            <CircleX className="size-5 shrink-0 text-bad" aria-hidden="true" />
          )}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
