import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { AMBULANCE_STATUS, EMERGENCY_STATUS } from '../utils/constants.js';

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDERS
 * Abstracts direct Mongoose model access. To be replaced by respective repositories.
 * ============================================================================
 */
const AmbulanceRepository = {
  findAmbulanceById: async (id, session = null) => null,
  findAmbulanceByDriver: async (driverId, session = null) => null,
  createAmbulance: async (data, session = null) => null,
  updateAmbulance: async (id, data, session = null) => null,
  softDeleteAmbulance: async (id, session = null) => null,
  getDriverStats: async (driverId, session = null) => null,
};

const EmergencyRepository = {
  findEmergencyById: async (id, session = null) => null,
  updateEmergencyStatus: async (id, status, session = null) => null,
  findEmergenciesByDriver: async (driverId, session = null) => null,
};

/**
 * Ambulance Service
 * Core business logic for Ambulance operations, fleet management, and emergency response trips.
 */
class AmbulanceService {
  /**
   * Internal helper to verify ownership/existence
   * @private
   */
  async _verifyAmbulanceExists(ambulanceId, session = null) {
    const ambulance = await AmbulanceRepository.findAmbulanceById(ambulanceId, session);
    if (!ambulance) throw new ApiError(404, 'Ambulance not found', 'AMBULANCE_NOT_FOUND');
    return ambulance;
  }

  /**
   * Registers a new Ambulance.
   * @param {Object} ambulanceData - Details about the ambulance.
   * @returns {Promise<Object>} Created ambulance profile.
   */
  async registerAmbulance(ambulanceData) {
    const ambulance = await AmbulanceRepository.createAmbulance(ambulanceData);
    logger.info(`[AUDIT] Ambulance Registered: ${ambulance._id}`);
    return ambulance;
  }

  /**
   * Updates Ambulance details.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {Object} updateData - Data to update.
   * @returns {Promise<Object>} Updated ambulance profile.
   */
  async updateAmbulanceDetails(ambulanceId, updateData) {
    await this._verifyAmbulanceExists(ambulanceId);
    const ambulance = await AmbulanceRepository.updateAmbulance(ambulanceId, updateData);
    logger.info(`[AUDIT] Ambulance Updated: ${ambulanceId}`);
    return ambulance;
  }

  /**
   * Soft deletes an ambulance profile.
   * @param {string} ambulanceId - Ambulance ID.
   * @returns {Promise<boolean>} Success status.
   */
  async softDeleteAmbulance(ambulanceId) {
    const result = await AmbulanceRepository.softDeleteAmbulance(ambulanceId);
    if (!result) throw new ApiError(404, 'Ambulance not found');
    logger.warn(`[AUDIT] Ambulance Soft Deleted: ${ambulanceId}`);
    return true;
  }

  /**
   * Assigns a driver to an ambulance.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} driverUserId - User ID of the driver.
   * @returns {Promise<Object>} Updated ambulance.
   */
  async assignDriver(ambulanceId, driverUserId) {
    const existing = await AmbulanceRepository.findAmbulanceByDriver(driverUserId);
    if (existing) {
      throw new ApiError(409, 'Driver is already assigned to another ambulance', 'DRIVER_UNAVAILABLE');
    }

    const ambulance = await AmbulanceRepository.updateAmbulance(ambulanceId, { driver: driverUserId });
    if (!ambulance) throw new ApiError(404, 'Ambulance not found');
    
    logger.info(`[AUDIT] Driver ${driverUserId} assigned to Ambulance ${ambulanceId}`);
    return ambulance;
  }

  /**
   * Removes a driver from an ambulance.
   * @param {string} ambulanceId - Ambulance ID.
   * @returns {Promise<Object>} Updated ambulance.
   */
  async removeDriver(ambulanceId) {
    const ambulance = await AmbulanceRepository.updateAmbulance(ambulanceId, { $unset: { driver: 1 } });
    if (!ambulance) throw new ApiError(404, 'Ambulance not found');
    
    logger.info(`[AUDIT] Driver removed from Ambulance ${ambulanceId}`);
    return ambulance;
  }

  /**
   * Fast, non-transactional update for Live GPS Location.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {number} lng - Longitude.
   * @param {number} lat - Latitude.
   * @returns {Promise<Object>} Updated ambulance.
   */
  async updateLiveLocation(ambulanceId, lng, lat) {
    const locationData = { location: { type: 'Point', coordinates: [lng, lat] } };
    const ambulance = await AmbulanceRepository.updateAmbulance(ambulanceId, locationData);
    if (!ambulance) throw new ApiError(404, 'Ambulance not found');
    return ambulance;
  }

  /**
   * Updates basic availability status (Available, Maintenance, Offline).
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} status - New status from AMBULANCE_STATUS.
   * @returns {Promise<Object>} Updated ambulance.
   */
  async updateStatus(ambulanceId, status) {
    const ambulance = await AmbulanceRepository.updateAmbulance(ambulanceId, { status });
    if (!ambulance) throw new ApiError(404, 'Ambulance not found');
    logger.debug(`Ambulance ${ambulanceId} status changed to ${status}`);
    return ambulance;
  }

  /**
   * Accepts a dispatch request.
   * Ensures ambulance is available and not already assigned.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async acceptDispatch(ambulanceId, emergencyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const ambulance = await this._verifyAmbulanceExists(ambulanceId, session);
      if (ambulance.status !== AMBULANCE_STATUS.AVAILABLE) {
        throw new ApiError(400, 'Ambulance is not available to accept dispatches', 'AMBULANCE_UNAVAILABLE');
      }

      const emergency = await EmergencyRepository.findEmergencyById(emergencyId, session);
      if (!emergency) throw new ApiError(404, 'Emergency request not found');

      // Update Ambulance state
      await AmbulanceRepository.updateAmbulance(ambulanceId, { 
        status: AMBULANCE_STATUS.ASSIGNED,
        currentEmergency: emergencyId
      }, session);

      // Update Emergency state
      await EmergencyRepository.updateEmergencyStatus(emergencyId, EMERGENCY_STATUS.AMBULANCE_ASSIGNED, session);

      logger.info(`[AUDIT] Ambulance ${ambulanceId} ACCEPTED dispatch for Emergency ${emergencyId}`);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Rejects a dispatch request, leaving ambulance available.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async rejectDispatch(ambulanceId, emergencyId) {
    await this._verifyAmbulanceExists(ambulanceId);
    logger.warn(`[AUDIT] Ambulance ${ambulanceId} REJECTED dispatch for Emergency ${emergencyId}`);
    return true; // Rerouting handled by emergency.service
  }

  /**
   * Starts the journey toward the patient.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async startJourney(ambulanceId, emergencyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await AmbulanceRepository.updateAmbulance(ambulanceId, { status: AMBULANCE_STATUS.ON_ROUTE }, session);
      await EmergencyRepository.updateEmergencyStatus(emergencyId, EMERGENCY_STATUS.DRIVER_EN_ROUTE, session);

      logger.info(`[AUDIT] Ambulance ${ambulanceId} STARTED JOURNEY for Emergency ${emergencyId}`);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Driver reports reaching the patient's location.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async reachPatient(ambulanceId, emergencyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await AmbulanceRepository.updateAmbulance(ambulanceId, { status: AMBULANCE_STATUS.BUSY }, session);
      await EmergencyRepository.updateEmergencyStatus(emergencyId, EMERGENCY_STATUS.PATIENT_PICKED, session);

      logger.info(`[AUDIT] Ambulance ${ambulanceId} REACHED PATIENT for Emergency ${emergencyId}`);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Driver reports reaching the destination hospital.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async reachHospital(ambulanceId, emergencyId) {
    await EmergencyRepository.updateEmergencyStatus(emergencyId, EMERGENCY_STATUS.ARRIVED_AT_HOSPITAL);
    logger.info(`[AUDIT] Ambulance ${ambulanceId} REACHED HOSPITAL for Emergency ${emergencyId}`);
    return true;
  }

  /**
   * Completes the trip atomically. Frees the ambulance and finalizes the emergency.
   * @param {string} ambulanceId - Ambulance ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async completeTrip(ambulanceId, emergencyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Free the ambulance
      await AmbulanceRepository.updateAmbulance(ambulanceId, { 
        status: AMBULANCE_STATUS.AVAILABLE,
        $unset: { currentEmergency: 1 }
      }, session);

      // Finalize the emergency
      await EmergencyRepository.updateEmergencyStatus(emergencyId, EMERGENCY_STATUS.COMPLETED, session);

      logger.info(`[AUDIT] Ambulance ${ambulanceId} COMPLETED TRIP for Emergency ${emergencyId}`);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Retrieves historical trips handled by this driver.
   * @param {string} driverId - Driver User ID.
   * @returns {Promise<Array>} List of emergencies.
   */
  async getTripHistory(driverId) {
    return await EmergencyRepository.findEmergenciesByDriver(driverId);
  }

  /**
   * Aggregates driver performance statistics for their dashboard.
   * @param {string} driverId - Driver User ID.
   * @returns {Promise<Object>} Dashboard metrics.
   */
  async getDriverDashboardStatistics(driverId) {
    const stats = await AmbulanceRepository.getDriverStats(driverId);
    return stats || { totalTrips: 0, averageResponseTime: 0, currentStatus: AMBULANCE_STATUS.OFFLINE };
  }
}

export const ambulanceService = new AmbulanceService();
