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
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand/25 bg-brand-tint p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <Sparkles className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-base font-bold">AI draft itinerary &middot; {draft.length} sessions</p>
          <p className="text-sm text-body">
            Not saved yet. Drag sessions between days, then save to publish it to attendees.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={discard}
          disabled={save.isPending}
          className="min-h-11 rounded-xl border border-field bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => save.mutate(draft)}
          disabled={save.isPending}
          className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {save.isPending ? 'Saving…' : 'Save itinerary'}
        </button>
      </div>
    </div>
  );
}
