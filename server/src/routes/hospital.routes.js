import { Router } from 'express';
import { hospitalController } from '../controllers/hospital.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as hospitalValidation from '../validations/hospital.validation.js';

const router = Router();

/**
 * ============================================================================
 * PROTECTED HOSPITAL ROUTES
 * ============================================================================
 */
router.use(authenticate);

// Register a new hospital facility
router.post(
  '/',
  authorize('ADMIN'),
  validate(hospitalValidation.registerHospitalSchema),
  hospitalController.registerHospital
);

// Get specific hospital (Publicly visible to any authenticated user)
router.get(
  '/:id',
  validate(hospitalValidation.getHospitalSchema),
  hospitalController.getHospital
);

// Update hospital basic details
router.patch(
  '/:id',
  authorize('HOSPITAL', 'ADMIN'),
  validate(hospitalValidation.updateHospitalSchema),
  hospitalController.updateHospital
);

// Update real-time ICU/General bed availability
router.patch(
  '/:id/beds',
  authorize('HOSPITAL'),
  validate(hospitalValidation.updateBedsSchema),
  hospitalController.updateBedAvailability
);

// Add a new department
router.post(
  '/:id/departments',
  authorize('HOSPITAL', 'ADMIN'),
  validate(hospitalValidation.manageDepartmentSchema),
  hospitalController.manageDepartments
);

// Update an existing department
router.patch(
  '/:id/departments/:departmentId',
  authorize('HOSPITAL', 'ADMIN'),
  validate(hospitalValidation.manageDepartmentSchema),
  hospitalController.manageDepartments
);

// Remove a department
router.delete(
  '/:id/departments/:departmentId',
  authorize('HOSPITAL', 'ADMIN'),
  hospitalController.manageDepartments
);

// Add affiliated doctors
router.post(
  '/:id/doctors',
  authorize('HOSPITAL', 'ADMIN'),
  validate(hospitalValidation.manageDoctorsSchema),
  hospitalController.manageDoctors
);

// Remove affiliated doctors
router.delete(
  '/:id/doctors/:doctorId',
  authorize('HOSPITAL', 'ADMIN'),
  hospitalController.manageDoctors
);

// Accept an incoming emergency SOS request
router.post(
  '/:id/emergencies/:emergencyId/accept',
  authorize('HOSPITAL'),
  hospitalController.acceptEmergency
);

// Reject an incoming emergency SOS request
router.post(
  '/:id/emergencies/:emergencyId/reject',
  authorize('HOSPITAL'),
  validate(hospitalValidation.rejectEmergencySchema),
  hospitalController.rejectEmergency
);

// Retrieve statistical dashboard for hospital administrators
router.get(
  '/:id/dashboard',
  authorize('HOSPITAL', 'ADMIN'),
  hospitalController.getDashboard
);

// Soft delete a hospital
router.delete(
  '/:id',
  authorize('ADMIN'),
  hospitalController.softDeleteHospital
);

export default router;
