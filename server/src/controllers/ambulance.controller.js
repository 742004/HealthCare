import { BaseController } from '../core/BaseController.js';
import { ambulanceService } from '../services/ambulance.service.js';

/**
 * Ambulance Controller
 * HTTP adapter routing ambulance-related requests to the Ambulance Service.
 */
class AmbulanceController extends BaseController {
  constructor() {
    super(ambulanceService);
  }

  /**
   * Register a new ambulance vehicle.
   * Route: POST /api/v1/ambulances
   */
  registerAmbulance = this.execute(async (req, res) => {
    const ambulance = await this.service.registerAmbulance(req.body);
    return this.sendCreated(res, ambulance, 'Ambulance registered successfully');
  });

  /**
   * Assign a driver to a specific ambulance.
   * Route: PATCH /api/v1/ambulances/:id/driver
   */
  getAmbulance = this.execute(async (req, res) => { res.json({ status: 'success', data: null }); });
  updateAmbulance = this.execute(async (req, res) => { res.json({ status: 'success', data: null }); });
  assignDriver = this.execute(async (req, res) => {
    const { driverId } = req.body;
    const ambulance = await this.service.assignDriver(req.params.id, driverId);
    return this.sendSuccess(res, 200, ambulance, 'Driver assigned successfully');
  });

  /**
   * Update live GPS location of the ambulance.
   * Route: PATCH /api/v1/ambulances/:id/location
   */
  updateLocation = this.execute(async (req, res) => {
    const { lng, lat } = req.body;
    // Driver auth check can be performed within the service
    await this.service.updateLiveLocation(req.params.id, lng, lat);
    return this.sendSuccess(res, 200, null, 'Location updated');
  });

  /**
   * Accept an incoming emergency dispatch.
   * Route: POST /api/v1/ambulances/:id/dispatches/:emergencyId/accept
   */
  acceptDispatch = this.execute(async (req, res) => {
    await this.service.acceptDispatch(req.params.id, req.params.emergencyId);
    return this.sendSuccess(res, 200, null, 'Dispatch accepted successfully');
  });

  /**
   * Start the trip toward the patient.
   * Route: POST /api/v1/ambulances/:id/trips/:emergencyId/start
   */
  startTrip = this.execute(async (req, res) => {
    await this.service.startJourney(req.params.id, req.params.emergencyId);
    return this.sendSuccess(res, 200, null, 'Trip started towards patient');
  });

  /**
   * Mark arrival at the patient's location.
   * Route: POST /api/v1/ambulances/:id/trips/:emergencyId/reach-patient
   */
  reachPatient = this.execute(async (req, res) => {
    await this.service.reachPatient(req.params.id, req.params.emergencyId);
    return this.sendSuccess(res, 200, null, 'Arrived at patient location');
  });

  /**
   * Complete the trip after reaching the destination hospital.
   * Route: POST /api/v1/ambulances/:id/trips/:emergencyId/complete
   */
  completeTrip = this.execute(async (req, res) => {
    await this.service.completeTrip(req.params.id, req.params.emergencyId);
    return this.sendSuccess(res, 200, null, 'Trip completed successfully');
  });

  /**
   * Retrieve statistical dashboard for the driver.
   * Route: GET /api/v1/ambulances/driver/:driverId/dashboard
   */
  getDashboard = this.execute(async (req, res) => {
    const dashboard = await this.service.getDriverDashboardStatistics(req.params.driverId);
    return this.sendSuccess(res, 200, dashboard, 'Dashboard retrieved');
  });

  /**
   * Soft delete an ambulance vehicle.
   * Route: DELETE /api/v1/ambulances/:id
   */
  softDeleteAmbulance = this.execute(async (req, res) => {
    await this.service.softDeleteAmbulance(req.params.id);
    return this.sendSuccess(res, 200, null, 'Ambulance deactivated successfully');
  });
}

export const ambulanceController = new AmbulanceController();
