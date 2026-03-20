require('dotenv').config();
const app = require('./app');
const db = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`✅ Server running at http://localhost:${PORT}`);
});

// Graceful Shutdown Events
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed.');
    // Close DB connection
    db.pool.end(() => {
      logger.info('PostgreSQL pool has ended.');
      process.exit(0);
    });
  });

  // Force close after 10s if graceful isn't working
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);