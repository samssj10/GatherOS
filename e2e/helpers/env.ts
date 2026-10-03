// Isolated ports and a throwaway secret, so the suite never collides with `npm run dev`
// and never needs a real .env file or API key.
export const SERVER_PORT = 3100;
export const CLIENT_PORT = 5273;
export const BASE_URL = `http://localhost:${CLIENT_PORT}`;
export const SESSION_SECRET = 'e2e-only-session-secret-0123456789abcdef';

// Pin the event clock so the Opening Keynote (day 1, 09:00 to 10:00) is live and the rest are upcoming,
// whatever time the suite really runs.
export const EVENT_START_DATE = '2030-06-03';
export const EVENT_NOW = '2030-06-03T09:30:18';
