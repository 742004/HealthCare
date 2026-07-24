/**
 * Doctor OpenAPI Schemas
 * 
 * Defines the request and response structures for doctor profiles,
 * medical credentials, availability, and consultation data.
 */

export const doctorSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Sub-components & Fragments
  // ---------------------------------------------------------
  Specialization: {
    type: 'array',
    items: { type: 'string' },
    example: ['Emergency Medicine', 'Trauma Surgery', 'Cardiology'],
    description: 'List of medical specializations',
  },
  Qualifications: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        degree: { type: 'string', example: 'MD' },
        institution: { type: 'string', example: 'Johns Hopkins University' },
        yearOfCompletion: { type: 'integer', example: 2012 },
      },
    },
  },
  LicenseInformation: {
    type: 'object',
    properties: {
      licenseNumber: { type: 'string', example: 'MD-123456789' },
      state: { type: 'string', example: 'CA' },
      expiryDate: { type: 'string', format: 'date', example: '2028-12-31' },
      isVerified: { type: 'boolean', example: true },
    },
  },
  Experience: {
    type: 'integer',
    description: 'Total years of clinical experience',
    example: 12,
  },
  Availability: {
    type: 'object',
    properties: {
      isAvailable: { type: 'boolean', example: true, description: 'True if currently accepting emergency alerts' },
      schedule: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dayOfWeek: { type: 'string', enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], example: 'MONDAY' },
            startTime: { type: 'string', example: '08:00' },
            endTime: { type: 'string', example: '20:00' },
          },
        },
      },
    },
  },
  Consultation: {
    type: 'object',
    properties: {
      fee: { type: 'number', example: 150.00 },
      currency: { type: 'string', example: 'USD' },
      acceptsInsurance: { type: 'boolean', example: true },
    },
  },
  DoctorLocation: {
    type: 'object',
    properties: {
      coordinates: { $ref: '#/components/schemas/Coordinates' },
      hospitalAffiliation: { $ref: '#/components/schemas/ObjectId', description: 'ID of the affiliated Hospital' },
      lastUpdated: { $ref: '#/components/schemas/Timestamp' },
    },
  },

  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  DoctorProfile: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      user: { $ref: '#/components/schemas/UserProfile' },
      specializations: { $ref: '#/components/schemas/Specialization' },
      qualifications: { $ref: '#/components/schemas/Qualifications' },
      license: { $ref: '#/components/schemas/LicenseInformation' },
      experienceYears: { $ref: '#/components/schemas/Experience' },
      availability: { $ref: '#/components/schemas/Availability' },
      consultation: { $ref: '#/components/schemas/Consultation' },
      location: { $ref: '#/components/schemas/DoctorLocation' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  DoctorSummary: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      firstName: { type: 'string', example: 'Sarah' },
      lastName: { type: 'string', example: 'Chen' },
      specializations: { $ref: '#/components/schemas/Specialization' },
      hospitalAffiliation: { $ref: '#/components/schemas/ObjectId' },
      isAvailable: { type: 'boolean', example: true },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreateDoctorRequest: {
    type: 'object',
    required: ['specializations', 'qualifications', 'license', 'experienceYears'],
    properties: {
      specializations: { $ref: '#/components/schemas/Specialization' },
      qualifications: { $ref: '#/components/schemas/Qualifications' },
      license: { $ref: '#/components/schemas/LicenseInformation' },
      experienceYears: { $ref: '#/components/schemas/Experience' },
      availability: { $ref: '#/components/schemas/Availability' },
      consultation: { $ref: '#/components/schemas/Consultation' },
      location: { $ref: '#/components/schemas/DoctorLocation' },
    },
  },
  UpdateDoctorRequest: {
    type: 'object',
    properties: {
      specializations: { $ref: '#/components/schemas/Specialization' },
      availability: { $ref: '#/components/schemas/Availability' },
      consultation: { $ref: '#/components/schemas/Consultation' },
      location: { $ref: '#/components/schemas/DoctorLocation' },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  DoctorResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              doctor: { $ref: '#/components/schemas/DoctorProfile' },
            },
          },
        },
      },
    ],
  },
  DoctorListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/DoctorSummary' },
          },
        },
      },
    ],
  },
  AssignedEmergencyResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              emergencyId: { $ref: '#/components/schemas/ObjectId' },
              patientId: { $ref: '#/components/schemas/ObjectId' },
              status: { type: 'string', example: 'ASSIGNED' },
              assignedAt: { $ref: '#/components/schemas/Timestamp' },
            },
          },
        },
      },
    ],
  },
});
