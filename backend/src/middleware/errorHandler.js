/**
 * Error Handling Middleware
 * 
 * Centralized error handling for database and application errors.
 * Properly formats Sequelize errors for client responses.
 */

const { parseValidationError } = require('../utils/database');

/**
 * Database error handler middleware
 * Catches and formats Sequelize errors
 */
const databaseErrorHandler = (err, req, res, next) => {
  // Check if it's a Sequelize error
  if (err.name && err.name.includes('Sequelize')) {
    const parsedError = parseValidationError(err);
    
    // Determine status code based on error type
    let statusCode = 400;
    if (parsedError.type === 'ForeignKeyConstraintError') {
      statusCode = 409;
    }
    
    return res.status(statusCode).json({
      error: parsedError.type,
      message: parsedError.message,
      details: parsedError.errors || parsedError,
      timestamp: Date.now()
    });
  }
  
  // Pass to next error handler if not a database error
  next(err);
};

/**
 * Not found error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.method} ${req.path} not found`);
  error.statusCode = 404;
  next(error);
};

/**
 * Generic error handler (should be last)
 */
const genericErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });
  
  res.status(statusCode).json({
    error: err.name || 'ServerError',
    message: message,
    timestamp: Date.now(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  databaseErrorHandler,
  notFoundHandler,
  genericErrorHandler
};
