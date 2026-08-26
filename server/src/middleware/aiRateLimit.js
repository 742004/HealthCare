import rateLimit from 'express-rate-limit';

/**
 * AI Rate Limiter Middleware
 * 
 * Protects AI endpoints from abuse and excessive token usage by limiting 
 * the number of requests a single IP can make within a specified timeframe.
 */
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI requests per windowMs
  message: {
    success: false,
    message: 'Too many AI requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

export default aiRateLimit;
