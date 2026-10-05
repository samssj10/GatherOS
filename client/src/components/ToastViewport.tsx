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
      {toasts.map((toast) => {
        // A toast you can act on (View, Undo) is dark so it stands out from plain confirmations.
        const dark = toast.actions !== undefined;
        return (
          <div
            key={toast.id}
            data-testid="toast"
            className={`pointer-events-auto flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border p-4 shadow-lg ${
              dark ? 'max-w-xl border-ink bg-ink text-white' : 'max-w-sm border-line bg-white'
            }`}
          >
            {toast.tone === 'success' ? (
              <CircleCheck className={`size-5 shrink-0 ${dark ? 'text-lime' : 'text-ok'}`} aria-hidden="true" />
            ) : (
              <CircleX className="size-5 shrink-0 text-bad" aria-hidden="true" />
            )}
            <p className="min-w-0 flex-1 basis-48 text-sm font-medium">{toast.message}</p>
            {toast.actions?.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  dismissToast(toast.id);
                  action.onClick();
                }}
                className={
                  action.variant === 'primary'
                    ? 'min-h-9 rounded-lg bg-lime px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-lime-hover focus-visible:outline-lime'
                    : 'min-h-9 rounded-lg px-1.5 text-sm font-medium text-white underline underline-offset-2 transition-colors hover:text-lime focus-visible:outline-lime'
                }
              >
                {action.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                dark
                  ? 'text-ink-text-3 hover:bg-ink-raised hover:text-white focus-visible:outline-lime'
                  : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
