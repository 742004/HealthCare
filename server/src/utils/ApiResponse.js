/**
 * Standardized API Response format across the entire application.
 * Ensures that mobile and frontend clients receive a predictable,
 * typed JSON object for every request, regardless of the endpoint.
 */
export class ApiResponse {
  /**
   * Private constructor to enforce the use of static factory methods.
   * @param {boolean} success - Indicates if the request was successful
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human readable message
   * @param {any} data - The payload/data requested (can be null/empty)
   * @param {Array|null} errors - Array of errors if request failed
   * @param {Object} [meta] - Optional metadata (like pagination details)
   */
  constructor(success, statusCode, message, data = null, errors = null, meta = undefined) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errors = errors;
    if (meta) {
      this.meta = meta;
    }
    this.timestamp = new Date().toISOString();
  }

  /**
   * Generate a standardized Success response.
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP success code (e.g., 200, 201)
   * @param {string} message - Human readable success message
   * @param {any} [data=null] - The main payload
   * @param {Object} [meta] - Pagination or additional metadata
   * @returns {Object} Express response sending JSON
   */
  static success(res, statusCode = 200, message = 'Request Successful', data = null, meta = undefined) {
    return res.status(statusCode).json(
      new ApiResponse(true, statusCode, message, data, null, meta)
    );
  }

  /**
   * Generate a standardized Error response.
   * (Note: For uncaught errors, the global error.middleware.js is used instead. 
   * This is for predictable, handled localized failures if needed).
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP error code (e.g., 400, 404)
   * @param {string} message - Human readable error message
   * @param {Array} [errors=[]] - Array of specific errors (e.g., validation fields)
   * @returns {Object} Express response sending JSON
   */
  static error(res, statusCode = 400, message = 'Request Failed', errors = []) {
    return res.status(statusCode).json(
      new ApiResponse(false, statusCode, message, null, errors)
    );
  }
}
