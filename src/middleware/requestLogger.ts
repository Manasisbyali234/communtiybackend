import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const existing = req.headers['x-request-id'];
    if (existing) return existing as string;
    return randomUUID();
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, _pinoErr) => {
    // _pinoErr is always a generic "failed with status code N" from pino-http.
    // The real error is attached to res.locals by the errorHandler.
    const realMsg = (res as any).locals?.errorMessage ?? _pinoErr.message;
    return `${req.method} ${req.url} ${res.statusCode} - ${realMsg}`;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
