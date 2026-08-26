import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

export const createMedicalRecordSchema = z.object({
  body: z.object({
    patient: objectIdSchema,
    doctor: objectIdSchema.optional(),
    hospital: objectIdSchema.optional(),
    diagnosis: z.string().min(3, 'Diagnosis is required'),
    prescription: z.array(
      z.object({
        medicineName: z.string().min(1, 'Medicine name is required'),
        dosage: z.string().min(1, 'Dosage is required'),
        duration: z.string().min(1, 'Duration is required'),
        notes: z.string().optional(),
      })
    ).optional(),
    notes: z.string().optional(),
  }),
});

export const getMedicalRecordsSchema = z.object({
  params: z.object({
    patientId: objectIdSchema,
  }),
});
