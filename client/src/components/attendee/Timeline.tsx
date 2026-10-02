import { Clock, MapPin } from 'lucide-react';
import { useMySchedule } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import type { AttendeeScheduleDTO } from '@/types';
import { categoryLabel, categoryStyle } from '@/utils/format';

function groupByDay(items: AttendeeScheduleDTO[]): [number, AttendeeScheduleDTO[]][] {
  const days = new Map<number, AttendeeScheduleDTO[]>();
  for (const item of items) {
    days.set(item.day, [...(days.get(item.day) ?? []), item]);
  }
  return [...days.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, list]) => [day, list.sort((a, b) => a.startTime.localeCompare(b.startTime))]);
}

export default function Timeline() {
  const { data, isPending, isError, refetch } = useMySchedule();

  if (isError) {
    return <ErrorNotice message="Could not load your schedule." onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No sessions have been scheduled yet.</p>;
  }

  return (
    <div className="space-y-8">
      {groupByDay(data).map(([day, items]) => (
        <section key={day} aria-labelledby={`day-${day}`}>
          <h2 id={`day-${day}`} className="mb-4 text-lg font-bold tracking-tight text-slate-900">
            Day {day}
          </h2>

          <ol className="ml-2 space-y-4 border-l-2 border-slate-200">
            {items.map((item) => {
              const style = categoryStyle(item.category);
              return (
                <li key={`${item.day}-${item.startTime}-${item.sessionTitle}`} className="relative pl-6">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[9px] top-5 h-4 w-4 rounded-full border-2 border-white ${style.dot}`}
                  />
                  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold tracking-tight text-slate-900">{item.sessionTitle}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                      >
                        {categoryLabel(item.category)}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {item.startTime} – {item.endTime}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {item.locationName}
                    </p>
                    {item.isRsvpRequired && (
                      <p className="mt-3 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        RSVP required
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
