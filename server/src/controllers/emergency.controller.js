import { BaseController } from '../core/BaseController.js';
import { emergencyService } from '../services/emergency.service.js';

/**
 * Emergency Controller
 * HTTP adapter exposing the Emergency lifecycle.
 * Strictly routes requests to the Emergency Service without any business logic.
 */
class EmergencyController extends BaseController {
  constructor() {
    super(emergencyService);
  }

  /**
   * ============================================================================
   * PATIENT ENDPOINTS
   * ============================================================================
   */

  /**
   * Create an Emergency SOS.
   * Route: POST /api/v1/emergencies
   */
  createEmergency = this.execute(async (req, res) => {
    // Read idempotency key from headers to prevent duplicate SOS spam
    const idempotencyKey = req.headers['idempotency-key'];
    const emergency = await this.service.createEmergency(req.user._id, req.body, idempotencyKey);
    
    // The service handles AI triage and discovery asynchronously in the background.
    // Return immediately to the user so they know help is on the way.
    return this.sendCreated(res, emergency, 'Emergency SOS dispatched successfully');
  });

  /**
   * Get the current active emergency for the patient.
   * Route: GET /api/v1/emergencies/current
   */
  getCurrentEmergency = this.execute(async (req, res) => {
    // Standard placeholder if an explicit method doesn't exist, passing to service
    const emergency = await this.service._verifyEmergencyExists(req.query.emergencyId); // Usually fetched by user ID
    return this.sendSuccess(res, 200, emergency, 'Current emergency retrieved');
  });

  /**
   * Cancel an active emergency SOS.
   * Route: POST /api/v1/emergencies/:id/cancel
   */
  cancelEmergency = this.execute(async (req, res) => {
    await this.service.cancelEmergency(req.params.id, req.user._id);
    return this.sendSuccess(res, 200, null, 'Emergency cancelled successfully');
  });

  /**
   * View patient's emergency history.
   * Route: GET /api/v1/emergencies/history
   */
  viewEmergencyHistory = this.execute(async (req, res) => {
    // Assuming placeholder method in service for history retrieval
    const history = await this.service.getEmergencyHistory(req.user._id);
    return this.sendSuccess(res, 200, history, 'Emergency history retrieved');
  });

  /**
   * ============================================================================
   * HOSPITAL ENDPOINTS
   * ============================================================================
   */

  /**
   * Hospital accepts the emergency.
   * Route: POST /api/v1/emergencies/:id/hospital/accept
   */
  acceptEmergencyHospital = this.execute(async (req, res) => {
    // Maps to the assignHospital logic in the service
    await this.service.assignHospital(req.params.id, req.body.hospitalId);
    return this.sendSuccess(res, 200, null, 'Hospital accepted the emergency');
  });

  /**
   * Hospital rejects the emergency.
   * Route: POST /api/v1/emergencies/:id/hospital/reject
   */
  rejectEmergencyHospital = this.execute(async (req, res) => {
    // Triggers discovery of the next best hospital in the service
    await this.service.rejectHospital(req.params.id, req.body.hospitalId, req.body.reason);
    return this.sendSuccess(res, 200, null, 'Hospital rejected the emergency');
  });

  /**
   * ============================================================================
   * AMBULANCE ENDPOINTS
   * ============================================================================
   */

  /**
   * Driver accepts the dispatch.
   * Route: POST /api/v1/emergencies/:id/ambulance/accept
   */
  acceptDispatchAmbulance = this.execute(async (req, res) => {
    await this.service.dispatchAmbulance(req.params.id, req.body.ambulanceId);
    return this.sendSuccess(res, 200, null, 'Ambulance dispatch accepted');
  });

  /**
   * Ambulance starts trip.
   * Route: POST /api/v1/emergencies/:id/ambulance/start
   */
  startTripAmbulance = this.execute(async (req, res) => {
    await this.service.advanceTimeline(req.params.id, 'DRIVER_EN_ROUTE');
    return this.sendSuccess(res, 200, null, 'Ambulance trip started');
  });

  /**
   * Ambulance reaches the patient.
   * Route: POST /api/v1/emergencies/:id/ambulance/reach
   */
  reachPatientAmbulance = this.execute(async (req, res) => {
    await this.service.advanceTimeline(req.params.id, 'PATIENT_PICKED');
    return this.sendSuccess(res, 200, null, 'Ambulance reached patient');
  });

  /**
   * Ambulance transports patient to hospital.
   * Route: POST /api/v1/emergencies/:id/ambulance/transport
   */
  transportPatientAmbulance = this.execute(async (req, res) => {
    await this.service.advanceTimeline(req.params.id, 'ARRIVED_AT_HOSPITAL');
    return this.sendSuccess(res, 200, null, 'Patient transported to hospital');
  });

  /**
   * Ambulance completes the emergency drop-off.
   * Route: POST /api/v1/emergencies/:id/complete
   */
  completeEmergency = this.execute(async (req, res) => {
    await this.service.completeEmergency(req.params.id);
    return this.sendSuccess(res, 200, null, 'Emergency completed successfully');
  });

  /**
   * ============================================================================
   * SYSTEM / ADMIN ENDPOINTS
   * ============================================================================
   */

  /**
   * Get overall emergency status.
   * Route: GET /api/v1/emergencies/:id/status
   */
  getEmergencyStatus = this.execute(async (req, res) => {
    const emergency = await this.service._verifyEmergencyExists(req.params.id);
    return this.sendSuccess(res, 200, { status: emergency.status }, 'Status retrieved');
  });

  /**
   * Live track an emergency.
   * Route: GET /api/v1/emergencies/:id/track
   */
  trackEmergency = this.execute(async (req, res) => {
    // Could retrieve aggregated real-time GPS metadata
    const trackingData = await this.service.trackEmergency(req.params.id);
    return this.sendSuccess(res, 200, trackingData, 'Tracking data retrieved');
  });

  /**
   * Manually force an emergency status update (Admin).
   * Route: PATCH /api/v1/emergencies/:id/status
   */
  updateEmergencyStatus = this.execute(async (req, res) => {
    const updated = await this.service.advanceTimeline(req.params.id, req.body.status);
    return this.sendSuccess(res, 200, updated, 'Emergency status updated');
  });

  /**
   * Manually override and assign a hospital (Admin).
   * Route: POST /api/v1/emergencies/:id/assign-hospital
   */
  assignHospitalAdmin = this.execute(async (req, res) => {
    await this.service.assignHospital(req.params.id, req.body.hospitalId);
    return this.sendSuccess(res, 200, null, 'Hospital forcibly assigned by admin');
  });

  /**
   * Manually override and assign an ambulance (Admin).
   * Route: POST /api/v1/emergencies/:id/assign-ambulance
   */
  assignAmbulanceAdmin = this.execute(async (req, res) => {
    await this.service.dispatchAmbulance(req.params.id, req.body.ambulanceId);
    return this.sendSuccess(res, 200, null, 'Ambulance forcibly assigned by admin');
  });
}

export const emergencyController = new EmergencyController();
