import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

const geoJsonPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
  address: z.string().optional(),
});

export const createEmergencySchema = z.object({
  body: z.object({
    patient: objectIdSchema,
    hospital: objectIdSchema.optional(),
    pickupLocation: geoJsonPointSchema,
    symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
    aiSeverityScore: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  }),
});

export const updateEmergencyStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    ambulance: objectIdSchema.optional(),
    doctor: objectIdSchema.optional(),
    status: z.enum(['Pending', 'Accepted', 'En Route', 'Arrived', 'In Transit', 'Completed', 'Cancelled']),
  }),
});

export const queryEmergenciesSchema = z.object({
  query: z.object({
    hospitalId: objectIdSchema.optional(),
    status: z.enum(['Pending', 'Accepted', 'En Route', 'Arrived', 'In Transit', 'Completed', 'Cancelled']).optional(),
  }),
});
