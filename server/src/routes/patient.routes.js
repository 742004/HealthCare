import { Router } from 'express';
import { patientController } from '../controllers/patient.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as patientValidation from '../validations/patient.validation.js';

const router = Router();

/**
 * ============================================================================
 * PROTECTED ROUTES (Requires valid Access Token)
 * ============================================================================
 */
router.use(authenticate);

// Create profile (Any authenticated user can create a patient profile)
router.post(
  '/',
  validate(patientValidation.createProfileSchema),
  patientController.createProfile
);

// Get current patient profile
router.get(
  '/me',
  authorize('PATIENT'),
  patientController.getCurrentPatient
);

// Update patient profile
router.patch(
  '/me',
  authorize('PATIENT'),
  validate(patientValidation.updateProfileSchema),
  patientController.updateProfile
);

// Update live GPS location
router.patch(
  '/me/location',
  authorize('PATIENT'),
  validate(patientValidation.updateLocationSchema),
  patientController.updateLiveLocation
);

// Update emergency contacts
router.patch(
  '/me/emergency-contacts',
  authorize('PATIENT'),
  validate(patientValidation.updateEmergencyContactsSchema),
  patientController.updateEmergencyContacts
);

// Upload medical documents
router.post(
  '/me/documents',
  authorize('PATIENT'),
  validate(patientValidation.uploadDocumentsSchema),
  patientController.uploadDocuments
);

// View personal emergency history
router.get(
  '/me/emergencies',
  authorize('PATIENT'),
  patientController.viewEmergencyHistory
);

// Soft delete patient profile
router.delete(
  '/me',
  authorize('PATIENT'),
  patientController.softDeleteProfile
);

/**
 * ============================================================================
 * ADMIN / DOCTOR ROUTES
 * ============================================================================
 */

// Get specific patient by ID (Doctors and Admins only)
router.get(
  '/:id',
  authorize('DOCTOR', 'ADMIN', 'HOSPITAL'),
  validate(patientValidation.getPatientByIdSchema),
  patientController.getPatientById
);

export default router;
