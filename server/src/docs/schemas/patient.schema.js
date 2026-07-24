/**
 * Patient OpenAPI Schemas
 * 
 * Defines the request and response structures for patient profiles,
 * medical histories, emergency contacts, and related health data.
 */

export const patientSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Sub-components & Fragments
  // ---------------------------------------------------------
  PatientAddress: {
    type: 'object',
    properties: {
      street: { type: 'string', example: '123 Recovery Lane' },
      city: { type: 'string', example: 'San Francisco' },
      state: { type: 'string', example: 'CA' },
      zipCode: { type: 'string', example: '94105' },
      country: { type: 'string', example: 'USA' },
    },
  },
  EmergencyContact: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Maria Rodriguez' },
      relationship: { type: 'string', example: 'Spouse' },
      phone: { type: 'string', example: '+14155552020' },
    },
  },
  InsuranceDetails: {
    type: 'object',
    properties: {
      provider: { type: 'string', example: 'Blue Cross Blue Shield' },
      policyNumber: { type: 'string', example: 'BCBS-89302-XY' },
      groupNumber: { type: 'string', example: 'GRP-1011' },
    },
  },
  Allergies: {
    type: 'array',
    items: { type: 'string' },
    example: ['Penicillin', 'Peanuts', 'Latex'],
  },
  Medications: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Lisinopril' },
        dosage: { type: 'string', example: '10mg' },
        frequency: { type: 'string', example: 'Once daily' },
      },
    },
  },
  MedicalInfo: {
    type: 'object',
    properties: {
      bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], example: 'O+' },
      height: { type: 'number', description: 'Height in cm', example: 178 },
      weight: { type: 'number', description: 'Weight in kg', example: 82.5 },
      allergies: { $ref: '#/components/schemas/Allergies' },
      currentMedications: { $ref: '#/components/schemas/Medications' },
      chronicConditions: {
        type: 'array',
        items: { type: 'string' },
        example: ['Type 2 Diabetes', 'Hypertension'],
      },
    },
  },
  PatientLocation: {
    type: 'object',
    properties: {
      coordinates: { $ref: '#/components/schemas/Coordinates' },
      lastUpdated: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  
  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  PatientProfile: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      user: { $ref: '#/components/schemas/UserProfile' }, // Populated Auth User details
      dateOfBirth: { type: 'string', format: 'date', example: '1985-11-22' },
      gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], example: 'MALE' },
      address: { $ref: '#/components/schemas/PatientAddress' },
      emergencyContacts: {
        type: 'array',
        items: { $ref: '#/components/schemas/EmergencyContact' },
      },
      insurance: { $ref: '#/components/schemas/InsuranceDetails' },
      medicalInfo: { $ref: '#/components/schemas/MedicalInfo' },
      location: { $ref: '#/components/schemas/PatientLocation' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  PatientSummary: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      firstName: { type: 'string', example: 'Alex' },
      lastName: { type: 'string', example: 'Rodriguez' },
      bloodGroup: { type: 'string', example: 'O+' },
      allergies: { $ref: '#/components/schemas/Allergies' },
      age: { type: 'integer', example: 38 },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreatePatientRequest: {
    type: 'object',
    required: ['dateOfBirth', 'gender', 'emergencyContacts'],
    properties: {
      dateOfBirth: { type: 'string', format: 'date', example: '1985-11-22' },
      gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], example: 'MALE' },
      address: { $ref: '#/components/schemas/PatientAddress' },
      emergencyContacts: {
        type: 'array',
        items: { $ref: '#/components/schemas/EmergencyContact' },
      },
      insurance: { $ref: '#/components/schemas/InsuranceDetails' },
      medicalInfo: { $ref: '#/components/schemas/MedicalInfo' },
    },
  },
  UpdatePatientRequest: {
    type: 'object',
    properties: {
      address: { $ref: '#/components/schemas/PatientAddress' },
      emergencyContacts: {
        type: 'array',
        items: { $ref: '#/components/schemas/EmergencyContact' },
      },
      insurance: { $ref: '#/components/schemas/InsuranceDetails' },
      medicalInfo: { $ref: '#/components/schemas/MedicalInfo' },
    },
  },
  UploadDocumentRequest: {
    type: 'object',
    required: ['file', 'documentType'],
    properties: {
      file: { type: 'string', format: 'binary', description: 'The medical record PDF/Image' },
      documentType: { type: 'string', example: 'LAB_REPORT' },
      notes: { type: 'string', example: 'Monthly blood sugar panel' },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  PatientResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              patient: { $ref: '#/components/schemas/PatientProfile' },
            },
          },
        },
      },
    ],
  },
  PatientListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/PatientSummary' },
          },
        },
      },
    ],
  },
  PatientDocumentsResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/ObjectId' },
                documentType: { type: 'string', example: 'LAB_REPORT' },
                fileUrl: { type: 'string', example: 'https://storage.aws.com/records/xyz.pdf' },
                uploadedAt: { $ref: '#/components/schemas/Timestamp' },
              },
            },
          },
        },
      },
    ],
  },
});
