import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, CLIENT_PORT, EVENT_NOW, EVENT_START_DATE, SERVER_PORT, SESSION_SECRET } from './helpers/env';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  // One journey against one in-memory mock database: no parallelism.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [['github'], ['html', { open: 'never', outputFolder: path.resolve(__dirname, 'playwright-report') }]]
    : [['list']],
  outputDir: './test-results',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // The suite boots its own BFF and Vite client so it is self-contained.
  webServer: [
    {
      command: 'npx tsx src/index.ts',
      cwd: path.resolve(__dirname, '../server'),
      url: `http://localhost:${SERVER_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'test',
        PORT: String(SERVER_PORT),
        LOG_LEVEL: 'silent',
        SESSION_SECRET,
        EVENT_START_DATE,
        EVENT_NOW,
        // Blank on purpose: the AI call is mocked in the browser, and a real key must never be spent by a test.
        ANTHROPIC_API_KEY: '',
      },
    },
    {
      command: `npx vite --port ${CLIENT_PORT} --strictPort`,
      cwd: path.resolve(__dirname, '../client'),
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        VITE_API_PROXY_TARGET: `http://localhost:${SERVER_PORT}`,
      },
    },
  ],
});
