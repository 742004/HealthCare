import rateLimit from 'express-rate-limit';

/**
 * Maps Rate Limiter Middleware
 * 
 * Protects Google Maps endpoints from excessive billable API calls.
 */
const mapsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many Maps API requests from this IP, please try again after 5 minutes.',
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

export default mapsRateLimit;
