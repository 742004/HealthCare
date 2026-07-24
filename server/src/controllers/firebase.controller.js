import deviceTokenService from '../services/deviceToken.service.js';
import notificationPreferenceService from '../services/notificationPreference.service.js';
import notificationHistoryService from '../services/notificationHistory.service.js';
import firebaseNotificationService from '../services/firebaseNotification.service.js';
import { catchAsync } from '../utils/helpers.js';

class FirebaseController {
  
  registerDevice = catchAsync(async (req, res) => {
    const { token, deviceType } = req.body;
    await deviceTokenService.registerToken(req.user.id, token, deviceType);
    res.status(200).json({ success: true, message: 'Device registered successfully' });
  });

  removeDevice = catchAsync(async (req, res) => {
    const { token } = req.body;
    await deviceTokenService.removeToken(req.user.id, token);
    res.status(200).json({ success: true, message: 'Device removed successfully' });
  });

  getPreferences = catchAsync(async (req, res) => {
    const prefs = await notificationPreferenceService.getPreferences(req.user.id);
    res.status(200).json({ success: true, data: prefs });
  });

  updatePreferences = catchAsync(async (req, res) => {
    const prefs = await notificationPreferenceService.updatePreferences(req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Preferences updated', data: prefs });
  });

  getHistory = catchAsync(async (req, res) => {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const data = await notificationHistoryService.getUserHistory(req.user.id, skip, limit);
    res.status(200).json({ success: true, data: data.history, meta: { total: data.total, skip, limit } });
  });

  markRead = catchAsync(async (req, res) => {
    await notificationHistoryService.markAsRead(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  });

  subscribeTopic = catchAsync(async (req, res) => {
    await firebaseNotificationService.subscribeUserToTopic(req.user.id, req.body.topic);
    res.status(200).json({ success: true, message: `Subscribed to ${req.body.topic}` });
  });

  unsubscribeTopic = catchAsync(async (req, res) => {
    await firebaseNotificationService.unsubscribeUserFromTopic(req.user.id, req.body.topic);
    res.status(200).json({ success: true, message: `Unsubscribed from ${req.body.topic}` });
  });

  // Admin / Internal use mainly
  sendPush = catchAsync(async (req, res) => {
    const { recipientId, type, title, body, dataPayload } = req.body;
    await firebaseNotificationService.sendToUser(recipientId, type, title, body, dataPayload);
    res.status(200).json({ success: true, message: 'Notification queued' });
  });
}

export default new FirebaseController();
