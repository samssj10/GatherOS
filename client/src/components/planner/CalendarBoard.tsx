import { Clock, MapPin } from 'lucide-react';
import { usePlannerSchedule } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import type { ScheduleItem } from '@/types';
import { categoryLabel, categoryStyle, formatCurrency } from '@/utils/format';

const DAYS = [1, 2, 3] as const;

function ScheduleCard({ item }: { item: ScheduleItem }) {
  const style = categoryStyle(item.category);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:bg-slate-50 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold tracking-tight text-slate-900">{item.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
        >
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
      <p className="mt-3 text-xs font-semibold text-slate-900">{formatCurrency(item.costEstimate)}</p>
    </li>
  );
}

export default function CalendarBoard() {
  const { data, isPending, isError, refetch } = usePlannerSchedule();

  if (isError) {
    return <ErrorNotice message="Could not load the itinerary." onRetry={() => void refetch()} />;
  }

  return (
    <section aria-labelledby="calendar-title">
      <h2 id="calendar-title" className="mb-4 text-base font-bold tracking-tight text-slate-900">
        Itinerary
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {DAYS.map((day) => {
          const items = (data ?? [])
            .filter((item) => item.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={day}
              aria-label={`Day ${day}`}
              className="min-h-64 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/50 p-4"
            >
              <h3 className="mb-3 text-sm font-bold tracking-tight text-slate-900">Day {day}</h3>

              {isPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-slate-500">No sessions planned yet.</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
