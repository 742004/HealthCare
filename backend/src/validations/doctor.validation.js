import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

export const createDoctorSchema = z.object({
  body: z.object({
    hospital: objectIdSchema.optional(),
    specialization: z.string().min(2, 'Specialization must be at least 2 characters').trim(),
    licenseNumber: z.string().min(4, 'License number is required').trim(),
    experienceYears: z.number().int().min(0, 'Experience years cannot be negative'),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    specialization: z.string().min(2).trim().optional(),
    experienceYears: z.number().int().min(0).optional(),
    // hospital, licenseNumber, isVerified, isActive cannot be modified by doctor directly
  }),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    status: z.enum(['Available', 'In Surgery', 'On Leave', 'Busy'], {
      required_error: 'Status is required',
      invalid_type_error: "Status must be one of 'Available', 'In Surgery', 'On Leave', 'Busy'",
    }),
  }),
});

export const getDoctorByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const queryDoctorsSchema = z.object({
  query: z.object({
    hospitalId: objectIdSchema.optional(),
    specialization: z.string().optional(),
    status: z.enum(['Available', 'In Surgery', 'On Leave', 'Busy']).optional(),
  }),
});
