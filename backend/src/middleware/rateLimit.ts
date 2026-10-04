import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.max(config.rateLimit.maxRequests, 10000), // Generous ceiling for multiple concurrent users
  message: {
    success: false,
    message: 'Too many requests, please slow down',
    data: null,
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Generous limit so shared Wi-Fi / classroom / multiple users don't get locked out
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in a few moments',
    data: null,
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
