import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { doctorRepository } from '../repositories/doctor.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { emergencyRepository } from '../repositories/emergency.repository.js';
import { auditService } from './audit.service.js';
import Doctor from '../models/Doctor.js';

class DoctorService {
  async _verifyDoctorExists(doctorId) {
    const doctor = await doctorRepository.findProfileById(doctorId);
    if (!doctor) throw new ApiError(404, 'Doctor profile not found', 'DOCTOR_NOT_FOUND');
    return doctor;
  }

  async createProfile(userId, data) {
    if (!userId || !data.licenseNumber) {
      throw new ApiError(400, 'User ID and License Number are required for creation.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingProfile = await doctorRepository.findProfileByUser(userId, session);
      if (existingProfile) {
        throw new ApiError(409, 'Doctor profile already exists for this user', 'PROFILE_EXISTS');
      }

      // Check if license is unique across all doctors
      const existingLicense = await Doctor.findOne({ licenseNumber: data.licenseNumber });
      if (existingLicense) {
        throw new ApiError(409, 'Doctor with this license number already exists', 'LICENSE_EXISTS');
      }

      const profile = await doctorRepository.createProfile({ ...data, user: userId }, session);
      
      auditService.logEvent('DOCTOR_PROFILE_CREATED', userId, { doctorId: profile._id });
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

  async getProfile(doctorId) {
    const doctor = await this._verifyDoctorExists(doctorId);
    return doctor;
  }

  async getCurrentDoctor(userId) {
    const doctor = await doctorRepository.findProfileByUser(userId);
    if (!doctor) {
      throw new ApiError(404, 'Doctor profile not found', 'NOT_FOUND');
    }
    return doctor;
  }

  async updateProfile(userId, updateData) {
    const doctor = await this.getCurrentDoctor(userId);
    
    // Protect immutable fields from this endpoint
    const safeData = { ...updateData };
    delete safeData.hospital;
    delete safeData.licenseNumber;
    delete safeData.isVerified;
    delete safeData.isActive;

    const profile = await doctorRepository.updateProfileByUserId(userId, safeData);
    if (!profile) throw new ApiError(404, 'Doctor not found');

    auditService.logEvent('DOCTOR_PROFILE_UPDATED', userId, { updatedFields: Object.keys(safeData) });
    return profile;
  }

  async updateAvailability(userId, status) {
    const doctor = await this.getCurrentDoctor(userId);
    
    if (!doctor.isVerified) {
      throw new ApiError(403, 'Unverified doctors cannot change availability status', 'FORBIDDEN');
    }

    const profile = await doctorRepository.updateProfileByUserId(userId, { availabilityStatus: status });
    if (!profile) throw new ApiError(404, 'Doctor not found');
    
    auditService.logEvent('DOCTOR_AVAILABILITY_CHANGED', userId, { status });
    return profile;
  }

  async viewAssignedEmergencies(userId) {
    const doctor = await this.getCurrentDoctor(userId);
    return await emergencyRepository.find({ doctor: doctor._id, status: { $nin: ['COMPLETED', 'CANCELLED'] } });
  }

  async deleteProfile(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await doctorRepository.softDeleteByUserId(userId, session);
      if (!result) throw new ApiError(404, 'Doctor profile not found');

      // Soft delete user account and revoke sessions
      await userRepository.updateById(userId, { isActive: false }, session);
      await sessionRepository.revokeAllUserSessions(userId);

      auditService.logEvent('DOCTOR_PROFILE_DEACTIVATED', userId, { doctorId: result._id });
      logger.warn(`[AUDIT] Doctor Profile Soft Deleted: ${result._id}`);

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
