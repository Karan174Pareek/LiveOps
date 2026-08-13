import rateLimit from 'express-rate-limit';

// Global API write rate limiter (POST/PUT/DELETE)
export const apiWriteRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // Max 100 write requests per IP
  message: { error: 'Rate limit exceeded. Too many write requests from this IP address.' },
  standardHeaders: true,
  legacyHeaders: false
});
