const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DMI Church REST API',
    version: '1.0.0',
    description: 'Documentation for Deliverance Ministry International API. Designed with a Version 1 (v1) constraint.',
    contact: {
      name: 'DMI Developers',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development Server',
    },
    {
      url: 'https://api.yourdomain.com/api/v1',
      description: 'Production Edge',
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Scan definitions inside standard routes
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
