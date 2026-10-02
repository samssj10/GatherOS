import type { RequestHandler } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService';
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
} from '../services/sessionService';
import { getSession } from '../middlewares/auth';

export const loginBodySchema = z.object({
  email: z.string().trim().email().max(254),
});

export const login: RequestHandler = (_req, res) => {
  const { email } = res.locals.validated.body as z.infer<typeof loginBodySchema>;
  const session = authService.login(email);

  res.cookie(SESSION_COOKIE_NAME, createSessionToken(session), sessionCookieOptions);
  res.json(session);
};

export const me: RequestHandler = (_req, res) => {
  res.json(getSession(res));
};

export const logout: RequestHandler = (_req, res) => {
  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE_NAME, clearOptions);
  res.status(204).end();
};
