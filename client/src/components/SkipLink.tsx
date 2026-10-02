/** First focusable element on every page: lets keyboard users jump past the navigation. */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-md focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
