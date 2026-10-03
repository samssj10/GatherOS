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
  Active,
  CollisionDetection,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  Over,
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
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePlannerSchedule, useReorderDay, useScheduleDraft } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { useUiStore } from '@/store/uiStore';
import type { ScheduleItem } from '@/types';
import { categoryLabel, categoryStyle, formatCurrency } from '@/utils/format';
import { reflowDay } from '@/utils/reflow';

const DAYS = [1, 2, 3] as const;
const FIRST_DAY = DAYS[0];
const LAST_DAY = DAYS[DAYS.length - 1];
const COLUMN_PREFIX = 'day-';

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

const byStartTime = (a: ScheduleItem, b: ScheduleItem) => a.startTime.localeCompare(b.startTime);

const idsOnDay = (items: ScheduleItem[], day: number): string[] =>
  items
    .filter((item) => item.day === day)
    .sort(byStartTime)
    .map((item) => item.id);

interface DropTarget {
  day: number;
  /** Every session that should be on `day` afterwards, in order. */
  orderedIds: string[];
  /** Where the dragged card lands among the destination day's other cards (cross-day only). */
  index: number;
  crossDay: boolean;
}

/** Turns "dragged card X is over Y" into the day, the new order and the landing index. */
function resolveDrop(active: Active, over: Over | null, items: ScheduleItem[]): DropTarget | null {
  if (!over) return null;
  const dragged = items.find((item) => item.id === String(active.id));
  if (!dragged) return null;

  const overId = String(over.id);

  // Dropped on a column's empty space: append to the end of that day.
  if (overId.startsWith(COLUMN_PREFIX)) {
    const day = Number(overId.slice(COLUMN_PREFIX.length));
    if (day === dragged.day) return null;
    const destination = idsOnDay(items, day);
    return { day, orderedIds: [...destination, dragged.id], index: destination.length, crossDay: true };
  }

  // Dropped on another card.
  const target = items.find((item) => item.id === overId);
  if (!target || target.id === dragged.id) return null;

  if (target.day === dragged.day) {
    const ids = idsOnDay(items, target.day);
    const to = ids.indexOf(target.id);
    return {
      day: target.day,
      orderedIds: arrayMove(ids, ids.indexOf(dragged.id), to),
      index: to,
      crossDay: false,
    };
  }

  // Another day: land before or after the hovered card, depending on which half the pointer is in.
  const destination = idsOnDay(items, target.day);
  const translated = active.rect.current.translated;
  const below = translated
    ? translated.top + translated.height / 2 > over.rect.top + over.rect.height / 2
    : false;
  const index = destination.indexOf(target.id) + (below ? 1 : 0);
  return {
    day: target.day,
    orderedIds: [...destination.slice(0, index), dragged.id, ...destination.slice(index)],
    index,
    crossDay: true,
  };
}

/** Pure presentation, shared by the in-column card and the floating drag preview. */
function CardBody({
  item,
  handle,
  actions,
  afterCost,
}: {
  item: ScheduleItem;
  handle?: ReactNode;
  actions?: ReactNode;
  /** Sits right after the price, e.g. the check-in code link. */
  afterCost?: ReactNode;
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
    </>
  );
}

interface CardCallbacks {
  onShiftDay: (item: ScheduleItem, delta: -1 | 1) => void;
  onShiftPosition: (item: ScheduleItem, delta: -1 | 1) => void;
  /** The room check-in code only exists for saved sessions, not for an unsaved AI draft. */
  showCode: boolean;
}

function ScheduleCard({
  item,
  isFirst,
  isLast,
  onShiftDay,
  onShiftPosition,
  showCode,
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
              disabled={item.day === LAST_DAY}
              onClick={() => onShiftDay(item, 1)}
              aria-label={
                item.day === LAST_DAY
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
  const addToast = useUiStore((state) => state.addToast);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hint, setHint] = useState<{ day: number; index: number } | null>(null);

  // Pointer drag needs a few pixels of travel so plain clicks on a card never start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = draft ?? saved.data ?? [];
  const activeItem = items.find((item) => item.id === activeId) ?? null;

  if (saved.isError && !draft) {
    return <ErrorNotice message="Could not load the itinerary." onRetry={() => void saved.refetch()} />;
  }

  const requestReorder = (day: number, orderedIds: string[]) => {
    if (!reflowDay(items, day, orderedIds)) {
      addToast('error', `There is not enough room left in Day ${day} for that.`);
      return;
    }
    reorder.mutate({ day, orderedIds });
  };

  const shiftDay = (item: ScheduleItem, delta: -1 | 1) => {
    const day = item.day + delta;
    requestReorder(day, [...idsOnDay(items, day), item.id]);
  };

  const shiftPosition = (item: ScheduleItem, delta: -1 | 1) => {
    const ids = idsOnDay(items, item.day);
    const from = ids.indexOf(item.id);
    requestReorder(item.day, arrayMove(ids, from, from + delta));
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  // onDragMove (not onDragOver) so the marker follows the pointer between the top and bottom half
  // of the hovered card, not just when the hovered card changes.
  const handleDragMove = (event: DragMoveEvent) => {
    const target = resolveDrop(event.active, event.over, items);
    const next = target?.crossDay ? { day: target.day, index: target.index } : null;
    setHint((previous) =>
      previous?.day === next?.day && previous?.index === next?.index ? previous : next,
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setHint(null);
    const target = resolveDrop(event.active, event.over, items);
    if (!target) return;

    const unchanged =
      !target.crossDay &&
      idsOnDay(items, target.day).every((id, index) => id === target.orderedIds[index]);
    if (!unchanged) requestReorder(target.day, target.orderedIds);
  };

  const cancelDrag = () => {
    setActiveId(null);
    setHint(null);
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
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
          {DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day}
              isLoading={saved.isPending && !draft}
              dropIndex={hint?.day === day ? hint.index : null}
              items={items.filter((item) => item.day === day).sort(byStartTime)}
              onShiftDay={shiftDay}
              onShiftPosition={shiftPosition}
              showCode={!draft}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-lg ring-2 ring-brand/40">
              <CardBody item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
