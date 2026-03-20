const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { securityHeaders, sanitizeInput, globalLimiter, csrfProtection } = require('./middlewares/security');
const expressStatusMonitor = require('express-status-monitor');
const morganMiddleware = require('./middlewares/morgan');
const errorHandler = require('./utils/errorHandler');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import routes
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const eventRoutes = require('./routes/eventRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const teamRoutes = require('./routes/teamRoutes');
const blogRoutes = require('./routes/blogRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Performance and Status monitoring 
app.use(expressStatusMonitor());
app.use(compression());

// Logging Middleware
app.use(morganMiddleware);

// Security Middlewares
app.use(securityHeaders);
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(globalLimiter);

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeInput);

// Static files for uploads
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Serve static assets with strict 1-year caching for Edge/CDN networks
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1y',
  immutable: true,
  etag: true
}));

// Health check endpoint (for Load Balancers and Kubernetes)
const db = require('./config/db');
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'UP', message: 'API and Database are healthy.' });
  } catch (error) {
    res.status(503).json({ status: 'DOWN', message: 'Database connection failed.', error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Swagger OpenAPI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Router V1 Abstraction
const v1Router = express.Router();

v1Router.use('/contact', contactRoutes);
v1Router.use('/newsletter', newsletterRoutes);
v1Router.use('/events', eventRoutes);
v1Router.use('/media', mediaRoutes);
v1Router.use('/team', teamRoutes);
v1Router.use('/blogs', blogRoutes);
v1Router.use('/', paymentRoutes);
app.use('/admin', adminRoutes);

// Mount V1 API
app.use('/api/v1', v1Router);

// Support legacy frontend logic temporarily (Alias)
app.use('/api', v1Router);

// Optional: CSRF token endpoint (Frontend must fetch this before POSTing and include in headers as CSRF-Token)
// Note: Currently commented out from global routes as it requires frontend integration, keeping it available here.
// app.use(csrfProtection);
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
