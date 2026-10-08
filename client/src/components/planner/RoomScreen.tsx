import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { XP } from '@/utils/gamification';

interface RoomScreenProps {
  /** A bar across the top, such as the preview banner. */
  banner?: ReactNode;
  /** The "Stop 1 · Day 1 · 09:00 – 10:00" line. */
  stop: string;
  /** Sits at the right end of the stop line, e.g. the way back to the dashboard. */
  stopAction?: ReactNode;
  title: string;
  /** Where the screen is shown. */
  location?: string;
  /** Says the session is not live. */
  notice?: string;
  /** The "Checked in" figure, and how full the bar is. `meter` makes the bar a real progress bar. */
  checked: { value: string; percent: number; meter?: { now: number; max: number } };
  /** The QR code, in its white card. */
  qr: ReactNode;
  /** The six characters under the QR code. */
  code: { text: string; spoken?: string };
  /** The small line under the code: a countdown, or a note. */
  codeNote: ReactNode;
}

/**
 * The room display, meant to be projected at the front of a room: what to do, how many have checked in, and a QR
 * code with its typed code. The live screen and the sample preview draw the same thing with different content.
 */
export default function RoomScreen({
  banner,
  stop,
  stopAction,
  title,
  location,
  notice,
  checked,
  qr,
  code,
  codeNote,
}: RoomScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-canvas">
      {banner}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col justify-center gap-12 px-6 py-10 focus:outline-none sm:px-12 lg:flex-row lg:items-center lg:gap-20 lg:px-20 lg:py-16"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand font-display text-[21px] font-extrabold text-white">
              G
            </span>
            <p className="font-mono text-[15px] uppercase tracking-[0.08em] text-lime">{stop}</p>
            {stopAction}
          </div>

          <h1 className="font-display text-5xl leading-[0.98] font-extrabold tracking-[-0.03em] sm:text-7xl xl:text-[88px]">
            {title}
          </h1>

          <p className="max-w-160 text-2xl leading-snug text-ink-text-2 lg:text-3xl">
            Scan to collect your stamp and <span className="font-semibold text-lime">+{XP.stamp} XP</span>. Open
            GatherOS, go to Journey, and tap Scan code to check in.
          </p>

          {location && (
            <p className="inline-flex items-center gap-2.5 text-lg text-ink-text-3">
              <MapPin className="size-5" strokeWidth={2} aria-hidden="true" />
              Shown in <span className="text-ink-text-2">{location}</span>
            </p>
          )}

          {notice && (
            <p role="status" className="max-w-160 rounded-2xl border border-ink-line bg-ink-raised px-5 py-4 text-lg text-ink-text-2">
              {notice}
            </p>
          )}

          <div className="max-w-115">
            <div className="mb-2.5 flex justify-between text-xl">
              <span>Checked in</span>
              <span className="font-mono">{checked.value}</span>
            </div>
            <div
              {...(checked.meter
                ? {
                    role: 'progressbar',
                    'aria-label': 'Attendees checked in',
                    'aria-valuemin': 0,
                    'aria-valuemax': checked.meter.max,
                    'aria-valuenow': checked.meter.now,
                  }
                : { 'aria-hidden': true })}
              className="h-3.5 overflow-hidden rounded-[7px] bg-ink-line"
            >
              <div
                className="h-full rounded-[7px] bg-lime transition-[width] duration-500"
                style={{ width: `${checked.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-117.5 flex-none flex-col items-center gap-6 self-center lg:w-117.5">
          <div className="relative rounded-4xl bg-white p-5 text-ink sm:p-8">{qr}</div>
          <div className="text-center">
            <p className="text-lg text-ink-text-2">Can't scan? Enter this code</p>
            <p
              aria-label={code.spoken}
              className="mt-1.5 pl-[0.25em] font-mono text-5xl font-semibold tracking-[0.25em] sm:text-[56px]"
            >
              {code.text}
            </p>
            {codeNote}
          </div>
        </div>
      </main>
    </div>
  );
}
