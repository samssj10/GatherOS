import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// The app reads its settings when it is first imported, so set them before that happens.
vi.hoisted(() => {
  process.env.PORT = '3999';
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters-long';
  process.env.LOG_LEVEL = 'silent';
});

import { createApp } from './app';

let clientDir: string;
const servers: { close: () => void }[] = [];

/** Starts an app on any free port and returns its address. */
async function start(app: ReturnType<typeof createApp>): Promise<string> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });
}

beforeAll(() => {
  clientDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gatheros-client-'));
  fs.writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><title>GatherOS</title><div id="root"></div>');
  fs.writeFileSync(path.join(clientDir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.mkdirSync(path.join(clientDir, 'assets'));
  fs.writeFileSync(path.join(clientDir, 'assets', 'app-1a2b3c.js'), 'console.log("app")');
});

afterAll(() => {
  for (const server of servers) server.close();
  fs.rmSync(clientDir, { recursive: true, force: true });
});

describe('serving the built client', () => {
  it('sends the single-page app for any page route, so a refresh on /planner works', async () => {
    const base = await start(createApp({ clientDir }));
    for (const route of ['/', '/login', '/planner', '/planner/attendees', '/attendee/schedule', '/planner/sessions/sch-001/code']) {
      const response = await fetch(base + route);
      expect(response.status, route).toBe(200);
      expect(await response.text(), route).toContain('<div id="root">');
    }
  });

  it('never caches the page itself, but caches hashed assets for good', async () => {
    const base = await start(createApp({ clientDir }));
    expect((await fetch(`${base}/planner`)).headers.get('cache-control')).toBe('no-cache');
    const asset = await fetch(`${base}/assets/app-1a2b3c.js`);
    expect(asset.status).toBe(200);
    expect(asset.headers.get('cache-control')).toContain('immutable');
    expect(asset.headers.get('cache-control')).toContain('max-age=31536000');
  });

  it('serves other files in the build, such as the icon', async () => {
    const base = await start(createApp({ clientDir }));
    const icon = await fetch(`${base}/favicon.svg`);
    expect(icon.status).toBe(200);
    expect(icon.headers.get('content-type')).toContain('svg');
  });

  it('does not answer a missing file with the page', async () => {
    const base = await start(createApp({ clientDir }));
    const response = await fetch(`${base}/assets/missing-9z9z9z.js`);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('keeps the API: health works and an unknown API route is still a JSON 404', async () => {
    const base = await start(createApp({ clientDir }));
    const health = await fetch(`${base}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: 'ok' });

    const missing = await fetch(`${base}/api/does-not-exist`);
    expect(missing.status).toBe(404);
    expect(((await missing.json()) as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });

  it('does not run API calls through the page fallback (a POST to a page route is a 404)', async () => {
    const base = await start(createApp({ clientDir }));
    expect((await fetch(`${base}/planner`, { method: 'POST' })).status).toBe(404);
  });
});

describe('without a client folder', () => {
  it('serves only the API, as in development', async () => {
    const base = await start(createApp());
    expect((await fetch(`${base}/api/health`)).status).toBe(200);
    expect((await fetch(`${base}/planner`)).status).toBe(404);
  });

  it('ignores a folder that has no built app in it', async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'gatheros-empty-'));
    const base = await start(createApp({ clientDir: empty }));
    expect((await fetch(`${base}/planner`)).status).toBe(404);
    fs.rmSync(empty, { recursive: true, force: true });
  });
});

describe('trusting the host proxy', () => {
  it('trusts no proxy unless told how many there are', () => {
    expect(createApp().get('trust proxy')).toBe(0);
  });

  it('trusts the given number of proxies', () => {
    expect(createApp({ trustProxyHops: 1 }).get('trust proxy')).toBe(1);
  });
});
