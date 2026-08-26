import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import logger from '../utils/logger.js';

/**
 * Swagger OpenAPI Configuration
 * Configures the OpenAPI 3.1 specification for the Emergency Healthcare Connector API.
 */

// Define environment-aware server URLs
const servers = [];
if (process.env.NODE_ENV === 'production') {
  servers.push({
    url: 'https://api.healthcareconnector.com/api/v1',
    description: 'Production Server',
  });
} else {
  servers.push({
    url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
    description: 'Development Server',
  });
}

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Emergency Healthcare Connector API',
      version: '1.0.0',
      description: 'API documentation for the Emergency Healthcare Connector, orchestrating SOS emergencies, live ambulance tracking, and real-time medical coordination.',
      contact: {
        name: 'API Support',
        email: 'support@healthcareconnector.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers,
    tags: [
      { name: 'Authentication', description: 'User login, registration, and token management' },
      { name: 'Patients', description: 'Patient profiles and emergency history' },
      { name: 'Doctors', description: 'Doctor availability and consultation notes' },
      { name: 'Hospitals', description: 'Hospital resources, bed management, and SOS acceptance' },
      { name: 'Ambulances', description: 'Vehicle registration, dispatch, and live tracking' },
      { name: 'Emergencies', description: 'Core SOS lifecycle orchestration' },
      { name: 'Medical Records', description: 'HIPAA-compliant clinical data management' },
      { name: 'Notifications', description: 'In-app real-time alerts and user preferences' },
      { name: 'Chat', description: 'Secure messaging between patients and medical staff' },
      { name: 'AI', description: 'AI triage and symptom analysis endpoints' },
      { name: 'Maps', description: 'Geocoding, routing, and ETA estimations' },
      { name: 'Admin', description: 'System-wide monitoring and override controls' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT in the format: Bearer <token>',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
        },
        NotFoundError: {
          description: 'The requested resource was not found',
        },
        ValidationError: {
          description: 'The request payload failed structural validation',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    externalDocs: {
      description: 'Find out more about the system architecture',
      url: 'https://github.com/healthcareconnector/docs',
    },
  },
  // Paths to files containing OpenAPI annotations (JSDoc comments)
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js'],
};

// Generate the OpenAPI specification from the configuration and inline JSDocs
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Attaches the Swagger UI middleware to the Express application.
 * 
 * @param {import('express').Application} app - The Express application instance
 */
export const setupSwagger = (app) => {
  // Only serve Swagger UI in development or staging environments to prevent exposing internal endpoints in production
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Healthcare API Documentation'
    }));
    logger.info(`[SWAGGER] API Documentation successfully mounted at /api-docs`);
  }
};
