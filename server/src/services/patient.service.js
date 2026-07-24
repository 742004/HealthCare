import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDER
 * Abstracts direct Mongoose model access. To be replaced by patient.repository.js
 * ============================================================================
 */
const PatientRepository = {
  findProfileByUser: async (userId, session = null) => null,
  findProfileById: async (id, session = null) => null,
  createProfile: async (patientData, session = null) => null,
  updateProfile: async (id, updateData, session = null) => null,
  softDeleteProfile: async (id, session = null) => null,
};

/**
 * Patient Service
 * Handles pure business logic for patient profiles, medical documents, and emergency history.
 */
class PatientService {
  /**
   * Creates a new Patient profile linked to a User account.
   * @param {string} userId - The user's ID.
   * @param {Object} patientData - Patient specific fields (DOB, blood group, etc).
   * @returns {Promise<Object>} The created patient profile as a plain object.
   */
  async createPatientProfile(userId, patientData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingProfile = await PatientRepository.findProfileByUser(userId, session);
      if (existingProfile) {
        throw new ApiError(409, 'Patient profile already exists for this user', 'PROFILE_EXISTS');
      }

      const newProfileData = { ...patientData, user: userId };
      const profile = await PatientRepository.createProfile(newProfileData, session);

      logger.info(`[AUDIT] Patient Profile Created: ${profile._id} for User: ${userId}`);

      await session.commitTransaction();
      session.endSession();
      
      return profile; // Plain JS object returned by repository in the future
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Retrieves a Patient profile by its ID.
   * @param {string} profileId - The patient profile ID.
   * @returns {Promise<Object>} The patient profile.
   */
  async getProfile(profileId) {
    const profile = await PatientRepository.findProfileById(profileId);
    if (!profile) {
      throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
    }
    return profile;
  }

  /**
   * Updates an existing Patient profile.
   * @param {string} profileId - The patient profile ID.
   * @param {Object} updateData - Fields to update.
   * @returns {Promise<Object>} The updated patient profile.
   */
  async updateProfile(profileId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const profile = await PatientRepository.updateProfile(profileId, updateData, session);
      if (!profile) {
        throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
      }

      logger.info(`[AUDIT] Patient Profile Updated: ${profileId}`);

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
   * Updates the patient's live location (GeoJSON).
   * @param {string} profileId - The patient profile ID.
   * @param {number} lng - Longitude.
   * @param {number} lat - Latitude.
   * @returns {Promise<Object>} The updated profile.
   */
  async updateLiveLocation(profileId, lng, lat) {
    const locationData = {
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    };
    // No transaction needed for simple fast location updates
    const profile = await PatientRepository.updateProfile(profileId, locationData);
    if (!profile) throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
    return profile;
  }

  /**
   * Uploads medical documents URL references to the patient profile.
   * @param {string} profileId - The patient profile ID.
   * @param {Array<string>} documentUrls - Array of secure URLs (e.g., S3).
   * @returns {Promise<Object>} The updated profile.
   */
  async uploadMedicalDocuments(profileId, documentUrls) {
    // Logic to append document URLs to the profile
    const updateData = { $push: { medicalDocuments: { $each: documentUrls } } };
    const profile = await PatientRepository.updateProfile(profileId, updateData);
    if (!profile) throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
    
    logger.info(`[AUDIT] Documents Uploaded for Patient: ${profileId}`);
    return profile;
  }

  /**
   * Soft deletes a patient profile.
   * @param {string} profileId - The patient profile ID.
   * @returns {Promise<boolean>} Success status.
   */
  async deleteProfile(profileId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await PatientRepository.softDeleteProfile(profileId, session);
      if (!result) throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
      
      logger.warn(`[AUDIT] Patient Profile Soft Deleted: ${profileId}`);
      
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

export const patientService = new PatientService();
