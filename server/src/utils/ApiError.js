/**
 * Custom Error Class for the API.
 * Extends the built-in Node.js Error class to provide structured
 * error handling across the application.
 */
export class ApiError extends Error {
  /**
   * Create an ApiError
   * @param {number} statusCode - HTTP status code (e.g., 400, 401, 404, 500)
   * @param {string} message - Human readable error message
   * @param {string} [errorCode=''] - Specific application error code (optional)
   * @param {Array} [errors=[]] - Array of specific validation/field errors (optional)
   * @param {string} [stack=''] - Custom stack trace (optional)
   */
  constructor(
    statusCode,
    message = 'Something went wrong',
    errorCode = '',
    errors = [],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    // For 4xx errors status is 'fail', for 5xx errors it is 'error'
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode;
    this.data = null;
    this.success = false;
    this.errors = errors;
    
    // Operational errors are predictable (e.g., bad request, user not found).
    // Non-operational errors are programming bugs or external package failures.
    this.isOperational = true;

    // Capture the stack trace securely without polluting the current constructor
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
