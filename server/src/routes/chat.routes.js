import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as chatValidation from '../validations/chat.validation.js';

const router = Router();
router.use(authenticate);

router.post(
  '/conversations',
  validate(chatValidation.createConversationSchema),
  chatController.createConversation
);

router.get(
  '/conversations/:id',
  validate(chatValidation.getConversationSchema),
  chatController.getConversation
);

router.post(
  '/conversations/:id/messages',
  validate(chatValidation.sendMessageSchema),
  chatController.sendMessage
);

router.patch(
  '/messages/:messageId',
  validate(chatValidation.editMessageSchema),
  chatController.editMessage
);

router.delete(
  '/messages/:messageId',
  validate(chatValidation.deleteMessageSchema),
  chatController.deleteMessage
);

router.post(
  '/conversations/:id/attachments',
  validate(chatValidation.uploadAttachmentSchema),
  chatController.uploadAttachment
);

router.get(
  '/conversations/:id/messages',
  validate(chatValidation.getChatHistorySchema),
  chatController.getChatHistory
);

router.patch(
  '/conversations/:id/read',
  validate(chatValidation.markMessagesReadSchema),
  chatController.markMessagesRead
);

router.post(
  '/conversations/:id/typing',
  validate(chatValidation.typingIndicatorSchema),
  chatController.typingIndicator
);

router.post(
  '/presence',
  validate(chatValidation.onlinePresenceSchema),
  chatController.onlinePresence
);

export default router;
