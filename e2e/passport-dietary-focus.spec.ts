import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { attendeeSession, plannerSession, sessionCookie } from './helpers/session';
import type { E2ESession } from './helpers/session';

// Amara (att-0001) has a flight booked and, until this suite runs, no dietary choice. Her RSVP is set here, since
// other specs change it. Nothing here picks a dietary option, so her choice stays unset for the specs after it.

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 1000 };

async function signIn(page: Page, session: E2ESession) {
  await page.context().addCookies([sessionCookie(session)]);
}

async function openAsAmara(page: Page, path: string) {
  await signIn(page, attendeeSession);
  const reset = await page.request.patch(`/api/attendees/${attendeeSession.id}`, { data: { rsvpStatus: 'declined' } });
  expect(reset.ok()).toBe(true);
  await page.goto(path);
}

for (const [name, size] of [['phone', PHONE], ['desktop', DESKTOP]] as const) {
  test.describe(`Passport on a ${name}`, () => {
    test.use({ viewport: size });

    test.beforeEach(async ({ page }) => {
      await openAsAmara(page, '/attendee/passport');
      await expect(page.getByRole('heading', { level: 2, name: 'Badges' })).toBeVisible();
    });

    test('has no LOCKED labels, and EARNED only on the one badge she has', async ({ page }) => {
      await expect(page.getByText('LOCKED')).toHaveCount(0);
      await expect(page.getByText('EARNED', { exact: true })).toHaveCount(1);
      await expect(page.getByRole('listitem').filter({ hasText: 'Jet Set' })).toContainText('EARNED');
    });

    test('tells a locked badge what to do and an earned one what was done', async ({ page }) => {
      const badge = (title: string) => page.getByRole('listitem').filter({ has: page.getByText(title, { exact: true }) });
      await expect(badge('Early Responder')).toContainText('Confirm your RSVP');
      await expect(badge('Fuelled Up')).toContainText('Set your dietary preference');
      await expect(badge('Front Row')).toContainText('Stamp every keynote');
      await expect(badge('Sea Legs')).toContainText('Stamp every activity');
      await expect(badge('Full House')).toContainText('Collect all 7 stamps');
      await expect(badge('Jet Set')).toContainText('Booked your flight');
      await expect(page.getByText('Confirmed your RSVP')).toHaveCount(0);
      await expect(page.getByText('Shared your dietary preference')).toHaveCount(0);
    });

    test('says how many teams the race leaves out before her own', async ({ page }) => {
      const race = page.getByRole('region', { name: 'Team race' });
      await expect(race).toContainText('1 more team');
      const positions = await race.getByRole('listitem').evaluateAll((items) =>
        items.map((item) => item.querySelector('span.font-mono')?.textContent?.trim() ?? item.textContent?.trim() ?? ''),
      );
      // 1 to 5, the divider, then her own team at 7.
      expect(positions.slice(0, 5)).toEqual(['1', '2', '3', '4', '5']);
      expect(positions).toHaveLength(7);
      expect(positions[6]).toBe('7');

      const own = race.getByRole('listitem').filter({ hasText: 'your team' });
      await expect(own).toContainText('People Ops');
      expect(await own.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(238, 235, 255)');
    });
  });
}

test.describe('Passport hero on a desktop', () => {
  test.use({ viewport: DESKTOP });

  test('says when the stamps start', async ({ page }) => {
    await openAsAmara(page, '/attendee/passport');
    await expect(page.getByText('Starts on Day 1')).toBeVisible();
    await expect(page.getByText('Check in to collect', { exact: true })).toHaveCount(0);
  });
});

for (const [name, size] of [['phone', PHONE], ['desktop', DESKTOP]] as const) {
  test.describe(`Dietary on a ${name}`, () => {
    test.use({ viewport: size });

    test('has one helper line with an info icon, not a dashed box, and no plus sign', async ({ page }) => {
      await openAsAmara(page, '/attendee/preferences');
      const helper = page.getByText('Pick one to complete this quest and earn 50 XP.');
      await expect(helper).toBeVisible();
      expect(await helper.evaluate((el) => getComputedStyle(el).borderStyle)).not.toBe('dashed');
      await expect(helper.locator('svg')).toHaveCount(1);
      await expect(page.getByText(/earn \+50/)).toHaveCount(0);
      // The tag above the title still shows the reward.
      await expect(page.getByText('QUEST · +50 XP')).toBeVisible();
    });
  });
}

test.describe('the Dietary options', () => {
  test('on a desktop are three across with Gluten-free spanning the row beneath', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openAsAmara(page, '/attendee/preferences');
    await expect(page.locator('label input[type="radio"]')).toHaveCount(4);
    const boxes = await page.locator('label').filter({ has: page.locator('input[type="radio"]') }).evaluateAll((labels) =>
      labels.map((label) => {
        const rect = label.getBoundingClientRect();
        return { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width) };
      }),
    );
    expect(boxes).toHaveLength(4);
    expect(new Set(boxes.slice(0, 3).map((box) => box.top)).size).toBe(1);
    expect(boxes[3]!.top).toBeGreaterThan(boxes[0]!.top);
    expect(boxes[3]!.left).toBe(boxes[0]!.left);
    expect(boxes[3]!.width).toBeGreaterThan(boxes[0]!.width * 2.5);
  });

  test('on a phone stay two by two', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await openAsAmara(page, '/attendee/preferences');
    await expect(page.locator('label input[type="radio"]')).toHaveCount(4);
    const tops = await page.locator('label').filter({ has: page.locator('input[type="radio"]') }).evaluateAll((labels) =>
      labels.map((label) => Math.round(label.getBoundingClientRect().top)),
    );
    expect(tops[0]).toBe(tops[1]);
    expect(tops[2]).toBe(tops[3]);
    expect(tops[2]).toBeGreaterThan(tops[0]!);
  });
});

// ---- focus rings: only for the keyboard ----

const ringOf = (control: Locator) =>
  control.evaluate((el) => ({ visible: el.matches(':focus-visible'), outline: getComputedStyle(el).outlineStyle }));

test.describe('the selected navigation item', () => {
  test('shows no focus ring after a click on the attendee desktop tabs, and a ring for the keyboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openAsAmara(page, '/attendee');
    const nav = page.getByRole('banner').getByRole('navigation');
    for (const tab of ['Journey', 'Passport', 'Dietary']) {
      await nav.getByRole('link', { name: tab }).click();
      const ring = await ringOf(nav.getByRole('link', { name: tab }));
      expect(ring, `${tab} after a click`).toEqual({ visible: false, outline: 'none' });
    }
    await nav.getByRole('link', { name: 'Home' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const keyboard = await ringOf(nav.getByRole('link', { name: 'Home' }));
    expect(keyboard.visible).toBe(true);
    expect(keyboard.outline).not.toBe('none');
  });

  test('shows no focus ring after a tap on the attendee phone tabs', async ({ browser }) => {
    const context = await browser.newContext({ viewport: PHONE, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await openAsAmara(page, '/attendee');
    const tabs = page.getByRole('navigation').last();
    for (const tab of ['Passport', 'Dietary']) {
      await tabs.getByRole('link', { name: tab }).tap();
      const ring = await ringOf(tabs.getByRole('link', { name: tab }));
      expect(ring, `${tab} after a tap`).toEqual({ visible: false, outline: 'none' });
    }
    await context.close();
  });

  test('shows no focus ring after a click on the planner sidebar', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await signIn(page, plannerSession);
    await page.goto('/planner');
    const link = page.getByRole('complementary').getByRole('link', { name: /^Attendees/ });
    await link.click();
    expect(await ringOf(link)).toEqual({ visible: false, outline: 'none' });
  });

  test('shows no focus ring after a tap on the planner phone tab', async ({ browser }) => {
    const context = await browser.newContext({ viewport: PHONE, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await signIn(page, plannerSession);
    await page.goto('/planner');
    const link = page.getByRole('navigation', { name: 'Planner' }).getByRole('link', { name: /^Attendees/ });
    await link.tap();
    expect(await ringOf(link)).toEqual({ visible: false, outline: 'none' });
    await context.close();
  });
});
