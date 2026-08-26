/**
 * Common OpenAPI Schemas
 * 
 * Centralized schema definitions for foundational data types, error responses, 
 * and structural wrappers used throughout the entire API.
 */

export const commonSchemas = Object.freeze({
  // Primitive Types & Identifiers
  ObjectId: {
    type: 'string',
    pattern: '^[0-9a-fA-F]{24}$',
    example: '60d5ecb8b392d700153cd123',
    description: 'MongoDB 24-character hex string ObjectId',
  },
  UUID: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Universally Unique Identifier',
  },
  Timestamp: {
    type: 'string',
    format: 'date-time',
    example: '2026-07-24T12:00:00.000Z',
    description: 'ISO 8601 formatted UTC date-time string',
  },

  // Geospatial & Address
  Coordinates: {
    type: 'array',
    items: { type: 'number' },
    minItems: 2,
    maxItems: 2,
    example: [-122.4194, 37.7749],
    description: '[longitude, latitude] array',
  },
  Address: {
    type: 'object',
    properties: {
      street: { type: 'string', example: '123 Main St' },
      city: { type: 'string', example: 'San Francisco' },
      state: { type: 'string', example: 'CA' },
      zipCode: { type: 'string', example: '94105' },
      country: { type: 'string', example: 'USA' },
    },
  },

  // Metadata
  AuditFields: {
    type: 'object',
    properties: {
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
      isDeleted: { type: 'boolean', example: false },
    },
  },

  // Pagination
  PaginationRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      sortBy: { type: 'string', example: 'createdAt' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    },
  },
  PaginationMeta: {
    type: 'object',
    properties: {
      total: { type: 'integer', example: 150 },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      totalPages: { type: 'integer', example: 15 },
      hasNextPage: { type: 'boolean', example: true },
      hasPrevPage: { type: 'boolean', example: false },
    },
  },
  PaginationResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: { type: 'object' },
        description: 'Array of records. Will be overridden via allOf in specific schemas.',
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' },
    },
  },

  // Base API Responses
  ApiResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: { type: 'object', nullable: true },
    },
    required: ['success', 'message'],
  },
  ApiError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    required: ['success', 'message'],
  },

  // Specific Success Responses
  SuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/ApiResponse' },
      {
        type: 'object',
        properties: {
          success: { example: true },
          message: { example: 'Operation completed successfully' },
        },
      },
    ],
  },
  CreatedResponse: {
    allOf: [
      { $ref: '#/components/schemas/ApiResponse' },
      {
        type: 'object',
        properties: {
          success: { example: true },
          message: { example: 'Resource created successfully' },
        },
      },
    ],
  },

  // Specific Error Responses
  ErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ApiError' },
      {
        type: 'object',
        properties: {
          success: { example: false },
          message: { example: 'An error occurred' },
        },
      },
    ],
  },
  ValidationError: {
    allOf: [
      { $ref: '#/components/schemas/ApiError' },
      {
        type: 'object',
        properties: {
          success: { example: false },
          message: { example: 'Validation failed' },
          errors: {
            example: [
              { field: 'email', message: 'Invalid email format' },
            ],
          },
        },
      },
    ],
  },
  UnauthorizedError: {
    allOf: [
      { $ref: '#/components/schemas/ApiError' },
      {
        type: 'object',
        properties: {
          success: { example: false },
          message: { example: 'Authentication required' },
        },
      },
    ],
  },
  ForbiddenError: {
    allOf: [
      { $ref: '#/components/schemas/ApiError' },
      {
        type: 'object',
        properties: {
          success: { example: false },
          message: { example: 'Insufficient permissions' },
        },
      },
    ],
  },
  NotFoundError: {
    allOf: [
      { $ref: '#/components/schemas/ApiError' },
      {
        type: 'object',
        properties: {
          success: { example: false },
          message: { example: 'Resource not found' },
        },
      },
    ],
  },
  ConflictError: {
    allOf: [
      { $ref: '#/components/schemas/ApiError' },
      {
        type: 'object',
        properties: {
          success: { example: false },
          message: { example: 'Resource already exists' },
        },
      },
    ],
  },
  InternalServerError: {
    allOf: [
      { $ref: '#/components/schemas/ApiError' },
      {
        type: 'object',
        properties: {
          success: { example: false },
          message: { example: 'An unexpected internal server error occurred' },
        },
      },
    ],
  },
});
