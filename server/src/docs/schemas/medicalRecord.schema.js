/**
 * Medical Record OpenAPI Schemas
 * 
 * Defines the request and response structures for clinical documentation,
 * diagnoses, prescriptions, lab results, and patient vitals.
 */

export const medicalRecordSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Sub-components & Fragments
  // ---------------------------------------------------------
  Diagnosis: {
    type: 'object',
    properties: {
      condition: { type: 'string', example: 'Acute Myocardial Infarction' },
      icd10Code: { type: 'string', example: 'I21.9' },
      diagnosedAt: { $ref: '#/components/schemas/Timestamp' },
      severity: { type: 'string', enum: ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'], example: 'CRITICAL' },
    },
  },
  Medication: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Aspirin' },
      dosage: { type: 'string', example: '325mg' },
      frequency: { type: 'string', example: 'Once immediately' },
      route: { type: 'string', example: 'Oral, chewable' },
    },
  },
  Prescription: {
    type: 'object',
    properties: {
      medications: {
        type: 'array',
        items: { $ref: '#/components/schemas/Medication' },
      },
      prescribedAt: { $ref: '#/components/schemas/Timestamp' },
      validUntil: { type: 'string', format: 'date', example: '2026-08-24' },
      pharmacyNotes: { type: 'string', example: 'Patient has no known drug allergies.' },
    },
  },
  TreatmentPlan: {
    type: 'object',
    properties: {
      planDetails: { type: 'string', example: 'Immediate transfer to cath lab for percutaneous coronary intervention (PCI).' },
      followUpDate: { type: 'string', format: 'date', nullable: true, example: '2026-08-01' },
      instructions: { type: 'string', example: 'Rest, avoid strenuous activity, strictly adhere to medication schedule.' },
    },
  },
  VitalSigns: {
    type: 'object',
    properties: {
      bloodPressure: { type: 'string', example: '145/90' },
      heartRate: { type: 'integer', description: 'BPM', example: 112 },
      temperature: { type: 'number', description: 'Celsius', example: 37.2 },
      respiratoryRate: { type: 'integer', description: 'Breaths per minute', example: 22 },
      oxygenSaturation: { type: 'integer', description: 'SpO2 percentage', example: 94 },
      recordedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  LabResults: {
    type: 'object',
    properties: {
      testName: { type: 'string', example: 'Troponin I' },
      result: { type: 'string', example: '2.5 ng/mL' },
      referenceRange: { type: 'string', example: '< 0.04 ng/mL' },
      status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'ABNORMAL'], example: 'ABNORMAL' },
      dateConducted: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  MedicalHistory: {
    type: 'object',
    properties: {
      previousConditions: {
        type: 'array',
        items: { type: 'string' },
        example: ['Hypertension', 'Hyperlipidemia'],
      },
      familyHistory: {
        type: 'array',
        items: { type: 'string' },
        example: ['Father: Coronary Artery Disease'],
      },
      surgeries: {
        type: 'array',
        items: { type: 'string' },
        example: ['Appendectomy (2010)'],
      },
    },
  },
  DoctorNotes: {
    type: 'string',
    example: 'Patient arrived via EMS exhibiting severe chest pain. EKG confirmed STEMI. Initiated protocol and transferred to cath lab.',
  },
  Attachments: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileUrl: { type: 'string', example: 'https://storage.aws.com/records/ekg_trace.pdf' },
        documentType: { type: 'string', example: 'EKG Report' },
        uploadedAt: { $ref: '#/components/schemas/Timestamp' },
      },
    },
  },

  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  MedicalRecord: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      patientId: { $ref: '#/components/schemas/ObjectId' },
      doctorId: { $ref: '#/components/schemas/ObjectId' },
      hospitalId: { $ref: '#/components/schemas/ObjectId' },
      emergencyId: { $ref: '#/components/schemas/ObjectId', nullable: true },
      type: { type: 'string', enum: ['CONSULTATION', 'EMERGENCY_VISIT', 'DISCHARGE_SUMMARY', 'LAB_REPORT'], example: 'EMERGENCY_VISIT' },
      vitals: { $ref: '#/components/schemas/VitalSigns' },
      diagnosis: {
        type: 'array',
        items: { $ref: '#/components/schemas/Diagnosis' },
      },
      prescription: { $ref: '#/components/schemas/Prescription' },
      treatmentPlan: { $ref: '#/components/schemas/TreatmentPlan' },
      labResults: {
        type: 'array',
        items: { $ref: '#/components/schemas/LabResults' },
      },
      history: { $ref: '#/components/schemas/MedicalHistory' },
      doctorNotes: { $ref: '#/components/schemas/DoctorNotes' },
      attachments: { $ref: '#/components/schemas/Attachments' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  MedicalRecordSummary: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      type: { type: 'string', example: 'EMERGENCY_VISIT' },
      primaryDiagnosis: { type: 'string', example: 'Acute Myocardial Infarction' },
      doctorName: { type: 'string', example: 'Dr. Sarah Chen' },
      hospitalName: { type: 'string', example: 'St. Mary\'s Medical Center' },
      date: { $ref: '#/components/schemas/Timestamp' },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreateMedicalRecordRequest: {
    type: 'object',
    required: ['patientId', 'type'],
    properties: {
      patientId: { $ref: '#/components/schemas/ObjectId' },
      emergencyId: { $ref: '#/components/schemas/ObjectId', nullable: true },
      type: { type: 'string', enum: ['CONSULTATION', 'EMERGENCY_VISIT', 'DISCHARGE_SUMMARY', 'LAB_REPORT'] },
      vitals: { $ref: '#/components/schemas/VitalSigns' },
      diagnosis: {
        type: 'array',
        items: { $ref: '#/components/schemas/Diagnosis' },
      },
      prescription: { $ref: '#/components/schemas/Prescription' },
      treatmentPlan: { $ref: '#/components/schemas/TreatmentPlan' },
      labResults: {
        type: 'array',
        items: { $ref: '#/components/schemas/LabResults' },
      },
      history: { $ref: '#/components/schemas/MedicalHistory' },
      doctorNotes: { $ref: '#/components/schemas/DoctorNotes' },
    },
  },
  UpdateMedicalRecordRequest: {
    type: 'object',
    properties: {
      vitals: { $ref: '#/components/schemas/VitalSigns' },
      diagnosis: {
        type: 'array',
        items: { $ref: '#/components/schemas/Diagnosis' },
      },
      prescription: { $ref: '#/components/schemas/Prescription' },
      treatmentPlan: { $ref: '#/components/schemas/TreatmentPlan' },
      labResults: {
        type: 'array',
        items: { $ref: '#/components/schemas/LabResults' },
      },
      doctorNotes: { $ref: '#/components/schemas/DoctorNotes' },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  MedicalRecordResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              record: { $ref: '#/components/schemas/MedicalRecord' },
            },
          },
        },
      },
    ],
  },
  MedicalRecordListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/MedicalRecordSummary' },
          },
        },
      },
    ],
  },
});
