import { Lock, Star } from 'lucide-react';
import type { Badge } from '@/utils/gamification';

export default function BadgeList({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <section
      aria-labelledby="badges-title"
      className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-5"
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h2 id="badges-title" className="font-display text-[19px] font-bold">
          Badges
        </h2>
        <span className="font-mono text-xs text-body">
          {earned} of {badges.length}
        </span>
      </div>

      <ul>
        {badges.map((badge) => (
          <li key={badge.id} className="flex min-h-15 items-center gap-3.5 border-t border-hairline py-2">
            <span
              className={`flex size-11 flex-none rotate-45 items-center justify-center rounded-[14px] ${
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
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-semibold ${badge.earned ? 'text-ink' : 'text-body'}`}>{badge.name}</p>
              <p className="text-[13px] text-muted">{badge.how}</p>
            </div>
            <span
              className={`font-mono text-[11px] font-semibold ${badge.earned ? 'text-ok-ink' : 'text-muted'}`}
            >
              {badge.earned ? 'EARNED' : 'LOCKED'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
