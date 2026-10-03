import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Quest } from '@/utils/gamification';

export default function QuestList({ quests }: { quests: Quest[] }) {
  const doneCount = quests.filter((quest) => quest.done).length;
  const earnedXp = quests.filter((quest) => quest.done).reduce((sum, quest) => sum + quest.xp, 0);

  return (
    <section
      aria-labelledby="quests-title"
      className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-5 lg:p-6"
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <h2 id="quests-title" className="font-display text-[19px] font-bold lg:text-xl">
          Pre-trip quests
        </h2>
        <span className="font-mono text-xs text-body lg:text-[13px]">
          {doneCount} of {quests.length}
          <span className="hidden lg:inline"> · {earnedXp} XP earned</span>
        </span>
      </div>

      <ul>
        {quests.map((quest) => (
          <li key={quest.id} className="flex min-h-13 items-center gap-3 border-t border-hairline py-2 lg:min-h-15 lg:gap-3.5">
            {quest.done ? (
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-ink text-lime lg:size-7.5">
                <Check className="size-3.5" strokeWidth={2.8} aria-hidden="true" />
                <span className="sr-only">Done</span>
              </span>
            ) : (
              <span
                className="size-7 flex-none rounded-full border-2 border-dashed border-ink-text lg:size-7.5"
                role="img"
                aria-label="To do"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-medium lg:text-base ${quest.done ? 'text-muted' : 'text-ink'}`}>
                {quest.label}
              </p>
              <p className="text-xs text-muted lg:text-[13px]">{quest.sub}</p>
            </div>
            {quest.id === 'checkin' && !quest.done && (
              <Link
                to="/attendee/schedule"
                className="hidden min-h-9 items-center rounded-[10px] border border-field px-3 text-[13px] font-medium text-ink no-underline transition-colors hover:bg-wash hover:text-ink lg:inline-flex"
              >
                View
              </Link>
            )}
            <span
              className={`rounded-md px-2 py-0.75 font-mono text-xs font-semibold ${
                quest.done ? 'bg-hairline text-muted' : 'bg-ink text-lime'
              }`}
            >
              +{quest.xp}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
