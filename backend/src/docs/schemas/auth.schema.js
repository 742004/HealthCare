/**
 * Authentication OpenAPI Schemas
 * 
 * Defines the request and response structures for all authentication,
 * authorization, and user identity management endpoints.
 */

export const authSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Base Models
  // ---------------------------------------------------------
  JWTToken: {
    type: 'string',
    description: 'Short-lived JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZ...',
  },
  RefreshToken: {
    type: 'string',
    description: 'Long-lived Refresh Token',
    example: 'd0b8d76a-5b12-4c6e-8d9e-1a2b3c4d5e6f',
  },
  UserProfile: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      firstName: { type: 'string', example: 'Alex' },
      lastName: { type: 'string', example: 'Rodriguez' },
      phone: { type: 'string', example: '+15551234567' },
      role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'HOSPITAL', 'AMBULANCE', 'ADMIN'], example: 'PATIENT' },
      isEmailVerified: { type: 'boolean', example: true },
      isPhoneVerified: { type: 'boolean', example: true },
      isActive: { type: 'boolean', example: true },
      lastLogin: { $ref: '#/components/schemas/Timestamp' },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName', 'phone', 'role'],
    properties: {
      email: { type: 'string', format: 'email', example: 'patient@example.com' },
      password: { type: 'string', format: 'password', example: 'SecureP@ssw0rd!' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      phone: { type: 'string', example: '+15559876543' },
      role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'HOSPITAL', 'AMBULANCE'], example: 'PATIENT' },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'patient@example.com' },
      password: { type: 'string', format: 'password', example: 'SecureP@ssw0rd!' },
    },
  },
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { $ref: '#/components/schemas/RefreshToken' },
    },
  },
  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'patient@example.com' },
    },
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string', example: 'a1b2c3d4e5f6g7h8i9j0' },
      newPassword: { type: 'string', format: 'password', example: 'NewSecur3P@ss!' },
    },
  },
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', format: 'password', example: 'OldP@ssw0rd!' },
      newPassword: { type: 'string', format: 'password', example: 'NewSecur3P@ss!' },
    },
  },
  VerifyEmailRequest: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', example: 'email-verification-token-string' },
    },
  },
  VerifyPhoneRequest: {
    type: 'object',
    required: ['otp'],
    properties: {
      otp: { type: 'string', example: '123456' },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  RegisterResponse: {
    allOf: [
      { $ref: '#/components/schemas/CreatedResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserProfile' },
              accessToken: { $ref: '#/components/schemas/JWTToken' },
              refreshToken: { $ref: '#/components/schemas/RefreshToken' },
            },
          },
        },
      },
    ],
  },
  LoginResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserProfile' },
              accessToken: { $ref: '#/components/schemas/JWTToken' },
              refreshToken: { $ref: '#/components/schemas/RefreshToken' },
            },
          },
        },
      },
    ],
  },
  RefreshTokenResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              accessToken: { $ref: '#/components/schemas/JWTToken' },
              refreshToken: { $ref: '#/components/schemas/RefreshToken' },
            },
          },
        },
      },
    ],
  },
  CurrentUserResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserProfile' },
            },
          },
        },
      },
    ],
  },
  LogoutResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          message: { example: 'Successfully logged out' },
        },
      },
    ],
  },
});
