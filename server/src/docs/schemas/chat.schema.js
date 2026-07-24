/**
 * Chat OpenAPI Schemas
 * 
 * Defines the request and response structures for messaging,
 * chat rooms, media attachments, and read receipts.
 */

export const chatSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Sub-components & Fragments
  // ---------------------------------------------------------
  ChatParticipant: {
    type: 'object',
    properties: {
      userId: { $ref: '#/components/schemas/ObjectId' },
      role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'HOSPITAL', 'AMBULANCE', 'ADMIN'], example: 'DOCTOR' },
      joinedAt: { $ref: '#/components/schemas/Timestamp' },
      lastReadAt: { $ref: '#/components/schemas/Timestamp', nullable: true },
    },
  },
  MessageAttachment: {
    type: 'object',
    properties: {
      url: { type: 'string', example: 'https://storage.aws.com/chat-media/xray-scan.jpg' },
      type: { type: 'string', enum: ['IMAGE', 'DOCUMENT', 'LOCATION'], example: 'IMAGE' },
      name: { type: 'string', example: 'xray-scan.jpg' },
      sizeBytes: { type: 'integer', example: 1048576 },
    },
    description: 'Multimedia or location data attached to a chat message',
  },
  TypingIndicator: {
    type: 'object',
    properties: {
      userId: { $ref: '#/components/schemas/ObjectId' },
      roomId: { $ref: '#/components/schemas/ObjectId' },
      isTyping: { type: 'boolean', example: true },
    },
  },
  ReadReceipt: {
    type: 'object',
    properties: {
      messageId: { $ref: '#/components/schemas/ObjectId' },
      readByUserId: { $ref: '#/components/schemas/ObjectId' },
      readAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  ChatStatistics: {
    type: 'object',
    properties: {
      totalMessages: { type: 'integer', example: 45 },
      participantsCount: { type: 'integer', example: 3 },
      lastActivityAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },

  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  ChatRoom: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      type: { type: 'string', enum: ['DIRECT', 'EMERGENCY_GROUP', 'CONSULTATION'], example: 'EMERGENCY_GROUP' },
      title: { type: 'string', nullable: true, example: 'Ambulance AMB-104 & St. Mary\'s Coordination' },
      emergencyId: { $ref: '#/components/schemas/ObjectId', nullable: true, description: 'Linked emergency request if applicable' },
      participants: {
        type: 'array',
        items: { $ref: '#/components/schemas/ChatParticipant' },
      },
      status: { type: 'string', enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'], example: 'ACTIVE' },
      statistics: { $ref: '#/components/schemas/ChatStatistics' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  ChatMessage: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      roomId: { $ref: '#/components/schemas/ObjectId' },
      senderId: { $ref: '#/components/schemas/ObjectId' },
      text: { type: 'string', example: 'Patient\'s oxygen saturation dropping, preparing for intubation.' },
      attachments: {
        type: 'array',
        items: { $ref: '#/components/schemas/MessageAttachment' },
      },
      isEdited: { type: 'boolean', example: false },
      isDeleted: { type: 'boolean', example: false },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  ChatSummary: {
    type: 'object',
    properties: {
      roomId: { $ref: '#/components/schemas/ObjectId' },
      title: { type: 'string', example: 'Consultation with Dr. Sarah Chen' },
      lastMessage: { type: 'string', example: 'Yes, please come in at 9 AM.' },
      lastMessageAt: { $ref: '#/components/schemas/Timestamp' },
      unreadCount: { type: 'integer', example: 2 },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreateChatRoomRequest: {
    type: 'object',
    required: ['type', 'participantIds'],
    properties: {
      type: { type: 'string', enum: ['DIRECT', 'EMERGENCY_GROUP', 'CONSULTATION'] },
      title: { type: 'string', nullable: true },
      participantIds: {
        type: 'array',
        items: { $ref: '#/components/schemas/ObjectId' },
      },
      emergencyId: { $ref: '#/components/schemas/ObjectId', nullable: true },
    },
  },
  SendMessageRequest: {
    type: 'object',
    properties: {
      text: { type: 'string', example: 'We are 2 minutes away from the hospital.' },
      attachments: {
        type: 'array',
        items: { $ref: '#/components/schemas/MessageAttachment' },
      },
    },
    // Either text or attachments must be present, though OpenAPI doesn't strictly enforce that in standard UI easily,
    // this acts as the schema envelope.
  },
  UpdateMessageRequest: {
    type: 'object',
    required: ['text'],
    properties: {
      text: { type: 'string', example: 'We are 1 minute away from the hospital. (Correction)' },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  ChatResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              room: { $ref: '#/components/schemas/ChatRoom' },
            },
          },
        },
      },
    ],
  },
  ChatListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChatSummary' },
          },
        },
      },
    ],
  },
  MessageResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              message: { $ref: '#/components/schemas/ChatMessage' },
            },
          },
        },
      },
    ],
  },
  MessageListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChatMessage' },
          },
        },
      },
    ],
  },
});
