import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

const geoJsonPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // Longitude
    z.number().min(-90).max(90)    // Latitude
  ]),
});

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const createProfileSchema = z.object({
  body: z.object({
    dateOfBirth: z.string().refine((date) => {
      const parsed = Date.parse(date);
      if (isNaN(parsed)) return false;
      return parsed <= Date.now(); // Cannot be in the future
    }, {
      message: 'Invalid date format or date is in the future',
    }),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    gender: z.enum(['Male', 'Female', 'Other']),
    emergencyContacts: z
      .array(
        z.object({
          name: z.string().min(1, 'Contact name is required').max(100),
          phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
          relation: z.string().min(1, 'Relation is required').max(50),
        })
      )
      .min(1, 'At least one emergency contact is required')
      .max(5, 'Maximum of 5 emergency contacts allowed'),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    location: geoJsonPointSchema.optional(),
  }).strict(), // Strict prevents user from passing in 'user' ID or 'isActive'
});

export const updateProfileSchema = z.object({
  body: z.object({
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).strict(),
});

export const updateLocationSchema = z.object({
  body: z.object({
    location: geoJsonPointSchema,
    timestamp: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid timestamp format',
    }).optional(),
  }).strict(),
});

export const updateEmergencyContactsSchema = z.object({
  body: z.object({
    contacts: z
      .array(
        z.object({
          name: z.string().min(1).max(100),
          phone: z.string().regex(phoneRegex),
          relation: z.string().min(1).max(50),
        })
      )
      .min(1)
      .max(5),
  }).strict(),
});

export const getPatientByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
