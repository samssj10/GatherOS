import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { attendeeSession, plannerSession, sessionCookie } from './helpers/session';

// The sign-out icon in the design is an arrow leaving a bracket, the same on every screen that has one.
const SIGN_OUT_PATH = 'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 17l5-5-5-5M21 12H9';

const iconPath = (control: Locator) => control.locator('svg path').first().getAttribute('d');

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 1000 };

test.describe('the sign-out icon', () => {
  test('is the design arrow in the planner sidebar', async ({ page }) => {
    await page.context().addCookies([sessionCookie(plannerSession)]);
    await page.setViewportSize(DESKTOP);
    await page.goto('/planner');
    const button = page.getByRole('complementary').getByRole('button', { name: 'Sign out' });
    await expect(button).toBeVisible();
    expect(await iconPath(button)).toBe(SIGN_OUT_PATH);
  });

  test('is the design arrow in the planner phone menu', async ({ page }) => {
    await page.context().addCookies([sessionCookie(plannerSession)]);
    await page.setViewportSize(PHONE);
    await page.goto('/planner');
    await page.getByRole('button', { name: 'Account menu' }).click();
    const button = page.getByRole('button', { name: 'Sign out' });
    await expect(button).toBeVisible();
    expect(await iconPath(button)).toBe(SIGN_OUT_PATH);
  });

  test('is the design arrow in the attendee top bar on a wide screen', async ({ page }) => {
    await page.context().addCookies([sessionCookie(attendeeSession)]);
    await page.setViewportSize(DESKTOP);
    await page.goto('/attendee');
    const button = page.getByRole('banner').getByRole('button', { name: 'Sign out' });
    await expect(button).toBeVisible();
    expect(await iconPath(button)).toBe(SIGN_OUT_PATH);
  });

  test('is the design arrow in the attendee header on a phone', async ({ page }) => {
    await page.context().addCookies([sessionCookie(attendeeSession)]);
    await page.setViewportSize(PHONE);
    await page.goto('/attendee');
    const button = page.getByRole('button', { name: 'Sign out' });
    await expect(button).toBeVisible();
    expect(await iconPath(button)).toBe(SIGN_OUT_PATH);
  });
});
