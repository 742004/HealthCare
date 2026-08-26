import { Router } from 'express';
import { medicalRecordController } from '../controllers/medicalRecord.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as mrValidation from '../validations/medicalRecord.validation.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  authorize('DOCTOR', 'HOSPITAL'),
  validate(mrValidation.createRecordSchema),
  medicalRecordController.createRecord
);

router.get(
  '/:id',
  authorize('PATIENT', 'DOCTOR', 'HOSPITAL', 'ADMIN'),
  validate(mrValidation.getRecordSchema),
  medicalRecordController.getRecord
);

router.patch(
  '/:id',
  authorize('DOCTOR', 'HOSPITAL'),
  validate(mrValidation.updateRecordSchema),
  medicalRecordController.updateRecord
);

router.post(
  '/:id/diagnoses',
  authorize('DOCTOR'),
  validate(mrValidation.addDiagnosisSchema),
  medicalRecordController.addDiagnosis
);

router.post(
  '/:id/prescriptions',
  authorize('DOCTOR'),
  validate(mrValidation.addPrescriptionSchema),
  medicalRecordController.addPrescription
);

router.post(
  '/:id/lab-reports',
  authorize('DOCTOR', 'HOSPITAL'),
  validate(mrValidation.uploadLabReportsSchema),
  medicalRecordController.uploadLabReport
);

router.post(
  '/:id/treatment-notes',
  authorize('DOCTOR', 'HOSPITAL'),
  validate(mrValidation.addTreatmentNotesSchema),
  medicalRecordController.addTreatmentNotes
);

router.get(
  '/:id/export',
  authorize('PATIENT', 'DOCTOR', 'HOSPITAL'),
  validate(mrValidation.exportRecordSchema),
  medicalRecordController.exportRecord
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  medicalRecordController.softDeleteRecord
);

export default router;
