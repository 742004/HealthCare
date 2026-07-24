import { BaseController } from '../core/BaseController.js';
import { notificationService } from '../services/notification.service.js';

/**
 * Notification Controller
 * HTTP adapter for handling user notification preferences and reads.
 */
class NotificationController extends BaseController {
  constructor() {
    super(notificationService);
  }

  /**
   * Retrieve paginated notifications for the authenticated user.
   * Route: GET /api/v1/notifications
   */
  getNotifications = this.execute(async (req, res) => {
    // Pagination params extracted via BaseController utility
    const { skip, limit } = this.getPaginationParams(req);
    // Placeholder assuming a getNotifications method exists in service or repository directly
    // const notifications = await this.service.getUserNotifications(req.user._id, skip, limit);
    return this.sendSuccess(res, 200, [], 'Notifications retrieved');
  });

  /**
   * Mark a specific notification as read.
   * Route: PATCH /api/v1/notifications/:id/read
   */
  markAsRead = this.execute(async (req, res) => {
    await this.service.markAsRead(req.params.id, req.user._id);
    return this.sendSuccess(res, 200, null, 'Notification marked as read');
  });

  /**
   * Mark all notifications for the user as read.
   * Route: PATCH /api/v1/notifications/read-all
   */
  markAllAsRead = this.execute(async (req, res) => {
    await this.service.markAllAsRead(req.user._id);
    return this.sendSuccess(res, 200, null, 'All notifications marked as read');
  });

  /**
   * Delete a specific notification.
   * Route: DELETE /api/v1/notifications/:id
   */
  deleteNotification = this.execute(async (req, res) => {
    await this.service.deleteNotification(req.params.id, req.user._id);
    return this.sendSuccess(res, 200, null, 'Notification deleted');
  });

  /**
   * Update notification channel preferences (e.g., disable SMS).
   * Route: PATCH /api/v1/notifications/preferences
   */
  updatePreferences = this.execute(async (req, res) => {
    const updated = await this.service.updatePreferences(req.user._id, req.body);
    return this.sendSuccess(res, 200, updated, 'Notification preferences updated');
  });

  /**
   * Manually trigger a test notification (Admin).
   * Route: POST /api/v1/notifications/test
   */
  sendTestNotification = this.execute(async (req, res) => {
    const { userId, templateKey, channels } = req.body;
    await this.service.sendTemplatedNotification(userId, channels, templateKey, { name: 'Test User' });
    return this.sendSuccess(res, 200, null, 'Test notification dispatched');
  });

  /**
   * Broadcast an alert to a specific role (Admin).
   * Route: POST /api/v1/notifications/broadcast
   */
  broadcastNotification = this.execute(async (req, res) => {
    const { role, templateKey, variables } = req.body;
    await this.service.broadcastToRole(role, templateKey, variables);
    return this.sendSuccess(res, 200, null, `Broadcast dispatched to role: ${role}`);
  });
}

export const notificationController = new NotificationController();
