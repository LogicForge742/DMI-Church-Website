const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Form tampered with (CSRF token missing or invalid).' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  // Send minimal info on production
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({ error: message });
  } else {
    res.status(statusCode).json({ error: message, stack: err.stack });
  }
};

module.exports = errorHandler;
