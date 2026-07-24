import { z } from 'zod';

/**
 * Maps Request Validation Schemas
 * 
 * Validates incoming JSON payloads to ensure valid coordinates and Google API parameters.
 */
const coordinateObject = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const mapsValidation = {
  coordinateSchema: z.object({
    body: coordinateObject,
  }),

  geocodeSchema: z.object({
    body: z.object({
      address: z.string().min(5, "Address must be at least 5 characters long"),
    }),
  }),

  routeSchema: z.object({
    body: z.object({
      origin: coordinateObject,
      destination: coordinateObject,
      waypoints: z.array(coordinateObject).optional(),
      options: z.record(z.any()).optional(),
    }),
  }),

  nearbySchema: z.object({
    body: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius: z.number().min(100).max(50000).optional(), // 100m to 50km
    }),
  }),

  trackSchema: z.object({
    body: z.object({
      entityType: z.enum(['AMBULANCE', 'PATIENT', 'EMERGENCY', 'HOSPITAL']),
      entityId: z.string().min(5),
      coordinates: coordinateObject,
      heading: z.number().min(0).max(360).optional(),
      speed: z.number().min(0).optional(),
    }),
  }),
};
