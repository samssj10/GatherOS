import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { plannerSession, secondAttendee, sessionCookie, thirdAttendee } from './helpers/session';

// The server clock is pinned (see helpers/env.ts): the Opening Keynote is live, everything else upcoming.

/** Opens the planner's room display for the Opening Keynote and returns the code on screen. */
async function readRoomCode(page: Page): Promise<string> {
  await page.context().addCookies([sessionCookie(plannerSession)]);
  await page.goto('/planner');
  await page.getByRole('link', { name: 'Show check-in code for Opening Keynote' }).click();

  await expect(page).toHaveURL(/\/planner\/sessions\/sch-001\/code$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Opening Keynote' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'QR code for checking in to Opening Keynote' })).toBeVisible();
  await expect(page.getByText(/New code in \d:\d\d/)).toBeVisible();
  // The room display has no sidebar: it is meant to be projected.
  await expect(page.getByRole('navigation', { name: 'Planner' })).toHaveCount(0);

  const code = ((await page.getByLabel(/^Code /).textContent()) ?? '').trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  return code;
}

test('a planner shows the room code and an attendee checks in with it on desktop', async ({ page, context }) => {
  const code = await readRoomCode(page);

  await context.clearCookies();
  await context.addCookies([sessionCookie(secondAttendee)]);
  await page.goto('/attendee/schedule');
  await expect(page.getByRole('heading', { level: 1, name: 'Your journey' })).toBeVisible();

  // Later sessions are locked until they start; the live one takes a code.
  await expect(page.getByText('Check-in opens at 10:15 on Day 1')).toBeVisible();
  await expect(page.getByText('Happening now · check-in open')).toBeVisible();
  const field = page.getByLabel(/Enter the 6-character code on the screen in Grand Ballroom/);

  // A wrong code is refused with the server's explanation and nothing is stamped.
  await field.fill('zzzzzz');
  await page.getByRole('button', { name: 'Check in to Opening Keynote' }).click();
  await expect(page.getByRole('alert').filter({ hasText: "That code doesn't match" })).toBeVisible();
  await expect(page.getByText('Stamp collected')).toHaveCount(0);

  // The right code (any case) collects the stamp.
  await field.fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Check in to Opening Keynote' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Stamp collected · Front Row 1 of 2' })).toBeVisible();
  await expect(page.getByText('1 / 7')).toBeVisible();
  await expect(field).toHaveCount(0);

  // The planner's checked-in count follows.
  await context.clearCookies();
  await context.addCookies([sessionCookie(plannerSession)]);
  const info = await page.request.get('/api/schedule/sch-001/checkin-code');
  expect((await info.json()).checkedIn).toBe(1);
});

test('on a phone the check-in page falls back to typing the code when there is no camera', async ({ page, context }) => {
  const code = await readRoomCode(page);

  await context.clearCookies();
  await context.addCookies([sessionCookie(thirdAttendee)]);
  await page.setViewportSize({ width: 390, height: 844 });
  // No camera in the test browser: refuse access the way a blocked permission would.
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('blocked', 'NotAllowedError'));
  });

  // The journey offers the scan link while the session is live...
  await page.goto('/attendee/schedule');
  await expect(page.getByText('Happening now · check-in open')).toBeVisible();
  await page.getByRole('link', { name: /Scan code to check in/ }).click();

  // ...and the check-in page explains the camera is unavailable and takes the code by hand.
  await expect(page).toHaveURL(/\/attendee\/check-in\?session=sch-001$/);
  await expect(page.getByText('Camera access is blocked, so enter the code instead.')).toBeVisible();
  await page.getByLabel('Enter the room code').fill(code);
  await page.getByRole('button', { name: 'Check in' }).click();

  await expect(page.getByRole('heading', { name: 'Stamp collected' })).toBeVisible();
  await expect(page.getByText('Front Row badge · 1 of 2 keynotes')).toBeVisible();
  // The header arrow and the big button both go back: use the button.
  await page.getByRole('link', { name: 'Back to journey' }).last().click();
  await expect(page).toHaveURL(/\/attendee\/schedule$/);
});
