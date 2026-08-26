/**
 * A Higher-Order Function (HOF) to wrap asynchronous Express route handlers.
 * It catches any rejected promises or thrown errors inside the controller
 * and passes them down to the Express global error handler (next).
 *
 * @param {Function} requestHandler - The async Express controller function
 * @returns {Function} - A middleware function compatible with Express routes
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    // Execute the controller. If it returns a Promise that rejects,
    // the .catch() block safely passes the error to next().
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
