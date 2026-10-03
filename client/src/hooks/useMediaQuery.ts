import { useSyncExternalStore } from 'react';

/** Tracks a CSS media query. Used when a layout swap should render one tree, not two hidden ones. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The Tailwind lg breakpoint, where the attendee side switches from phone to desktop layout. */
export const DESKTOP_QUERY = '(min-width: 64rem)';
