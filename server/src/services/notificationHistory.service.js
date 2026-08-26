import NotificationHistory from '../models/NotificationHistory.js';
import { ApiError } from '../utils/ApiError.js';

class NotificationHistoryService {
  async logNotification(recipientId, type, title, body, dataPayload) {
    try {
      const log = await NotificationHistory.create({
        recipientId,
        type,
        title,
        body,
        dataPayload,
      });
      return log;
    } catch (error) {
      console.error(`Failed to log notification history: ${error.message}`);
      return null;
    }
  }

  async updateDeliveryStatus(logId, status, errorMsg = null) {
    if (!logId) return;
    try {
      await NotificationHistory.findByIdAndUpdate(logId, {
        $set: {
          deliveryStatus: status,
          error: errorMsg,
          sentAt: status === 'SENT' ? Date.now() : undefined
        },
        $inc: { retryCount: status === 'FAILED' ? 1 : 0 }
      });
    } catch (error) {
      console.error(`Failed to update delivery status: ${error.message}`);
    }
  }

  async getUserHistory(userId, skip = 0, limit = 20) {
    try {
      const history = await NotificationHistory.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await NotificationHistory.countDocuments({ recipientId: userId });
      
      return { history, total };
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch notification history');
    }
  }

  async markAsRead(userId, logId) {
    try {
      await NotificationHistory.findOneAndUpdate(
        { _id: logId, recipientId: userId },
        { $set: { isRead: true, readAt: Date.now() } }
      );
      return true;
    } catch (error) {
      throw new ApiError(500, 'Failed to mark notification as read');
    }
  }
}

export default new NotificationHistoryService();
