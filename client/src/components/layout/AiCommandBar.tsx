import { Loader2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendeeSummary } from '@/api/attendees';
import { useBudgetSummary, useGenerateSchedule } from '@/api/schedule';

const fieldClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60';

/** Sticky top bar: describe the offsite and Claude drafts an itinerary onto the calendar board. */
export default function AiCommandBar() {
  const navigate = useNavigate();
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
    generate.mutate(
      {
        prompt: prompt.trim(),
        city: city.trim() || undefined,
        days,
        attendeeCount: Number.isFinite(requested) && requested > 0 ? requested : defaultAttendees,
        budget,
      },
      { onSuccess: () => void navigate('/planner') },
    );
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6">
      <form
        role="search"
        aria-label="Generate itinerary with AI"
        aria-busy={pending}
        onSubmit={handleSubmit}
      >
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3">
          <label htmlFor="ai-prompt" className="sr-only">
            Describe the offsite you want to plan
          </label>
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
            className="h-10 w-full rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 placeholder:text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowOptions((open) => !open)}
            aria-expanded={showOptions}
            aria-controls="ai-options"
            aria-label="Generation options"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {pending ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {showOptions && (
          <div id="ai-options" className="mx-auto grid max-w-3xl grid-cols-3 gap-4 pb-4">
            <div>
              <label htmlFor="ai-city" className="text-xs font-medium text-slate-500">
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
              <label htmlFor="ai-days" className="text-xs font-medium text-slate-500">
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
              <label htmlFor="ai-attendees" className="text-xs font-medium text-slate-500">
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
