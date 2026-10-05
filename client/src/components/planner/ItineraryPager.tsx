import { useDroppable } from '@dnd-kit/core';
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Ref } from 'react';
import { CHIP_PREFIX } from '@/utils/dropTarget';
import { pageOfDay, rangeLabel } from '@/utils/itineraryPages';

const stepButtonClass =
  'flex size-11 items-center justify-center rounded-xl transition-colors disabled:pointer-events-none disabled:opacity-35';

interface DayChipProps {
  day: number;
  onPage: boolean;
  /** The day the dragged card comes from; null when nothing is being dragged. */
  sourceDay: number | null;
  /** The day that just received a card, flashing lime for a moment. */
  flashing: boolean;
  onSelect: () => void;
}

/** One Day button: a jump link when idle, a drop target for a dragged card while dragging. */
function DayChip({ day, onPage, sourceDay, flashing, onSelect }: DayChipProps) {
  const dragging = sourceDay !== null;
  const isSource = sourceDay === day;
  const { setNodeRef, isOver } = useDroppable({
    id: `${CHIP_PREFIX}${day}`,
    data: { day },
    disabled: !dragging || isSource,
  });
  const target = dragging && !isSource;

  // One state wins at a time: the lime flash after a drop, the hover ring, the dashed "you can drop here" hint, then idle.
  let look: string;
  if (flashing) look = 'border-lime bg-lime text-ink';
  else if (target && isOver)
    look = 'border-brand bg-brand-tint text-brand-ink ring-4 ring-brand/20 motion-safe:scale-[1.06]';
  else if (target)
    look = onPage ? 'border-dashed border-brand-soft bg-ink text-white' : 'border-dashed border-brand bg-white text-ink';
  else look = onPage ? 'border-ink bg-ink text-white hover:bg-ink-active' : 'border-field bg-white text-ink hover:bg-wash';

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      aria-current={onPage ? 'true' : undefined}
      // The dashed border is 2px wide, so the side padding gives up a pixel to keep the button the same size.
      className={`relative inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border text-sm font-medium transition-[scale,background-color,box-shadow,opacity] ${
        target || flashing ? 'border-2 px-[13px]' : 'px-3.5'
      } ${isSource ? 'opacity-40' : ''} ${look}`}
    >
      {flashing && <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" />}
      {!flashing && target && isOver && <Plus className="size-3.5" strokeWidth={2.4} aria-hidden="true" />}
      Day {day}
      {target && isOver && !flashing && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
        >
          Drop to add to end of Day {day}
        </span>
      )}
    </button>
  );
}

interface JumpBarProps {
  days: readonly number[];
  page: number;
  sourceDay: number | null;
  flashDay: number | null;
  onSelectDay: (day: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  previousRef: Ref<HTMLButtonElement>;
  nextRef: Ref<HTMLButtonElement>;
}

/**
 * Sits above the board on trips longer than one page: a button per day (dark = on screen,
 * white = on another page), the "Days 1–3 of 4" label and the previous / next page buttons.
 */
export function DayJumpBar({ days, page, sourceDay, flashDay, onSelectDay, onPrevious, onNext, previousRef, nextRef }: JumpBarProps) {
  const lastPage = pageOfDay(days.length);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white py-2 pr-2 pl-3.5">
      <nav aria-label="Jump to day" className="flex flex-wrap items-center gap-1.5">
        {days.map((day) => (
          <DayChip
            key={day}
            day={day}
            onPage={pageOfDay(day) === page}
            sourceDay={sourceDay}
            flashing={flashDay === day}
            onSelect={() => onSelectDay(day)}
          />
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <span aria-live="polite" className="px-1.5 text-sm text-body">
          {rangeLabel(days, page)}
        </span>
        <button
          ref={previousRef}
          type="button"
          onClick={onPrevious}
          disabled={page === 0}
          aria-label="Show previous days"
          className={`${stepButtonClass} border border-field bg-white text-ink hover:bg-wash`}
        >
          <ChevronLeft className="size-4.5" strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          ref={nextRef}
          type="button"
          onClick={onNext}
          disabled={page >= lastPage}
          aria-label="Show next days"
          className={`${stepButtonClass} bg-ink text-lime hover:bg-ink-active`}
        >
          <ChevronRight className="size-4.5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** A dashed strip beside the board naming the neighbouring days; clicking it turns the page. */
export function PageRail({
  direction,
  label,
  onClick,
}: {
  direction: 'previous' | 'next';
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show ${direction} days, ${label}`}
      className={`flex w-13 shrink-0 flex-col items-center justify-start gap-2.5 rounded-[22px] border-2 border-dashed border-ink-text-2 py-4.5 transition-colors hover:bg-white/60 ${
        direction === 'previous' ? 'text-body' : 'text-ink'
      }`}
    >
      <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
      <span
        className={`text-[13px] font-semibold [writing-mode:vertical-rl] ${direction === 'previous' ? 'rotate-180' : ''}`}
      >
        {label}
      </span>
    </button>
  );
}
