/**
 * Centralized Global Error Handler Middleware
 */

// Helper to send errors in development environment
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Helper to send errors in production environment
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // 1) Log error for internal tracking
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.code === 11000) {
    err.statusCode = 409;
    err.status = 'fail';
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific MongoDB/Mongoose Errors
    if (err.name === 'CastError') {
      error = { ...err, isOperational: true, message: `Invalid ${err.path}: ${err.value}.` };
    }
    if (err.code === 11000) {
      const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0] || 'unknown' : 'unknown';
      error = { ...err, isOperational: true, message: `Duplicate field value: ${value}. Please use another value!`, statusCode: 409 };
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((el) => el.message);
      error = { ...err, isOperational: true, message: `Invalid input data. ${errors.join('. ')}` };
    }
    if (err.name === 'JsonWebTokenError') {
      error = { ...err, isOperational: true, message: 'Invalid token. Please log in again!', statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
      error = { ...err, isOperational: true, message: 'Your token has expired! Please log in again.', statusCode: 401 };
    }

    sendErrorProd(error, res);
  }
};
