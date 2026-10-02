import { expect, test } from '@playwright/test';
import { attendeeSession, plannerSession, sessionCookie } from './helpers/session';

// The valid payload POST /api/ai/generate-schedule returns on success.
const MOCK_AI_RESPONSE = {
  items: [
    { id: 'ai-001', day: 1, startTime: '09:00', endTime: '10:00', title: 'E2E Opening Keynote', description: 'Kickoff', location: 'Main Hall', category: 'keynote', costEstimate: 1500 },
    { id: 'ai-002', day: 1, startTime: '10:15', endTime: '12:00', title: 'E2E Strategy Workshop', description: 'Planning', location: 'Room A', category: 'workshop', costEstimate: 2200 },
    { id: 'ai-003', day: 2, startTime: '12:30', endTime: '13:30', title: 'E2E Team Lunch', description: 'Catered lunch', location: 'Terrace', category: 'meal', costEstimate: 9000 },
    { id: 'ai-004', day: 2, startTime: '15:00', endTime: '17:30', title: 'E2E Harbour Cruise', description: 'Team building', location: 'Marina', category: 'activity', costEstimate: 12000 },
    { id: 'ai-005', day: 3, startTime: '10:00', endTime: '11:00', title: 'E2E Closing Session', description: 'Wrap-up', location: 'Main Hall', category: 'keynote', costEstimate: 1000 },
  ],
};

test('planner generates an AI itinerary, then an attendee RSVPs with optimistic UI', async ({ page, context }) => {
  // 1. Mock authentication: inject the Planner role cookie, skipping the login screen.
  await context.addCookies([sessionCookie(plannerSession)]);

  // 2. Mock the AI provider: intercept the generation request and answer with hardcoded valid JSON.
  await page.route('**/api/ai/generate-schedule', async (route) => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_AI_RESPONSE),
    });
  });

  await page.goto('/planner');
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

  await page.getByLabel('Describe the offsite you want to plan').fill('Three-day engineering offsite in Lisbon with a sailing day');
  await page.getByRole('button', { name: 'Generate' }).click();

  // 3. Verify the planner DOM: the 3-column drag-and-drop grid renders the mocked AI items.
  await expect(page.getByTestId('draft-banner')).toContainText('5 sessions');
  await expect(page.getByRole('group', { name: /^Day [123]$/ })).toHaveCount(3);

  const placement: [number, string[]][] = [
    [1, ['E2E Opening Keynote', 'E2E Strategy Workshop']],
    [2, ['E2E Team Lunch', 'E2E Harbour Cruise']],
    [3, ['E2E Closing Session']],
  ];
  for (const [day, titles] of placement) {
    const column = page.getByRole('group', { name: `Day ${day}` });
    for (const title of titles) {
      await expect(column.getByRole('heading', { level: 3, name: title })).toBeVisible();
    }
  }
  // Every mocked session is draggable.
  await expect(page.getByRole('button', { name: /^Drag .+ to reorder or move$/ })).toHaveCount(5);

  // 4. Persona switch: clear cookies, inject the Attendee role cookie and reload.
  await context.clearCookies();
  await context.addCookies([sessionCookie(attendeeSession)]);
  // Start from a known RSVP state, whatever earlier runs left in the mock database.
  const reset = await page.request.patch(`/api/attendees/${attendeeSession.id}`, { data: { rsvpStatus: 'pending' } });
  expect(reset.ok()).toBe(true);

  await page.reload();
  // The route guard sends the attendee away from the planner area.
  await expect(page).toHaveURL(/\/attendee$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome, Amara' })).toBeVisible();

  // 5. Verify optimistic UI: delay the RSVP request by 500 ms and watch the UI react first.
  let serverResponded = false;
  await page.route(`**/api/attendees/${attendeeSession.id}`, async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.fallback();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await route.fetch();
    serverResponded = true;
    await route.fulfill({ response });
  });

  const accept = page.getByRole('button', { name: 'Accept RSVP' });
  await expect(accept).toHaveAttribute('aria-pressed', 'false');
  await accept.click();

  // The UI has already changed while the request is still being held back...
  await expect(accept).toHaveAttribute('aria-pressed', 'true', { timeout: 400 });
  await expect(page.getByRole('heading', { name: "You're going!" })).toBeVisible();
  expect(serverResponded).toBe(false);
  await expect(page.getByTestId('toast')).toHaveCount(0);

  // ...and the success toast only appears once the server has answered.
  const toast = page.getByTestId('toast');
  await expect(toast).toContainText('RSVP accepted');
  expect(serverResponded).toBe(true);
});
