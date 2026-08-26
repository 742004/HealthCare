import express from 'express';
import firebaseController from '../controllers/firebase.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { firebaseValidation } from '../validations/firebase.validation.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import firebaseRateLimit from '../middleware/firebaseRateLimit.js';

const router = express.Router();

router.use(firebaseRateLimit);
router.use(authenticate); // All routes require authentication

// Device Token Management
router.post('/register-device', validateRequest(firebaseValidation.deviceTokenSchema), firebaseController.registerDevice);
router.delete('/remove-device', validateRequest(firebaseValidation.removeDeviceSchema), firebaseController.removeDevice);

// Preferences
router.get('/preferences', firebaseController.getPreferences);
router.post('/preferences', validateRequest(firebaseValidation.preferenceSchema), firebaseController.updatePreferences);

// History
router.get('/history', firebaseController.getHistory);
router.patch('/history/:id/read', firebaseController.markRead);

// Topic Management
router.post('/subscribe', validateRequest(firebaseValidation.topicSchema), firebaseController.subscribeTopic);
router.post('/unsubscribe', validateRequest(firebaseValidation.topicSchema), firebaseController.unsubscribeTopic);

// Send/Broadcast (Restricted to Admins or specific internal roles)
router.post('/send', authorize('ADMIN'), validateRequest(firebaseValidation.sendSchema), firebaseController.sendPush);

export default router;
