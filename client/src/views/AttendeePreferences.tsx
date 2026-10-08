import { Check, Info, Leaf, Sprout, Star, Utensils, WheatOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAttendee, useUpdateAttendee } from '@/api/attendees';
import { useMySchedule } from '@/api/schedule';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Attendee } from '@/types';
import { DIETARY_LABELS, XP, sortSessions } from '@/utils/gamification';

interface Option {
  value: Attendee['dietaryPreference'];
  description: string;
  icon: LucideIcon;
}

const OPTIONS: Option[] = [
  { value: 'none', description: 'Anything goes', icon: Utensils },
  { value: 'vegetarian', description: 'No meat or fish', icon: Leaf },
  { value: 'vegan', description: 'No animal products', icon: Sprout },
  { value: 'gluten-free', description: 'No wheat, barley or rye', icon: WheatOff },
];

function MealsList() {
  const { data } = useMySchedule();
  const meals = sortSessions(data ?? []).filter((session) => session.category === 'meal');
  if (meals.length === 0) return null;

  return (
    <section
      aria-labelledby="meals-title"
      className="flex flex-col gap-1 rounded-[20px] border border-line bg-white p-4.5 lg:rounded-3xl lg:p-6"
    >
      <h2 id="meals-title" className="mb-2 font-display text-lg font-bold lg:mb-3 lg:text-xl">
        Meals on this trip
      </h2>
      <ul>
        {meals.map((meal) => (
          <li key={meal.id} className="flex min-h-14 items-center gap-3 border-t border-hairline lg:min-h-16 lg:gap-3.5">
            <span className="flex size-10 flex-none flex-col items-center justify-center rounded-xl bg-orange-tint leading-none text-warn-ink lg:size-11">
              <span className="text-[9px] font-semibold">DAY</span>
              <span className="font-display text-base font-extrabold lg:text-lg">{meal.day}</span>
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold">{meal.sessionTitle}</p>
              <p className="text-[13px] text-body">
                {meal.startTime} · {meal.locationName}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 hidden border-t border-hairline pt-3 text-[13px] text-body lg:block">
        Allergies or other needs? Tell your event planner directly.
      </p>
    </section>
  );
}

function DietaryForm({ attendeeId }: { attendeeId: string }) {
  const { data: attendee, isPending, isError, refetch } = useAttendee(attendeeId);
  const update = useUpdateAttendee(attendeeId);

  if (isError) {
    return <ErrorNotice message="Could not load your preferences." onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {OPTIONS.map((option, index) => (
          <Skeleton key={option.value} className={`h-33 rounded-[20px] lg:h-42 ${index === OPTIONS.length - 1 ? 'lg:col-span-3' : ''}`} />
        ))}
      </div>
    );
  }

  const confirmed = attendee.dietaryConfirmed;

  return (
    <>
      <fieldset>
        <legend className="sr-only">Dietary preference</legend>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {OPTIONS.map((option, index) => {
            const selected = confirmed && attendee.dietaryPreference === option.value;
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={`relative flex min-h-33 cursor-pointer flex-col justify-between rounded-[20px] border-2 p-4 transition-colors lg:min-h-42 lg:p-4.5 ${index === OPTIONS.length - 1 ? 'lg:col-span-3' : ''} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${
                  selected ? 'border-brand bg-brand-tint' : 'border-line bg-white hover:bg-wash'
                }`}
              >
                {/* onClick (not onChange) so confirming the already-selected default still counts. */}
                <input
                  type="radio"
                  name="dietary"
                  value={option.value}
                  checked={selected}
                  onChange={() => undefined}
                  onClick={() => update.mutate({ dietaryPreference: option.value })}
                  className="absolute size-px opacity-0"
                />
                <span className="flex items-start justify-between">
                  <span
                    className={`flex size-11 items-center justify-center rounded-[14px] lg:size-12 ${
                      selected ? 'bg-brand text-white' : 'bg-canvas text-body'
                    }`}
                  >
                    <Icon className="size-5.5 lg:size-6" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-ink bg-ink text-lime' : 'border-ink-text'
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <Check className="size-3" strokeWidth={3.2} />}
                  </span>
                </span>
                <span>
                  <span className={`block text-base font-semibold lg:text-[17px] ${selected ? 'text-brand-deep' : ''}`}>
                    {DIETARY_LABELS[option.value]}
                  </span>
                  <span className={`mt-0.5 block text-xs lg:text-[13px] ${selected ? 'text-brand-ink' : 'text-muted'}`}>
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {confirmed ? (
          <div className="flex items-center gap-3.5 rounded-[20px] bg-ink p-4 text-canvas lg:gap-4 lg:px-5 lg:py-4.5">
            <span className="flex size-11 flex-none rotate-45 items-center justify-center rounded-xl bg-lime text-ink">
              <Star className="size-5 -rotate-45" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold lg:text-base">
                Quest complete · Fuelled Up<span className="hidden lg:inline"> badge earned</span>
              </p>
              <p className="text-[13px] text-ink-text-2 lg:text-sm">
                Saved as {DIETARY_LABELS[attendee.dietaryPreference].toLowerCase()}.
                <span className="lg:hidden"> Change it any time.</span>
                <span className="hidden lg:inline"> You can change it any time.</span>
              </p>
            </div>
            <span className="font-mono text-[13px] font-semibold text-lime lg:text-sm">
              +{XP.dietary}
              <span className="hidden lg:inline"> XP</span>
            </span>
          </div>
        ) : (
          <p className="flex items-center gap-2.5 px-1 text-sm text-body">
            <Info className="size-4.5 flex-none text-brand" strokeWidth={1.9} aria-hidden="true" />
            Pick one to complete this quest and earn {XP.dietary} XP.
          </p>
        )}
      </div>
    </>
  );
}

export default function AttendeePreferences() {
  usePageTitle('Fuel your trip');
  const { session } = useAuth();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header>
        <span className="rounded-md bg-brand-tint px-2 py-1 font-mono text-[11px] font-semibold text-brand-ink lg:text-xs">
          QUEST · +{XP.dietary} XP
        </span>
        <h1 className="mt-2.5 mb-1 font-display text-3xl font-extrabold tracking-tight lg:mt-3 lg:text-[40px]">
          Fuel your trip
        </h1>
        <p className="text-[15px] text-body lg:text-base">Pick what you eat. We'll share it with the catering team.</p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:gap-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-[2_1_560px]">
          <ErrorBoundary inline>
            <DietaryForm attendeeId={session.id} />
          </ErrorBoundary>
        </div>
        <div className="min-w-0 lg:flex-[1_1_300px]">
          <ErrorBoundary inline>
            <MealsList />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
