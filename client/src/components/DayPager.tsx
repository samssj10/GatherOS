import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import type { ReactNode, Ref } from 'react';
import { pageCount, pageOfDay, rangeLabel } from '@/utils/itineraryPages';

const stepButtonClass =
  'flex size-11 items-center justify-center rounded-xl transition-colors disabled:pointer-events-none disabled:opacity-35';

/** A plain Day button for the jump bar: dark when its day is on screen, white when it is on another page. */
export function DayButton({ day, onPage, onSelect }: { day: number; onPage: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-day={day}
      aria-current={onPage ? 'true' : undefined}
      className={`inline-flex min-h-10 items-center rounded-[10px] border px-3.5 text-sm font-medium transition-colors ${
        onPage ? 'border-ink bg-ink text-white hover:bg-ink-active' : 'border-field bg-white text-ink hover:bg-wash'
      }`}
    >
      Day {day}
    </button>
  );
}

interface JumpBarProps {
  /** Every day of the trip, in order. */
  days: readonly number[];
  page: number;
  /** Draws one day's button. The planner swaps in a drop target; everyone else uses DayButton. */
  renderDay: (day: number, onPage: boolean) => ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  previousRef: Ref<HTMLButtonElement>;
  nextRef: Ref<HTMLButtonElement>;
}

/**
 * Sits above a board on trips longer than one page: a button per day, the "Days 1–3 of 4" label
 * and the previous / next page buttons.
 */
export function DayJumpBar({ days, page, renderDay, onPrevious, onNext, previousRef, nextRef }: JumpBarProps) {
  const lastPage = pageCount(days.length) - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white py-2 pr-2 pl-3.5">
      <nav aria-label="Jump to day" className="flex flex-wrap items-center gap-1.5">
        {days.map((day) => (
          <Fragment key={day}>{renderDay(day, pageOfDay(days, day) === page)}</Fragment>
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

/** A dashed strip beside a board naming the neighbouring days; clicking it turns the page. */
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
