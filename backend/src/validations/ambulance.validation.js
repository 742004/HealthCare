import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

const geoJsonPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
});

export const createAmbulanceSchema = z.object({
  body: z.object({
    driver: objectIdSchema,
    hospital: objectIdSchema.optional(),
    vehicleNumber: z.string().min(2, 'Vehicle number is required'),
    vehicleType: z.enum(['Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'Patient Transport']),
    equipmentLevel: z.array(z.string()).optional(),
    location: geoJsonPointSchema.optional(),
  }),
});

export const updateAmbulanceStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(['Available', 'On Route', 'Busy', 'Off Duty', 'Maintenance']),
    location: geoJsonPointSchema.optional(),
  }),
});

export const getAmbulanceByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
