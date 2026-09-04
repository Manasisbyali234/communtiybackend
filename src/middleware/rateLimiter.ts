import rateLimit from 'express-rate-limit';
import { config } from '../config/index';
import { ApiError } from '../utils/ApiError';

export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/v1/messages'),
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many requests, please try again later.'));
  },
});

export const messagesRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many requests, please try again later.'));
  },
});

