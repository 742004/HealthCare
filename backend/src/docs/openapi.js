/**
 * OpenAPI Specification Configuration
 * 
 * This file defines the core, environment-aware OpenAPI 3.1 metadata.
 * It is completely decoupled from Express and Swagger-UI logic, acting only
 * as a data dictionary for the API blueprint.
 */

const getServers = () => {
  if (process.env.NODE_ENV === 'production') {
    return [
      {
        url: 'https://api.healthcareconnector.com/api/v1',
        description: 'Production Server',
      },
    ];
  }
  return [
    {
      url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
      description: 'Development Server',
    },
  ];
};

export const openApiConfiguration = {
  openapi: '3.1.0',
  info: {
    title: 'Emergency Healthcare Connector API',
    version: '1.0.0',
    description: 'API documentation for orchestrating SOS emergencies, live ambulance tracking, and real-time medical coordination.',
    contact: {
      name: 'API Support',
      email: 'support@healthcareconnector.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: getServers(),
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
      SuccessResponse: {
        description: 'Operation completed successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Operation successful' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorSchema',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions for this action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorSchema',
            },
          },
        },
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorSchema',
            },
          },
        },
      },
      ValidationError: {
        description: 'The request payload failed structural validation',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationErrorSchema',
            },
          },
        },
      },
    },
    parameters: {
      PaginationSkip: {
        in: 'query',
        name: 'skip',
        schema: { type: 'integer', default: 0 },
        description: 'Number of records to skip for pagination',
      },
      PaginationLimit: {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', default: 10 },
        description: 'Maximum number of records to return',
      },
    },
    schemas: {
      ErrorSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
        },
      },
      ValidationErrorSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' },
              },
            },
          },
        },
      },
      PaginationSchema: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 100 },
          skip: { type: 'integer', example: 0 },
          limit: { type: 'integer', example: 10 },
        },
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
};
