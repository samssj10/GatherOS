import { useBudgetSummary } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { formatCurrency } from '@/utils/format';

function barColor(percent: number): string {
  if (percent > 100) return 'bg-rose-500';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-emerald-600';
}

export default function BudgetTracker() {
  const { data, isPending, isError, refetch } = useBudgetSummary();

  if (isError) {
    return <ErrorNotice message="Could not load the budget." onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-6 h-3 w-full" />
        <Skeleton className="mt-6 h-10 w-full" />
      </div>
    );
  }

  const percent = data.budget > 0 ? (data.estimatedSpend / data.budget) * 100 : 0;
  const overBudget = data.remaining < 0;

  return (
    <section
      aria-labelledby="budget-title"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-baseline justify-between">
        <h2 id="budget-title" className="text-base font-bold tracking-tight text-slate-900">
          Budget
        </h2>
        <span className="text-sm text-slate-500">{Math.round(percent)}% of budget planned</span>
      </div>

      <div
        role="progressbar"
        aria-label="Planned spend as a share of the budget"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(Math.round(percent), 100)}
        className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full transition-all ${barColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <dt className="text-sm text-slate-500">Total budget</dt>
          <dd className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(data.budget)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Estimated spend</dt>
          <dd className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(data.estimatedSpend)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">{overBudget ? 'Over budget' : 'Remaining'}</dt>
          <dd
            className={`mt-1 text-xl font-bold tracking-tight ${
              overBudget ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(Math.abs(data.remaining))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
