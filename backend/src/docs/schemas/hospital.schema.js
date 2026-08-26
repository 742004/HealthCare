/**
 * Hospital OpenAPI Schemas
 * 
 * Defines the request and response structures for hospital facilities,
 * bed capacities, departments, and emergency readiness.
 */

export const hospitalSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Sub-components & Fragments
  // ---------------------------------------------------------
  HospitalDepartment: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Cardiology' },
      head: { type: 'string', example: 'Dr. Amara Okoye' },
      contactNumber: { type: 'string', example: '+15550106601' },
      operatingHours: { type: 'string', example: '24/7' },
    },
  },
  BedAvailability: {
    type: 'object',
    properties: {
      total: { type: 'integer', example: 500 },
      occupied: { type: 'integer', example: 458 },
      available: { type: 'integer', example: 42 },
    },
  },
  ICUAvailability: {
    type: 'object',
    properties: {
      total: { type: 'integer', example: 50 },
      occupied: { type: 'integer', example: 42 },
      available: { type: 'integer', example: 8 },
      ventilatorsAvailable: { type: 'integer', example: 12 },
    },
  },
  EmergencyCapacity: {
    type: 'object',
    properties: {
      isAcceptingPatients: { type: 'boolean', example: true },
      currentWaitTimeMinutes: { type: 'integer', example: 15 },
      traumaLevel: { type: 'string', enum: ['Level I', 'Level II', 'Level III', 'Level IV', 'Level V', 'None'], example: 'Level I' },
    },
  },
  HospitalContact: {
    type: 'object',
    properties: {
      generalPhone: { type: 'string', example: '+15550104200' },
      emergencyPhone: { type: 'string', example: '+15550109110' },
      email: { type: 'string', format: 'email', example: 'info@stmarysmedical.org' },
    },
  },
  HospitalLocation: {
    type: 'object',
    properties: {
      address: { $ref: '#/components/schemas/Address' },
      coordinates: { $ref: '#/components/schemas/Coordinates' },
    },
  },
  HospitalFacilities: {
    type: 'array',
    items: { type: 'string' },
    example: ['24/7 ER', 'Helipad', 'MRI', 'Blood Bank', 'Neonatal ICU'],
  },
  HospitalStatistics: {
    type: 'object',
    properties: {
      monthlyEmergenciesHandled: { type: 'integer', example: 1240 },
      averageRating: { type: 'number', example: 4.7 },
      activeDoctors: { type: 'integer', example: 185 },
    },
  },

  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  HospitalProfile: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      user: { $ref: '#/components/schemas/UserProfile' },
      name: { type: 'string', example: 'St. Mary\'s Medical Center' },
      location: { $ref: '#/components/schemas/HospitalLocation' },
      contact: { $ref: '#/components/schemas/HospitalContact' },
      departments: {
        type: 'array',
        items: { $ref: '#/components/schemas/HospitalDepartment' },
      },
      beds: { $ref: '#/components/schemas/BedAvailability' },
      icu: { $ref: '#/components/schemas/ICUAvailability' },
      emergency: { $ref: '#/components/schemas/EmergencyCapacity' },
      facilities: { $ref: '#/components/schemas/HospitalFacilities' },
      statistics: { $ref: '#/components/schemas/HospitalStatistics' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  HospitalSummary: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      name: { type: 'string', example: 'St. Mary\'s Medical Center' },
      availableBeds: { type: 'integer', example: 42 },
      availableICU: { type: 'integer', example: 8 },
      isAcceptingPatients: { type: 'boolean', example: true },
      traumaLevel: { type: 'string', example: 'Level I' },
      distance: { type: 'number', description: 'Calculated distance from user (if spatial query)', example: 4.2 },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreateHospitalRequest: {
    type: 'object',
    required: ['name', 'location', 'contact', 'beds', 'icu', 'emergency'],
    properties: {
      name: { type: 'string', example: 'St. Mary\'s Medical Center' },
      location: { $ref: '#/components/schemas/HospitalLocation' },
      contact: { $ref: '#/components/schemas/HospitalContact' },
      departments: {
        type: 'array',
        items: { $ref: '#/components/schemas/HospitalDepartment' },
      },
      beds: { $ref: '#/components/schemas/BedAvailability' },
      icu: { $ref: '#/components/schemas/ICUAvailability' },
      emergency: { $ref: '#/components/schemas/EmergencyCapacity' },
      facilities: { $ref: '#/components/schemas/HospitalFacilities' },
    },
  },
  UpdateHospitalRequest: {
    type: 'object',
    properties: {
      contact: { $ref: '#/components/schemas/HospitalContact' },
      beds: { $ref: '#/components/schemas/BedAvailability' },
      icu: { $ref: '#/components/schemas/ICUAvailability' },
      emergency: { $ref: '#/components/schemas/EmergencyCapacity' },
      facilities: { $ref: '#/components/schemas/HospitalFacilities' },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  HospitalResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              hospital: { $ref: '#/components/schemas/HospitalProfile' },
            },
          },
        },
      },
    ],
  },
  HospitalListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/HospitalSummary' },
          },
        },
      },
    ],
  },
  EmergencyAssignmentResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              emergencyId: { $ref: '#/components/schemas/ObjectId' },
              hospitalId: { $ref: '#/components/schemas/ObjectId' },
              action: { type: 'string', enum: ['ACCEPTED', 'REJECTED'], example: 'ACCEPTED' },
              processedAt: { $ref: '#/components/schemas/Timestamp' },
            },
          },
        },
      },
    ],
  },
});
