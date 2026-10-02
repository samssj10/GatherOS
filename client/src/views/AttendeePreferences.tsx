import { usePageTitle } from '@/hooks/usePageTitle';
import { useAttendee, useUpdateAttendee } from '@/api/attendees';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import type { Attendee } from '@/types';

const OPTIONS: { value: Attendee['dietaryPreference']; label: string }[] = [
  { value: 'none', label: 'No restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
];

function DietaryForm({ attendeeId }: { attendeeId: string }) {
  const { data: attendee, isPending, isError, refetch } = useAttendee(attendeeId);
  const update = useUpdateAttendee(attendeeId);

  if (isError) {
    return <ErrorNotice message="Could not load your preferences." onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return (
      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <Skeleton key={option.value} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="text-sm text-slate-500">We&apos;ll share this with the catering team.</legend>
      <div className="mt-4 space-y-3">
        {OPTIONS.map((option) => {
          const selected = attendee.dietaryPreference === option.value;
          return (
            <label
              key={option.value}
              className={`flex h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
                selected
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="dietaryPreference"
                value={option.value}
                checked={selected}
                onChange={() => update.mutate({ dietaryPreference: option.value })}
                className="h-4 w-4 accent-indigo-600 focus:outline-none"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function AttendeePreferences() {
  usePageTitle('Dietary preferences');
  const { session } = useAuth();
  if (!session) return null;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">Dietary preferences</h1>
      <ErrorBoundary inline>
        <DietaryForm attendeeId={session.id} />
      </ErrorBoundary>
    </div>
  );
}
