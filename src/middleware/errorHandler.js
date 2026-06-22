/**
 * Centralized error handling middleware.
 * Catches all errors thrown in route handlers and returns a consistent JSON response.
 */
function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${err.message}`, err.stack);

  // Determine status code
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: message,
  });
}

module.exports = errorHandler;