import { Check } from 'lucide-react';
import type { Quest } from '@/utils/gamification';

export default function QuestList({ quests }: { quests: Quest[] }) {
  const doneCount = quests.filter((quest) => quest.done).length;

  return (
    <section
      aria-labelledby="quests-title"
      className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-5"
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <h2 id="quests-title" className="font-display text-[19px] font-bold">
          Pre-trip quests
        </h2>
        <span className="font-mono text-xs text-body">
          {doneCount} of {quests.length}
        </span>
      </div>

      <ul>
        {quests.map((quest) => (
          <li key={quest.id} className="flex min-h-13 items-center gap-3 border-t border-hairline py-2">
            {quest.done ? (
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-ink text-lime">
                <Check className="size-3.5" strokeWidth={2.8} aria-hidden="true" />
                <span className="sr-only">Done</span>
              </span>
            ) : (
              <span
                className="size-7 flex-none rounded-full border-2 border-dashed border-ink-text"
                role="img"
                aria-label="To do"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-medium ${quest.done ? 'text-muted' : 'text-ink'}`}>{quest.label}</p>
              <p className="text-xs text-muted">{quest.sub}</p>
            </div>
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
