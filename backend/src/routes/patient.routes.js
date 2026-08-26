import { Router } from 'express';
import { patientController } from '../controllers/patient.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as patientValidation from '../validations/patient.validation.js';

const router = Router();

/**
 * ============================================================================
 * PROTECTED ROUTES (Requires valid Access Token)
 * ============================================================================
 */
router.use(authenticate);

// Create profile (Only PATIENT and ADMIN can create profiles)
router.post(
  '/',
  authorize('patient', 'admin'),
  validate(patientValidation.createProfileSchema),
  patientController.createProfile
);

// Get current patient profile
router.get(
  '/me',
  authorize('patient'),
  patientController.getCurrentPatient
);

// Update patient profile (demographics)
router.patch(
  '/me',
  authorize('patient'),
  validate(patientValidation.updateProfileSchema),
  patientController.updateProfile
);

// Update live GPS location
router.patch(
  '/me/location',
  authorize('patient'),
  validate(patientValidation.updateLocationSchema),
  patientController.updateLiveLocation
);

// Update emergency contacts
router.patch(
  '/me/emergency-contacts',
  authorize('patient'),
  validate(patientValidation.updateEmergencyContactsSchema),
  patientController.updateEmergencyContacts
);

// Soft delete patient profile
router.delete(
  '/me',
  authorize('patient', 'admin'),
  patientController.softDeleteProfile
);

/**
 * ============================================================================
 * ADMIN / DOCTOR / HOSPITAL / AMBULANCE ROUTES
 * ============================================================================
 */

// Get specific patient by ID
// Authorization logic is handled strictly inside the service via Server-Side Relationship lookups.
router.get(
  '/:id',
  authorize('doctor', 'admin', 'hospital', 'driver'),
  validate(patientValidation.getPatientByIdSchema),
  patientController.getPatientById
);

export default router;
