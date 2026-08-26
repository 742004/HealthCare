import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

const geoJsonPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
});

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const createPatientSchema = z.object({
  body: z.object({
    user: objectIdSchema,
    dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format (must be ISO string)',
    }),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    gender: z.enum(['Male', 'Female', 'Other']),
    emergencyContacts: z
      .array(
        z.object({
          name: z.string().min(1, 'Contact name is required'),
          phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
          relation: z.string().min(1, 'Relation is required'),
        })
      )
      .min(1, 'At least one emergency contact is required'),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    location: geoJsonPointSchema.optional(),
  }),
});

export const updatePatientSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    location: geoJsonPointSchema.optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

export const getPatientByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
