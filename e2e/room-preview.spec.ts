import { expect, test } from '@playwright/test';
import { attendeeSession, plannerSession, sessionCookie } from './helpers/session';

// The server clock is pinned (see helpers/env.ts): the Opening Keynote (sch-001) is live, everything else upcoming.

const PHONE = { width: 390, height: 844 };

test.describe('the Code link on the planner board', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([sessionCookie(plannerSession)]);
    await page.goto('/planner');
    await expect(page.getByTestId('schedule-card').first()).toBeVisible();
  });

  test('is on the live session only', async ({ page }) => {
    const links = page.getByRole('link', { name: /^Show check-in code for/ });
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAccessibleName('Show check-in code for Opening Keynote');
    await expect(links).toContainText('Live · Code');
  });

  test('is not in the card footer: the price and arrows are the whole footer', async ({ page }) => {
    const card = page.getByTestId('schedule-card').filter({ hasText: 'Opening Keynote' });
    await expect(card.getByRole('link', { name: /check-in code/ })).toBeVisible();
    const footerHasLink = await card.evaluate((el) => {
      const price = [...el.querySelectorAll('span')].find((span) => /^\$[\d,]+$/.test(span.textContent ?? ''));
      return price?.parentElement?.querySelector('a') !== null;
    });
    expect(footerHasLink).toBe(false);
  });
});

test.describe('a room screen for a session that is not live', () => {
  test('still says it is not live yet, and shows no sample', async ({ page }) => {
    await page.context().addCookies([sessionCookie(plannerSession)]);
    await page.goto('/planner/sessions/sch-002/code');
    await expect(page.getByRole('status')).toContainText('Not live yet');
    await expect(page.getByText('PREVIEW')).toHaveCount(0);
    await expect(page.getByText('SAMPLE', { exact: true })).toHaveCount(0);
  });
});

test.describe('previewing the room screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([sessionCookie(plannerSession)]);
  });

  test('opens from the itinerary header and exits back to the dashboard', async ({ page }) => {
    await page.goto('/planner');
    await page.getByRole('link', { name: 'Preview room screens' }).click();
    await expect(page).toHaveURL(/\/planner\/room-preview/);
    await expect(page.getByRole('heading', { level: 1, name: 'Opening Keynote' })).toBeVisible();
    await page.getByRole('link', { name: 'Exit preview' }).click();
    await expect(page).toHaveURL(/\/planner$/);
  });

  test('shows a sample code and a SAMPLE QR, and never asks the server for a real code', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/checkin-code')) requested.push(request.url());
    });
    await page.goto('/planner/room-preview');
    const banner = page.getByRole('region', { name: 'Preview' });
    await expect(banner).toContainText("Check-ins don't count");
    await expect(banner).toContainText('Session 1 of 7');
    await expect(page.getByLabel(/^Sample code /)).toHaveText('TEST42');
    await expect(page.getByText('SAMPLE', { exact: true })).toBeVisible();
    await expect(page.getByText('Sample code. The real one appears when the session starts.')).toBeVisible();
    await expect(page.getByText('Shown in Grand Ballroom')).toBeVisible();
    await expect(page.getByText(/New code in/)).toHaveCount(0);
    expect(requested).toEqual([]);
  });

  test('steps through the sessions in order and stops at the ends', async ({ page }) => {
    await page.goto('/planner/room-preview');
    const banner = page.getByRole('region', { name: 'Preview' });
    const previous = banner.getByRole('button', { name: 'Previous session' });
    const next = banner.getByRole('button', { name: 'Next session' });
    await expect(previous).toBeDisabled();

    await next.click();
    await expect(banner).toContainText('Session 2 of 7');
    await expect(page.getByRole('heading', { level: 1, name: 'Cross-Team Strategy Workshop' })).toBeVisible();
    await expect(page).toHaveURL(/stop=2/);

    await previous.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Opening Keynote' })).toBeVisible();

    await page.goto('/planner/room-preview?stop=7');
    await expect(banner).toContainText('Session 7 of 7');
    await expect(next).toBeDisabled();
  });

  test('is planner only', async ({ page, context }) => {
    await context.clearCookies();
    await context.addCookies([sessionCookie(attendeeSession)]);
    await page.goto('/planner/room-preview');
    await expect(page).not.toHaveURL(/room-preview/);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

    test('fits the screen', async ({ page }) => {
      await page.goto('/planner/room-preview');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(fits).toBe(true);
      for (const button of await page.getByRole('region', { name: 'Preview' }).getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
      }
    });
  });
});

test.describe('the session status endpoint', () => {
  test('tells the planner which sessions are live, and nobody else', async ({ page, context }) => {
    await context.addCookies([sessionCookie(plannerSession)]);
    const asPlanner = await page.request.get('/api/schedule/status');
    expect(asPlanner.status()).toBe(200);
    const statuses = (await asPlanner.json()) as Record<string, string>;
    expect(statuses['sch-001']).toBe('live');
    expect(statuses['sch-002']).toBe('upcoming');

    await context.clearCookies();
    await context.addCookies([sessionCookie(attendeeSession)]);
    expect((await page.request.get('/api/schedule/status')).status()).toBe(403);
  });
});
