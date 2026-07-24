/**
 * Notification OpenAPI Schemas
 * 
 * Defines the request and response structures for system alerts,
 * push notifications, SMS, email configurations, and user preferences.
 */

export const notificationSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Sub-components & Fragments
  // ---------------------------------------------------------
  NotificationRecipient: {
    type: 'object',
    properties: {
      userId: { $ref: '#/components/schemas/ObjectId', description: 'The target user receiving the notification' },
      role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'HOSPITAL', 'AMBULANCE', 'ADMIN'], example: 'HOSPITAL' },
    },
  },
  NotificationPayload: {
    type: 'object',
    properties: {
      title: { type: 'string', example: 'Emergency SOS Triggered' },
      body: { type: 'string', example: 'A critical cardiac emergency has been reported 1.2 miles from your location.' },
      imageUrl: { type: 'string', nullable: true, example: 'https://cdn.healthcareconnector.com/icons/alert-critical.png' },
    },
  },
  NotificationMetadata: {
    type: 'object',
    properties: {
      entityType: { type: 'string', enum: ['EMERGENCY', 'MEDICAL_RECORD', 'CHAT', 'SYSTEM'], example: 'EMERGENCY' },
      entityId: { $ref: '#/components/schemas/ObjectId', description: 'The ID of the emergency, record, or chat room' },
      actionUrl: { type: 'string', nullable: true, example: '/dashboard/emergencies/60d5ecb8b392d700153cd123' },
    },
  },
  NotificationPreferences: {
    type: 'object',
    properties: {
      emailEnabled: { type: 'boolean', example: true },
      smsEnabled: { type: 'boolean', example: true },
      pushEnabled: { type: 'boolean', example: true },
      doNotDisturb: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', example: false },
          startTime: { type: 'string', example: '22:00' },
          endTime: { type: 'string', example: '07:00' },
        },
      },
    },
  },
  PushNotification: {
    type: 'object',
    properties: {
      fcmToken: { type: 'string', example: 'fcm-device-token-string...' },
      badgeCount: { type: 'integer', example: 3 },
      sound: { type: 'string', example: 'siren.wav' },
    },
  },
  EmailNotification: {
    type: 'object',
    properties: {
      subject: { type: 'string', example: 'Medical Record Updated - Lab Results Available' },
      templateId: { type: 'string', example: 'tmpl_lab_results_v2' },
    },
  },
  SMSNotification: {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string', example: '+14155552020' },
      messageText: { type: 'string', example: 'Healthcare Connector: Ambulance AMB-104 is 5 mins away.' },
    },
  },

  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  Notification: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      type: { type: 'string', enum: ['EMERGENCY_CREATED', 'HOSPITAL_ASSIGNED', 'AMBULANCE_DISPATCHED', 'AMBULANCE_ARRIVED', 'DOCTOR_ASSIGNED', 'MEDICAL_RECORD_UPDATED', 'CHAT_MESSAGE_RECEIVED'], example: 'AMBULANCE_DISPATCHED' },
      recipient: { $ref: '#/components/schemas/NotificationRecipient' },
      payload: { $ref: '#/components/schemas/NotificationPayload' },
      metadata: { $ref: '#/components/schemas/NotificationMetadata' },
      isRead: { type: 'boolean', example: false },
      readAt: { $ref: '#/components/schemas/Timestamp', nullable: true },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  NotificationSummary: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      title: { type: 'string', example: 'Ambulance Dispatched' },
      type: { type: 'string', example: 'AMBULANCE_DISPATCHED' },
      isRead: { type: 'boolean', example: false },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreateNotificationRequest: {
    type: 'object',
    required: ['type', 'recipientId', 'payload'],
    properties: {
      type: { type: 'string', enum: ['EMERGENCY_CREATED', 'HOSPITAL_ASSIGNED', 'AMBULANCE_DISPATCHED', 'AMBULANCE_ARRIVED', 'DOCTOR_ASSIGNED', 'MEDICAL_RECORD_UPDATED', 'CHAT_MESSAGE_RECEIVED'] },
      recipientId: { $ref: '#/components/schemas/ObjectId' },
      payload: { $ref: '#/components/schemas/NotificationPayload' },
      metadata: { $ref: '#/components/schemas/NotificationMetadata' },
      channels: {
        type: 'array',
        items: { type: 'string', enum: ['IN_APP', 'PUSH', 'EMAIL', 'SMS'] },
        example: ['IN_APP', 'PUSH'],
      },
    },
  },
  UpdateNotificationRequest: {
    type: 'object',
    properties: {
      preferences: { $ref: '#/components/schemas/NotificationPreferences' },
    },
  },
  MarkAsReadRequest: {
    type: 'object',
    required: ['notificationIds'],
    properties: {
      notificationIds: {
        type: 'array',
        items: { $ref: '#/components/schemas/ObjectId' },
        description: 'Array of notification IDs to mark as read',
      },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  NotificationResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              notification: { $ref: '#/components/schemas/Notification' },
            },
          },
        },
      },
    ],
  },
  NotificationListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/NotificationSummary' },
          },
          unreadCount: { type: 'integer', example: 4 },
        },
      },
    ],
  },
});
