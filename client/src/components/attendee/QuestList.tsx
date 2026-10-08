import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Quest, QuestState } from '@/utils/gamification';

/** Lime on black only once the XP is earned; light violet while it waits on something; plain while it is open. */
const XP_CHIP: Record<QuestState, string> = {
  done: 'bg-ink text-lime',
  waiting: 'bg-brand-tint text-brand-ink',
  todo: 'bg-wash text-body',
};

function QuestRow({ quest }: { quest: Quest }) {
  const body = (
    <>
      {quest.done ? (
        <span className="flex size-7 flex-none items-center justify-center rounded-full bg-ink text-lime lg:size-7.5">
          <Check className="size-3.5" strokeWidth={2.8} aria-hidden="true" />
          <span className="sr-only">Done</span>
        </span>
      ) : (
        <span
          className="size-7 flex-none rounded-full border-2 border-dashed border-ink-text lg:size-7.5"
          role="img"
          aria-label={quest.state === 'waiting' ? 'Waiting' : 'To do'}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-medium lg:text-base ${quest.done ? 'text-muted' : 'text-ink'}`}>{quest.label}</p>
        <p className="text-xs text-muted lg:text-[13px]">
          {quest.subWide ? (
            <>
              <span className="lg:hidden">{quest.sub}</span>
              <span className="hidden lg:inline">{quest.subWide}</span>
            </>
          ) : (
            quest.sub
          )}
        </p>
      </div>
      <span className={`rounded-md px-2 py-0.75 font-mono text-xs font-semibold ${XP_CHIP[quest.state]}`}>
        +{quest.xp}
      </span>
    </>
  );

  const rowClass = 'flex min-h-13 items-center gap-3 py-2 lg:min-h-15 lg:gap-3.5';
  // An open quest is a link to where it is done; one that is earned or waiting is only a statement.
  if (quest.state === 'todo' && quest.to) {
    const linkClass = `${rowClass} -mx-2 rounded-xl px-2 text-inherit no-underline transition-colors hover:bg-wash hover:text-inherit`;
    return quest.to.startsWith('#') ? (
      <a href={quest.to} className={linkClass}>
        {body}
      </a>
    ) : (
      <Link to={quest.to} className={linkClass}>
        {body}
      </Link>
    );
  }
  return <div className={rowClass}>{body}</div>;
}

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
          <li key={quest.id} className="border-t border-hairline">
            <QuestRow quest={quest} />
          </li>
        ))}
      </ul>
    </section>
  );
}
