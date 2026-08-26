import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware for Role-Based Access Control (RBAC).
 * Checks if the authenticated user's role is included in the allowed roles array.
 * @param  {...String} roles - Array of allowed roles (e.g., 'Patient', 'Doctor', 'HospitalAdmin', 'SuperAdmin', 'Driver')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the auth.middleware.js
    if (!req.user) {
      return next(new ApiError(401, 'User not authenticated. Please log in.'));
    }

    // Check if the user's role is in the array of allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not authorized to access this route.`)
      );
    }

    next();
  };
};
