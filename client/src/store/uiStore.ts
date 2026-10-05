import { create } from 'zustand';

export type ToastTone = 'success' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
  /** "primary" is a lime button, "link" an underlined link. Defaults to "link". */
  variant?: 'primary' | 'link';
}

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  /** Buttons shown beside the message. Choosing one also closes the toast. */
  actions?: ToastAction[];
}

export interface ToastOptions {
  actions?: ToastAction[];
  /** How long the toast stays; toasts with actions get longer by default so there is time to act. */
  durationMs?: number;
}

export type RosterRsvpFilter = 'all' | 'accepted' | 'pending' | 'declined';

interface UiState {
  toasts: Toast[];
  rosterSearch: string;
  rosterRsvpFilter: RosterRsvpFilter;
  setRosterSearch: (value: string) => void;
  setRosterRsvpFilter: (value: RosterRsvpFilter) => void;
  addToast: (tone: ToastTone, message: string, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const TOAST_DURATION_MS = 4000;
const ACTION_TOAST_DURATION_MS = 10_000;

/**
 * Ephemeral UI state only. Anything fetched from the BFF lives in TanStack Query,
 * never here, so there is a single source of truth for server data.
 */
export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  rosterSearch: '',
  rosterRsvpFilter: 'all',
  setRosterSearch: (value) => set({ rosterSearch: value }),
  setRosterRsvpFilter: (value) => set({ rosterRsvpFilter: value }),
  addToast: (tone, message, options) => {
    const id = crypto.randomUUID();
    const actions = options?.actions?.length ? options.actions : undefined;
    // An Undo only makes sense for the latest change, so a new one replaces the older ones.
    set((state) => ({
      toasts: [...(actions ? state.toasts.filter((toast) => !toast.actions) : state.toasts), { id, tone, message, actions }],
    }));
    window.setTimeout(
      () => get().dismissToast(id),
      options?.durationMs ?? (actions ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS),
    );
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
