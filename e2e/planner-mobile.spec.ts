import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { plannerSession, sessionCookie } from './helpers/session';

// The planner on a phone and a tablet: a slim top bar and a bottom tab bar replace the sidebar, which
// is still what a wide screen gets.
const PHONE = { width: 390, height: 844 };
const TABLET = { width: 820, height: 1100 };
const DESKTOP = { width: 1440, height: 1000 };

async function open(page: Page, path = '/planner') {
  await page.context().addCookies([sessionCookie(plannerSession)]);
  await page.goto(path);
  await expect(page.locator('main h1')).toBeVisible();
}

const tabBar = (page: Page) => page.getByRole('navigation', { name: 'Planner' });
const accountMenu = (page: Page) => page.getByRole('button', { name: 'Account menu' });
const hostRank = (page: Page) => page.getByRole('region', { name: 'Host rank' });

/** True when nothing on the page sticks out past the right edge of the screen. */
const fitsAcross = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const [name, size] of [['phone', PHONE], ['tablet', TABLET]] as const) {
  test.describe(`the planner on a ${name}`, () => {
    test.use({ viewport: size, hasTouch: true, isMobile: true });

    test('has a top bar and a bottom tab bar, and no sidebar', async ({ page }) => {
      await open(page);
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(accountMenu(page)).toBeVisible();
      // Only the tab bar is on screen: the sidebar with the same name is hidden.
      await expect(tabBar(page)).toHaveCount(1);
      await expect(tabBar(page).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
      await expect(tabBar(page).getByRole('link', { name: /^Attendees/ })).toBeVisible();
      await expect(page.getByRole('complementary')).toHaveCount(0);
    });

    test('moves between the pages with the tab bar and shows the pending count', async ({ page }) => {
      await open(page);
      await expect(tabBar(page).getByText('900 pending responses')).toBeAttached();
      await tabBar(page).getByRole('link', { name: /^Attendees/ }).click();
      await expect(page).toHaveURL(/\/planner\/attendees$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Attendees' })).toBeVisible();
      await expect(tabBar(page).getByRole('link', { name: /^Attendees/ })).toHaveAttribute('aria-current', 'page');
      await tabBar(page).getByRole('link', { name: 'Dashboard' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Mission control' })).toBeVisible();
    });

    test('shows the host rank in the page, on the dashboard only', async ({ page }) => {
      await open(page);
      await expect(hostRank(page)).toBeVisible();
      await tabBar(page).getByRole('link', { name: /^Attendees/ }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Attendees' })).toBeVisible();
      await expect(hostRank(page)).toHaveCount(0);
    });

    test('keeps the last of the page clear of the tab bar', async ({ page }) => {
      await open(page);
      // Wait for the itinerary, the last thing on the page, so the page has its full height.
      await expect(page.getByTestId('schedule-card').first()).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const bar = await tabBar(page).boundingBox();
      const lastCard = await page.getByTestId('schedule-card').last().boundingBox();
      if (!bar || !lastCard) throw new Error('Missing the tab bar or the last card');
      const gap = bar.y - (lastCard.y + lastCard.height);
      // The last card ends above the top of the bar, so nothing is hidden behind it.
      expect(gap).toBeGreaterThanOrEqual(0);
    });

    test('fits across the screen on every planner page', async ({ page }) => {
      await open(page);
      expect(await fitsAcross(page)).toBe(true);
      await open(page, '/planner/attendees');
      expect(await fitsAcross(page)).toBe(true);
    });

    test('has an account menu that opens, closes and signs out', async ({ page }) => {
      await open(page);
      await expect(accountMenu(page)).toHaveAttribute('aria-expanded', 'false');
      const email = page.getByRole('banner').getByText(plannerSession.email);
      await accountMenu(page).click();
      await expect(accountMenu(page)).toHaveAttribute('aria-expanded', 'true');
      await expect(email).toBeVisible();

      // Escape closes it and gives focus back to its button.
      await page.keyboard.press('Escape');
      await expect(email).toHaveCount(0);
      await expect(accountMenu(page)).toBeFocused();

      // A tap elsewhere closes it too.
      await accountMenu(page).click();
      await expect(email).toBeVisible();
      await page.locator('main h1').click({ force: true });
      await expect(email).toHaveCount(0);

      await accountMenu(page).click();
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(/\/login$/);
    });
  });
}

test.describe('the planner on a wide screen', () => {
  test.use({ viewport: DESKTOP });

  test('keeps the sidebar, with the host rank, and has no phone bars', async ({ page }) => {
    await open(page);
    await expect(page.getByRole('complementary')).toBeVisible();
    await expect(tabBar(page)).toHaveCount(1);
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(accountMenu(page)).toHaveCount(0);
    // Exactly one host rank card: the one in the sidebar.
    await expect(hostRank(page)).toHaveCount(1);
    await expect(page.getByRole('complementary').getByRole('region', { name: 'Host rank' })).toBeVisible();
  });
});

/**
 * Pairs of visible text pieces that are drawn on top of each other inside `scope`. It measures the text
 * as drawn (a number wider than its cell spills out of the cell's box, which a box check would miss).
 */
async function overlappingText(page: Page, scope: string): Promise<string[]> {
  return page.locator(scope).first().evaluate((root) => {
    const drawn = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect();
    };
    const leaves = Array.from(root.querySelectorAll('*')).filter((element) => {
      const rect = drawn(element);
      return (
        element.childElementCount === 0 &&
        (element.textContent ?? '').trim() !== '' &&
        rect.width > 2 &&
        rect.height > 2 &&
        getComputedStyle(element).visibility !== 'hidden' &&
        !element.closest('[aria-hidden="true"]') &&
        !element.closest('.sr-only')
      );
    });
    const clashes: string[] = [];
    for (let i = 0; i < leaves.length; i += 1) {
      for (let j = i + 1; j < leaves.length; j += 1) {
        const first = drawn(leaves[i]);
        const second = drawn(leaves[j]);
        const overlaps =
          first.left < second.right - 1 && second.left < first.right - 1 && first.top < second.bottom - 1 && second.top < first.bottom - 1;
        if (overlaps) clashes.push(`"${leaves[i].textContent?.trim()}" over "${leaves[j].textContent?.trim()}"`);
      }
    }
    return clashes.slice(0, 5);
  });
}

const budgetNumbers = (page: Page) => page.getByRole('region', { name: 'Budget' }).locator('dd');

for (const [name, size, columns] of [['phone', PHONE, 1], ['tablet', TABLET, 3], ['wide screen', DESKTOP, 3]] as const) {
  test.describe(`the dashboard on a ${name}`, () => {
    test.use({ viewport: size, hasTouch: size.width < 1024, isMobile: size.width < 1024 });

    test('has no text drawn over other text', async ({ page }) => {
      await open(page);
      await expect(page.getByRole('region', { name: 'Budget' })).toBeVisible();
      expect(await overlappingText(page, 'main')).toEqual([]);
    });

    test(`lays the three budget figures out in ${columns === 1 ? 'a column' : 'a row'}`, async ({ page }) => {
      await open(page);
      const budget = page.getByRole('region', { name: 'Budget' });
      const gridColumns = await budget.locator('dl').evaluate((dl) => getComputedStyle(dl).gridTemplateColumns.split(' ').length);
      expect(gridColumns).toBe(columns);
      // Every figure sits inside the screen.
      const rights = await budgetNumbers(page).evaluateAll((all) => all.map((dd) => dd.getBoundingClientRect().right));
      expect(rights).toHaveLength(3);
      for (const right of rights) expect(right).toBeLessThanOrEqual(size.width);
    });
  });
}

test.describe('the AI bar and page padding on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test('scrolls away with the page instead of covering it', async ({ page }) => {
    await open(page);
    const position = await page.locator('header').filter({ has: page.getByRole('search') }).evaluate((el) => getComputedStyle(el).position);
    expect(position).not.toBe('sticky');
    await page.evaluate(() => window.scrollTo(0, 600));
    const top = await page.locator('header').filter({ has: page.getByRole('search') }).evaluate((el) => el.getBoundingClientRect().bottom);
    expect(top).toBeLessThan(0);
  });

  test('stacks its options one to a row, each as wide as the screen allows', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Generation options' }).click();
    const widths = await page.locator('#ai-options input, #ai-options select').evaluateAll((all) => all.map((el) => Math.round(el.getBoundingClientRect().width)));
    expect(widths).toHaveLength(3);
    for (const width of widths) expect(width).toBeGreaterThan(300);
    expect(new Set(widths).size).toBe(1);
  });

  test('uses a short prompt hint that fits, and a Generate button that fills the row', async ({ page }) => {
    await open(page);
    const placeholder = await page.getByLabel('Describe the offsite you want to plan').getAttribute('placeholder');
    expect(placeholder).toBe('Describe your offsite, e.g. 3 days in Lisbon');
    const generate = await page.getByRole('button', { name: 'Generate draft' }).boundingBox();
    expect(generate?.width ?? 0).toBeGreaterThan(200);
  });

  test('keeps a 16px margin at the sides of the page', async ({ page }) => {
    await open(page);
    const left = await page.getByRole('region', { name: 'Budget' }).evaluate((el) => el.getBoundingClientRect().left);
    expect(left).toBe(16);
  });
});

test.describe('the AI bar and page padding on a wide screen', () => {
  test.use({ viewport: DESKTOP });

  test('still sticks to the top and keeps its 32px margin', async ({ page }) => {
    await open(page);
    const header = page.locator('header').filter({ has: page.getByRole('search') });
    expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
    expect(await page.getByRole('region', { name: 'Budget' }).evaluate((el) => el.getBoundingClientRect().left)).toBe(276 + 32);
    expect(await page.getByLabel('Describe the offsite you want to plan').getAttribute('placeholder')).toContain('3-day team retreat');
  });
});

// ---- the itinerary board: one day at a time on a phone, two on a tablet, three on a wide screen ----

function draftFor(days: number) {
  const slots = [
    ['a', '09:00', '10:00', 'keynote'],
    ['b', '12:00', '13:00', 'meal'],
    ['c', '14:00', '16:00', 'activity'],
  ] as const;
  return {
    items: Array.from({ length: days }, (_, index) => index + 1).flatMap((day) =>
      slots.map(([key, startTime, endTime, category]) => ({
        id: `pm-${day}-${key}`,
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
  await expect(page.getByRole('navigation', { name: 'Jump to day' })).toBeVisible();
  await page.locator('#itinerary').evaluate((section) => section.scrollIntoView());
}

const dayColumns = (page: Page) => page.getByRole('group', { name: /^Day \d$/ });
const dayColumn = (page: Page, day: number) => page.getByRole('group', { name: `Day ${day}`, exact: true });
const rangeText = (page: Page, text: string) => page.locator('#itinerary').getByText(text, { exact: true });
const sideStrips = (page: Page) => page.getByRole('button', { name: /^Show (next|previous) days, / });

/** Drags with a finger: touch down, move in small steps, lift. Playwright has no touch drag of its own. */
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const client = await page.context().newCDPSession(page);
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', point?: { x: number; y: number }) =>
    client.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [{ x: point.x, y: point.y }] : [] });
  await send('touchStart', from);
  const steps = 14;
  for (let step = 1; step <= steps; step += 1) {
    await send('touchMove', { x: from.x + ((to.x - from.x) * step) / steps, y: from.y + ((to.y - from.y) * step) / steps });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(250);
  await send('touchEnd');
}

const centre = async (locator: ReturnType<Page['locator']>) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Nothing to point at');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test.describe('the itinerary board on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test('shows one day at a time, with Day buttons and no side strips', async ({ page }) => {
    await openDraft(page, 5);
    await expect(dayColumns(page)).toHaveCount(1);
    await expect(dayColumn(page, 1)).toBeVisible();
    await expect(rangeText(page, 'Day 1 of 5')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Jump to day' }).getByRole('button')).toHaveCount(5);
    await expect(sideStrips(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Show next days', exact: true }).click();
    await expect(rangeText(page, 'Day 2 of 5')).toBeVisible();
    await expect(dayColumn(page, 2)).toBeVisible();
    await expect(dayColumns(page)).toHaveCount(1);

    await page.getByRole('navigation', { name: 'Jump to day' }).getByRole('button', { name: 'Day 5', exact: true }).click();
    await expect(dayColumn(page, 5)).toBeVisible();
  });

  test('also shows the saved three-day itinerary one day at a time', async ({ page }) => {
    await open(page);
    await expect(page.getByTestId('schedule-card').first()).toBeVisible();
    await expect(dayColumns(page)).toHaveCount(1);
    await expect(rangeText(page, 'Day 1 of 3')).toBeVisible();
  });

  test('gives each card full width and touch-sized controls', async ({ page }) => {
    await openDraft(page, 5);
    const card = await page.getByTestId('schedule-card').first().boundingBox();
    expect(card?.width ?? 0).toBeGreaterThan(300);

    const small = await page.locator('#itinerary').evaluate((board) => {
      const found: string[] = [];
      const selector =
        '[data-testid="schedule-card"] button:not([data-testid="drag-handle"]), [data-testid="schedule-card"] select, [data-testid="schedule-card"] a, nav button';
      for (const control of board.querySelectorAll(selector)) {
        const rect = control.getBoundingClientRect();
        if (rect.width > 0 && (rect.width < 43.5 || rect.height < 43.5)) {
          found.push(`${control.getAttribute('aria-label') ?? control.textContent?.trim()} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
      }
      return found;
    });
    expect(small).toEqual([]);
  });

  test('fits the screen, with no text over other text', async ({ page }) => {
    await openDraft(page, 5);
    expect(await fitsAcross(page)).toBe(true);
    expect(await overlappingText(page, '#itinerary')).toEqual([]);
  });

  test('reorders a day when a card is dragged with a finger', async ({ page }) => {
    await openDraft(page, 3);
    const titles = () => dayColumn(page, 1).getByTestId('schedule-card').locator('h3').allTextContents();
    expect(await titles()).toEqual(['E2E Day 1 keynote', 'E2E Day 1 meal', 'E2E Day 1 activity']);

    // Drag the second card up over the first, so the finger stays in the middle of the screen.
    const from = await centre(page.getByRole('button', { name: 'Drag E2E Day 1 meal to reorder or move' }));
    const over = await centre(dayColumn(page, 1).getByTestId('schedule-card').first());
    await touchDrag(page, from, { x: from.x, y: over.y - 20 });

    await expect(page.getByTestId('toast').filter({ hasText: 'Day 1 reordered' })).toBeVisible();
    expect(await titles()).toEqual(['E2E Day 1 meal', 'E2E Day 1 keynote', 'E2E Day 1 activity']);
  });

  test('moves a card to another day when it is dragged onto a Day button with a finger', async ({ page }) => {
    await openDraft(page, 3);
    const from = await centre(page.getByRole('button', { name: 'Drag E2E Day 1 meal to reorder or move' }));
    const to = await centre(page.getByRole('navigation', { name: 'Jump to day' }).getByRole('button', { name: 'Day 3', exact: true }));
    await touchDrag(page, from, to);

    await expect(page.getByTestId('toast').filter({ hasText: 'Moved E2E Day 1 meal to Day 3' })).toBeVisible();
    // The board stays on Day 1, which now has one card fewer.
    await expect(dayColumn(page, 1).getByTestId('schedule-card')).toHaveCount(2);
  });
});

test.describe('the itinerary board on a tablet', () => {
  test.use({ viewport: TABLET, hasTouch: true, isMobile: true });

  test('shows two days at a time, with side strips', async ({ page }) => {
    await openDraft(page, 5);
    await expect(dayColumns(page)).toHaveCount(2);
    await expect(rangeText(page, 'Days 1–2 of 5')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show next days, Days 3–4' })).toBeVisible();
    expect(await fitsAcross(page)).toBe(true);
    expect(await overlappingText(page, '#itinerary')).toEqual([]);
  });
});

test.describe('the itinerary board when the screen changes size', () => {
  test.use({ viewport: DESKTOP });

  test('keeps you on the day you were looking at', async ({ page }) => {
    await openDraft(page, 5);
    await page.getByRole('button', { name: 'Show next days', exact: true }).click();
    await expect(rangeText(page, 'Days 4–5 of 5')).toBeVisible();

    await page.setViewportSize(PHONE);
    await expect(rangeText(page, 'Day 4 of 5')).toBeVisible();
    await expect(dayColumns(page)).toHaveCount(1);

    await page.setViewportSize(DESKTOP);
    await expect(rangeText(page, 'Days 4–5 of 5')).toBeVisible();
  });
});

// ---- the roster: cards on a phone and a tablet, the table on a wide screen ----

const rosterCards = (page: Page) => page.getByTestId('roster-row');
const rosterNames = (page: Page) => rosterCards(page).getByTestId('roster-name').allTextContents();
const showing = (page: Page) => page.getByText(/^Showing /);

async function openRoster(page: Page) {
  await open(page, '/planner/attendees');
  await expect(rosterCards(page).first()).toBeVisible();
}

for (const [name, size] of [['phone', PHONE], ['tablet', TABLET]] as const) {
  test.describe(`the roster on a ${name}`, () => {
    test.use({ viewport: size, hasTouch: true, isMobile: true });

    test('is a list of cards, not a table', async ({ page }) => {
      await openRoster(page);
      await expect(page.getByRole('table')).toHaveCount(0);
      await expect(page.getByRole('list', { name: 'Attendee roster' })).toBeVisible();

      const first = rosterCards(page).first();
      await expect(first.getByTestId('roster-name')).not.toBeEmpty();
      await expect(first).toContainText('@');
      await expect(first).toContainText('RSVP:');
      await expect(first).toContainText('Department:');
      await expect(first).toContainText('Trip ready:');
    });

    test('fits the screen, with no text over other text', async ({ page }) => {
      await openRoster(page);
      expect(await fitsAcross(page)).toBe(true);
      expect(await overlappingText(page, '[role="list"]')).toEqual([]);
    });

    test('keeps only the cards near the screen in the page, however far you scroll', async ({ page }) => {
      await openRoster(page);
      expect(await rosterCards(page).count()).toBeLessThan(60);
      const before = await rosterNames(page);

      await page.evaluate(() => window.scrollTo(0, 60_000));
      await expect.poll(async () => (await rosterNames(page))[0]).not.toBe(before[0]);
      expect(await rosterCards(page).count()).toBeLessThan(60);

      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(async () => (await rosterNames(page))[0]).toBe(before[0]);
    });

    test('raises no browser errors while you scroll, search and filter', async ({ page }) => {
      // Page errors, console errors and the window's own error events (where "ResizeObserver loop" shows up).
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.addInitScript(() => {
        window.addEventListener('error', (event) => {
          (window as unknown as { __errors: string[] }).__errors ??= [];
          (window as unknown as { __errors: string[] }).__errors.push(event.message);
        });
      });
      await openRoster(page);
      await page.evaluate(() => window.scrollTo(0, 20_000));
      await page.getByLabel('Search attendees by name, email or department').fill('a');
      await page.getByRole('button', { name: /^Pending/ }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const windowErrors = await page.evaluate(() => (window as unknown as { __errors?: string[] }).__errors ?? []);
      expect([...errors, ...windowErrors]).toEqual([]);
    });

    test('searches the roster', async ({ page }) => {
      await openRoster(page);
      await page.getByLabel('Search attendees by name, email or department').fill('amara');
      await expect(showing(page)).toContainText('matches for “amara”');
      const names = await rosterNames(page);
      expect(names.length).toBeGreaterThan(0);
      for (const person of names) expect(person.toLowerCase()).toContain('amara');
    });

    test('filters the roster by response', async ({ page }) => {
      await openRoster(page);
      await page.getByRole('button', { name: /^Pending/ }).click();
      await expect(showing(page)).toContainText('of 2,500 attendees');
      await expect(showing(page)).toContainText('Showing 900');
      const pills = await rosterCards(page).evaluateAll((cards) => cards.map((card) => /RSVP: pending/.test(card.textContent ?? '')));
      expect(pills.length).toBeGreaterThan(0);
      expect(pills.every(Boolean)).toBe(true);
    });

    test('has touch-sized controls on every card', async ({ page }) => {
      await openRoster(page);
      await page.getByRole('button', { name: /^Pending/ }).click();
      await expect(showing(page)).toContainText('Showing 900');
      const small = await page.locator('[role="list"]').evaluate((list) => {
        const found: string[] = [];
        for (const control of list.querySelectorAll('button, a')) {
          const rect = control.getBoundingClientRect();
          if (rect.width > 0 && rect.height < 43.5) found.push(`${control.getAttribute('aria-label')} ${Math.round(rect.height)}px`);
        }
        return found;
      });
      expect(small).toEqual([]);
    });
  });
}

test.describe('nudging from a card on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test('nudges one attendee and marks the card', async ({ page }) => {
    await openRoster(page);
    await page.getByRole('button', { name: /^Pending/ }).click();
    await expect(showing(page)).toContainText('Showing 900');
    const nudge = rosterCards(page).first().getByRole('button', { name: /^Nudge / });
    await nudge.tap();
    await expect(rosterCards(page).first().getByRole('button', { name: /^Already nudged / })).toBeDisabled();
    await expect(rosterCards(page).first()).toContainText('Nudged');
  });
});

test.describe('the roster on a wide screen', () => {
  test.use({ viewport: DESKTOP });

  test('is still the table, with its own scrolling rows', async ({ page }) => {
    await openRoster(page);
    await expect(page.getByRole('table', { name: 'Attendee roster' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Attendee roster' })).toHaveCount(0);
    await expect(page.getByTestId('roster-viewport')).toBeVisible();
    expect(await rosterCards(page).count()).toBeLessThan(40);
  });
});
