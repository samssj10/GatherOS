import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attendeeSession, sessionCookie } from './helpers/session';

// The server clock is pinned (see helpers/env.ts): the Opening Keynote is live. Amara's RSVP is set here, since
// other specs change it.

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 1000 };

const LIME = 'rgb(198, 244, 50)';

async function openJourney(page: Page, rsvp: 'pending' | 'declined' | 'accepted') {
  await page.context().addCookies([sessionCookie(attendeeSession)]);
  const reset = await page.request.patch(`/api/attendees/${attendeeSession.id}`, { data: { rsvpStatus: rsvp } });
  expect(reset.ok()).toBe(true);
  await page.goto('/attendee/schedule');
  await expect(page.getByRole('heading', { level: 1, name: 'Your journey' })).toBeVisible();
}

const keynote = (page: Page) => page.getByRole('article').filter({ hasText: 'Opening Keynote' });

for (const [name, size] of [['phone', PHONE], ['desktop', DESKTOP]] as const) {
  test.describe(`the Journey on a ${name} for someone who is not going`, () => {
    test.use({ viewport: size });

    for (const rsvp of ['declined', 'pending'] as const) {
      test(`offers "RSVP to check in", not the code, on the live session while the answer is ${rsvp}`, async ({ page }) => {
        await openJourney(page, rsvp);
        const card = keynote(page);
        await expect(card).toContainText('Happening now · check-in for confirmed attendees');
        const link = card.getByRole('link', { name: 'RSVP to check in' });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', '/attendee');
        expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

        // Nothing to type a code into or scan with.
        await expect(card.getByRole('textbox')).toHaveCount(0);
        await expect(card.getByRole('button', { name: /Check in/ })).toHaveCount(0);
        await expect(card.getByText(/Scan code to check in/)).toHaveCount(0);
      });
    }

    test('the "RSVP to check in" link goes to Home', async ({ page }) => {
      await openJourney(page, 'declined');
      await keynote(page).getByRole('link', { name: 'RSVP to check in' }).click();
      await expect(page).toHaveURL(/\/attendee$/);
      await expect(page.getByRole('heading', { level: 1, name: /^Hi, Amara/ })).toBeVisible();
    });
  });
}

test.describe('the Journey for someone who is going', () => {
  test('on a desktop, takes the code in a field whose hint is the quieter grey', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openJourney(page, 'accepted');
    const field = page.getByLabel(/Enter the 6-character code on the screen in Grand Ballroom/);
    await expect(field).toBeEnabled();
    await expect(field).toHaveAttribute('placeholder', 'K7Q2XM');
    const hint = await field.evaluate((el) => getComputedStyle(el, '::placeholder').color);
    expect(hint).toBe('rgb(139, 144, 163)');
    await expect(keynote(page).getByRole('button', { name: /Check in/ })).toBeEnabled();
    await expect(keynote(page).getByRole('link', { name: 'RSVP to check in' })).toHaveCount(0);
  });

  test('on a phone, scans the code', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await openJourney(page, 'accepted');
    await expect(keynote(page).getByRole('link', { name: /Scan code to check in/ })).toBeVisible();
    await expect(keynote(page).getByRole('link', { name: 'RSVP to check in' })).toHaveCount(0);
  });
});

test.describe('the Journey cards on a desktop', () => {
  test.use({ viewport: DESKTOP });

  test('has a light progress card with no lime on XP that is not earned', async ({ page }) => {
    await openJourney(page, 'accepted');
    const card = page.getByRole('region', { name: 'Journey progress' });
    expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
    await expect(card).toContainText('XP still to collect');
    const xp = card.getByText(/^\+\d+$/);
    await expect(xp).toBeVisible();
    expect(await xp.evaluate((el) => getComputedStyle(el).color)).not.toBe(LIME);
    expect(await card.getByText(/^\d+ \/ \d+$/).evaluate((el) => getComputedStyle(el).color)).not.toBe(LIME);
  });

  test('puts the RSVP reminder inside the progress card, in place of the XP, while not going', async ({ page }) => {
    await openJourney(page, 'declined');
    const card = page.getByRole('region', { name: 'Journey progress' });
    await expect(card).toContainText('RSVP to start collecting stamps.');
    await expect(card.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/attendee');
    await expect(card.getByText('XP still to collect')).toHaveCount(0);
  });

  test('shows the XP chip on each stop in grey, and never an "RSVP required" chip', async ({ page }) => {
    await openJourney(page, 'accepted');
    const chips = page.getByText('+25 XP stamp');
    expect(await chips.count()).toBe(7);
    for (const chip of await chips.all()) {
      const { colour, background } = await chip.evaluate((el) => {
        const style = getComputedStyle(el);
        return { colour: style.color, background: style.backgroundColor };
      });
      expect(colour).not.toBe(LIME);
      expect(background).toBe('rgb(243, 244, 248)');
    }
    await expect(page.getByText('RSVP required')).toHaveCount(0);
  });
});

test.describe('the Journey cards on a phone', () => {
  test.use({ viewport: PHONE });

  test('has plain grey stamp chips, no "RSVP required" chips and a plain line for the day\'s XP', async ({ page }) => {
    await openJourney(page, 'accepted');
    const chips = page.getByText('+25 XP stamp');
    expect(await chips.count()).toBeGreaterThan(0);
    for (const chip of await chips.all()) {
      expect(await chip.evaluate((el) => getComputedStyle(el).color)).not.toBe(LIME);
    }
    await expect(page.getByText('RSVP required')).toHaveCount(0);
    await expect(page.getByText(/^Day 1 · up to/)).toContainText('+75 XP in stamps');
  });
});
