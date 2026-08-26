import { BaseController } from '../core/BaseController.js';
import { doctorService } from '../services/doctor.service.js';

/**
 * Doctor Controller
 * HTTP adapter routing doctor-related requests to the Doctor Service.
 */
class DoctorController extends BaseController {
  constructor() {
    super(doctorService);
  }

  /**
   * Create a new doctor profile linked to the authenticated user.
   * Route: POST /api/v1/doctors
   */
  createProfile = this.execute(async (req, res) => {
    const payload = { ...req.body, user: req.user._id };
    const profile = await this.service.createProfile(payload);
    return this.sendCreated(res, profile, 'Doctor profile created successfully');
  });

  /**
   * Retrieve the profile of the currently authenticated doctor.
   * Route: GET /api/v1/doctors/me
   */
  getCurrentDoctor = this.execute(async (req, res) => {
    const profile = await this.service.getProfileByUserId(req.user._id);
    return this.sendSuccess(res, 200, profile, 'Current doctor profile retrieved');
  });

  /**
   * Retrieve a specific doctor profile by ID (e.g., accessed by patients or hospitals).
   * Route: GET /api/v1/doctors/:id
   */
  getDoctorById = this.execute(async (req, res) => {
    const profile = await this.service.getProfileById(req.params.id);
    return this.sendSuccess(res, 200, profile, 'Doctor profile retrieved');
  });

  /**
   * Update the current doctor's profile.
   * Route: PATCH /api/v1/doctors/me
   */
  updateProfile = this.execute(async (req, res) => {
    const updatedProfile = await this.service.updateProfile(req.user._id, req.body);
    return this.sendSuccess(res, 200, updatedProfile, 'Doctor profile updated successfully');
  });

  /**
   * Update the doctor's availability status.
   * Route: PATCH /api/v1/doctors/me/availability
   */
  updateAvailability = this.execute(async (req, res) => {
    const { isAvailable } = req.body;
    await this.service.updateAvailability(req.user._id, isAvailable);
    return this.sendSuccess(res, 200, null, 'Availability updated successfully');
  });

  /**
   * View all emergencies currently assigned to this doctor.
   * Route: GET /api/v1/doctors/me/emergencies
   */
  viewAssignedEmergencies = this.execute(async (req, res) => {
    const emergencies = await this.service.getAssignedEmergencies(req.user._id);
    return this.sendSuccess(res, 200, emergencies, 'Assigned emergencies retrieved');
  });

  /**
   * Add medical consultation notes to a patient's case.
   * Route: POST /api/v1/doctors/me/consultations
   */
  addConsultationNotes = this.execute(async (req, res) => {
    const { emergencyId, notes } = req.body;
    await this.service.addConsultationNotes(req.user._id, emergencyId, notes);
    return this.sendSuccess(res, 200, null, 'Consultation notes added successfully');
  });

  /**
   * Soft delete the doctor's profile.
   * Route: DELETE /api/v1/doctors/me
   */
  softDeleteProfile = this.execute(async (req, res) => {
    await this.service.softDeleteProfile(req.user._id);
    return this.sendSuccess(res, 200, null, 'Doctor profile deactivated successfully');
  });
}

export const doctorController = new DoctorController();
