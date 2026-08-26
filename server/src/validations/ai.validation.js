import { z } from 'zod';

/**
 * AI Request Validation Schemas
 * 
 * Validates incoming JSON payloads using Zod before they hit the AI Service,
 * preventing prompt injection or malformed data from wasting API tokens.
 */
export const aiValidation = {
  triageSchema: z.object({
    body: z.object({
      symptoms: z.string().min(3, "Symptoms are required"),
      age: z.number().positive().optional(),
      gender: z.string().optional(),
      painLevel: z.number().min(1).max(10).optional(),
      medicalHistory: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      currentMedication: z.array(z.string()).optional(),
      consciousness: z.string().optional(),
      location: z.string().optional(),
    }),
  }),

  chatSchema: z.object({
    body: z.object({
      message: z.string().min(1, "Message is required"),
      context: z.record(z.any()).optional(),
    }),
  }),

  hospitalSchema: z.object({
    body: z.object({
      emergencyType: z.string().min(2, "Emergency type is required"),
      condition: z.string().min(2, "Condition is required"),
      vitals: z.record(z.any()).optional(),
    }),
  }),

  doctorSchema: z.object({
    body: z.object({
      condition: z.string().min(2, "Condition is required"),
      severity: z.string().min(2, "Severity is required"),
      medicalHistory: z.array(z.string()).optional(),
    }),
  }),

  summarySchema: z.object({
    body: z.object({
      records: z.array(z.record(z.any())).min(1, "At least one record is required"),
    }),
  }),

  reportSchema: z.object({
    body: z.object({
      emergencyId: z.string().min(5, "Emergency ID is required"),
      timeline: z.array(z.record(z.any())).min(1, "Timeline events are required"),
      vitals: z.record(z.any()).optional(),
      notes: z.string().optional(),
    }),
  }),
};
