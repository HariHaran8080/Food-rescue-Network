import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Safe server-side logging without leaking to client
  const isDev = env.NODE_ENV === 'development';
  if (isDev) {
    console.error('[DEV ERROR LOG]', err);
  } else {
    // In production, log message and code without printing raw request bodies or tokens
    console.error(`[PROD ERROR] ${new Date().toISOString()} ${req.method} ${req.path}:`, err?.message || err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0]?.message || 'Validation failed';
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      error: firstError,
      details: fieldErrors,
    });
  }

  // Handle Prisma unique constraint violations (e.g. duplicate email)
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }

  // Handle Prisma record not found
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'The requested resource was not found' });
  }

  // Handle Prisma transaction timeout (e.g. serverless DB latency)
  if (err?.code === 'P2028') {
    return res.status(503).json({
      error: 'Database transaction timed out. Please try again.',
    });
  }

  // Handle payload too large
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({ error: 'Payload too large. Maximum allowed size is 50KB.' });
  }

  // Client errors (4xx) with trusted explicit messages
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : 500;

  if (status < 500 && err?.message) {
    return res.status(status).json({ error: err.message });
  }

  // For 500 or unknown errors: never leak internal exception details to client
  res.status(500).json({
    error: 'An unexpected internal error occurred. Please try again later.',
  });
}
