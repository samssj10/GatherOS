import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';

/** Dark card: level, rank, XP and progress toward the next tier. */
export default function LevelCard({ progress }: { progress: AttendeeProgress }) {
  const { level, earnedBadges } = progress;
  // The bar's scale is the gap to the next tier, not a fixed maximum.
  const barMax = level.next ? level.xp + level.next.xpToGo : level.xp || 1;

  return (
    <section
      aria-label="Your level"
      className="flex flex-col gap-3.5 rounded-3xl bg-ink p-5 text-canvas"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-lime px-2.5 py-1 font-mono text-xs font-semibold text-ink">
          LVL {level.level}
        </span>
        <Link
          to="/attendee/passport"
          className="inline-flex min-h-8 items-center gap-1.5 text-[13px] text-ink-text-2 no-underline hover:text-white"
        >
          {earnedBadges} {earnedBadges === 1 ? 'badge' : 'badges'}
          <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-2xl font-bold">{level.rank}</p>
        <p className="font-display text-[34px] leading-none font-extrabold">
          {level.xp}
          <span className="ml-1 text-base text-ink-text-3">XP</span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Experience toward next level"
        aria-valuemin={0}
        aria-valuemax={barMax}
        aria-valuenow={level.xp}
        className="h-2.5 overflow-hidden rounded-[5px] bg-ink-line"
      >
        <div
          className="h-full rounded-[5px] bg-lime transition-[width] duration-500"
          style={{ width: `${level.pct}%` }}
        />
      </div>

      <p className="text-[13px] text-ink-text-2">
        {level.next
          ? `${level.next.xpToGo} XP to Level ${level.next.level} · ${level.next.rank}`
          : 'Top level reached'}
      </p>
    </section>
  );
}
