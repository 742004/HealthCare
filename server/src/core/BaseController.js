import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

/**
 * BaseController
 * An abstract base class for all Express controllers to inherit from.
 * Enforces a standard, consistent, and DRY approach to handling HTTP requests and responses.
 */
export class BaseController {
  constructor(service = null) {
    // Optionally inject a primary service for basic CRUD delegation
    this.service = service;
  }

  /**
   * Standardized success response handler.
   * @param {Object} res - Express response object.
   * @param {number} statusCode - HTTP status code (default 200).
   * @param {any} data - The payload to send to the client.
   * @param {string} message - Success message.
   */
  sendSuccess(res, statusCode = 200, data = null, message = 'Success') {
    return res.status(statusCode).json(
      new ApiResponse(statusCode, data, message)
    );
  }

  /**
   * Standardized error response handler.
   * Note: The centralized error handling middleware usually catches ApiErrors thrown inside asyncHandlers,
   * but this is useful for manual error triggering within the controller if needed.
   * @param {Object} res - Express response object.
   * @param {number} statusCode - HTTP error code.
   * @param {string} message - Error message.
   * @param {string} errorCode - Optional internal tracking code.
   */
  sendError(res, statusCode, message, errorCode = 'ERROR') {
    logger.error(`[CONTROLLER_ERROR] ${errorCode}: ${message}`);
    return res.status(statusCode).json(
      new ApiError(statusCode, message, errorCode)
    );
  }

  /**
   * Standardized Created (201) response handler.
   * @param {Object} res - Express response object.
   * @param {any} data - The payload to send.
   * @param {string} message - Creation success message.
   */
  sendCreated(res, data, message = 'Resource created successfully') {
    return this.sendSuccess(res, 201, data, message);
  }

  /**
   * Wraps a controller method with the standard asyncHandler to eliminate repetitive try/catch blocks.
   * Binds 'this' context automatically.
   * 
   * @param {Function} method - The async controller method to execute.
   * @returns {Function} Express middleware function.
   */
  execute(method) {
    return asyncHandler(method.bind(this));
  }

  /**
   * Utility to extract pagination parameters from query string with safe defaults.
   * @param {Object} req - Express request object.
   * @returns {Object} { limit, page, skip }
   */
  getPaginationParams(req) {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}
