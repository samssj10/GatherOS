import { CheckCircle2, X, XCircle } from 'lucide-react';
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
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid="toast"
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-md"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
          )}
          <p className="flex-1 text-sm font-medium text-slate-900">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
