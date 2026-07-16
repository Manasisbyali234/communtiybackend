import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { config } from '../config/index';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Store the real error message so requestLogger can log it instead of pino-http's generic message.
  const storeMessage = (msg: string) => { res.locals['errorMessage'] = msg; };

  // ── Known typed ApiError ───────────────────────────────────────────────────
  if (err instanceof ApiError) {
    storeMessage(err.message);
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    storeMessage('Validation failed');
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // ── Prisma known errors ────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = Array.isArray(err.meta?.['target'])
        ? (err.meta?.['target'] as string[]).join(', ')
        : 'field';
      storeMessage(`Duplicate value for unique ${field}`);
      res.status(409).json({
        success: false,
        statusCode: 409,
        message: `Duplicate value for unique ${field}`,
        errors: [],
      });
      return;
    }
    if (err.code === 'P2025') {
      storeMessage('Record not found');
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Record not found',
        errors: [],
      });
      return;
    }
  }

  // ── Unknown / unexpected error ─────────────────────────────────────────────
  const errMessage = err instanceof Error ? err.message : String(err);
  const errStack   = err instanceof Error ? err.stack    : undefined;
  const awsMeta    = (err as any)?.$metadata ?? undefined;
  const awsCode    = (err as any)?.Code ?? (err as any)?.name ?? undefined;

  storeMessage(`${awsCode ? awsCode + ': ' : ''}${errMessage}`);
  logger.error({ err, url: req.url, method: req.method, errMessage, errStack, awsMeta, awsCode }, 'Unhandled error');
  console.error('[Unhandled Error]', awsCode ?? '', errMessage);
  console.error('[Unhandled Error] stack:', errStack);
  if (awsMeta) console.error('[Unhandled Error] AWS $metadata:', JSON.stringify(awsMeta));

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: config.NODE_ENV !== 'production' ? errMessage : 'Internal server error',
    ...(config.NODE_ENV !== 'production' && {
      errorCode: awsCode,
      awsMeta,
      stack: errStack?.split('\n').slice(0, 6),
    }),
  });
}
