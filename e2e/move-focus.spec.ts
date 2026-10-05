import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { plannerSession, sessionCookie } from './helpers/session';

// Moving a session re-draws it in another column or place. Keyboard focus must follow it instead of
// dropping to the top of the page. Drafts stay in the browser, so the shared mock database is untouched.
test.use({ viewport: { width: 1440, height: 1000 } });

function draftFor(days: number) {
  const slots = [
    ['a', '09:00', '10:00', 'keynote'],
    ['b', '12:00', '13:00', 'meal'],
    ['c', '14:00', '16:00', 'activity'],
  ] as const;
  return {
    items: Array.from({ length: days }, (_, index) => index + 1).flatMap((day) =>
      slots.map(([key, startTime, endTime, category]) => ({
        id: `mf-${day}-${key}`,
        day,
        startTime,
        endTime,
        title: `E2E Day ${day} ${category}`,
        description: 'Mocked',
        location: 'Main Hall',
        category,
        costEstimate: 500,
      })),
    ),
  };
}

async function openDraft(page: Page, days: number) {
  await page.context().addCookies([sessionCookie(plannerSession)]);
  await page.route('**/api/ai/generate-schedule', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(draftFor(days)) }),
  );
  await page.goto('/planner');
  await page.getByLabel('Describe the offsite you want to plan').fill(`${days}-day retreat in Lisbon`);
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await expect(column(page, 1).getByRole('heading', { level: 3, name: 'E2E Day 1 keynote' })).toBeVisible();
  await page.locator('#itinerary').evaluate((section) => section.scrollIntoView());
}

const column = (page: Page, day: number) => page.getByRole('group', { name: `Day ${day}`, exact: true });
const card = (page: Page, day: number, title: string) =>
  column(page, day).getByTestId('schedule-card').filter({ hasText: title });
const dayButton = (page: Page, day: number) =>
  page.getByRole('navigation', { name: 'Jump to day' }).getByRole('button', { name: `Day ${day}`, exact: true });
const handleOf = (page: Page, title: string) => page.getByRole('button', { name: `Drag ${title} to reorder or move` });

test('the next-day arrow keeps focus on the moved card, and on the card itself once it can go no further', async ({ page }) => {
  await openDraft(page, 3);
  await page.getByRole('button', { name: 'Move E2E Day 1 keynote to Day 2' }).focus();
  await page.keyboard.press('Enter');

  // On Day 2 the same arrow now offers Day 3, and it has focus.
  await expect(column(page, 2).getByRole('button', { name: 'Move E2E Day 1 keynote to Day 3' })).toBeFocused();

  // On the last day that arrow is disabled, so the card itself takes focus.
  await page.keyboard.press('Enter');
  await expect(card(page, 3, 'E2E Day 1 keynote')).toBeFocused();
});

test('the previous-day arrow keeps focus the same way', async ({ page }) => {
  await openDraft(page, 3);
  await page.getByRole('button', { name: 'Move E2E Day 3 keynote to Day 2' }).focus();
  await page.keyboard.press('Enter');
  await expect(column(page, 2).getByRole('button', { name: 'Move E2E Day 3 keynote to Day 1' })).toBeFocused();
});

test('the up and down arrows keep focus while the card can still move that way', async ({ page }) => {
  await openDraft(page, 3);
  await page.getByRole('button', { name: 'Move E2E Day 1 keynote later on Day 1' }).focus();
  await page.keyboard.press('Enter');
  // Wait for the move to land (the keynote is second of three) before judging where focus is: the
  // button had focus before the move too, so focus alone proves nothing yet.
  await expect(column(page, 1).getByTestId('schedule-card').nth(1)).toContainText('E2E Day 1 keynote');
  // "later" is still available for a second-of-three card, and still focused.
  await expect(page.getByRole('button', { name: 'Move E2E Day 1 keynote later on Day 1' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(column(page, 1).getByTestId('schedule-card').nth(2)).toContainText('E2E Day 1 keynote');
  // Now it is last: the arrow is disabled, so focus is on the card.
  await expect(card(page, 1, 'E2E Day 1 keynote')).toBeFocused();
});

test('a three-day board has no "Move to another day" select', async ({ page }) => {
  await openDraft(page, 3);
  await expect(page.getByRole('combobox')).toHaveCount(0);
});

test('the day select keeps focus when the card lands on a day that is on screen', async ({ page }) => {
  await openDraft(page, 5);
  await page.getByRole('combobox', { name: 'Move E2E Day 1 keynote to another day' }).selectOption('2');
  await expect(column(page, 2).getByRole('combobox', { name: 'Move E2E Day 1 keynote to another day' })).toBeFocused();
});

test('when a card moves to a day on another page, focus stays in the list it left', async ({ page }) => {
  await openDraft(page, 5);
  await page.getByRole('combobox', { name: 'Move E2E Day 1 keynote to another day' }).selectOption('5');
  await expect(column(page, 1).getByRole('heading', { level: 3, name: 'E2E Day 1 keynote' })).toHaveCount(0);
  // Focus is on a card of Day 1 (the one now in the keynote's old place), not lost to the page.
  await expect(column(page, 1).locator('[data-testid="schedule-card"]:focus')).toHaveCount(1);
});

test('a keyboard drag onto a Day button on screen ends with focus on the card handle in its new column', async ({ page }) => {
  await openDraft(page, 5);
  await handleOf(page, 'E2E Day 1 keynote').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await expect(dayButton(page, 2)).toBeFocused();
  await page.keyboard.press('Space');

  await expect(column(page, 2).getByRole('button', { name: 'Drag E2E Day 1 keynote to reorder or move' })).toBeFocused();
});

test('a keyboard drag onto a Day button on another page leaves focus in the list the card left', async ({ page }) => {
  await openDraft(page, 5);
  await handleOf(page, 'E2E Day 1 keynote').focus();
  await page.keyboard.press('Space');
  for (let i = 0; i < 4; i += 1) await page.keyboard.press('Tab');
  await expect(dayButton(page, 5)).toBeFocused();
  await page.keyboard.press('Space');

  await expect(column(page, 1).getByRole('heading', { level: 3, name: 'E2E Day 1 keynote' })).toHaveCount(0);
  await expect(column(page, 1).locator('[data-testid="schedule-card"]:focus')).toHaveCount(1);
});
