import { z } from 'zod';

export const firebaseValidation = {
  deviceTokenSchema: z.object({
    body: z.object({
      token: z.string().min(10, "Invalid FCM token format"),
      deviceType: z.enum(['ANDROID', 'IOS', 'WEB']),
    }),
  }),

  removeDeviceSchema: z.object({
    body: z.object({
      token: z.string().min(10, "Invalid FCM token format"),
    }),
  }),

  preferenceSchema: z.object({
    body: z.object({
      emergencyAlerts: z.boolean().optional(),
      hospitalUpdates: z.boolean().optional(),
      ambulanceUpdates: z.boolean().optional(),
      chatNotifications: z.boolean().optional(),
      medicalRecordUpdates: z.boolean().optional(),
      appointmentReminders: z.boolean().optional(),
      marketing: z.boolean().optional(),
      doNotDisturb: z.object({
        enabled: z.boolean().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      }).optional(),
    }),
  }),

  topicSchema: z.object({
    body: z.object({
      topic: z.string().min(2, "Topic name is required"),
    }),
  }),

  sendSchema: z.object({
    body: z.object({
      recipientId: z.string().min(24),
      type: z.string(),
      title: z.string().min(1),
      body: z.string().min(1),
      dataPayload: z.record(z.any()).optional(),
    }),
  }),
};
