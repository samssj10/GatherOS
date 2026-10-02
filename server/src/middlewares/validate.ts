import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

interface Schemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

export interface ValidatedLocals {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

// Express 5 makes req.query read-only, so parsed values go on res.locals.validated.
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    const validated: ValidatedLocals = {};

    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        next(AppError.badRequest(`Invalid request ${key}`, z.flattenError(result.error)));
        return;
      }
      validated[key] = result.data;
    }

    res.locals.validated = validated;
    next();
  };
