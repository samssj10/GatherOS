import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { plannerSession, sessionCookie } from './helpers/session';

test.use({ viewport: { width: 1440, height: 1000 } });

// A five-day AI draft: a keynote (09:00 to 10:00) and a meal (12:00 to 13:00) on every day.
// Moves inside a draft stay in the browser, so these tests never touch the shared mock database.
const DRAFT = {
  items: [1, 2, 3, 4, 5].flatMap((day) => [
    { id: `mv-${day}-a`, day, startTime: '09:00', endTime: '10:00', title: `E2E Day ${day} keynote`, description: 'Mocked', location: 'Main Hall', category: 'keynote', costEstimate: 500 },
    { id: `mv-${day}-b`, day, startTime: '12:00', endTime: '13:00', title: `E2E Day ${day} meal`, description: 'Mocked', location: 'Terrace', category: 'meal', costEstimate: 500 },
  ]),
};

async function openFiveDayDraft(page: Page) {
  await page.context().addCookies([sessionCookie(plannerSession)]);
  await page.route('**/api/ai/generate-schedule', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DRAFT) }),
  );
  await page.goto('/planner');
  await page.getByLabel('Describe the offsite you want to plan').fill('5-day retreat in Lisbon');
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await expect(page.getByRole('navigation', { name: 'Jump to day' })).toBeVisible();
  // Bring the jump bar and the cards under it into view together: a drag needs both on screen.
  await page.locator('#itinerary').evaluate((section) => section.scrollIntoView());
}

const dayButton = (page: Page, day: number) =>
  page.getByRole('navigation', { name: 'Jump to day' }).getByRole('button', { name: `Day ${day}`, exact: true });

const handle = (page: Page, title: string) => page.getByRole('button', { name: `Drag ${title} to reorder or move` });

async function dragOnto(page: Page, title: string, day: number) {
  const from = await handle(page, title).boundingBox();
  const to = await dayButton(page, day).boundingBox();
  if (!from || !to) throw new Error('Missing drag handle or Day button');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2 + 12, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  // The button shows it is a target before the drop.
  await expect(page.getByText(`Drop to add to end of Day ${day}`)).toBeVisible();
  await page.mouse.up();
}

const column = (page: Page, day: number) => page.getByRole('group', { name: `Day ${day}`, exact: true });
// The confirmation of a move; other toasts (e.g. "Draft itinerary ready") may be on screen too.
const toast = (page: Page) => page.getByTestId('toast').filter({ hasText: 'Moved' });

test('dropping a session on a Day button moves it, and Undo puts everything back', async ({ page }) => {
  await openFiveDayDraft(page);
  await expect(column(page, 1).getByRole('heading', { level: 3, name: 'E2E Day 1 keynote' })).toBeVisible();

  await dragOnto(page, 'E2E Day 1 keynote', 5);

  // Day 5 is on another page, so the board stays put and the toast offers the jump.
  await expect(toast(page)).toContainText('Moved E2E Day 1 keynote to Day 5 · 11:30 – 12:30');
  await expect(toast(page).getByRole('button', { name: 'View Day 5' })).toBeVisible();
  await expect(page.getByText('Days 1–3 of 5')).toBeVisible();
  await expect(column(page, 1).getByRole('heading', { level: 3, name: 'E2E Day 1 keynote' })).toHaveCount(0);

  await toast(page).getByRole('button', { name: 'Undo' }).click();
  const back = column(page, 1).getByTestId('schedule-card').filter({ hasText: 'E2E Day 1 keynote' });
  await expect(back).toContainText('09:00 – 10:00');
  await expect(page.getByTestId('toast').filter({ hasText: 'Move undone.' })).toBeVisible();

  // Day 5 gets its own times back too, which moving the session back by hand would not do.
  await page.getByRole('button', { name: 'Show next days', exact: true }).click();
  await expect(column(page, 5).getByTestId('schedule-card').filter({ hasText: 'E2E Day 5 meal' })).toContainText('12:00 – 13:00');
});

test('"View Day 5" in the toast turns the page to the day the session went to', async ({ page }) => {
  await openFiveDayDraft(page);
  await dragOnto(page, 'E2E Day 2 meal', 5);
  await toast(page).getByRole('button', { name: 'View Day 5' }).click();
  await expect(page.getByText('Days 4–5 of 5')).toBeVisible();
  await expect(column(page, 5).getByRole('heading', { level: 3, name: 'E2E Day 2 meal' })).toBeVisible();
});

test('a keyboard drag Tabs along the Day buttons and drops with Space', async ({ page }) => {
  await openFiveDayDraft(page);
  await handle(page, 'E2E Day 1 keynote').focus();
  await page.keyboard.press('Space');

  await page.keyboard.press('Tab');
  await expect(dayButton(page, 2)).toBeFocused();
  await expect(page.getByText('Drop to add to end of Day 2')).toBeVisible();
  await expect(page.getByText('Over Day 2. Drop to add E2E Day 1 keynote to the end of Day 2')).toBeAttached();

  for (let i = 0; i < 3; i += 1) await page.keyboard.press('Tab');
  await expect(dayButton(page, 5)).toBeFocused();
  await page.keyboard.press('Space');

  await expect(toast(page)).toContainText('Moved E2E Day 1 keynote to Day 5');
  await expect(page.getByText('Days 1–3 of 5')).toBeVisible();
});

test('Escape cancels a keyboard drag without moving anything', async ({ page }) => {
  await openFiveDayDraft(page);
  await handle(page, 'E2E Day 1 keynote').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(column(page, 1).getByRole('heading', { level: 3, name: 'E2E Day 1 keynote' })).toBeVisible();
  await expect(toast(page).filter({ hasText: 'Moved' })).toHaveCount(0);
});

test('the "Move to another day" select sends a session to any day in one step', async ({ page }) => {
  await openFiveDayDraft(page);
  await page.getByRole('combobox', { name: 'Move E2E Day 1 meal to another day' }).selectOption('4');
  await expect(toast(page)).toContainText('Moved E2E Day 1 meal to Day 4');
  await expect(toast(page).getByRole('button', { name: 'View Day 4' })).toBeVisible();
});

test('the timing endpoint refuses sessions that do not exist and anything but day and times', async ({ page }) => {
  await page.context().addCookies([sessionCookie(plannerSession)]);
  const put = (items: unknown[]) => page.request.put('/api/schedule/timing', { data: { items } });
  const entry = { id: 'no-such-session', day: 1, startTime: '09:00', endTime: '10:00' };

  expect((await put([entry])).status()).toBe(422);
  expect((await put([{ ...entry, title: 'sneaky' }])).status()).toBe(400);
  expect((await put([{ ...entry, startTime: '11:00' }])).status()).toBe(400);
  expect((await put([])).status()).toBe(400);
});

// Names every button, link and select that sticks out of its session card.
async function controlsOutsideTheirCard(page: Page): Promise<string[]> {
  return page.getByTestId('schedule-card').evaluateAll((cards) => {
    const out: string[] = [];
    for (const card of cards) {
      const box = card.getBoundingClientRect();
      for (const control of card.querySelectorAll('button, a, select')) {
        const rect = control.getBoundingClientRect();
        if (rect.width === 0) continue;
        if (rect.left < box.left - 0.5 || rect.right > box.right + 0.5) {
          out.push(control.getAttribute('aria-label') ?? control.textContent?.trim() ?? control.tagName);
        }
      }
    }
    return out;
  });
}

test('on a saved itinerary no card control sticks out of its card, even in narrow columns', async ({ page }) => {
  await page.context().addCookies([sessionCookie(plannerSession)]);
  await page.goto('/planner');
  await expect(page.getByTestId('schedule-card').first()).toBeVisible();
  // Saved sessions carry the Code button, so this is the widest footer a card gets.
  await expect(page.getByRole('link', { name: /^Show check-in code for/ }).first()).toBeVisible();

  for (const width of [1100, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await controlsOutsideTheirCard(page), `controls outside their card at ${width}px`).toEqual([]);
  }
});

test('on a paged draft, with the day select, no card control sticks out of its card', async ({ page }) => {
  await openFiveDayDraft(page);
  await expect(page.getByRole('combobox', { name: /^Move .+ to another day$/ }).first()).toBeVisible();

  for (const width of [1100, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await controlsOutsideTheirCard(page), `controls outside their card at ${width}px`).toEqual([]);
  }
  await page.getByRole('button', { name: 'Show next days', exact: true }).click();
  expect(await controlsOutsideTheirCard(page), 'controls outside their card on page 2').toEqual([]);
});
