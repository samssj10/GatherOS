import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { attendeeSession, sessionCookie } from './helpers/session';

// The server clock is pinned (see helpers/env.ts): the Opening Keynote is live. Amara (att-0001) has a flight
// booked; her RSVP is set here, since other specs change it.

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 1000 };

const LIME = 'rgb(198, 244, 50)';
const BRAND_INK = 'rgb(64, 36, 214)';

async function openHome(page: Page, rsvp: 'pending' | 'declined' | 'accepted') {
  await page.context().addCookies([sessionCookie(attendeeSession)]);
  const reset = await page.request.patch(`/api/attendees/${attendeeSession.id}`, { data: { rsvpStatus: rsvp } });
  expect(reset.ok()).toBe(true);
  await page.goto('/attendee');
  await expect(page.getByRole('heading', { level: 1, name: /^Hi, Amara/ })).toBeVisible();
  await expect(page.getByRole('list').getByText('Book your flight')).toBeVisible();
}

const rsvpCard = (page: Page) => page.locator('section#rsvp');
const levelCard = (page: Page) => page.getByRole('region', { name: 'Your level' });
const questRow = (page: Page, label: string) => page.getByRole('listitem').filter({ hasText: label });
const chip = (page: Page, label: string) => questRow(page, label).getByText(/^\+\d+$/);
const colour = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).color);

const top = async (locator: Locator) => (await locator.boundingBox())?.y ?? Number.NaN;

for (const [name, size] of [['phone', PHONE], ['desktop', DESKTOP]] as const) {
  test.describe(`Home on a ${name}`, () => {
    test.use({ viewport: size });

    for (const rsvp of ['pending', 'declined'] as const) {
      test(`asks the RSVP question before showing XP while the answer is ${rsvp}`, async ({ page }) => {
        await openHome(page, rsvp);
        if (name === 'phone') {
          expect(await top(rsvpCard(page))).toBeLessThan(await top(levelCard(page)));
        } else {
          // Two columns: the question is the first thing in the left column, above the level card.
          expect(await top(rsvpCard(page))).toBeLessThan(await top(levelCard(page)));
        }
      });
    }

    test('moves the RSVP card below the level card once the attendee is going', async ({ page }) => {
      await openHome(page, 'accepted');
      expect(await top(rsvpCard(page))).toBeGreaterThan(await top(levelCard(page)));
    });

    test('draws earned XP in lime on black, open XP plain and waiting XP light violet', async ({ page }) => {
      await openHome(page, 'declined');
      // Earned: the flight, in lime.
      expect(await colour(chip(page, 'Book your flight'))).toBe(LIME);
      // Open: the RSVP is something to do now, so it is not lime.
      expect(await colour(chip(page, 'Confirm your RSVP'))).not.toBe(LIME);
      // Waiting: the first check-in waits for the RSVP, in the light violet.
      expect(await colour(chip(page, 'Check in at Opening Keynote'))).toBe(BRAND_INK);
      const open = await chip(page, 'Confirm your RSVP').evaluate((el) => getComputedStyle(el).backgroundColor);
      const waiting = await chip(page, 'Check in at Opening Keynote').evaluate((el) => getComputedStyle(el).backgroundColor);
      const earned = await chip(page, 'Book your flight').evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(new Set([open, waiting, earned]).size).toBe(3);
    });

    test('opens the check-in quest once the attendee is going, and it is no longer light violet', async ({ page }) => {
      await openHome(page, 'accepted');
      await expect(questRow(page, 'Check in at Opening Keynote')).toContainText('Happening now');
      expect(await colour(chip(page, 'Check in at Opening Keynote'))).not.toBe(BRAND_INK);
      expect(await colour(chip(page, 'Check in at Opening Keynote'))).not.toBe(LIME);
      expect(await colour(chip(page, 'Confirm your RSVP'))).toBe(LIME);
    });

    test('has no separate View button on the check-in quest', async ({ page }) => {
      await openHome(page, 'accepted');
      await expect(questRow(page, 'Check in at Opening Keynote').getByRole('link')).toHaveCount(1);
      await expect(page.getByRole('link', { name: 'View', exact: true })).toHaveCount(0);
    });

    test('says where to answer the RSVP, for this screen', async ({ page }) => {
      await openHome(page, 'pending');
      const row = questRow(page, 'Confirm your RSVP');
      await expect(row).toContainText(name === 'phone' ? 'Answer at the top of this page' : 'Answer on the left');
      // Only one of the two lines is on screen.
      await expect(row.getByText(name === 'phone' ? 'Answer on the left' : 'Answer at the top of this page')).toBeHidden();
    });
  });
}

test.describe('the quest rows are links to where each quest is done', () => {
  test.use({ viewport: DESKTOP });

  test('an open RSVP quest jumps to the RSVP card', async ({ page }) => {
    await openHome(page, 'pending');
    await questRow(page, 'Confirm your RSVP').getByRole('link').click();
    await expect(page).toHaveURL(/\/attendee#rsvp$/);
  });

  test('an open dietary quest goes to Dietary, and earned or waiting quests are not links', async ({ page }) => {
    await openHome(page, 'declined');
    const dietary = questRow(page, 'Set dietary preference');
    if ((await dietary.getByRole('link').count()) > 0) {
      await dietary.getByRole('link').click();
      await expect(page).toHaveURL(/\/attendee\/preferences$/);
    }
    await page.goto('/attendee');
    await expect(questRow(page, 'Book your flight').getByRole('link')).toHaveCount(0);
    await expect(questRow(page, 'Check in at Opening Keynote').getByRole('link')).toHaveCount(0);
  });

  test('says "Opens 09:00 on Day 1" style wording, without "at"', async ({ page }) => {
    await openHome(page, 'accepted');
    await expect(page.getByText(/Opens at \d\d:\d\d/)).toHaveCount(0);
  });
});
