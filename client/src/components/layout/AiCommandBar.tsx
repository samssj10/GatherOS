import { Sparkles } from 'lucide-react';

/** Sticky top bar with the AI prompt field. Wired to the BFF in Phase 6. */
export default function AiCommandBar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-slate-200 bg-white px-6">
      <form
        role="search"
        aria-label="Generate itinerary with AI"
        className="mx-auto flex w-full max-w-3xl items-center gap-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="ai-prompt" className="sr-only">
          Describe the offsite you want to plan
        </label>
        <input
          id="ai-prompt"
          type="text"
          placeholder="Describe your offsite, e.g. 3-day team retreat in Lisbon for 120 people"
          className="h-10 w-full rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 placeholder:text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        />
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Generate
        </button>
      </form>
    </header>
  );
}
