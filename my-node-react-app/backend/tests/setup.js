jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() }
}));

jest.mock('../src/utils/redisClient', () => ({
  isReady: true,
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  connect: jest.fn()
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn()
  })),
  Worker: jest.fn()
}));

// Suppress Winston console outputs during tests
const logger = require('../src/utils/logger');
logger.transports.forEach((t) => (t.silent = true));
