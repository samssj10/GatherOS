import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  Announcements,
  CollisionDetection,
  Modifier,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  GripVertical,
  MapPin,
  QrCode,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePlannerSchedule, useReorderDay, useRestoreTiming, useScheduleDraft } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import { DayJumpBar, PageRail } from '@/components/planner/ItineraryPager';
import Skeleton from '@/components/Skeleton';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUiStore } from '@/store/uiStore';
import type { ScheduleItem } from '@/types';
import { CHIP_PREFIX, COLUMN_PREFIX, byStartTime, idsOnDay, resolveDrop } from '@/utils/dropTarget';
import { eventDayNumbers } from '@/utils/eventLength';
import { categoryLabel, categoryStyle, formatCurrency } from '@/utils/format';
import { clampPage, daysOnPage, isPaged, neighbourPages, pageCount, pageOfDay } from '@/utils/itineraryPages';
import { reflowDay } from '@/utils/reflow';
import { timingsOf } from '@/utils/restoreTiming';

const FIRST_DAY = 1;

/**
 * Over a Day button the floating card steps down and aside so it does not cover the button it is about
 * to drop on, or the tooltip under it.
 */
const stepAsideFromDayButton: Modifier = ({ over, transform }) =>
  over && String(over.id).startsWith(CHIP_PREFIX)
    ? { ...transform, x: transform.x + 28, y: transform.y + 96 }
    : transform;

const cardActionClass =
  'flex size-8 items-center justify-center rounded-lg bg-canvas text-ink transition-colors hover:bg-line disabled:pointer-events-none disabled:opacity-35';

/**
 * Mouse and touch drops follow the pointer: whichever card (or empty column space) it is over wins.
 * Keyboard dragging has no pointer, so it falls back to the nearest corners.
 */
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : closestCorners(args);
};

/** Pure presentation, shared by the in-column card and the floating drag preview. */
function CardBody({
  item,
  handle,
  actions,
  afterCost,
  moveControl,
}: {
  item: ScheduleItem;
  handle?: ReactNode;
  actions?: ReactNode;
  /** Sits right after the price, e.g. the check-in code link. */
  afterCost?: ReactNode;
  /** A full-width row under the arrows, for jumping straight to any day. */
  moveControl?: ReactNode;
}) {
  const style = categoryStyle(item.category);

  return (
    <>
      <div className="flex items-start gap-2.5">
        {handle ?? <span className="size-6 shrink-0" aria-hidden="true" />}
        <h3 className="min-w-0 flex-1 text-base leading-snug font-semibold">{item.title}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
          {categoryLabel(item.category)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 pl-8.5 text-[13px] text-body">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {item.startTime} – {item.endTime}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {item.location}
        </span>
      </div>
      <div className="flex items-center justify-between pl-8.5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-sm font-semibold">{formatCurrency(item.costEstimate)}</span>
          {afterCost}
        </div>
        {actions}
      </div>
      {moveControl && <div className="pl-8.5">{moveControl}</div>}
    </>
  );
}

interface CardCallbacks {
  onShiftDay: (item: ScheduleItem, delta: -1 | 1) => void;
  onShiftPosition: (item: ScheduleItem, delta: -1 | 1) => void;
  /** The room check-in code only exists for saved sessions, not for an unsaved AI draft. */
  showCode: boolean;
  /** The last day on the board; a session cannot move past it. */
  lastDay: number;
  /** Moves a session to the end of another day in one step. */
  onMoveToDay: (item: ScheduleItem, day: number) => void;
  /** Every day a session can be sent to by name; null on a short trip, where the arrows are enough. */
  dayChoices: number[] | null;
}

function ScheduleCard({
  item,
  isFirst,
  isLast,
  onShiftDay,
  onShiftPosition,
  showCode,
  lastDay,
  onMoveToDay,
  dayChoices,
}: CardCallbacks & { item: ScheduleItem; isFirst: boolean; isLast: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid="schedule-card"
      data-item-id={item.id}
      className={`flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <CardBody
        item={item}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={`Drag ${item.title} to reorder or move`}
            data-testid="drag-handle"
            className="-ml-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        }
        moveControl={
          dayChoices && (
            <select
              aria-label={`Move ${item.title} to another day`}
              value=""
              onChange={(event) => {
                const day = Number(event.target.value);
                if (day) onMoveToDay(item, day);
              }}
              className="h-8 w-full cursor-pointer rounded-lg bg-canvas px-2 text-xs font-medium text-ink transition-colors hover:bg-line"
            >
              <option value="">Move to another day…</option>
              {dayChoices.map((day) => (
                <option key={day} value={day} disabled={day === item.day}>
                  Day {day}
                </option>
              ))}
            </select>
          )
        }
        afterCost={
          showCode ? (
            <Link
              to={`/planner/sessions/${item.id}/code`}
              aria-label={`Show check-in code for ${item.title}`}
              title="Show check-in code"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-2.5 text-xs font-semibold text-lime no-underline transition-colors hover:bg-ink-active hover:text-lime"
            >
              <QrCode className="size-3.5" strokeWidth={2} aria-hidden="true" />
              Code
            </Link>
          ) : null
        }
        actions={
          // Click alternatives to dragging, for keyboard and assistive-technology users.
          <div className="flex gap-0.5">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onShiftPosition(item, -1)}
              aria-label={isFirst ? `${item.title} is already first on Day ${item.day}` : `Move ${item.title} earlier on Day ${item.day}`}
              className={cardActionClass}
            >
              <ChevronUp className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onShiftPosition(item, 1)}
              aria-label={isLast ? `${item.title} is already last on Day ${item.day}` : `Move ${item.title} later on Day ${item.day}`}
              className={cardActionClass}
            >
              <ChevronDown className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={item.day === FIRST_DAY}
              onClick={() => onShiftDay(item, -1)}
              aria-label={
                item.day === FIRST_DAY
                  ? `${item.title} is already on the first day`
                  : `Move ${item.title} to Day ${item.day - 1}`
              }
              className={cardActionClass}
            >
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={item.day === lastDay}
              onClick={() => onShiftDay(item, 1)}
              aria-label={
                item.day === lastDay
                  ? `${item.title} is already on the last day`
                  : `Move ${item.title} to Day ${item.day + 1}`
              }
              className={cardActionClass}
            >
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        }
      />
    </li>
  );
}

function DropIndicator() {
  return <li aria-hidden="true" data-testid="drop-indicator" className="h-1.5 rounded-full bg-brand" />;
}

function FragmentWithIndicator({ showBefore, children }: { showBefore: boolean; children: ReactNode }) {
  return (
    <>
      {showBefore && <DropIndicator />}
      {children}
    </>
  );
}

function DayColumn({
  day,
  items,
  isLoading,
  dropIndex,
  ...callbacks
}: CardCallbacks & {
  day: number;
  items: ScheduleItem[];
  isLoading: boolean;
  /** Position of the insertion marker while a card from another day is hovering here. */
  dropIndex: number | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${day}`, data: { day } });
  const total = items.reduce((sum, item) => sum + item.costEstimate, 0);

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`Day ${day}`}
      data-testid={`day-column-${day}`}
      className={`flex min-h-64 min-w-0 flex-col gap-3 rounded-[22px] p-3.5 transition-colors ${
        isOver ? 'bg-brand-tint ring-2 ring-brand/50' : 'bg-sunken'
      }`}
    >
      <div className="flex items-center justify-between px-1.5 py-1">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8.5 items-center justify-center rounded-[10px] bg-ink font-display text-base font-extrabold text-lime">
            {day}
          </span>
          <span className="font-display text-lg font-bold">Day {day}</span>
        </div>
        {!isLoading && (
          <span className="font-mono text-[13px] text-body">
            {items.length} {items.length === 1 ? 'session' : 'sessions'} · {formatCurrency(total)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : (
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && dropIndex === null ? (
            <p className="px-1.5 text-sm text-body">No sessions planned. Drag one here.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item, index) => (
                <FragmentWithIndicator key={item.id} showBefore={dropIndex === index}>
                  <ScheduleCard
                    item={item}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    {...callbacks}
                  />
                </FragmentWithIndicator>
              ))}
              {dropIndex !== null && dropIndex >= items.length && <DropIndicator />}
            </ul>
          )}
        </SortableContext>
      )}
    </div>
  );
}

export default function CalendarBoard() {
  const saved = usePlannerSchedule();
  const draft = useScheduleDraft().data;
  const reorder = useReorderDay();
  const restoreTiming = useRestoreTiming();
  const addToast = useUiStore((state) => state.addToast);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hint, setHint] = useState<{ day: number; index: number } | null>(null);
  const [page, setPage] = useState(0);
  // The Day button that just received a card flashes lime briefly (skipped for reduced motion).
  const [overDayButton, setOverDayButton] = useState(false);
  const [flashDay, setFlashDay] = useState<number | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);
  const previousButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const focusAfterTurn = useRef<'previous' | 'next' | null>(null);

  // Opening or closing an AI draft starts the board back on its first page.
  const hasDraft = draft != null;
  const [sawDraft, setSawDraft] = useState(hasDraft);
  if (hasDraft !== sawDraft) {
    setSawDraft(hasDraft);
    setPage(0);
  }

  // Pointer drag needs a few pixels of travel so plain clicks on a card never start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = draft ?? saved.data ?? [];
  const days = eventDayNumbers(items);
  const lastDay = days[days.length - 1];
  const paged = isPaged(days.length);
  const currentPage = clampPage(page, days.length);
  const visibleDays = paged ? daysOnPage(days, currentPage) : days;
  const neighbours = neighbourPages(days, currentPage);

  // A button that turns the page may disable or remove itself, so hand focus to the one that still works.
  useEffect(() => {
    const wanted = focusAfterTurn.current;
    focusAfterTurn.current = null;
    if (!wanted) return;
    const canNext = currentPage < pageCount(days.length) - 1;
    const canPrevious = currentPage > 0;
    const useNext = wanted === 'next' ? canNext || !canPrevious : !canPrevious && canNext;
    (useNext ? nextButton : previousButton).current?.focus();
  }, [currentPage, days.length]);
  const activeItem = items.find((item) => item.id === activeId) ?? null;

  if (saved.isError && !draft) {
    return <ErrorNotice message="Could not load the itinerary." onRetry={() => void saved.refetch()} />;
  }

  const flash =(day: number) => {
    if (reducedMotion) return;
    window.clearTimeout(flashTimer.current);
    setFlashDay(day);
    flashTimer.current = window.setTimeout(() => setFlashDay(null), 600);
  };

  /**
   * Re-times `day` to the given order. Pass `moved` when a session is coming from another day: the
   * confirmation then names where it landed and offers View and Undo. Returns false (with a toast)
   * when the day has no room for the change.
   */
  const requestReorder = (day: number, orderedIds: string[], moved?: ScheduleItem): boolean => {
    const result = reflowDay(items, day, orderedIds);
    if (!result) {
      addToast('error', `There is not enough room left in Day ${day} for that.`);
      return false;
    }
    if (!moved) {
      reorder.mutate({ day, orderedIds });
      return true;
    }

    // Everything on the two days involved is re-timed, so remember how they were to put them back exactly.
    const before = timingsOf(items.filter((item) => item.day === moved.day || item.day === day));
    const landed = result.find((item) => item.id === moved.id) ?? moved;
    const shownNow = visibleDays.includes(day);
    reorder.mutate(
      { day, orderedIds, quiet: true },
      {
        onSuccess: () =>
          addToast('success', `Moved ${moved.title} to Day ${day} · ${landed.startTime} – ${landed.endTime}`, {
            actions: [
              // The board stays where it is after a move; offer the jump only when the card is out of sight.
              ...(shownNow
                ? []
                : [{ label: `View Day ${day}`, variant: 'primary' as const, onClick: () => turnPage(pageOfDay(day)) }]),
              { label: 'Undo', onClick: () => restoreTiming.mutate(before) },
            ],
          }),
      },
    );
    return true;
  };

  const titleOf = (id: string | number) => items.find((item) => item.id === String(id))?.title ?? 'the session';

  // Spoken while dragging. The Day buttons say where a drop would land; after a drop the toast speaks.
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) => {
      if (!over) return undefined;
      const overId = String(over.id);
      if (overId.startsWith(CHIP_PREFIX)) {
        const day = Number(overId.slice(CHIP_PREFIX.length));
        if (day === activeItem?.day) return undefined;
        return `Over Day ${day}. Drop to add ${titleOf(active.id)} to the end of Day ${day}`;
      }
      if (overId.startsWith(COLUMN_PREFIX)) return `Over Day ${overId.slice(COLUMN_PREFIX.length)}.`;
      return `Over ${titleOf(overId)}.`;
    },
    onDragEnd: ({ active, over }) =>
      over && String(over.id).startsWith(CHIP_PREFIX) ? undefined : `Dropped ${titleOf(active.id)}.`,
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
  };

  const shiftDay = (item: ScheduleItem, delta: -1 | 1) => {
    const day = item.day + delta;
    requestReorder(day, [...idsOnDay(items, day), item.id], item);
  };

  const moveToDay = (item: ScheduleItem, day: number) => {
    if (day !== item.day) requestReorder(day, [...idsOnDay(items, day), item.id], item);
  };

  const shiftPosition = (item: ScheduleItem, delta: -1 | 1) => {
    const ids = idsOnDay(items, item.day);
    const from = ids.indexOf(item.id);
    requestReorder(item.day, arrayMove(ids, from, from + delta));
  };

  const turnPage = (target: number, direction?: 'previous' | 'next') => {
    const next = clampPage(target, days.length);
    if (next === currentPage) return;
    focusAfterTurn.current = direction ?? null;
    setPage(next);
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  // onDragMove (not onDragOver) so the marker follows the pointer between the top and bottom half
  // of the hovered card, not just when the hovered card changes.
  const handleDragMove = (event: DragMoveEvent) => {
    const target = resolveDrop(event.active, event.over, items);
    setOverDayButton(target?.viaDayButton ?? false);
    const next = target?.crossDay ? { day: target.day, index: target.index } : null;
    setHint((previous) =>
      previous?.day === next?.day && previous?.index === next?.index ? previous : next,
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setHint(null);
    setOverDayButton(false);
    const target = resolveDrop(event.active, event.over, items);
    if (!target) return;

    const unchanged =
      !target.crossDay &&
      idsOnDay(items, target.day).every((id, index) => id === target.orderedIds[index]);
    const dragged = items.find((item) => item.id === String(event.active.id));
    if (unchanged) return;
    const moved = target.crossDay ? dragged : undefined;
    if (requestReorder(target.day, target.orderedIds, moved) && target.viaDayButton) flash(target.day);
  };

  const cancelDrag = () => {
    setActiveId(null);
    setHint(null);
    setOverDayButton(false);
  };

  return (
    <section id="itinerary" aria-labelledby="calendar-title" className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="calendar-title" className="font-display text-2xl font-bold">
          Itinerary
        </h2>
        <span className="text-sm text-body">Drag cards or use the arrows. Days re-time automatically.</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={cancelDrag}
        accessibility={{ announcements }}
      >
        {paged && (
          <DayJumpBar
            days={days}
            page={currentPage}
            sourceDay={activeItem?.day ?? null}
            flashDay={flashDay}
            onSelectDay={(day) => turnPage(pageOfDay(day))}
            onPrevious={() => turnPage(currentPage - 1, 'previous')}
            onNext={() => turnPage(currentPage + 1, 'next')}
            previousRef={previousButton}
            nextRef={nextButton}
          />
        )}

        <div className="flex items-stretch gap-3">
          {paged && neighbours.previous && (
            <PageRail
              direction="previous"
              label={neighbours.previous}
              onClick={() => turnPage(currentPage - 1, 'previous')}
            />
          )}
          {/* auto-fill keeps a lone last day one column wide instead of stretching it across the board. */}
          <div
            className={`grid min-w-0 flex-1 gap-4 ${
              paged
                ? 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]'
                : 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]'
            }`}
          >
            {visibleDays.map((day) => (
              <DayColumn
                key={day}
                day={day}
                isLoading={saved.isPending && !draft}
                dropIndex={hint?.day === day ? hint.index : null}
                items={items.filter((item) => item.day === day).sort(byStartTime)}
                onShiftDay={shiftDay}
                onShiftPosition={shiftPosition}
                showCode={!draft}
                lastDay={lastDay}
                onMoveToDay={moveToDay}
                dayChoices={paged ? days : null}
              />
            ))}
          </div>
          {paged && neighbours.next && (
            <PageRail
              direction="next"
              label={neighbours.next}
              onClick={() => turnPage(currentPage + 1, 'next')}
            />
          )}
        </div>

        <DragOverlay modifiers={[stepAsideFromDayButton]}>
          {activeItem ? (
            <div
              className={`flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-lg ring-2 ring-brand/40 ${overDayButton ? '-rotate-2' : ''}`}
            >
              <CardBody item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
