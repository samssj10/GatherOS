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
