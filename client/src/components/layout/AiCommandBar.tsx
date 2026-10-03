import { Loader2, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAttendeeSummary } from '@/api/attendees';
import { useBudgetSummary, useGenerateSchedule } from '@/api/schedule';
import BurstIcon from '@/components/layout/BurstIcon';

const fieldClass =
  'mt-1 h-11 w-full rounded-xl border border-field bg-white px-3 text-sm text-ink placeholder:text-muted hover:bg-wash disabled:opacity-60';

/** Top bar of the dashboard: describe the offsite and Claude drafts an itinerary onto the board. */
export default function AiCommandBar() {
  const generate = useGenerateSchedule();
  const summary = useAttendeeSummary().data;
  const budget = useBudgetSummary().data?.budget;

  const [prompt, setPrompt] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [city, setCity] = useState('');
  const [days, setDays] = useState(3);
  const [attendees, setAttendees] = useState('');

  const defaultAttendees = summary?.rsvp.accepted || summary?.total || 100;
  const pending = generate.isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;

    const requested = Number.parseInt(attendees, 10);
    generate.mutate({
      prompt: prompt.trim(),
      city: city.trim() || undefined,
      days,
      attendeeCount: Number.isFinite(requested) && requested > 0 ? requested : defaultAttendees,
      budget,
    });
  };

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white px-8">
      <form
        role="search"
        aria-label="Generate itinerary with AI"
        aria-busy={pending}
        onSubmit={handleSubmit}
      >
        <div className="flex flex-wrap items-center gap-2.5 py-4">
          <label htmlFor="ai-prompt" className="sr-only">
            Describe the offsite you want to plan
          </label>
          <div className="flex min-h-12 min-w-0 flex-[1_1_360px] items-center gap-2.5 rounded-[14px] border border-field bg-wash px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
            <BurstIcon className="size-4.5 shrink-0 text-brand" />
            <input
              id="ai-prompt"
              type="text"
              required
              minLength={3}
              maxLength={500}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={pending}
              placeholder="Describe your offsite, e.g. 3-day team retreat in Lisbon with a sailing day"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted disabled:opacity-60"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowOptions((open) => !open)}
            aria-expanded={showOptions}
            aria-controls="ai-options"
            aria-label="Generation options"
            className="flex size-12 shrink-0 items-center justify-center rounded-[14px] border border-field bg-white text-body transition-colors hover:bg-wash"
          >
            <SlidersHorizontal className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-[14px] bg-brand px-5.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-70"
          >
            {pending ? (
              <Loader2 className="size-4.5 animate-spin" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <BurstIcon className="size-4.5" />
            )}
            {pending ? 'Generating…' : 'Generate draft'}
          </button>
        </div>

        {showOptions && (
          <div id="ai-options" className="grid grid-cols-3 gap-4 pb-4">
            <div>
              <label htmlFor="ai-city" className="text-xs font-medium text-muted">
                City (optional)
              </label>
              <input
                id="ai-city"
                type="text"
                maxLength={80}
                value={city}
                onChange={(event) => setCity(event.target.value)}
                disabled={pending}
                placeholder="e.g. Lisbon"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ai-days" className="text-xs font-medium text-muted">
                Days
              </label>
              <select
                id="ai-days"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                disabled={pending}
                className={fieldClass}
              >
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
              </select>
            </div>
            <div>
              <label htmlFor="ai-attendees" className="text-xs font-medium text-muted">
                Attendees
              </label>
              <input
                id="ai-attendees"
                type="number"
                min={1}
                max={2500}
                value={attendees}
                onChange={(event) => setAttendees(event.target.value)}
                disabled={pending}
                placeholder={`${defaultAttendees.toLocaleString()} (accepted RSVPs)`}
                className={fieldClass}
              />
            </div>
          </div>
        )}
      </form>
    </header>
  );
}
