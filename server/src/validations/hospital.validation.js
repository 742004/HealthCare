import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const geoJsonPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
});

export const createHospitalSchema = z.object({
  body: z.object({
    admin: objectIdSchema,
    name: z.string().min(3, 'Hospital name is required').trim(),
    registrationNumber: z.string().min(3, 'Registration number is required'),
    contactNumber: z.string().regex(phoneRegex, 'Invalid phone number format'),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
    }).optional(),
    location: geoJsonPointSchema,
    facilities: z.array(z.string()).optional(),
  }),
});

export const updateHospitalStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(['Active', 'Suspended', 'Pending Verification']),
    isActive: z.boolean().optional(),
  }),
});

export const getNearbyHospitalsSchema = z.object({
  query: z.object({
    lng: z.string().refine((val) => !isNaN(parseFloat(val)), 'Longitude must be a number'),
    lat: z.string().refine((val) => !isNaN(parseFloat(val)), 'Latitude must be a number'),
    maxDistance: z.string().refine((val) => !isNaN(parseInt(val, 10)), 'Max distance must be a number').optional(),
  }),
});
