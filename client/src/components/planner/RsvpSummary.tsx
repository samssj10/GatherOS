import { useAttendeeSummary } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';

export default function RsvpSummary() {
  const { data, isPending, isError, refetch } = useAttendeeSummary();

  if (isError) {
    return <ErrorNotice message="Could not load RSVPs." onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    );
  }

  const rows = [
    { label: 'Accepted', value: data.rsvp.accepted, color: 'text-emerald-700' },
    { label: 'Pending', value: data.rsvp.pending, color: 'text-amber-700' },
    { label: 'Declined', value: data.rsvp.declined, color: 'text-rose-700' },
  ];

  return (
    <section
      aria-labelledby="rsvp-title"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-baseline justify-between">
        <h2 id="rsvp-title" className="text-base font-bold tracking-tight text-slate-900">
          RSVPs
        </h2>
        <span className="text-sm text-slate-500">{data.total.toLocaleString()} invited</span>
      </div>

      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className={`text-lg font-bold tracking-tight ${row.color}`}>
              {row.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
