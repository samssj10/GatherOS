import { Lock, Star } from 'lucide-react';
import type { Badge } from '@/utils/gamification';

export default function BadgeList({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <section
      aria-labelledby="badges-title"
      className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-5 lg:gap-4 lg:p-6"
    >
      <div className="mb-2 flex items-baseline justify-between lg:mb-0">
        <h2 id="badges-title" className="font-display text-[19px] font-bold lg:text-[22px]">
          Badges
        </h2>
        <span className="font-mono text-xs text-body lg:text-[13px]">
          {earned} of {badges.length}
        </span>
      </div>

      <ul className="lg:grid lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-3">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={`grid min-h-15 grid-cols-[auto_1fr_auto] items-center gap-x-3.5 border-t border-hairline py-2 lg:grid-cols-[1fr_auto] lg:content-start lg:items-start lg:gap-y-3 lg:rounded-[18px] lg:border lg:p-4.5 ${
              badge.earned ? 'lg:border-ink lg:bg-white' : 'lg:border-line lg:bg-wash'
            }`}
          >
            <span
              className={`flex size-11 flex-none rotate-45 items-center justify-center rounded-[14px] lg:size-11.5 ${
                badge.earned ? 'bg-ink text-lime' : 'bg-hairline text-muted'
              }`}
              aria-hidden="true"
            >
              <span className="-rotate-45">
                {badge.earned ? (
                  <Star className="size-5" strokeWidth={2} />
                ) : (
                  <Lock className="size-4.5" strokeWidth={2} />
                )}
              </span>
            </span>
            <div className="min-w-0 lg:col-span-2 lg:row-start-2">
              <p className={`text-[15px] font-semibold lg:text-base ${badge.earned ? 'text-ink' : 'text-body'}`}>
                {badge.name}
              </p>
              <p className="text-[13px] text-muted">{badge.how}</p>
            </div>
            {badge.earned && (
              <span className="font-mono text-[11px] font-semibold text-ok-ink lg:col-start-2 lg:row-start-1">EARNED</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
