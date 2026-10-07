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
