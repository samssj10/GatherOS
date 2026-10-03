/** First focusable element on every page: lets keyboard users jump past the navigation. */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-ink shadow-md focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
    >
      Skip to main content
    </a>
  );
}
