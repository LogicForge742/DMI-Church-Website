const { createClient } = require('redis');
const logger = require('./logger');

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', err => logger.error('Redis Client Error', err));

// Connect gracefully
(async () => {
  try {
    await redisClient.connect();
    logger.info('✅ Connected to Redis cache');
  } catch (err) {
    logger.error('❌ Redis connection error (is Redis running?)', err);
  }
})();

module.exports = redisClient;
