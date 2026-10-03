import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { usePlannerProgress } from '@/hooks/usePlannerProgress';
import { formatCurrency } from '@/utils/format';
import { budgetStatus, spendByCategory, spendOf } from '@/utils/progress';

export default function BudgetCard() {
  const { numbers, isDraft, isError, refetch } = usePlannerProgress();

  if (isError) {
    return (
      <div className="flex-[3_1_440px]">
        <ErrorNotice message="Could not load the budget." onRetry={refetch} />
      </div>
    );
  }

  if (!numbers) {
    return <Skeleton className="min-h-68 flex-[3_1_440px] rounded-3xl" />;
  }

  const { items, budget } = numbers;
  const spend = spendOf(items);
  const remaining = budget - spend;
  const spendPct = budget > 0 ? (spend / budget) * 100 : 0;
  const status = budgetStatus(spendPct);
  const segments = spendByCategory(items).filter((segment) => segment.amount > 0);
  const summary = spendByCategory(items)
    .map((segment) => `${segment.label.toLowerCase()} ${formatCurrency(segment.amount)}`)
    .join(', ');

  return (
    <section
      aria-labelledby="budget-title"
      className="flex flex-[3_1_440px] flex-col gap-5 rounded-3xl border border-line bg-white p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="budget-title" className="font-display text-xl font-bold">
          Budget
        </h2>
        <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${status.classes}`}>
          {Math.round(spendPct)}% planned · {status.label}
        </span>
      </div>

      <div>
        <div
          role="img"
          aria-label={`Spend by category: ${summary}, out of ${formatCurrency(budget)}`}
          className="flex h-4.5 overflow-hidden rounded-[9px] bg-hairline"
        >
          {segments.map((segment, index) => (
            <div
              key={segment.category}
              className={`${segment.swatch} ${index > 0 ? 'border-l-2 border-white' : ''}`}
              style={{ width: `${budget > 0 ? (segment.amount / budget) * 100 : 0}%` }}
            />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4.5 gap-y-1.5 text-[13px] text-body">
          {spendByCategory(items).map((segment) => (
            <li key={segment.category} className="inline-flex items-center gap-1.5">
              <span className={`size-2.5 rounded-[3px] ${segment.swatch}`} aria-hidden="true" />
              {segment.label} {formatCurrency(segment.amount)}
            </li>
          ))}
        </ul>
      </div>

      <dl className="grid grid-cols-3 gap-4 border-t border-hairline pt-4.5">
        <div>
          <dt className="text-[13px] text-muted">Total budget</dt>
          <dd className="mt-1 font-display text-3xl font-bold">{formatCurrency(budget)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">{isDraft ? 'Estimated spend (draft)' : 'Estimated spend'}</dt>
          <dd className="mt-1 font-display text-3xl font-bold">{formatCurrency(spend)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">{remaining < 0 ? 'Over budget' : 'Remaining'}</dt>
          <dd
            className={`mt-1 font-display text-3xl font-bold ${remaining < 0 ? 'text-bad-ink' : 'text-ok-ink'}`}
          >
            {formatCurrency(Math.abs(remaining))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
