import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { usePlannerProgress } from '@/hooks/usePlannerProgress';
import { formatNumber } from '@/utils/format';

export default function RsvpOverview() {
  const { numbers, isError, refetch } = usePlannerProgress();

  if (isError) {
    return (
      <div className="flex-[2_1_320px]">
        <ErrorNotice message="Could not load RSVPs." onRetry={refetch} />
      </div>
    );
  }

  if (!numbers) {
    return <Skeleton className="min-h-68 flex-[2_1_320px] rounded-3xl" />;
  }

  const { total, rsvp } = numbers.summary;
  const pct = (count: number) => (total > 0 ? (count / total) * 100 : 0);
  const answeredPct = Math.round(pct(rsvp.accepted + rsvp.declined));

  const rows = [
    { label: 'Accepted', value: rsvp.accepted, dot: 'bg-ok', text: 'text-ok-ink' },
    { label: 'Pending', value: rsvp.pending, dot: 'bg-warn', text: 'text-warn-ink' },
    { label: 'Declined', value: rsvp.declined, dot: 'bg-bad', text: 'text-bad-ink' },
  ];

  return (
    <section
      aria-labelledby="rsvp-title"
      className="flex flex-[2_1_320px] flex-col gap-4.5 rounded-3xl border border-line bg-white p-6"
    >
      <div className="flex items-baseline justify-between">
        <h2 id="rsvp-title" className="font-display text-xl font-bold">
          RSVPs
        </h2>
        <span className="text-sm text-body">
          {formatNumber(total)} invited · {answeredPct}% answered
        </span>
      </div>

      <div className="relative pt-5.5">
        <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded bg-lime px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-ink">
          Half House
        </span>
        <div
          role="img"
          aria-label={`${formatNumber(rsvp.accepted)} accepted, ${formatNumber(rsvp.pending)} pending, ${formatNumber(rsvp.declined)} declined`}
          className="flex h-4.5 overflow-hidden rounded-[9px] bg-hairline"
        >
          <div className="bg-ok" style={{ width: `${pct(rsvp.accepted)}%` }} />
          <div className="border-l-2 border-white bg-warn" style={{ width: `${pct(rsvp.pending)}%` }} />
          <div className="border-l-2 border-white bg-bad" style={{ width: `${pct(rsvp.declined)}%` }} />
        </div>
        <div aria-hidden="true" className="absolute top-4.5 -bottom-1 left-1/2 w-0.5 bg-ink" />
      </div>

      <ul className="flex flex-col">
        {rows.map((row, index) => (
          <li
            key={row.label}
            className={`flex items-center justify-between py-2.5 ${index < rows.length - 1 ? 'border-b border-hairline' : ''}`}
          >
            <span className="inline-flex items-center gap-2 text-[15px] text-body">
              <span className={`size-2.5 rounded-full ${row.dot}`} aria-hidden="true" />
              {row.label}
            </span>
            <span className={`font-display text-[22px] font-bold ${row.text}`}>{formatNumber(row.value)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
