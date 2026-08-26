import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as doctorValidation from '../validations/doctor.validation.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('doctor'),
  validate(doctorValidation.createDoctorSchema),
  doctorController.createProfile
);

router.get(
  '/me',
  authorize('doctor'),
  doctorController.getCurrentDoctor
);

router.patch(
  '/me',
  authorize('doctor'),
  validate(doctorValidation.updateDoctorSchema),
  doctorController.updateProfile
);

router.patch(
  '/me/availability',
  authorize('doctor'),
  validate(doctorValidation.updateAvailabilitySchema),
  doctorController.updateAvailability
);

router.get(
  '/me/emergencies',
  authorize('doctor'),
  doctorController.viewAssignedEmergencies
);

router.delete(
  '/me',
  authorize('doctor'),
  doctorController.softDeleteProfile
);

// Public projection, accessible by any authenticated user
router.get(
  '/:id',
  validate(doctorValidation.getDoctorByIdSchema),
  doctorController.getDoctorById
);

export default router;
