import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Clock, GripVertical, MapPin } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useMoveScheduleItem, usePlannerSchedule, useScheduleDraft } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import type { ScheduleItem } from '@/types';
import { categoryLabel, categoryStyle, formatCurrency } from '@/utils/format';

const DAYS = [1, 2, 3] as const;
const FIRST_DAY = DAYS[0];
const LAST_DAY = DAYS[DAYS.length - 1];

const cardActionClass =
  'flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-30';

/** Pure presentation, shared by the in-column card and the floating drag preview. */
function CardBody({ item, handle, actions }: { item: ScheduleItem; handle?: ReactNode; actions?: ReactNode }) {
  const style = categoryStyle(item.category);

  return (
    <>
      <div className="flex items-start gap-2">
        {handle}
        <h3 className="min-w-0 flex-1 text-sm font-bold tracking-tight text-slate-900">{item.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
          {categoryLabel(item.category)}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {item.startTime} – {item.endTime}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {item.location}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-900">{formatCurrency(item.costEstimate)}</p>
        {actions}
      </div>
    </>
  );
}

function ScheduleCard({ item, onMove }: { item: ScheduleItem; onMove: (id: string, day: number) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  return (
    <li
      ref={setNodeRef}
      data-testid="schedule-card"
      data-item-id={item.id}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:bg-slate-50 hover:shadow-md ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <CardBody
        item={item}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={`Drag ${item.title} to another day`}
            data-testid="drag-handle"
            className="-ml-1 mt-px flex h-6 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        }
        actions={
          // A click alternative to dragging, for keyboard and assistive-technology users.
          <div className="flex items-center">
            <button
              type="button"
              disabled={item.day === FIRST_DAY}
              onClick={() => onMove(item.id, item.day - 1)}
              aria-label={
                item.day === FIRST_DAY
                  ? `${item.title} is already on the first day`
                  : `Move ${item.title} to Day ${item.day - 1}`
              }
              className={cardActionClass}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={item.day === LAST_DAY}
              onClick={() => onMove(item.id, item.day + 1)}
              aria-label={
                item.day === LAST_DAY
                  ? `${item.title} is already on the last day`
                  : `Move ${item.title} to Day ${item.day + 1}`
              }
              className={cardActionClass}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        }
      />
    </li>
  );
}

function DayColumn({
  day,
  items,
  isLoading,
  onMove,
}: {
  day: number;
  items: ScheduleItem[];
  isLoading: boolean;
  onMove: (id: string, day: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}`, data: { day } });

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`Day ${day}`}
      data-testid={`day-column-${day}`}
      className={`min-h-64 rounded-xl border-2 border-dashed p-4 transition-colors ${
        isOver ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-300 bg-slate-100/50'
      }`}
    >
      <h3 className="mb-3 text-sm font-bold tracking-tight text-slate-900">Day {day}</h3>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No sessions planned. Drag one here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ScheduleCard key={item.id} item={item} onMove={onMove} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CalendarBoard() {
  const saved = usePlannerSchedule();
  const draft = useScheduleDraft().data;
  const move = useMoveScheduleItem();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Pointer drag needs a few pixels of travel so plain clicks on a card never start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const items = draft ?? saved.data ?? [];
  const activeItem = items.find((item) => item.id === activeId) ?? null;

  if (saved.isError && !draft) {
    return <ErrorNotice message="Could not load the itinerary." onRetry={() => void saved.refetch()} />;
  }

  const moveItem = (id: string, day: number) => move.mutate({ id, day });

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const targetDay = event.over?.data.current?.day as number | undefined;
    const item = items.find((entry) => entry.id === String(event.active.id));
    if (item && targetDay !== undefined && item.day !== targetDay) moveItem(item.id, targetDay);
  };

  return (
    <section aria-labelledby="calendar-title">
      <h2 id="calendar-title" className="mb-4 text-base font-bold tracking-tight text-slate-900">
        Itinerary
      </h2>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-3 gap-4">
          {DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day}
              isLoading={saved.isPending && !draft}
              onMove={moveItem}
              items={items
                .filter((item) => item.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="rounded-xl border border-indigo-300 bg-white p-4 shadow-md">
              <CardBody item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
