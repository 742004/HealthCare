import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as notifValidation from '../validations/notification.validation.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  notificationController.getNotifications
);

router.patch(
  '/:id/read',
  validate(notifValidation.markReadSchema),
  notificationController.markAsRead
);

router.patch(
  '/read-all',
  notificationController.markAllAsRead
);

router.delete(
  '/:id',
  validate(notifValidation.deleteNotificationSchema),
  notificationController.deleteNotification
);

router.patch(
  '/preferences',
  validate(notifValidation.updatePreferencesSchema),
  notificationController.updatePreferences
);

router.post(
  '/test',
  authorize('ADMIN'),
  validate(notifValidation.testNotificationSchema),
  notificationController.sendTestNotification
);

router.post(
  '/broadcast',
  authorize('ADMIN'),
  validate(notifValidation.broadcastNotificationSchema),
  notificationController.broadcastNotification
);

export default router;
