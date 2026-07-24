import { BaseController } from '../core/BaseController.js';
import { patientService } from '../services/patient.service.js';

/**
 * Patient Controller
 * Pure HTTP adapter routing patient-related requests to the Patient Service.
 */
class PatientController extends BaseController {
  constructor() {
    super(patientService);
  }

  /**
   * Create a new patient profile linked to the authenticated user.
   * Route: POST /api/v1/patients
   */
  createProfile = this.execute(async (req, res) => {
    // Inject the authenticated user's ID into the payload
    const payload = { ...req.body, user: req.user._id };
    const profile = await this.service.createProfile(payload);
    return this.sendCreated(res, profile, 'Patient profile created successfully');
  });

  /**
   * Retrieve the profile of the currently authenticated patient.
   * Route: GET /api/v1/patients/me
   */
  getCurrentPatient = this.execute(async (req, res) => {
    const profile = await this.service.getProfileByUserId(req.user._id);
    return this.sendSuccess(res, 200, profile, 'Current patient profile retrieved');
  });

  /**
   * Retrieve a specific patient profile by ID (e.g., accessed by doctors).
   * Route: GET /api/v1/patients/:id
   */
  getPatientById = this.execute(async (req, res) => {
    // Service handles checking if the requesting user has permission to view this profile
    const profile = await this.service.getProfileById(req.params.id, req.user._id, req.user.role);
    return this.sendSuccess(res, 200, profile, 'Patient profile retrieved');
  });

  /**
   * Update the current patient's profile.
   * Route: PATCH /api/v1/patients/me
   */
  updateProfile = this.execute(async (req, res) => {
    const updatedProfile = await this.service.updateProfile(req.user._id, req.body);
    return this.sendSuccess(res, 200, updatedProfile, 'Patient profile updated successfully');
  });

  /**
   * Update the patient's live GPS location for tracking during an SOS.
   * Route: PATCH /api/v1/patients/me/location
   */
  updateLiveLocation = this.execute(async (req, res) => {
    const { lng, lat } = req.body;
    await this.service.updateLiveLocation(req.user._id, lng, lat);
    return this.sendSuccess(res, 200, null, 'Live location updated');
  });

  /**
   * Update the patient's emergency contacts array.
   * Route: PATCH /api/v1/patients/me/emergency-contacts
   */
  updateEmergencyContacts = this.execute(async (req, res) => {
    const updatedProfile = await this.service.updateEmergencyContacts(req.user._id, req.body.contacts);
    return this.sendSuccess(res, 200, updatedProfile, 'Emergency contacts updated successfully');
  });

  /**
   * Upload medical documents (IDs, insurance) for the patient.
   * Route: POST /api/v1/patients/me/documents
   */
  uploadDocuments = this.execute(async (req, res) => {
    // Actual file upload handled by Multer/Firebase beforehand, passing URLs in body
    const updatedProfile = await this.service.uploadDocuments(req.user._id, req.body.documents);
    return this.sendSuccess(res, 200, updatedProfile, 'Documents uploaded successfully');
  });

  /**
   * Retrieve the history of emergencies triggered by this patient.
   * Route: GET /api/v1/patients/me/emergencies
   */
  viewEmergencyHistory = this.execute(async (req, res) => {
    const history = await this.service.getEmergencyHistory(req.user._id);
    return this.sendSuccess(res, 200, history, 'Emergency history retrieved');
  });

  /**
   * Soft delete the patient's profile.
   * Route: DELETE /api/v1/patients/me
   */
  softDeleteProfile = this.execute(async (req, res) => {
    await this.service.softDeleteProfile(req.user._id);
    return this.sendSuccess(res, 200, null, 'Patient profile deactivated successfully');
  });
}

export const patientController = new PatientController();
