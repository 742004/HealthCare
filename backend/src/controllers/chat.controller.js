import { BaseController } from '../core/BaseController.js';
import { chatService } from '../services/chat.service.js';

/**
 * Chat Controller
 * HTTP adapter for handling secure messaging operations.
 */
class ChatController extends BaseController {
  constructor() {
    super(chatService);
  }

  /**
   * Create a new chat conversation.
   * Route: POST /api/v1/chat/conversations
   */
  createConversation = this.execute(async (req, res) => {
    const { participants, conversationType, metadata } = req.body;
    
    // Ensure the creator is automatically included in the chat
    const allParticipants = [...new Set([...participants, req.user._id.toString()])];
    
    const conversation = await this.service.createConversation(allParticipants, {}, conversationType, metadata);
    return this.sendCreated(res, conversation, 'Conversation created successfully');
  });

  /**
   * Get conversation details.
   * Route: GET /api/v1/chat/conversations/:id
   */
  getConversation = this.execute(async (req, res) => {
    // The service inherently acts as a guard using _verifyConversationAccess
    const conversation = await this.service._verifyConversationAccess(req.params.id, req.user._id);
    return this.sendSuccess(res, 200, conversation, 'Conversation retrieved');
  });

  /**
   * Send a text message to a conversation.
   * Route: POST /api/v1/chat/conversations/:id/messages
   */
  sendMessage = this.execute(async (req, res) => {
    const message = await this.service.sendMessage(req.params.id, req.user._id, req.body.text);
    return this.sendCreated(res, message, 'Message sent successfully');
  });

  /**
   * Edit an existing message (time-limited).
   * Route: PATCH /api/v1/chat/messages/:messageId
   */
  editMessage = this.execute(async (req, res) => {
    const updated = await this.service.editMessage(req.params.messageId, req.user._id, req.body.text);
    return this.sendSuccess(res, 200, updated, 'Message edited successfully');
  });

  /**
   * Soft delete a message.
   * Route: DELETE /api/v1/chat/messages/:messageId
   */
  deleteMessage = this.execute(async (req, res) => {
    await this.service.deleteMessage(req.params.messageId, req.user._id);
    return this.sendSuccess(res, 200, null, 'Message deleted successfully');
  });

  /**
   * Upload an attachment to the chat (Image, PDF, etc).
   * Route: POST /api/v1/chat/conversations/:id/attachments
   */
  uploadAttachment = this.execute(async (req, res) => {
    const { fileUrl, fileType, mimeType, sizeBytes } = req.body;
    const message = await this.service.uploadAttachment(
      req.params.id, 
      req.user._id, 
      fileUrl, 
      fileType, 
      mimeType, 
      sizeBytes
    );
    return this.sendCreated(res, message, 'Attachment uploaded successfully');
  });

  /**
   * Get paginated chat history.
   * Route: GET /api/v1/chat/conversations/:id/messages
   */
  getChatHistory = this.execute(async (req, res) => {
    const { skip, limit } = this.getPaginationParams(req);
    const history = await this.service.getConversationHistory(req.params.id, req.user._id, skip, limit);
    return this.sendSuccess(res, 200, history, 'Chat history retrieved');
  });

  /**
   * Mark all messages in a conversation as read.
   * Route: PATCH /api/v1/chat/conversations/:id/read
   */
  markMessagesRead = this.execute(async (req, res) => {
    await this.service.markMessagesAsRead(req.params.id, req.user._id);
    return this.sendSuccess(res, 200, null, 'Messages marked as read');
  });

  /**
   * Broadcast typing indicator.
   * Route: POST /api/v1/chat/conversations/:id/typing
   */
  typingIndicator = this.execute(async (req, res) => {
    await this.service.broadcastTypingIndicator(req.params.id, req.user._id, req.body.isTyping);
    return this.sendSuccess(res, 200, null, 'Typing indicator broadcasted');
  });

  /**
   * Update user online presence.
   * Route: POST /api/v1/chat/presence
   */
  onlinePresence = this.execute(async (req, res) => {
    await this.service.updateOnlinePresence(req.user._id, req.body.status);
    return this.sendSuccess(res, 200, null, 'Online presence updated');
  });
}

export const chatController = new ChatController();
