import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

export const createDoctorSchema = z.object({
  body: z.object({
    user: objectIdSchema,
    hospital: objectIdSchema,
    specialization: z.string().min(2, 'Specialization must be at least 2 characters').trim(),
    licenseNumber: z.string().min(4, 'License number is required'),
    experienceYears: z.number().int().min(0, 'Experience years cannot be negative'),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    hospital: objectIdSchema.optional(),
    specialization: z.string().optional(),
    availabilityStatus: z.enum(['Available', 'In Surgery', 'On Leave', 'Busy']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const queryDoctorsSchema = z.object({
  query: z.object({
    hospitalId: objectIdSchema.optional(),
    specialization: z.string().optional(),
    status: z.enum(['Available', 'In Surgery', 'On Leave', 'Busy']).optional(),
  }),
});
