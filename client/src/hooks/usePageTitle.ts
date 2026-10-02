import { useEffect } from 'react';

/** Keeps the document title in step with the current page (WCAG 2.4.2). */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · GatherOS`;
  }, [title]);
}
