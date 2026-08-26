import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

export const sendChatMessageSchema = z.object({
  body: z.object({
    receiver: objectIdSchema,
    emergencyRequest: objectIdSchema.optional(),
    messageType: z.enum(['Text', 'System', 'Location']).optional(),
    content: z.string().min(1, 'Message content cannot be empty'),
  }),
});

export const getChatHistorySchema = z.object({
  params: z.object({
    emergencyId: objectIdSchema,
  }),
});
