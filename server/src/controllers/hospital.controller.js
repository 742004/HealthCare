import { BaseController } from '../core/BaseController.js';
import { hospitalService } from '../services/hospital.service.js';
import { searchNearbyHospitals } from '../utils/geo.utils.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Hospital Controller
 * HTTP adapter routing hospital-related requests to the Hospital Service.
 */
class HospitalController extends BaseController {
  constructor() {
    super(hospitalService);
  }

  /**
   * Register a new hospital facility.
   * Route: POST /api/v1/hospitals
   */
  registerHospital = this.execute(async (req, res) => {
    const payload = { ...req.body, adminUser: req.user._id };
    const hospital = await this.service.registerHospital(payload);
    return this.sendCreated(res, hospital, 'Hospital registered successfully');
  });

  /**
   * Get nearby hospitals using Google Places API
   * Route: GET /api/v1/hospitals/nearby?lat=...&lng=...
   */
  getNearbyHospitals = this.execute(async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      throw new ApiError(400, 'Latitude and longitude are required');
    }
    const hospitals = await searchNearbyHospitals(lat, lng);
    return this.sendSuccess(res, hospitals, 'Nearby hospitals retrieved successfully');
  });

  /**
   * Retrieve hospital details by ID.
   * Route: GET /api/v1/hospitals/:id
   */
  getHospital = this.execute(async (req, res) => {
    const hospital = await this.service.getHospitalById(req.params.id);
    return this.sendSuccess(res, 200, hospital, 'Hospital retrieved');
  });

  /**
   * Update hospital basic details.
   * Route: PATCH /api/v1/hospitals/:id
   */
  updateHospital = this.execute(async (req, res) => {
    // Service handles verifying if req.user._id is the admin of this hospital
    const updated = await this.service.updateHospital(req.params.id, req.user._id, req.body);
    return this.sendSuccess(res, 200, updated, 'Hospital updated successfully');
  });

  /**
   * Manage hospital departments (add/remove/update).
   * Route: PATCH /api/v1/hospitals/:id/departments
   */
  manageDepartments = this.execute(async (req, res) => {
    const updated = await this.service.manageDepartments(req.params.id, req.user._id, req.body.departments);
    return this.sendSuccess(res, 200, updated, 'Departments updated successfully');
  });

  /**
   * Manage doctors affiliated with the hospital.
   * Route: PATCH /api/v1/hospitals/:id/doctors
   */
  manageDoctors = this.execute(async (req, res) => {
    const updated = await this.service.manageDoctors(req.params.id, req.user._id, req.body.doctors);
    return this.sendSuccess(res, 200, updated, 'Doctors updated successfully');
  });

  /**
   * Update real-time ICU/General bed availability.
   * Route: PATCH /api/v1/hospitals/:id/beds
   */
  updateBedAvailability = this.execute(async (req, res) => {
    const updated = await this.service.updateBedAvailability(req.params.id, req.user._id, req.body.beds);
    return this.sendSuccess(res, 200, updated, 'Bed availability updated');
  });

  /**
   * Accept an incoming emergency SOS request.
   * Route: POST /api/v1/hospitals/:id/emergencies/:emergencyId/accept
   */
  acceptEmergency = this.execute(async (req, res) => {
    await this.service.acceptEmergency(req.params.id, req.user._id, req.params.emergencyId);
    return this.sendSuccess(res, 200, null, 'Emergency accepted successfully');
  });

  /**
   * Reject an incoming emergency SOS request.
   * Route: POST /api/v1/hospitals/:id/emergencies/:emergencyId/reject
   */
  rejectEmergency = this.execute(async (req, res) => {
    const { reason } = req.body;
    await this.service.rejectEmergency(req.params.id, req.user._id, req.params.emergencyId, reason);
    return this.sendSuccess(res, 200, null, 'Emergency rejected');
  });

  /**
   * Retrieve statistical dashboard for hospital administrators.
   * Route: GET /api/v1/hospitals/:id/dashboard
   */
  getDashboard = this.execute(async (req, res) => {
    const dashboard = await this.service.getDashboardStats(req.params.id, req.user._id);
    return this.sendSuccess(res, 200, dashboard, 'Dashboard retrieved');
  });

  /**
   * Soft delete a hospital.
   * Route: DELETE /api/v1/hospitals/:id
   */
  softDeleteHospital = this.execute(async (req, res) => {
    await this.service.softDeleteHospital(req.params.id, req.user._id);
    return this.sendSuccess(res, 200, null, 'Hospital deactivated successfully');
  });
}

export const hospitalController = new HospitalController();
