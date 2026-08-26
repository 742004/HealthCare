import { ApiError } from '../utils/ApiError.js';

/**
 * Standardized request validation middleware using Zod.
 * Validates request body, query parameters, and URL params.
 * @param {Object} schema - Zod validation schema
 */
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    // Parse asynchronously to validate all fields against the schema
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // If validation passes, move to the next middleware/controller
    return next();
  } catch (error) {
    // Extract Zod error messages and format them beautifully
    let errorMessage = 'Validation Error';
    if (error.errors) {
      errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
    }
    
    // Pass to global error handler as a 400 Bad Request
    return next(new ApiError(400, errorMessage));
  }
};

export const validate = validateRequest;
