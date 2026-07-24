import { BaseController } from '../core/BaseController.js';
import { medicalRecordService } from '../services/medicalRecord.service.js';

/**
 * Medical Record Controller
 * HTTP adapter routing medical record requests to the Medical Record Service.
 */
class MedicalRecordController extends BaseController {
  constructor() {
    super(medicalRecordService);
  }

  /**
   * Create a new medical record.
   * Route: POST /api/v1/medical-records
   */
  createRecord = this.execute(async (req, res) => {
    const record = await this.service.createMedicalRecord(req.body);
    return this.sendCreated(res, record, 'Medical record created successfully');
  });

  /**
   * Retrieve a specific medical record.
   * Route: GET /api/v1/medical-records/:id
   */
  getRecord = this.execute(async (req, res) => {
    // Service handles verifying if req.user has permission to view this specific record
    const record = await this.service.viewMedicalRecord(req.params.id, req.user._id, req.user.role);
    return this.sendSuccess(res, 200, record, 'Medical record retrieved');
  });

  /**
   * Update basic details of a medical record.
   * Route: PATCH /api/v1/medical-records/:id
   */
  updateRecord = this.execute(async (req, res) => {
    const updated = await this.service.updateMedicalRecord(req.params.id, req.body);
    return this.sendSuccess(res, 200, updated, 'Medical record updated');
  });

  /**
   * Append a new diagnosis to the medical record.
   * Route: POST /api/v1/medical-records/:id/diagnoses
   */
  addDiagnosis = this.execute(async (req, res) => {
    const updated = await this.service.addDiagnosis(req.params.id, req.user._id, req.body.details);
    return this.sendSuccess(res, 200, updated, 'Diagnosis added successfully');
  });

  /**
   * Append a new prescription.
   * Route: POST /api/v1/medical-records/:id/prescriptions
   */
  addPrescription = this.execute(async (req, res) => {
    const updated = await this.service.addPrescription(req.params.id, req.user._id, req.body);
    return this.sendSuccess(res, 200, updated, 'Prescription added successfully');
  });

  /**
   * Upload a lab report reference.
   * Route: POST /api/v1/medical-records/:id/lab-reports
   */
  uploadLabReport = this.execute(async (req, res) => {
    const updated = await this.service.uploadLabReports(req.params.id, req.user._id, req.user.role, req.body.reportUrls);
    return this.sendSuccess(res, 200, updated, 'Lab reports uploaded successfully');
  });

  /**
   * Append treatment notes.
   * Route: POST /api/v1/medical-records/:id/treatment-notes
   */
  addTreatmentNotes = this.execute(async (req, res) => {
    const updated = await this.service.addTreatmentNotes(req.params.id, req.user._id, req.body.notes);
    return this.sendSuccess(res, 200, updated, 'Treatment notes added successfully');
  });

  /**
   * Export the medical record to a specific format (PDF/FHIR).
   * Route: GET /api/v1/medical-records/:id/export
   */
  exportRecord = this.execute(async (req, res) => {
    const { format } = req.query; // e.g., 'pdf' or 'fhir'
    let exportedData;
    
    if (format === 'fhir') {
      exportedData = await this.service.exportToFHIR(req.params.id);
    } else {
      exportedData = await this.service.exportToPDF(req.params.id);
    }
    
    return this.sendSuccess(res, 200, exportedData, `Medical record exported as ${format || 'PDF'}`);
  });

  /**
   * Soft delete a medical record.
   * Route: DELETE /api/v1/medical-records/:id
   */
  softDeleteRecord = this.execute(async (req, res) => {
    await this.service.softDeleteMedicalRecord(req.params.id);
    return this.sendSuccess(res, 200, null, 'Medical record deleted successfully');
  });
}

export const medicalRecordController = new MedicalRecordController();
