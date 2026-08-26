import rateLimit from 'express-rate-limit'; // Note: Must run `npm install express-rate-limit`

// General API rate limiter for standard routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication routes (Login/Register/Forgot Password)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/auth requests per hour to prevent brute-force attacks
  message: {
    status: 'error',
    message: 'Too many authentication attempts from this IP, please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
