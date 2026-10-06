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
