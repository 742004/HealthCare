import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

export const createNotificationSchema = z.object({
  body: z.object({
    receiver: objectIdSchema,
    sender: objectIdSchema.optional(),
    emergencyRequest: objectIdSchema.optional(),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.enum(['Alert', 'Info', 'Success', 'Warning']).optional(),
  }),
});

export const markAsReadSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
