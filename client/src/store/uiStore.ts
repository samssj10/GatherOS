import { create } from 'zustand';

export type ToastTone = 'success' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface UiState {
  toasts: Toast[];
  addToast: (tone: ToastTone, message: string) => void;
  dismissToast: (id: string) => void;
}

const TOAST_DURATION_MS = 4000;

/**
 * Ephemeral UI state only. Anything fetched from the BFF lives in TanStack Query,
 * never here (CLAUDE.md section 5.B).
 */
export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  addToast: (tone, message) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, tone, message }] }));
    window.setTimeout(() => get().dismissToast(id), TOAST_DURATION_MS);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
