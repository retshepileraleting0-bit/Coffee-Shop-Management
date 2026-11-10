// Error handling middleware
// 404 Not Found Handler
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found at endpoint: ${req.method} ${req.originalUrl}`
  });
}

// Global 500 Error Handler
function globalErrorHandler(err, req, res, next) {
  console.error('Unhandled server error:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};

