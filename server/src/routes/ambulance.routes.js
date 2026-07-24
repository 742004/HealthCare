import { Router } from 'express';
import { ambulanceController } from '../controllers/ambulance.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as ambulanceValidation from '../validations/ambulance.validation.js';

const router = Router();

/**
 * ============================================================================
 * PROTECTED AMBULANCE ROUTES
 * ============================================================================
 */
router.use(authenticate);

// Register a new ambulance vehicle (Admin only)
router.post(
  '/',
  authorize('ADMIN'),
  validate(ambulanceValidation.registerAmbulanceSchema),
  ambulanceController.registerAmbulance
);

// Get ambulance details (Publicly visible to any authenticated user)
router.get(
  '/:id',
  validate(ambulanceValidation.getAmbulanceSchema),
  ambulanceController.getAmbulance // Assuming standard getter exists in controller base
);

// Update ambulance details
router.patch(
  '/:id',
  authorize('ADMIN', 'AMBULANCE'),
  validate(ambulanceValidation.updateAmbulanceSchema),
  ambulanceController.updateAmbulance // Assuming update exists
);

// Update live GPS location of the ambulance (High frequency)
router.patch(
  '/:id/location',
  authorize('AMBULANCE'),
  validate(ambulanceValidation.updateLocationSchema),
  ambulanceController.updateLocation
);

// Assign a driver to the ambulance
router.post(
  '/:id/driver',
  authorize('ADMIN', 'HOSPITAL'),
  validate(ambulanceValidation.assignDriverSchema),
  ambulanceController.assignDriver
);

// Driver accepts the emergency dispatch
router.post(
  '/:id/emergencies/:emergencyId/accept',
  authorize('AMBULANCE'),
  ambulanceController.acceptDispatch
);

// Start the trip toward the patient
router.post(
  '/:id/trips/:emergencyId/start',
  authorize('AMBULANCE'),
  ambulanceController.startTrip
);

// Mark arrival at the patient's location
router.post(
  '/:id/trips/:emergencyId/reach-patient',
  authorize('AMBULANCE'),
  ambulanceController.reachPatient
);

// Complete the trip after reaching the hospital
router.post(
  '/:id/trips/:emergencyId/complete',
  authorize('AMBULANCE'),
  ambulanceController.completeTrip
);

// Retrieve statistical dashboard for the driver
router.get(
  '/:id/dashboard',
  authorize('AMBULANCE', 'ADMIN'),
  ambulanceController.getDashboard
);

// Soft delete an ambulance vehicle
router.delete(
  '/:id',
  authorize('ADMIN'),
  ambulanceController.softDeleteAmbulance
);

export default router;
