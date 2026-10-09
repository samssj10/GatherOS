import { expect, test } from '@playwright/test';

// The two demo cards on the sign-in page. Both personas work on a phone and on a wide screen now, so the
// cards no longer claim a device.
for (const [name, size] of [
  ['phone', { width: 390, height: 844 }],
  ['wide screen', { width: 1440, height: 1000 }],
] as const) {
  test.describe(`the sign-in page on a ${name}`, () => {
    test.use({ viewport: size });

    test('offers a planner and an attendee demo, with no device labels', async ({ page }) => {
      await page.goto('/login');
      const planner = page.getByRole('button', { name: /Planner demo/ });
      const attendee = page.getByRole('button', { name: /Attendee demo/ });
      await expect(planner).toBeVisible();
      await expect(attendee).toBeVisible();

      await expect(planner).toContainText('Budget, RSVPs and the itinerary board');
      await expect(attendee).toContainText('RSVP, stamps and badges as Amara');
      for (const card of [planner, attendee]) {
        await expect(card).not.toContainText(/desktop|mobile|phone/i);
      }
    });

    test('fits the screen', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('button', { name: /Planner demo/ })).toBeVisible();
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(fits).toBe(true);
    });

    test('signs in as the planner from the card', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Planner demo/ }).click();
      await page.getByRole('button', { name: /Continue as planner/ }).click();
      await expect(page).toHaveURL(/\/planner$/);
    });
  });
}

test.describe('the stamp strip under the logo on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('sits between the logo and "Welcome back", with seven 26px circles', async ({ page }) => {
    await page.goto('/login');
    const heading = page.getByRole('heading', { level: 1, name: 'Welcome back' });
    await expect(heading).toBeVisible();

    const strip = page.locator('[data-testid="stamp-strip"]:visible');
    await expect(strip).toBeVisible();
    const circles = strip.locator(':scope > span');
    await expect(circles).toHaveCount(7);
    for (const circle of await circles.all()) {
      const box = await circle.boundingBox();
      expect(Math.round(box?.width ?? 0)).toBe(26);
      expect(Math.round(box?.height ?? 0)).toBe(26);
    }

    // The first three are filled violet, blue and orange; the other four are empty with dashed borders.
    const fills = await circles.evaluateAll((all) => all.map((el) => getComputedStyle(el).backgroundColor));
    expect(new Set(fills.slice(0, 3)).size).toBe(3);
    expect(fills.slice(0, 3)).not.toContain('rgba(0, 0, 0, 0)');
    const borders = await circles.evaluateAll((all) => all.map((el) => getComputedStyle(el).borderTopStyle));
    expect(borders.slice(3)).toEqual(['dashed', 'dashed', 'dashed', 'dashed']);

    // Directly under the logo and above the heading.
    const logo = await page.locator('span:visible', { hasText: /^GatherOS$/ }).first().boundingBox();
    const pill = await strip.boundingBox();
    const title = await heading.boundingBox();
    expect(pill!.y).toBeGreaterThan(logo!.y + logo!.height - 1);
    expect(pill!.y + pill!.height).toBeLessThan(title!.y);
  });

  test('is decorative: the logo and strip are hidden from assistive technology, the h1 is the page title', async ({ page }) => {
    await page.goto('/login');
    // The strip and the logo beside it share one hidden block.
    const block = page.locator('div[aria-hidden="true"]').filter({ has: page.locator('[data-testid="stamp-strip"]:visible') });
    await expect(block.first()).toContainText('GatherOS');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome back');
    // Only the Welcome back heading is exposed as a level-1 heading; the logo text is not.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('fits the screen', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="stamp-strip"]:visible')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});

test.describe('the stamp strip on a wide screen', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('is only in the brand panel, at its larger size, not repeated above the form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
    await expect(page.locator('[data-testid="stamp-strip"]:visible')).toHaveCount(1);
    const visibleStrips = await page.locator('[data-testid="stamp-strip"]:visible').count();
    expect(visibleStrips).toBe(1);
  });
});

test.describe('the pages after sign-in', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('start downloading while someone is still on the sign-in page, only for the account they pick', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Planner demo/ })).toBeVisible();
    // Nothing is fetched ahead of a choice.
    expect(requested.some((url) => /PlannerDashboard/.test(url))).toBe(false);

    await page.getByRole('button', { name: /Planner demo/ }).click();
    await expect.poll(() => requested.some((url) => /PlannerDashboard/.test(url))).toBe(true);
    // Signing in has not happened yet, and the other account's pages were not fetched.
    expect(requested.some((url) => /\/api\/auth\/login/.test(url))).toBe(false);
    expect(requested.some((url) => /AttendeeView/.test(url))).toBe(false);

    await page.getByRole('button', { name: /Continue as planner/ }).click();
    await expect(page).toHaveURL(/\/planner$/);
  });
});
