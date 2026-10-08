import { Send, Trophy } from 'lucide-react';
import { useAttendeeSummary, useNudge } from '@/api/attendees';
import { formatNumber } from '@/utils/format';
import { halfHouseTarget } from '@/utils/progress';

/** Dark call-to-action above the roster: how close Half House is, and a one-click reminder. */
export default function NudgeBanner() {
  const summary = useAttendeeSummary().data;
  const nudge = useNudge();

  if (!summary || summary.rsvp.pending === 0) return null;

  const pending = summary.rsvp.pending;
  const gap = Math.max(0, halfHouseTarget(summary.total) - summary.rsvp.accepted);

  return (
    <section
      aria-label="Reminders"
      className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[20px] bg-ink px-5.5 py-4.5 text-canvas"
    >
      <span className="flex size-11 flex-none max-sm:hidden items-center justify-center rounded-xl bg-lime text-ink">
        <Trophy className="size-5.5" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-[1_1_320px]">
        <p className="font-display text-[19px] font-bold">
          {gap > 0
            ? `${formatNumber(gap)} more ${gap === 1 ? 'yes' : 'yeses'} to fill half the house`
            : 'Half House reached'}
        </p>
        <p className="mt-0.5 text-sm text-ink-text-2">
          {formatNumber(pending)} {pending === 1 ? 'invitee hasn’t' : 'invitees haven’t'} answered. One nudge to
          the pending group usually does it.
        </p>
      </div>
      <button
        type="button"
        onClick={() => nudge.mutate(undefined)}
        disabled={nudge.isPending}
        className="inline-flex min-h-11.5 items-center gap-2 rounded-xl max-sm:w-full max-sm:justify-center bg-lime px-5 text-[15px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <Send className="size-4.5" strokeWidth={1.9} aria-hidden="true" />
        {nudge.isPending ? 'Nudging…' : 'Nudge all pending'}
      </button>
    </section>
  );
}
