/**
 * Emergency OpenAPI Schemas
 * 
 * The central orchestration schemas for the Emergency Healthcare Connector.
 * Defines the request and response structures for SOS triggers, AI triage,
 * hospital assignments, ambulance tracking, and emergency lifecycle timelines.
 */

export const emergencySchemas = Object.freeze({
  // ---------------------------------------------------------
  // Core Enums & Fragments
  // ---------------------------------------------------------
  EmergencyStatus: {
    type: 'string',
    enum: ['PENDING', 'AI_TRIAGE', 'HOSPITAL_ASSIGNED', 'AMBULANCE_DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
    example: 'AMBULANCE_DISPATCHED',
    description: 'The current lifecycle state of the emergency',
  },
  EmergencyPriority: {
    type: 'string',
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    example: 'CRITICAL',
    description: 'Urgency level determined by AI triage or manual override',
  },
  EmergencyLocation: {
    type: 'object',
    properties: {
      coordinates: { $ref: '#/components/schemas/Coordinates' },
      address: { type: 'string', example: 'Intersection of 5th Ave and Main St' },
      notes: { type: 'string', example: 'Gate code 4521, building behind the main complex' },
    },
  },
  EmergencySymptoms: {
    type: 'object',
    properties: {
      chiefComplaint: { type: 'string', example: 'Severe crushing chest pain radiating to left arm' },
      duration: { type: 'string', example: '20 minutes' },
      severityScore: { type: 'integer', description: 'Self-reported severity (1-10)', example: 9 },
      additionalNotes: { type: 'string', example: 'Patient has a history of hypertension.' },
    },
  },
  AITriageResult: {
    type: 'object',
    properties: {
      predictedPriority: { $ref: '#/components/schemas/EmergencyPriority' },
      suspectedCondition: { type: 'string', example: 'Myocardial Infarction (Heart Attack)' },
      confidenceScore: { type: 'number', example: 94.5 },
      recommendedAction: { type: 'string', example: 'Immediate dispatch of ALS Ambulance equipped with Defibrillator. Route to Trauma Level I Cardiac center.' },
      completedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  EmergencyTimeline: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        status: { $ref: '#/components/schemas/EmergencyStatus' },
        timestamp: { $ref: '#/components/schemas/Timestamp' },
        note: { type: 'string', example: 'Ambulance AMB-104 dispatched to location.' },
      },
    },
    description: 'Chronological log of state transitions during the emergency',
  },
  AssignedHospital: {
    type: 'object',
    properties: {
      hospitalId: { $ref: '#/components/schemas/ObjectId' },
      acceptedAt: { $ref: '#/components/schemas/Timestamp' },
      expectedArrival: { $ref: '#/components/schemas/Timestamp' },
      assignedDoctorId: { $ref: '#/components/schemas/ObjectId', nullable: true },
    },
  },
  AssignedAmbulance: {
    type: 'object',
    properties: {
      ambulanceId: { $ref: '#/components/schemas/ObjectId' },
      dispatchedAt: { $ref: '#/components/schemas/Timestamp' },
      estimatedETA: { type: 'integer', description: 'ETA in minutes', example: 6 },
    },
  },
  EmergencyTracking: {
    type: 'object',
    properties: {
      liveAmbulanceLocation: { $ref: '#/components/schemas/Coordinates', nullable: true },
      distanceRemaining: { type: 'number', description: 'Distance in miles/km', example: 2.4 },
      lastUpdated: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  EmergencyHistory: {
    type: 'object',
    properties: {
      previousEmergenciesCount: { type: 'integer', example: 2 },
      knownRiskFactors: {
        type: 'array',
        items: { type: 'string' },
        example: ['Diabetic', 'Severe Peanut Allergy'],
      },
    },
  },

  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  EmergencyRequest: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      patientId: { $ref: '#/components/schemas/ObjectId' },
      status: { $ref: '#/components/schemas/EmergencyStatus' },
      priority: { $ref: '#/components/schemas/EmergencyPriority' },
      location: { $ref: '#/components/schemas/EmergencyLocation' },
      symptoms: { $ref: '#/components/schemas/EmergencySymptoms' },
      triage: { $ref: '#/components/schemas/AITriageResult' },
      hospital: { $ref: '#/components/schemas/AssignedHospital' },
      ambulance: { $ref: '#/components/schemas/AssignedAmbulance' },
      tracking: { $ref: '#/components/schemas/EmergencyTracking' },
      timeline: { $ref: '#/components/schemas/EmergencyTimeline' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  EmergencySummary: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      patientId: { $ref: '#/components/schemas/ObjectId' },
      status: { $ref: '#/components/schemas/EmergencyStatus' },
      priority: { $ref: '#/components/schemas/EmergencyPriority' },
      chiefComplaint: { type: 'string', example: 'Multi-vehicle Road Accident' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreateEmergencyRequest: {
    type: 'object',
    required: ['location', 'symptoms'],
    properties: {
      location: { $ref: '#/components/schemas/EmergencyLocation' },
      symptoms: { $ref: '#/components/schemas/EmergencySymptoms' },
      patientId: { $ref: '#/components/schemas/ObjectId', description: 'Included if triggered on behalf of someone else' },
    },
  },
  UpdateEmergencyRequest: {
    type: 'object',
    properties: {
      status: { $ref: '#/components/schemas/EmergencyStatus' },
      priority: { $ref: '#/components/schemas/EmergencyPriority' },
      tracking: { $ref: '#/components/schemas/EmergencyTracking' },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  EmergencyResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              emergency: { $ref: '#/components/schemas/EmergencyRequest' },
            },
          },
        },
      },
    ],
  },
  EmergencyListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/EmergencySummary' },
          },
        },
      },
    ],
  },
  EmergencyDashboardResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              activeEmergencies: { type: 'integer', example: 14 },
              criticalCases: { type: 'integer', example: 3 },
              averageTriageTimeSeconds: { type: 'number', example: 4.2 },
              ambulancesDispatched: { type: 'integer', example: 11 },
            },
          },
        },
      },
    ],
  },
});
