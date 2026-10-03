import Skeleton from '@/components/Skeleton';
import { usePlannerProgress } from '@/hooks/usePlannerProgress';

/** Sidebar card: the planner's rank, earned by completing dashboard milestones. */
export default function HostRankCard() {
  const { rank, isError } = usePlannerProgress();

  if (isError) return null;

  if (!rank) {
    return <Skeleton className="h-36 rounded-2xl bg-ink-raised" />;
  }

  return (
    <section
      aria-label="Host rank"
      className="flex flex-col gap-3 rounded-2xl border border-ink-line bg-ink-raised p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-lime">
          Host rank
        </span>
        <span className="font-mono text-xs text-ink-text">
          {rank.doneCount} / {rank.total}
        </span>
      </div>
      <p className="font-display text-xl font-bold text-white">{rank.name}</p>
      <div
        role="img"
        aria-label={`${rank.doneCount} of ${rank.total} milestones complete`}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${rank.total}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rank.total }, (_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-[3px] ${index < rank.doneCount ? 'bg-lime' : 'bg-ink-track'}`}
          />
        ))}
      </div>
      <p className="text-[13px] leading-snug text-ink-text">
        {rank.next
          ? `Next rank, ${rank.next.name}, unlocks at ${rank.next.unlocksAt} milestones.`
          : 'Top rank reached. Every milestone is complete.'}
      </p>
    </section>
  );
}
