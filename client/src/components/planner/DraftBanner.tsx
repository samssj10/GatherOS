import { Sparkles } from 'lucide-react';
import { useDiscardDraft, useSaveSchedule, useScheduleDraft } from '@/api/schedule';

/** Shown while an AI-generated itinerary exists only in the browser and has not been saved. */
export default function DraftBanner() {
  const draft = useScheduleDraft().data;
  const save = useSaveSchedule();
  const discard = useDiscardDraft();

  if (!draft) return null;

  return (
    <div
      role="status"
      data-testid="draft-banner"
      className="flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">
            AI draft itinerary &middot; {draft.length} sessions
          </p>
          <p className="text-sm text-slate-600">
            Not saved yet. Drag sessions between days, then save to publish it to attendees.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={discard}
          disabled={save.isPending}
          className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => save.mutate(draft)}
          disabled={save.isPending}
          className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {save.isPending ? 'Saving…' : 'Save itinerary'}
        </button>
      </div>
    </div>
  );
}
