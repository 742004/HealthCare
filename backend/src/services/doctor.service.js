import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { USER_ROLES } from '../utils/constants.js';

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDER
 * Abstracts direct Mongoose model access. To be replaced by repositories.
 * ============================================================================
 */
const DoctorRepository = {
  findProfileByUser: async (userId, session = null) => null,
  findProfileById: async (id, session = null) => null,
  createProfile: async (data, session = null) => null,
  updateProfile: async (id, data, session = null) => null,
  softDeleteProfile: async (id, session = null) => null,
};

const HospitalRepository = {
  findHospitalById: async (id, session = null) => null,
  addDoctorToHospital: async (hospitalId, doctorId, session = null) => null,
  removeDoctorFromHospital: async (hospitalId, doctorId, session = null) => null,
};

const MedicalRecordRepository = {
  findRecordById: async (id, session = null) => null,
  findRecordsByPatientId: async (patientId, session = null) => null,
  updateRecord: async (id, data, session = null) => null,
};

const EmergencyRepository = {
  findEmergenciesByDoctor: async (doctorId, session = null) => null,
};

/**
 * Doctor Service
 * Pure business logic for managing Doctor profiles, hospital assignments, and medical records.
 */
class DoctorService {
  /**
   * Internal helper to verify ownership/existence
   * @private
   */
  async _verifyDoctorExists(doctorId) {
    const doctor = await DoctorRepository.findProfileById(doctorId);
    if (!doctor) throw new ApiError(404, 'Doctor profile not found', 'DOCTOR_NOT_FOUND');
    return doctor;
  }

  /**
   * Creates a new Doctor profile.
   * @param {string} userId - The ID of the User creating the profile.
   * @param {Object} data - Doctor details (license, specialization, etc).
   * @returns {Promise<Object>} Created doctor profile plain object.
   */
  async createProfile(userId, data) {
    if (!userId || !data.licenseNumber) {
      throw new ApiError(400, 'User ID and License Number are required for creation.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existing = await DoctorRepository.findProfileByUser(userId, session);
      if (existing) {
        throw new ApiError(409, 'Doctor profile already exists for this user', 'PROFILE_EXISTS');
      }

      const profile = await DoctorRepository.createProfile({ ...data, user: userId }, session);
      
      logger.info(`[AUDIT] Doctor Profile Created: ${profile._id}`);
      
      await session.commitTransaction();
      session.endSession();
      return profile;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Retrieves a Doctor's profile.
   * @param {string} doctorId - Doctor's ID.
   * @returns {Promise<Object>} The doctor profile plain object.
   */
  async getProfile(doctorId) {
    const doctor = await this._verifyDoctorExists(doctorId);
    return doctor;
  }

  /**
   * Updates a Doctor's basic profile details.
   * @param {string} doctorId - Doctor's ID.
   * @param {Object} updateData - Data to update.
   * @returns {Promise<Object>} Updated profile.
   */
  async updateProfile(doctorId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await this._verifyDoctorExists(doctorId);

      const profile = await DoctorRepository.updateProfile(doctorId, updateData, session);
      logger.info(`[AUDIT] Doctor Profile Updated: ${doctorId}`);

      await session.commitTransaction();
      session.endSession();
      return profile;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Verifies the doctor's license (e.g., via external API simulation or Admin approval).
   * @param {string} doctorId - Doctor's ID.
   * @returns {Promise<Object>} Updated profile.
   */
  async verifyLicense(doctorId) {
    // In real-world, this would call an external API (like a national medical registry)
    const profile = await DoctorRepository.updateProfile(doctorId, { isVerified: true });
    if (!profile) throw new ApiError(404, 'Doctor not found');

    logger.info(`[AUDIT] Doctor License Verified: ${doctorId}`);
    return profile;
  }

  /**
   * Assigns a Doctor to a Hospital.
   * Requires modifying both the Doctor and the Hospital collections.
   * @param {string} doctorId - Doctor's ID.
   * @param {string} hospitalId - Hospital's ID.
   * @returns {Promise<boolean>} Success status.
   */
  async assignHospital(doctorId, hospitalId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const doctor = await DoctorRepository.findProfileById(doctorId, session);
      const hospital = await HospitalRepository.findHospitalById(hospitalId, session);

      if (!doctor || !hospital) {
        throw new ApiError(404, 'Doctor or Hospital not found', 'NOT_FOUND');
      }

      await DoctorRepository.updateProfile(doctorId, { hospital: hospitalId }, session);
      await HospitalRepository.addDoctorToHospital(hospitalId, doctorId, session);

      logger.info(`[AUDIT] Doctor ${doctorId} assigned to Hospital ${hospitalId}`);

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
   * Removes a Doctor from a Hospital.
   * @param {string} doctorId - Doctor's ID.
   * @param {string} hospitalId - Hospital's ID.
   * @returns {Promise<boolean>} Success status.
   */
  async removeHospitalAssignment(doctorId, hospitalId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await DoctorRepository.updateProfile(doctorId, { $unset: { hospital: 1 } }, session);
      await HospitalRepository.removeDoctorFromHospital(hospitalId, doctorId, session);

      logger.info(`[AUDIT] Doctor ${doctorId} removed from Hospital ${hospitalId}`);

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
   * Updates Doctor availability (e.g., 'Available', 'Busy').
   * @param {string} doctorId - Doctor's ID.
   * @param {string} status - New status.
   * @returns {Promise<Object>} Updated profile.
   */
  async updateAvailability(doctorId, status) {
    const profile = await DoctorRepository.updateProfile(doctorId, { availabilityStatus: status });
    if (!profile) throw new ApiError(404, 'Doctor not found');
    
    logger.debug(`Doctor ${doctorId} availability changed to ${status}`);
    return profile;
  }

  /**
   * Retrieves all emergencies assigned to this Doctor.
   * @param {string} doctorId - Doctor's ID.
   * @returns {Promise<Array>} List of emergencies.
   */
  async viewAssignedEmergencies(doctorId) {
    await this._verifyDoctorExists(doctorId);
    return await EmergencyRepository.findEmergenciesByDoctor(doctorId);
  }

  /**
   * Adds consultation notes to a specific Medical Record.
   * @param {string} doctorId - Doctor making the note.
   * @param {string} medicalRecordId - ID of the medical record.
   * @param {string} notes - The text notes.
   * @returns {Promise<Object>} The updated medical record.
   */
  async addConsultationNotes(doctorId, medicalRecordId, notes) {
    if (!notes || notes.trim() === '') {
      throw new ApiError(400, 'Consultation notes cannot be empty');
    }

    const record = await MedicalRecordRepository.findRecordById(medicalRecordId);
    if (!record) throw new ApiError(404, 'Medical record not found');
    
    // Authorization check
    if (record.doctor?.toString() !== doctorId.toString()) {
      logger.warn(`[SECURITY] Unauthorized attempt to add notes to Record ${medicalRecordId} by Doctor ${doctorId}`);
      throw new ApiError(403, 'You are not authorized to edit this record', 'FORBIDDEN');
    }

    const updatedRecord = await MedicalRecordRepository.updateRecord(medicalRecordId, {
      $push: { consultationNotes: { doctor: doctorId, notes, date: new Date() } }
    });

    logger.info(`[AUDIT] Consultation notes added to Record ${medicalRecordId} by Doctor ${doctorId}`);
    return updatedRecord;
  }

  /**
   * Views a patient's medical records (Authorization required).
   * @param {string} doctorId - Doctor requesting access.
   * @param {string} patientId - Patient ID.
   * @returns {Promise<Array>} List of medical records.
   */
  async viewPatientMedicalRecords(doctorId, patientId) {
    await this._verifyDoctorExists(doctorId);
    
    // In a real app, complex authorization logic goes here (e.g. checking if they share a hospital 
    // or if the patient explicitly granted access).
    const isAuthorized = true; // Placeholder for actual auth check logic

    if (!isAuthorized) {
      logger.warn(`[SECURITY] Unauthorized medical record access attempt by Doctor ${doctorId} for Patient ${patientId}`);
      throw new ApiError(403, 'You are not authorized to view this patient\'s records');
    }

    return await MedicalRecordRepository.findRecordsByPatientId(patientId);
  }

  /**
   * Soft deletes a Doctor profile.
   * @param {string} doctorId - Doctor's ID.
   * @returns {Promise<boolean>} Success status.
   */
  async deleteProfile(doctorId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await DoctorRepository.softDeleteProfile(doctorId, session);
      if (!result) throw new ApiError(404, 'Doctor profile not found');

      logger.warn(`[AUDIT] Doctor Profile Soft Deleted: ${doctorId}`);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export const doctorService = new DoctorService();
