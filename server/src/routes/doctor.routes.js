import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as doctorValidation from '../validations/doctor.validation.js';

const router = Router();

/**
 * ============================================================================
 * PROTECTED ROUTES (Requires valid Access Token)
 * ============================================================================
 */
router.use(authenticate);

// Create doctor profile
router.post(
  '/',
  validate(doctorValidation.createProfileSchema),
  doctorController.createProfile
);

// Get current doctor profile
router.get(
  '/me',
  authorize('DOCTOR'),
  doctorController.getCurrentDoctor
);

// Update doctor profile
router.patch(
  '/me',
  authorize('DOCTOR'),
  validate(doctorValidation.updateProfileSchema),
  doctorController.updateProfile
);

// Update availability status
router.patch(
  '/me/availability',
  authorize('DOCTOR'),
  validate(doctorValidation.updateAvailabilitySchema),
  doctorController.updateAvailability
);

// View assigned emergencies
router.get(
  '/me/emergencies',
  authorize('DOCTOR'),
  doctorController.viewAssignedEmergencies
);

// Add consultation notes to an emergency/patient case
router.post(
  '/consultations',
  authorize('DOCTOR'),
  validate(doctorValidation.addConsultationSchema),
  doctorController.addConsultationNotes
);

// Soft delete doctor profile
router.delete(
  '/me',
  authorize('DOCTOR'),
  doctorController.softDeleteProfile
);

/**
 * ============================================================================
 * PUBLIC / SYSTEM ROUTES
 * ============================================================================
 */

// Get specific doctor by ID (Visible to patients, hospitals, admins)
router.get(
  '/:id',
  validate(doctorValidation.getDoctorByIdSchema),
  doctorController.getDoctorById
);

export default router;
