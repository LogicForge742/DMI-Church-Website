const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');

const securityHeaders = helmet(); // Sets multiple secure headers
const sanitizeInput = xss(); // Prevents Cross-Site Scripting

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const donateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many donation requests. Please try again later.' },
});

// Configure CSRF protection (assumes cookie-parser is used)
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

module.exports = {
  securityHeaders,
  sanitizeInput,
  globalLimiter,
  loginLimiter,
  donateLimiter,
  csrfProtection,
};
