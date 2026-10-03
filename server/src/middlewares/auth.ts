import type { RequestHandler, Response } from 'express';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../services/sessionService';
import type { UserRole, UserSession } from '../types';
import { AppError } from '../utils/AppError';

export function getSession(res: Response): UserSession {
  return res.locals.session as UserSession;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = (req.cookies as Record<string, string | undefined> | undefined)?.[SESSION_COOKIE_NAME];
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    next(AppError.unauthorized());
    return;
  }

  res.locals.session = session;
  next();
};

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (_req, res, next) => {
    if (!roles.includes(getSession(res).role)) {
      next(AppError.forbidden('Your role cannot access this resource'));
      return;
    }
    next();
  };

/** Only the signed-in attendee themselves (planners cannot act as an attendee). */
export const requireSelf: RequestHandler = (req, res, next) => {
  if (getSession(res).id === req.params.id) {
    next();
    return;
  }
  next(AppError.forbidden('You can only do this for yourself'));
};

/** Planners may act on any attendee; attendees only on their own record (`:id` param). */
export const requireSelfOrPlanner: RequestHandler = (req, res, next) => {
  const session = getSession(res);
  if (session.role === 'planner' || session.id === req.params.id) {
    next();
    return;
  }
  next(AppError.forbidden('You can only access your own record'));
};
