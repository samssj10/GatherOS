import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attendeeSession, sessionCookie } from './helpers/session';

// The attendee's schedule is mocked at the network, so these tests never touch the shared mock database.
type Status = 'upcoming' | 'live' | 'ended';

function trip(days: number[], statusOf: (day: number, index: number) => Status = () => 'upcoming') {
  const slots = [
    ['09:00', '10:00', 'keynote', 'Opening Keynote'],
    ['12:00', '13:00', 'meal', 'Team Lunch'],
  ] as const;
  return days.flatMap((day) =>
    slots.map(([startTime, endTime, category, title], index) => ({
      id: `aj-${day}-${index}`,
      eventId: 'evt-offsite-2026',
      day,
      sessionTitle: `${title} (Day ${day})`,
      startTime,
      endTime,
      locationName: 'Main Hall',
      category,
      isRsvpRequired: false,
      checkInStatus: statusOf(day, index),
    })),
  );
}

async function openJourney(page: Page, schedule: ReturnType<typeof trip>) {
  await page.context().addCookies([sessionCookie(attendeeSession)]);
  await page.route('**/api/schedule/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(schedule) }),
  );
  await page.goto('/attendee/schedule');
  await expect(page.getByRole('heading', { level: 1, name: 'Your journey' })).toBeVisible();
}

const day = (page: Page, number: number) => page.getByRole('region', { name: `Day ${number}`, exact: true });
const bar = (page: Page) => page.getByRole('navigation', { name: 'Jump to day' });
const nextButton = (page: Page) => page.getByRole('button', { name: 'Show next days', exact: true });
const previousButton = (page: Page) => page.getByRole('button', { name: 'Show previous days', exact: true });

test.use({ viewport: { width: 1440, height: 1000 } });

test('a long trip is paged three days at a time, starting on the first page', async ({ page }) => {
  await openJourney(page, trip([1, 2, 3, 4, 5]));

  await expect(bar(page).getByRole('button')).toHaveCount(5);
  await expect(page.getByText('Days 1–3 of 5')).toBeVisible();
  await expect(page.getByRole('region', { name: /^Day \d$/ })).toHaveCount(3);
  await expect(previousButton(page)).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Show next days, Days 4–5' })).toBeVisible();

  await nextButton(page).click();
  await expect(page.getByText('Days 4–5 of 5')).toBeVisible();
  await expect(day(page, 5)).toBeVisible();
  await expect(day(page, 1)).toHaveCount(0);
  await expect(nextButton(page)).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Show previous days, Days 1–3' })).toBeVisible();

  // The strip goes back, and a Day button jumps to the page that holds it.
  await page.getByRole('button', { name: 'Show previous days, Days 1–3' }).click();
  await expect(day(page, 1)).toBeVisible();
  await bar(page).getByRole('button', { name: 'Day 5' }).click();
  await expect(day(page, 5)).toBeVisible();
});

test('the journey opens on the page with the live session', async ({ page }) => {
  await openJourney(page, trip([1, 2, 3, 4, 5], (d, index) => (d === 4 && index === 0 ? 'live' : d < 4 ? 'ended' : 'upcoming')));

  await expect(page.getByText('Days 4–5 of 5')).toBeVisible();
  await expect(day(page, 4).getByText('Happening now')).toBeVisible();
});

test('the journey opens on the page with the next session when nothing is live', async ({ page }) => {
  await openJourney(page, trip([1, 2, 3, 4, 5], (d) => (d <= 3 ? 'ended' : 'upcoming')));

  await expect(page.getByText('Days 4–5 of 5')).toBeVisible();
  await expect(day(page, 4)).toBeVisible();
});

test('a trip that skips a day names the days it really has', async ({ page }) => {
  await openJourney(page, trip([1, 2, 4, 5]));

  await expect(bar(page).getByRole('button')).toHaveCount(4);
  await expect(bar(page).getByRole('button', { name: 'Day 3' })).toHaveCount(0);
  await expect(page.getByText('Days 1, 2 and 4 of 4')).toBeVisible();
  await expect(day(page, 4)).toBeVisible();
  // Day 4 sits on the first page, so its button does not turn the page.
  await bar(page).getByRole('button', { name: 'Day 4' }).click();
  await expect(page.getByText('Days 1, 2 and 4 of 4')).toBeVisible();
});

test('a trip of three days shows no jump bar and no strips', async ({ page }) => {
  await openJourney(page, trip([1, 2, 3]));

  await expect(day(page, 3)).toBeVisible();
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Show (next|previous) days/ })).toHaveCount(0);
});

test('on a phone the journey keeps its day tabs and has no jump bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openJourney(page, trip([1, 2, 3, 4, 5]));

  await expect(page.getByRole('group', { name: 'Choose a day' }).getByRole('button')).toHaveCount(5);
  await expect(bar(page)).toHaveCount(0);
});
