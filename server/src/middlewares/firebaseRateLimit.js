import rateLimit from 'express-rate-limit';

/**
 * Firebase Rate Limiter Middleware
 * 
 * Protects Firebase endpoints from excessive calls.
 */
const firebaseRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many notification requests from this IP, please try again after 5 minutes.',
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

export default firebaseRateLimit;
