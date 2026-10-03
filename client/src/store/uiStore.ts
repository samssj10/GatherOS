import { create } from 'zustand';

export type ToastTone = 'success' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

export type RosterRsvpFilter = 'all' | 'accepted' | 'pending' | 'declined';

interface UiState {
  toasts: Toast[];
  rosterSearch: string;
  rosterRsvpFilter: RosterRsvpFilter;
  setRosterSearch: (value: string) => void;
  setRosterRsvpFilter: (value: RosterRsvpFilter) => void;
  addToast: (tone: ToastTone, message: string) => void;
  dismissToast: (id: string) => void;
}

const TOAST_DURATION_MS = 4000;

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
  addToast: (tone, message) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, tone, message }] }));
    window.setTimeout(() => get().dismissToast(id), TOAST_DURATION_MS);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
