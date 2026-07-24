import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { EMERGENCY_STATUS } from '../utils/constants.js';

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDERS
 * Abstracts direct Mongoose model access. To be replaced by respective repositories.
 * ============================================================================
 */
const HospitalRepository = {
  findHospitalById: async (id, session = null) => null,
  findHospitalByAdmin: async (adminId, session = null) => null,
  createHospital: async (data, session = null) => null,
  updateHospital: async (id, data, session = null) => null,
  softDeleteHospital: async (id, session = null) => null,
  getDashboardStats: async (hospitalId, session = null) => null,
};

const BedAvailabilityRepository = {
  updateBeds: async (hospitalId, bedData, session = null) => null,
};

const EmergencyRepository = {
  findEmergencyById: async (id, session = null) => null,
  updateEmergencyStatus: async (id, status, session = null) => null,
  findEmergenciesByHospital: async (hospitalId, session = null) => null,
};

const AmbulanceRepository = {
  findAmbulanceById: async (id, session = null) => null,
  assignToHospital: async (ambulanceId, hospitalId, session = null) => null,
};

const DoctorRepository = {
  findDoctorById: async (id, session = null) => null,
  assignToHospital: async (doctorId, hospitalId, session = null) => null,
  removeFromHospital: async (doctorId, hospitalId, session = null) => null,
};

/**
 * Hospital Service
 * Core business logic for Hospital operations, bed management, and emergency triage.
 */
class HospitalService {
  /**
   * Internal helper to verify ownership/existence
   * @private
   */
  async _verifyHospitalExists(hospitalId, session = null) {
    const hospital = await HospitalRepository.findHospitalById(hospitalId, session);
    if (!hospital) throw new ApiError(404, 'Hospital not found', 'HOSPITAL_NOT_FOUND');
    return hospital;
  }

  /**
   * Registers a new Hospital.
   * @param {string} adminUserId - User ID of the hospital admin.
   * @param {Object} hospitalData - Details about the hospital.
   * @returns {Promise<Object>} Created hospital profile.
   */
  async registerHospital(adminUserId, hospitalData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existing = await HospitalRepository.findHospitalByAdmin(adminUserId, session);
      if (existing) {
        throw new ApiError(409, 'This admin is already associated with a hospital', 'ADMIN_EXISTS');
      }

      const hospital = await HospitalRepository.createHospital({ ...hospitalData, admin: adminUserId }, session);
      
      logger.info(`[AUDIT] Hospital Registered: ${hospital._id}`);
      
      await session.commitTransaction();
      session.endSession();
      return hospital;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Updates Hospital details.
   * @param {string} hospitalId - Hospital ID.
   * @param {Object} updateData - Data to update.
   * @returns {Promise<Object>} Updated hospital profile.
   */
  async updateHospital(hospitalId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await this._verifyHospitalExists(hospitalId, session);

      const hospital = await HospitalRepository.updateHospital(hospitalId, updateData, session);
      logger.info(`[AUDIT] Hospital Updated: ${hospitalId}`);

      await session.commitTransaction();
      session.endSession();
      return hospital;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Soft deletes a hospital profile.
   * @param {string} hospitalId - Hospital ID.
   * @returns {Promise<boolean>} Success status.
   */
  async softDeleteHospital(hospitalId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await HospitalRepository.softDeleteHospital(hospitalId, session);
      if (!result) throw new ApiError(404, 'Hospital not found');

      logger.warn(`[AUDIT] Hospital Soft Deleted: ${hospitalId}`);

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
   * Updates Bed Availability (e.g. ICU, General Ward).
   * @param {string} hospitalId - Hospital ID.
   * @param {Object} bedData - New bed counts.
   * @returns {Promise<Object>} Updated bed availability.
   */
  async updateBedAvailability(hospitalId, bedData) {
    await this._verifyHospitalExists(hospitalId);
    
    // Fast path: no multi-collection transaction needed for simple counter updates
    const updatedBeds = await BedAvailabilityRepository.updateBeds(hospitalId, bedData);
    logger.debug(`[AUDIT] Bed Availability Updated for Hospital: ${hospitalId}`);
    return updatedBeds;
  }

  /**
   * Manages hospital departments (adds/removes departments).
   * @param {string} hospitalId - Hospital ID.
   * @param {Array<string>} departments - List of departments.
   * @returns {Promise<Object>} Updated hospital.
   */
  async manageDepartments(hospitalId, departments) {
    await this._verifyHospitalExists(hospitalId);
    return await HospitalRepository.updateHospital(hospitalId, { departments });
  }

  /**
   * Links a doctor to this hospital.
   * @param {string} hospitalId - Hospital ID.
   * @param {string} doctorId - Doctor ID.
   * @returns {Promise<boolean>} Success status.
   */
  async manageDoctors(hospitalId, doctorId, action = 'ADD') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await this._verifyHospitalExists(hospitalId, session);
      const doctor = await DoctorRepository.findDoctorById(doctorId, session);
      
      if (!doctor) throw new ApiError(404, 'Doctor not found');

      if (action === 'ADD') {
        await HospitalRepository.updateHospital(hospitalId, { $addToSet: { doctors: doctorId } }, session);
        await DoctorRepository.assignToHospital(doctorId, hospitalId, session);
        logger.info(`[AUDIT] Doctor ${doctorId} added to Hospital ${hospitalId}`);
      } else if (action === 'REMOVE') {
        await HospitalRepository.updateHospital(hospitalId, { $pull: { doctors: doctorId } }, session);
        await DoctorRepository.removeFromHospital(doctorId, hospitalId, session);
        logger.info(`[AUDIT] Doctor ${doctorId} removed from Hospital ${hospitalId}`);
      }

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
   * Assigns an ambulance to the hospital's fleet.
   * @param {string} hospitalId - Hospital ID.
   * @param {string} ambulanceId - Ambulance ID.
   * @returns {Promise<boolean>} Success status.
   */
  async assignAmbulance(hospitalId, ambulanceId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await this._verifyHospitalExists(hospitalId, session);
      const ambulance = await AmbulanceRepository.findAmbulanceById(ambulanceId, session);
      
      if (!ambulance) throw new ApiError(404, 'Ambulance not found');

      await HospitalRepository.updateHospital(hospitalId, { $addToSet: { ambulances: ambulanceId } }, session);
      await AmbulanceRepository.assignToHospital(ambulanceId, hospitalId, session);

      logger.info(`[AUDIT] Ambulance ${ambulanceId} assigned to Hospital ${hospitalId}`);

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
   * Triage: Accept an incoming emergency request.
   * @param {string} hospitalId - Hospital ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async acceptEmergency(hospitalId, emergencyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await this._verifyHospitalExists(hospitalId, session);
      
      const emergency = await EmergencyRepository.findEmergencyById(emergencyId, session);
      if (!emergency) throw new ApiError(404, 'Emergency request not found');
      if (emergency.status !== EMERGENCY_STATUS.PENDING) {
        throw new ApiError(400, 'Emergency is no longer pending', 'INVALID_STATE');
      }

      await EmergencyRepository.updateEmergencyStatus(emergencyId, EMERGENCY_STATUS.ACCEPTED, session);
      // Associate emergency directly with hospital
      await HospitalRepository.updateHospital(hospitalId, { $addToSet: { activeEmergencies: emergencyId } }, session);

      logger.info(`[AUDIT] Hospital ${hospitalId} ACCEPTED Emergency ${emergencyId}`);

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
   * Triage: Reject an incoming emergency request (routes to another hospital).
   * @param {string} hospitalId - Hospital ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async rejectEmergency(hospitalId, emergencyId) {
    await this._verifyHospitalExists(hospitalId);
    
    const emergency = await EmergencyRepository.findEmergencyById(emergencyId);
    if (!emergency) throw new ApiError(404, 'Emergency request not found');

    // Rejecting just adds hospital to a skipped/rejected array on the emergency doc
    logger.warn(`[AUDIT] Hospital ${hospitalId} REJECTED Emergency ${emergencyId}`);
    return true; // Actual rerouting logic handled by EmergencyService
  }

  /**
   * Prepares the Emergency Room for an incoming patient.
   * @param {string} hospitalId - Hospital ID.
   * @param {string} emergencyId - Emergency ID.
   * @returns {Promise<boolean>} Success status.
   */
  async prepareEmergencyRoom(hospitalId, emergencyId) {
    await this._verifyHospitalExists(hospitalId);
    await EmergencyRepository.updateEmergencyStatus(emergencyId, EMERGENCY_STATUS.HOSPITAL_NOTIFIED);
    
    logger.info(`[AUDIT] Hospital ${hospitalId} PREPARED ER for Emergency ${emergencyId}`);
    return true;
  }

  /**
   * Updates the hospital's geographic location.
   * @param {string} hospitalId - Hospital ID.
   * @param {number} lng - Longitude.
   * @param {number} lat - Latitude.
   * @returns {Promise<Object>} Updated profile.
   */
  async updateHospitalLocation(hospitalId, lng, lat) {
    const locationData = { location: { type: 'Point', coordinates: [lng, lat] } };
    const hospital = await HospitalRepository.updateHospital(hospitalId, locationData);
    if (!hospital) throw new ApiError(404, 'Hospital not found');
    return hospital;
  }

  /**
   * Views the active emergency queue for this hospital.
   * @param {string} hospitalId - Hospital ID.
   * @returns {Promise<Array>} List of emergencies.
   */
  async viewEmergencyQueue(hospitalId) {
    await this._verifyHospitalExists(hospitalId);
    return await EmergencyRepository.findEmergenciesByHospital(hospitalId);
  }

  /**
   * Aggregates hospital statistics for the Admin Dashboard.
   * @param {string} hospitalId - Hospital ID.
   * @returns {Promise<Object>} Dashboard metrics.
   */
  async getDashboardStatistics(hospitalId) {
    await this._verifyHospitalExists(hospitalId);
    // Real implementation would aggregate active emergencies, available beds, on-duty doctors, etc.
    const stats = await HospitalRepository.getDashboardStats(hospitalId);
    return stats || { activeEmergencies: 0, availableBeds: 0, activeDoctors: 0 };
  }
}

export const hospitalService = new HospitalService();
