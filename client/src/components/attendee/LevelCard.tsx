import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';

/**
 * Dark card: level, rank, XP and progress toward the next tier. One grid serves both layouts:
 * on phones the badge link sits beside the level tag; from lg up it becomes a footer with one
 * diamond per badge.
 */
export default function LevelCard({ progress }: { progress: AttendeeProgress }) {
  const { level, earnedBadges, badges } = progress;
  // The bar's scale is the gap to the next tier, not a fixed maximum.
  const barMax = level.next ? level.xp + level.next.xpToGo : level.xp || 1;

  return (
    <section
      aria-label="Your level"
      className="grid grid-cols-2 items-baseline gap-x-2 gap-y-3.5 rounded-3xl bg-ink p-5 text-canvas lg:gap-y-4 lg:p-6"
    >
      <span className="w-fit self-center rounded-lg bg-lime px-2.5 py-1 font-mono text-xs font-semibold text-ink">
        LVL {level.level}
      </span>

      <Link
        to="/attendee/passport"
        className="inline-flex min-h-8 items-center gap-1.5 justify-self-end text-[13px] text-ink-text-2 no-underline hover:text-white lg:hidden"
      >
        {earnedBadges} {earnedBadges === 1 ? 'badge' : 'badges'}
        <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </Link>

      <p className="font-display text-2xl font-bold lg:col-span-2 lg:row-start-2 lg:text-[28px]">{level.rank}</p>

      <p className="justify-self-end font-display text-[34px] leading-none font-extrabold lg:col-start-2 lg:row-start-1 lg:self-center lg:text-[40px]">
        {level.xp}
        <span className="ml-1 text-base text-ink-text-3">XP</span>
      </p>

      <div
        role="progressbar"
        aria-label="Experience toward next level"
        aria-valuemin={0}
        aria-valuemax={barMax}
        aria-valuenow={level.xp}
        className="col-span-2 h-2.5 overflow-hidden rounded-[5px] bg-ink-line"
      >
        <div
          className="h-full rounded-[5px] bg-lime transition-[width] duration-500"
          style={{ width: `${level.pct}%` }}
        />
      </div>

      <p className="col-span-2 text-[13px] text-ink-text-2 lg:text-sm">
        {level.next
          ? `${level.next.xpToGo} XP to Level ${level.next.level} · ${level.next.rank}`
          : 'Top level reached'}
      </p>

      <Link
        to="/attendee/passport"
        className="col-span-2 hidden min-h-11 items-center gap-3 border-t border-ink-line pt-4 text-sm text-canvas no-underline hover:text-white lg:flex"
      >
        <span className="flex gap-1.5" aria-hidden="true">
          {badges.map((badge) => (
            <span
              key={badge.id}
              className={`size-6.5 rotate-45 rounded-lg border ${
                badge.earned ? 'border-lime bg-lime' : 'border-ink-track'
              }`}
            />
          ))}
        </span>
        <span className="flex-1">
          {earnedBadges} of {badges.length} badges
        </span>
        <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    </section>
  );
}
